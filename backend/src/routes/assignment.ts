import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { connectDB, mockDb, IS_MOCK_MODE } from '../config/db.js';
import Assignment from '../models/Assignment.js';
import User from '../models/User.js';
import { addGenerationJob } from '../queues/queue.js';
import { generateAssignmentPDF } from '../services/pdf.js';

const router = Router();

// Validation helper
function validateAssignmentInput(body: any) {
  const { title, subject, classLevel, allowedTime, maxMarks, dueDate, questionTypes } = body;
  
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return 'Title is required and must be a valid string.';
  }
  if (!subject || typeof subject !== 'string' || subject.trim() === '') {
    return 'Subject is required and must be a valid string.';
  }
  if (!classLevel || typeof classLevel !== 'string' || classLevel.trim() === '') {
    return 'Class Level is required.';
  }
  if (!allowedTime || typeof allowedTime !== 'number' || allowedTime <= 0) {
    return 'Time Allowed must be a positive number of minutes.';
  }
  if (!maxMarks || typeof maxMarks !== 'number' || maxMarks <= 0) {
    return 'Maximum Marks must be a positive number.';
  }
  if (!dueDate || isNaN(Date.parse(dueDate))) {
    return 'Due Date must be a valid date string.';
  }
  if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
    return 'At least one Question Type must be selected.';
  }
  return null;
}

// 1. Create assignment
router.post('/assignments', async (req: Request, res: Response) => {
  const errorMsg = validateAssignmentInput(req.body);
  if (errorMsg) {
    return res.status(400).json({ error: errorMsg });
  }

  const { title, subject, classLevel, allowedTime, maxMarks, dueDate, questionTypes, additionalInstructions } = req.body;

  try {
    // Determine active school name and teacher name from database or mock
    let schoolName = 'Delhi Public School';
    let teacherName = 'Gourav Mishra';
    let userIdObj: any = null;
    try {
      if (IS_MOCK_MODE) {
        const mockUserPath = path.join(process.cwd(), 'mock_user.json');
        if (fs.existsSync(mockUserPath)) {
          const userObj = JSON.parse(fs.readFileSync(mockUserPath, 'utf8'));
          schoolName = userObj.schoolName || schoolName;
          teacherName = userObj.name || teacherName;
        }
      } else {
        const userObj = await User.findOne();
        if (userObj) {
          schoolName = userObj.schoolName;
          teacherName = userObj.name;
          userIdObj = userObj._id;
        }
      }
    } catch (e) {
      console.error('Failed to pre-populate user details for assignment:', e);
    }

    let assignmentData: any = {
      title,
      subject,
      classLevel,
      allowedTime,
      maxMarks,
      dueDate: new Date(dueDate),
      questionTypes,
      additionalInstructions,
      status: 'pending',
      progress: 0,
      stepLog: 'Initializing assignment creation...',
      sections: [],
      schoolName,
      teacherName,
      userId: userIdObj,
      user: userIdObj,
      teacher: userIdObj
    };

    let newAssignment: any = null;

    if (IS_MOCK_MODE) {
      // Create a unique id
      assignmentData.id = Math.random().toString(36).substring(2, 9);
      assignmentData._id = assignmentData.id;
      assignmentData.createdAt = new Date();
      newAssignment = await mockDb.saveAssignment(assignmentData);
    } else {
      newAssignment = new Assignment(assignmentData);
      await newAssignment.save();
    }

    const assignmentId = IS_MOCK_MODE ? newAssignment.id : newAssignment._id.toString();
    
    // Add job to BullMQ queue
    await addGenerationJob(assignmentId);

    return res.status(201).json(newAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Get all assignments
router.get('/assignments', async (req: Request, res: Response) => {
  try {
    let list: any[] = [];
    if (IS_MOCK_MODE) {
      list = await mockDb.getAssignments();
      // Sort by date descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list = await Assignment.find().sort({ createdAt: -1 });
    }
    return res.status(200).json(list);
  } catch (error) {
    console.error('Error listing assignments:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Get single assignment
router.get('/assignments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    let item: any = null;
    if (IS_MOCK_MODE) {
      item = await mockDb.getAssignmentById(id);
    } else {
      item = await Assignment.findById(id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Delete assignment
router.delete('/assignments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    let success = false;
    if (IS_MOCK_MODE) {
      success = await mockDb.deleteAssignment(id);
    } else {
      const result = await Assignment.findByIdAndDelete(id);
      success = !!result;
    }

    if (!success) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Regenerate questions
router.post('/assignments/:id/regenerate', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    let item: any = null;
    if (IS_MOCK_MODE) {
      item = await mockDb.getAssignmentById(id);
    } else {
      item = await Assignment.findById(id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Reset status and progress
    item.status = 'pending';
    item.progress = 0;
    item.stepLog = 'Queuing regeneration job...';
    item.sections = [];

    if (IS_MOCK_MODE) {
      await mockDb.saveAssignment(item);
    } else {
      await item.save();
    }

    // Retrigger generation job
    await addGenerationJob(id);

    return res.status(200).json(item);
  } catch (error) {
    console.error('Error regenerating assignment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Download PDF
router.get('/assignments/:id/pdf', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    let item: any = null;
    if (IS_MOCK_MODE) {
      item = await mockDb.getAssignmentById(id);
    } else {
      item = await Assignment.findById(id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (item.status !== 'completed') {
      return res.status(400).json({ error: 'Assignment generation is not completed yet.' });
    }

    const pdfBuffer = await generateAssignmentPDF(item);
    
    // Set headers
    const safeTitle = item.title.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_QuestionPaper.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
