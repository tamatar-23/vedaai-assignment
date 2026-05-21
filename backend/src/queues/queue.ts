import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { broadcastProgress } from '../websocket/socket.js';
import { generateQuestionPaper } from '../services/ai.js';
import { mockDb, IS_MOCK_MODE } from '../config/db.js';
import Assignment from '../models/Assignment.js';

export let IS_REDIS_ACTIVE = false;
let generationQueue: Queue | null = null;
let bullWorker: Worker | null = null;

// Mock queue for Redis-free execution
const mockJobs = new Map<string, NodeJS.Timeout>();

export async function initQueue(): Promise<void> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    console.log('Attempting to connect to Redis for BullMQ...');
    const client = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000
    });
    
    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => {
        IS_REDIS_ACTIVE = true;
        resolve();
      });
      client.on('error', (err) => {
        reject(err);
      });
    });

    console.log('Redis Connected. Initializing BullMQ...');
    
    const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    
    generationQueue = new Queue('generation-queue', { connection });
    
    // Register worker
    bullWorker = new Worker('generation-queue', async (job: Job) => {
      const { assignmentId } = job.data;
      await processGenerationJob(assignmentId);
    }, { connection });
    
    bullWorker.on('completed', (job) => {
      console.log(`BullMQ Job ${job.id} completed successfully.`);
    });
    
    bullWorker.on('failed', (job, err) => {
      console.error(`BullMQ Job ${job?.id} failed:`, err);
    });

  } catch (error) {
    console.warn('\n======================================================');
    console.warn('WARNING: Redis is not running or unreachable.');
    console.warn('Falling back to local in-memory async Queue Processor.');
    console.warn('======================================================\n');
    IS_REDIS_ACTIVE = false;
  }
}

export async function addGenerationJob(assignmentId: string): Promise<void> {
  // Update status in DB to processing
  await updateAssignmentStatus(assignmentId, 'processing', 5, 'Job received by queue...');
  broadcastProgress(assignmentId, 5, 'processing', 'Job received by queue...');

  if (IS_REDIS_ACTIVE && generationQueue) {
    await generationQueue.add('generate', { assignmentId });
  } else {
    // Run mock generation in background using setTimeout
    runMockGenerationJob(assignmentId);
  }
}

function runMockGenerationJob(assignmentId: string): void {
  // Clear any existing job for this assignment
  if (mockJobs.has(assignmentId)) {
    clearTimeout(mockJobs.get(assignmentId)!);
  }

  const timeoutId = setTimeout(async () => {
    try {
      await processGenerationJob(assignmentId);
    } catch (err) {
      console.error('Error processing mock generation job:', err);
      await updateAssignmentStatus(assignmentId, 'failed', 0, `Generation failed: ${(err as Error).message}`);
      broadcastProgress(assignmentId, 0, 'failed', `Generation failed: ${(err as Error).message}`);
    } finally {
      mockJobs.delete(assignmentId);
    }
  }, 100);

  mockJobs.set(assignmentId, timeoutId);
}

// Common processing logic
async function processGenerationJob(assignmentId: string): Promise<void> {
  console.log(`Starting question generation for assignment: ${assignmentId}`);
  
  // 1. Fetch assignment details
  let assignment: any = null;
  
  if (IS_MOCK_MODE) {
    assignment = await mockDb.getAssignmentById(assignmentId);
  } else {
    assignment = await Assignment.findById(assignmentId);
  }
  
  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }
  
  try {
    // 2. Run generation with real-time logs
    const sections = await generateQuestionPaper({
      title: assignment.title,
      subject: assignment.subject,
      classLevel: assignment.classLevel,
      allowedTime: assignment.allowedTime,
      maxMarks: assignment.maxMarks,
      questionTypes: assignment.questionTypes,
      additionalInstructions: assignment.additionalInstructions
    }, async (log: string, percent: number) => {
      // Progress updater callback
      await updateAssignmentStatus(assignmentId, 'processing', percent, log);
      broadcastProgress(assignmentId, percent, 'processing', log);
    });
    
    // 3. Save sections and set complete
    if (IS_MOCK_MODE) {
      assignment.sections = sections;
      assignment.status = 'completed';
      assignment.progress = 100;
      assignment.stepLog = 'Questions generated successfully!';
      await mockDb.saveAssignment(assignment);
    } else {
      assignment.sections = sections;
      assignment.status = 'completed';
      assignment.progress = 100;
      assignment.stepLog = 'Questions generated successfully!';
      await assignment.save();
    }
    
    broadcastProgress(assignmentId, 100, 'completed', 'Questions generated successfully!');
    console.log(`Successfully completed question generation for ${assignmentId}`);
    
  } catch (err) {
    console.error(`Failed to process generation for ${assignmentId}:`, err);
    await updateAssignmentStatus(assignmentId, 'failed', 0, `AI Generation Failed: ${(err as Error).message}`);
    broadcastProgress(assignmentId, 0, 'failed', `AI Generation Failed: ${(err as Error).message}`);
    throw err;
  }
}

async function updateAssignmentStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,
  stepLog: string
): Promise<void> {
  if (IS_MOCK_MODE) {
    const item = await mockDb.getAssignmentById(id);
    if (item) {
      item.status = status;
      item.progress = progress;
      item.stepLog = stepLog;
      await mockDb.saveAssignment(item);
    }
  } else {
    await Assignment.findByIdAndUpdate(id, { status, progress, stepLog });
  }
}
