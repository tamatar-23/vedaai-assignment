import { create } from 'zustand';

export interface IQuestion {
  questionText: string;
  difficulty: 'easy' | 'moderate' | 'hard';
  marks: number;
  options?: string[];
  answer: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssignment {
  id?: string;
  _id: string;
  title: string;
  subject: string;
  classLevel: string;
  allowedTime: number;
  maxMarks: number;
  dueDate: string;
  questionTypes: string[];
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stepLog: string;
  sections: ISection[];
  schoolName?: string;
  teacherName?: string;
  userId?: string;
  user?: string;
  teacher?: string;
  createdAt: string;
}

interface AssignmentState {
  assignments: IAssignment[];
  activeAssignment: IAssignment | null;
  loading: boolean;
  generating: boolean;
  generationProgress: number;
  generationLogs: string[];
  
  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  createAssignment: (data: Omit<IAssignment, '_id' | 'status' | 'progress' | 'stepLog' | 'sections' | 'createdAt'>) => Promise<string | null>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  connectWebSocket: (assignmentId: string, onComplete?: () => void) => void;
  resetGenerationState: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export const defaultAssignments: IAssignment[] = [];

export const useAssignmentStore = create<AssignmentState>((set, get) => {
  let wsInstance: WebSocket | null = null;

  return {
    assignments: [],
    activeAssignment: null,
    loading: false,
    generating: false,
    generationProgress: 0,
    generationLogs: [],

    resetGenerationState: () => {
      set({ generating: false, generationProgress: 0, generationLogs: [] });
    },

    fetchAssignments: async () => {
      set({ loading: true });
      try {
        const response = await fetch(`${API_BASE}/assignments`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        // Merge user assignments with mock assignments so they are always in the list
        set({ assignments: [...data] });
      } catch (err) {
        console.error('Error fetching assignments:', err);
      } finally {
        set({ loading: false });
      }
    },

    fetchAssignmentDetails: async (id) => {
      set({ loading: true });
      try {
        const response = await fetch(`${API_BASE}/assignments/${id}`);
        if (!response.ok) throw new Error('Failed to fetch details');
        const data = await response.json();
        set({ activeAssignment: data });
        return data;
      } catch (err) {
        console.error('Error fetching assignment details:', err);
        return null;
      } finally {
        set({ loading: false });
      }
    },

    createAssignment: async (data) => {
      set({ generating: true, generationProgress: 0, generationLogs: ['Initializing creation request...'] });
      try {
        const response = await fetch(`${API_BASE}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to create assignment');
        }
        
        const newAssignment = await response.json();
        const id = newAssignment.id || newAssignment._id;
        
        // Add to local list immediately
        set(state => ({
          assignments: [newAssignment, ...state.assignments],
          generationLogs: [...state.generationLogs, 'Assignment created. Queuing AI worker...']
        }));
        
        return id;
      } catch (err) {
        set(state => ({ 
          generating: false, 
          generationLogs: [...state.generationLogs, `Error: ${(err as Error).message}`] 
        }));
        console.error('Error creating assignment:', err);
        return null;
      }
    },

    deleteAssignment: async (id) => {
      try {
        const response = await fetch(`${API_BASE}/assignments/${id}`, {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete');
        set(state => ({
          assignments: state.assignments.filter(a => (a.id !== id && a._id !== id))
        }));
      } catch (err) {
        console.error('Error deleting assignment:', err);
      }
    },

    regenerateAssignment: async (id) => {
      set({ generating: true, generationProgress: 0, generationLogs: ['Initializing regeneration...'] });
      try {
        const response = await fetch(`${API_BASE}/assignments/${id}/regenerate`, {
          method: 'POST'
        });
        if (!response.ok) throw new Error('Regeneration request failed');
        
        set(state => ({
          generationLogs: [...state.generationLogs, 'Regeneration request sent. Awaiting queue...']
        }));
      } catch (err) {
        set(state => ({
          generating: false,
          generationLogs: [...state.generationLogs, `Regeneration Error: ${(err as Error).message}`]
        }));
        console.error('Error regenerating assignment:', err);
      }
    },

    connectWebSocket: (assignmentId, onComplete) => {
      if (wsInstance) {
        wsInstance.close();
      }

      console.log(`Connecting WebSocket to ${WS_BASE} for assignment ${assignmentId}`);
      const ws = new WebSocket(WS_BASE);
      wsInstance = ws;

      ws.onopen = () => {
        console.log('WebSocket connected. Subscribing to rooms...');
        ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'progress' && msg.assignmentId === assignmentId) {
            set(state => {
              // Add log message if it doesn't already exist or matches
              const newLogs = [...state.generationLogs];
              if (newLogs[newLogs.length - 1] !== msg.log) {
                newLogs.push(msg.log);
              }
              
              const isDone = msg.progress === 100 && msg.status === 'completed';
              const isFailed = msg.status === 'failed';
              
              return {
                generationProgress: msg.progress,
                generationLogs: newLogs,
                generating: !isDone && !isFailed
              };
            });

            if (msg.progress === 100 && msg.status === 'completed') {
              console.log('Generation completed via socket. Closing connection.');
              ws.close();
              wsInstance = null;
              get().fetchAssignments();
              if (onComplete) onComplete();
            }

            if (msg.status === 'failed') {
              console.warn('Generation failed via socket. Closing connection.');
              ws.close();
              wsInstance = null;
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed.');
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
      };
    }
  };
});
