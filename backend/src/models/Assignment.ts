import mongoose, { Schema, Document } from 'mongoose';

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

export interface IAssignment extends Document {
  title: string;
  subject: string;
  classLevel: string;
  allowedTime: number;
  maxMarks: number;
  dueDate: Date;
  questionTypes: string[];
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stepLog: string;
  sections: ISection[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'moderate', 'hard'], required: true },
  marks: { type: Number, required: true },
  options: { type: [String], required: false },
  answer: { type: String, required: true }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  classLevel: { type: String, required: true },
  allowedTime: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  questionTypes: { type: [String], required: true },
  additionalInstructions: { type: String, required: false },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  progress: { type: Number, default: 0 },
  stepLog: { type: String, default: 'Assignment created' },
  sections: [SectionSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export default Assignment;
