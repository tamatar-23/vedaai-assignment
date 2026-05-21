import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { IS_MOCK_MODE } from '../config/db.js';
import User from '../models/User.js';

const router = Router();
const MOCK_USER_FILE = path.join(process.cwd(), 'mock_user.json');

const DEFAULT_USER = {
  name: 'Gourav Mishra',
  email: 'gourav@vedaai.com',
  schoolName: 'Delhi Public School',
  schoolBranch: 'Bokaro Steel City',
  role: 'Teacher',
  avatarUrl: ''
};

// Helper to get mock user
function getMockUser(): any {
  if (fs.existsSync(MOCK_USER_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MOCK_USER_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading mock user', e);
    }
  }
  // Initialize with default
  fs.writeFileSync(MOCK_USER_FILE, JSON.stringify(DEFAULT_USER, null, 2));
  return DEFAULT_USER;
}

// Helper to save mock user
function saveMockUser(user: any): any {
  fs.writeFileSync(MOCK_USER_FILE, JSON.stringify(user, null, 2));
  return user;
}

// GET /profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    if (IS_MOCK_MODE) {
      const user = getMockUser();
      return res.status(200).json(user);
    } else {
      let user = await User.findOne();
      if (!user) {
        // Seed default user
        user = new User(DEFAULT_USER);
        await user.save();
      }
      return res.status(200).json(user);
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /profile
router.put('/profile', async (req: Request, res: Response) => {
  const { name, schoolName, schoolBranch } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!schoolName || schoolName.trim() === '') {
    return res.status(400).json({ error: 'School name is required' });
  }
  if (!schoolBranch || schoolBranch.trim() === '') {
    return res.status(400).json({ error: 'School branch is required' });
  }

  try {
    if (IS_MOCK_MODE) {
      const user = getMockUser();
      user.name = name;
      user.schoolName = schoolName;
      user.schoolBranch = schoolBranch;
      saveMockUser(user);
      return res.status(200).json(user);
    } else {
      let user = await User.findOne();
      if (!user) {
        user = new User(DEFAULT_USER);
      }
      user.name = name;
      user.schoolName = schoolName;
      user.schoolBranch = schoolBranch;
      await user.save();
      return res.status(200).json(user);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
