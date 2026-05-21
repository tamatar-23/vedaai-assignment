import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import { initQueue } from './queues/queue.js';
import { initSocketServer } from './websocket/socket.js';
import assignmentRouter from './routes/assignment.js';
import userRouter from './routes/user.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for simplicity in assessment
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve API routes
app.use('/api', assignmentRouter);
app.use('/api', userRouter);

// Welcome / Status route at root to confirm API is running
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'VedaAI Assessment Creator API is running successfully!',
    endpoints: {
      health: '/health',
      assignments: '/api/assignments',
      profile: '/api/profile'
    },
    timestamp: new Date().toISOString()
  });
});

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create Server
const httpServer = createServer(app);

// Initialize socket server
initSocketServer(httpServer);

// Startup sequence
async function startServer() {
  try {
    // 1. Connect to database
    await connectDB();
    
    // 2. Initialize Queue
    await initQueue();
    
    // 3. Start server
    httpServer.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(` VedaAI Assignment Backend running on port ${PORT}`);
      console.log(` WebSockets listening on the same port`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

startServer();
