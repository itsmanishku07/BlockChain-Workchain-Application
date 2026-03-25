import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Create a new job
app.post('/api/jobs', async (req, res) => {
  try {
    const { title, description, budget, category, skills } = req.body;
    
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        budget,
        category,
        skills
      }
    });
    
    res.status(201).json(newJob);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Get User Profile
app.get('/api/profile/:uid', async (req, res) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: req.params.uid }
    });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Create or Update User Profile
app.put('/api/profile/:uid', async (req, res) => {
  try {
    const { name, title, bio, hourlyRate, location, website, github, skills } = req.body;
    
    const profile = await prisma.userProfile.upsert({
      where: { id: req.params.uid },
      update: { name, title, bio, hourlyRate, location, website, github, skills },
      create: { id: req.params.uid, name, title, bio, hourlyRate, location, website, github, skills }
    });
    res.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
