import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dns from 'dns';

export let IS_MOCK_MODE = false;

const MOCK_DB_FILE = path.join(process.cwd(), 'mock_db.json');

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai_assessment';
  
  try {
    console.log('Attempting to connect to MongoDB...');
    // Set a very short timeout of 2 seconds so we fail fast and fall back to mock mode
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    console.log('MongoDB Connected Successfully.');
    IS_MOCK_MODE = false;
  } catch (error: any) {
    // If connection failed due to DNS SRV/TXT resolution error (ECONNREFUSED / ENOTFOUND),
    // and we haven't overridden the DNS servers yet, override them to public DNS and retry once.
    const isDnsError = 
      error.message?.includes('ECONNREFUSED') || 
      error.message?.includes('ENOTFOUND') || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND';
      
    if (isDnsError && mongoUri.startsWith('mongodb+srv://')) {
      const servers = dns.getServers();
      if (servers.includes('127.0.0.1') || servers.includes('::1')) {
        console.log('MongoDB connection failed due to DNS lookup. Overriding Node DNS servers to Google & Cloudflare (8.8.8.8, 1.1.1.1) and retrying...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        try {
          await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 3000,
            connectTimeoutMS: 3000
          });
          console.log('MongoDB Connected Successfully after DNS override.');
          IS_MOCK_MODE = false;
          return;
        } catch (retryError) {
          console.error('MongoDB connection retry failed:', retryError);
        }
      }
    }

    console.warn('\n======================================================');
    console.warn('WARNING: MongoDB is not running or unreachable.');
    console.warn('Error details:', error);
    console.warn('Falling back to local high-fidelity MOCK MODE (mock_db.json).');
    console.warn('No external database setup required!');
    console.warn('======================================================\n');
    IS_MOCK_MODE = true;
    
    // Ensure mock DB file exists
    if (!fs.existsSync(MOCK_DB_FILE)) {
      fs.writeFileSync(MOCK_DB_FILE, JSON.stringify([], null, 2));
    }
  }
}

// In-Memory / File-based Database operations for Mock Mode
export const mockDb = {
  async getAssignments(): Promise<any[]> {
    try {
      if (fs.existsSync(MOCK_DB_FILE)) {
        const data = fs.readFileSync(MOCK_DB_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading mock DB', e);
    }
    return [];
  },
  
  async saveAssignment(assignment: any): Promise<any> {
    try {
      const items = await this.getAssignments();
      const existingIndex = items.findIndex((i: any) => i.id === assignment.id || i._id === assignment._id);
      
      if (existingIndex > -1) {
        items[existingIndex] = { ...items[existingIndex], ...assignment };
      } else {
        items.push(assignment);
      }
      
      fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(items, null, 2));
      return assignment;
    } catch (e) {
      console.error('Error saving to mock DB', e);
      return assignment;
    }
  },
  
  async getAssignmentById(id: string): Promise<any | null> {
    const items = await this.getAssignments();
    return items.find((i: any) => i.id === id || i._id === id) || null;
  },

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      const items = await this.getAssignments();
      const filtered = items.filter((i: any) => i.id !== id && i._id !== id);
      fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(filtered, null, 2));
      return true;
    } catch (e) {
      console.error('Error deleting from mock DB', e);
      return false;
    }
  }
};
