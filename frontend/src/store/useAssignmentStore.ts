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

const API_BASE = 'http://localhost:5000/api';
const WS_BASE = 'ws://localhost:5000';

export const defaultAssignments: IAssignment[] = [
  {
    _id: 'motion-101',
    id: 'motion-101',
    title: 'Assignment on Motion',
    subject: 'Science',
    classLevel: '10-A',
    allowedTime: 45,
    maxMarks: 50,
    dueDate: '2025-05-21T00:00:00.000Z',
    createdAt: '2025-05-20T00:00:00.000Z',
    status: 'completed',
    progress: 100,
    stepLog: 'Completed',
    questionTypes: ['MCQ', 'Short Answer', 'Long Answer'],
    sections: [
      {
        title: 'Section A - Multiple Choice Questions',
        instruction: 'Answer all questions. Each question carries 2 marks.',
        questions: [
          {
            questionText: 'A body is moving with a constant speed in a circle. It has:',
            difficulty: 'easy',
            marks: 2,
            options: ['Constant velocity', 'Constant acceleration', 'An inward acceleration', 'An outward velocity'],
            answer: 'An inward acceleration'
          },
          {
            questionText: 'Which of the following is a scalar quantity?',
            difficulty: 'easy',
            marks: 2,
            options: ['Velocity', 'Displacement', 'Acceleration', 'Distance'],
            answer: 'Distance'
          },
          {
            questionText: 'The slope of a velocity-time graph represents:',
            difficulty: 'easy',
            marks: 2,
            options: ['Distance', 'Displacement', 'Speed', 'Acceleration'],
            answer: 'Acceleration'
          },
          {
            questionText: 'The area under a velocity-time graph represents:',
            difficulty: 'moderate',
            marks: 2,
            options: ['Acceleration', 'Force', 'Displacement', 'Speed'],
            answer: 'Displacement'
          },
          {
            questionText: 'A ball is thrown vertically upwards. At the highest point of its trajectory, its velocity is:',
            difficulty: 'moderate',
            marks: 2,
            options: ['Maximum', 'Zero', '9.8 m/s', 'Constant'],
            answer: 'Zero'
          }
        ]
      },
      {
        title: 'Section B - Short Answer Questions',
        instruction: 'Answer the following in 30-40 words.',
        questions: [
          {
            questionText: 'Distinguish between distance and displacement with examples.',
            difficulty: 'moderate',
            marks: 5,
            answer: 'Distance is the total path length traversed by an object, which is scalar. Displacement is the shortest vector distance between initial and final points.'
          },
          {
            questionText: 'State Newton\'s First Law of Motion and explain inertia.',
            difficulty: 'moderate',
            marks: 5,
            answer: 'An object remains at rest or in uniform motion unless acted upon by an external net force. Inertia is the resistance of any physical object to any change in its velocity.'
          },
          {
            questionText: 'A cyclist rides around a circular track of radius 40m in 80 seconds. Calculate the average velocity.',
            difficulty: 'hard',
            marks: 5,
            answer: 'In 80 seconds, if the cyclist completes one full lap, the net displacement is zero. Hence, the average velocity is zero.'
          }
        ]
      },
      {
        title: 'Section C - Long Answer Questions',
        instruction: 'Answer the following in detail.',
        questions: [
          {
            questionText: 'Derive the three equations of motion graphically: v = u + at, s = ut + 0.5at², and v² = u² + 2as.',
            difficulty: 'hard',
            marks: 15,
            answer: 'Provide graphical derivation using velocity-time graph showing area under curve is displacement and slope is acceleration.'
          },
          {
            questionText: 'Explain circular motion. Why is uniform circular motion considered an accelerated motion?',
            difficulty: 'hard',
            marks: 10,
            answer: 'Circular motion is motion along a circular path. Even if speed is constant, direction changes continuously. Change in velocity vector implies acceleration (centripetal acceleration).'
          }
        ]
      }
    ]
  },
  {
    _id: 'electricity-102',
    id: 'electricity-102',
    title: 'Quiz on Electricity',
    subject: 'Science',
    classLevel: '10-A',
    allowedTime: 60,
    maxMarks: 50,
    dueDate: '2025-06-21T00:00:00.000Z',
    createdAt: '2025-06-20T00:00:00.000Z',
    status: 'completed',
    progress: 100,
    stepLog: 'Completed',
    questionTypes: ['MCQ', 'Short Answer'],
    sections: [
      {
        title: 'Section A - MCQs',
        instruction: 'Select the correct option for each question.',
        questions: [
          {
            questionText: 'What is the SI unit of electric current?',
            difficulty: 'easy',
            marks: 5,
            options: ['Volt', 'Ampere', 'Ohm', 'Joule'],
            answer: 'Ampere'
          },
          {
            questionText: 'The electrical resistance of a conductor depends on:',
            difficulty: 'easy',
            marks: 5,
            options: ['Its length', 'Its area of cross-section', 'Nature of material', 'All of the above'],
            answer: 'All of the above'
          },
          {
            questionText: 'How is an ammeter connected in a circuit to measure current?',
            difficulty: 'easy',
            marks: 5,
            options: ['In parallel', 'In series', 'Either series or parallel', 'None of these'],
            answer: 'In series'
          },
          {
            questionText: 'Three resistors of 2 ohms, 3 ohms, and 6 ohms are connected in parallel. Their equivalent resistance is:',
            difficulty: 'moderate',
            marks: 5,
            options: ['11 ohms', '6 ohms', '1 ohm', '2.5 ohms'],
            answer: '1 ohm'
          }
        ]
      },
      {
        title: 'Section B - Short Answer Questions',
        instruction: 'State the principles clearly.',
        questions: [
          {
            questionText: 'State Ohm\'s Law. Draw a circuit diagram to verify it.',
            difficulty: 'moderate',
            marks: 10,
            answer: 'The current passing through a conductor is directly proportional to the potential difference across its ends, provided temperature remains constant (V = IR).'
          },
          {
            questionText: 'Why are household electrical appliances connected in parallel rather than in series?',
            difficulty: 'moderate',
            marks: 10,
            answer: 'Parallel connection ensures each appliance gets full voltage, operates independently, and if one device fails, others continue to work.'
          },
          {
            questionText: 'An electric iron consumes energy at a rate of 840W when heating is at the maximum. Voltage is 220V. Find current.',
            difficulty: 'hard',
            marks: 10,
            answer: 'Current I = P/V = 840 / 220 = 3.82 A. Resistance R = V/I = 220 / 3.82 = 57.6 ohms.'
          }
        ]
      }
    ]
  }
];

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
      // Intercept mock assignments
      if (id === 'motion-101' || id === 'electricity-102') {
        const mockItem = defaultAssignments.find(a => a.id === id);
        if (mockItem) {
          set({ activeAssignment: mockItem });
          return mockItem;
        }
      }

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
      if (id === 'motion-101' || id === 'electricity-102') {
        // Just remove from local state
        set(state => ({
          assignments: state.assignments.filter(a => (a.id !== id && a._id !== id))
        }));
        return;
      }

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
      if (id === 'motion-101' || id === 'electricity-102') {
        // Mock success logs for regeneration
        set({ generating: true, generationProgress: 10, generationLogs: ['Initializing mock regeneration...', 'Re-loading context...', 'Generating questions...'] });
        setTimeout(() => {
          set({ generationProgress: 50, generationLogs: ['Mock regeneration: Sections loaded.', 'Generating MCQs...', 'Formulating short answers...'] });
        }, 1000);
        setTimeout(() => {
          set({ generationProgress: 90, generationLogs: ['Mock regeneration: Formatting paper...', 'Validating marks allocations...'] });
        }, 2000);
        setTimeout(() => {
          set({ generating: false, generationProgress: 100, generationLogs: ['Mock regeneration complete!'] });
        }, 3000);
        return;
      }

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
