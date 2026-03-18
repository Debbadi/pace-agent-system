import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Orchestrator } from './agents/Orchestrator.js';
import 'dotenv/config';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/stories', (req, res) => {
  const orchestrator = new Orchestrator(io);
  res.json(orchestrator.getStories());
});

app.post('/api/run/:storyId', async (req, res) => {
  const { storyId } = req.params;
  const orchestrator = new Orchestrator(io);
  orchestrator.runStory(storyId).catch(console.error);
  res.json({ message: `Pipeline started for ${storyId}` });
});

app.post('/api/run-all', async (req, res) => {
  const orchestrator = new Orchestrator(io);
  const stories = orchestrator.getStories();
  res.json({ message: `Running pipeline for all ${stories.length} stories` });

  // Run sequentially
  for (const story of stories) {
    await orchestrator.runStory(story.id).catch(console.error);
    await new Promise(r => setTimeout(r, 1000));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`PACE backend running on http://localhost:${PORT}`));
