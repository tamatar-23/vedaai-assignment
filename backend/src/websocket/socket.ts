import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

interface SocketMessage {
  type: 'subscribe' | 'unsubscribe';
  assignmentId: string;
}

// Track subscribers for each assignment ID
const subscribers = new Map<string, Set<WebSocket>>();

export function initSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    let currentSubscription: string | null = null;
    console.log('New WebSocket connection established.');

    ws.on('message', (message: string) => {
      try {
        const payload: SocketMessage = JSON.parse(message);
        
        if (payload.type === 'subscribe') {
          const assignmentId = payload.assignmentId;
          
          // Unsubscribe from previous if any
          if (currentSubscription && currentSubscription !== assignmentId) {
            subscribers.get(currentSubscription)?.delete(ws);
          }
          
          currentSubscription = assignmentId;
          
          if (!subscribers.has(assignmentId)) {
            subscribers.set(assignmentId, new Set());
          }
          subscribers.get(assignmentId)!.add(ws);
          console.log(`Socket subscribed to assignment progress: ${assignmentId}`);
          
          // Send initial message
          ws.send(JSON.stringify({
            type: 'progress',
            assignmentId,
            progress: 5,
            status: 'processing',
            log: 'Connected to generation worker.'
          }));
        } else if (payload.type === 'unsubscribe') {
          if (currentSubscription) {
            subscribers.get(currentSubscription)?.delete(ws);
            console.log(`Socket unsubscribed from: ${currentSubscription}`);
            currentSubscription = null;
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentSubscription) {
        subscribers.get(currentSubscription)?.delete(ws);
        console.log(`Socket closed and unsubscribed from: ${currentSubscription}`);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket socket error:', err);
    });
  });

  console.log('WebSocket Server initialized.');
  return wss;
}

export function broadcastProgress(
  assignmentId: string,
  progress: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  log: string
): void {
  const sockets = subscribers.get(assignmentId);
  if (!sockets || sockets.size === 0) return;

  const payload = JSON.stringify({
    type: 'progress',
    assignmentId,
    progress,
    status,
    log,
    timestamp: new Date().toISOString()
  });

  console.log(`Broadcasting [${progress}% - ${status}] for ${assignmentId}: ${log}`);

  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}
