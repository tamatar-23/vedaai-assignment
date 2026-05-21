import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  schoolName: string;
  schoolBranch: string;
  role: string;
  avatarUrl?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  schoolName: { type: String, required: true },
  schoolBranch: { type: String, required: true },
  role: { type: String, default: 'Teacher' },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;
