import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/jobs', async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { title, description, budget, category, skills } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!budget || typeof budget !== 'string') {
      return res.status(400).json({ error: 'Budget is required' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Category is required' });
    }

    const newJob = await prisma.job.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        budget,
        category,
        skills: Array.isArray(skills) ? skills : [],
      },
    });

    res.status(201).json(newJob);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

app.get('/api/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid || uid.length > 128) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const profile = await prisma.userProfile.findUnique({ where: { id: uid } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid || uid.length > 128) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { name, title, bio, hourlyRate, location, website, github, skills } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const profile = await prisma.userProfile.upsert({
      where: { id: uid },
      update: {
        name: name.trim(),
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        hourlyRate: hourlyRate?.trim() || null,
        location: location?.trim() || null,
        website: website?.trim() || null,
        github: github?.trim() || null,
        skills: Array.isArray(skills) ? skills : [],
      },
      create: {
        id: uid,
        name: name.trim(),
        title: title?.trim() || null,
        bio: bio?.trim() || null,
        hourlyRate: hourlyRate?.trim() || null,
        location: location?.trim() || null,
        website: website?.trim() || null,
        github: github?.trim() || null,
        skills: Array.isArray(skills) ? skills : [],
      },
    });

    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    process.exit(1);
  }
}

start();
