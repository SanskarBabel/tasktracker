import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, country } = req.body;
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        country,
      },
    });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        country: user.country,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Routes
app.get('/api/users/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      country: user.country,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country } = req.body;
    
    if (id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        country,
      },
    });
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      country: updatedUser.country,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Project Routes
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      include: {
        tasks: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
      },
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/projects', authenticate, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Check if user already has 4 projects
    const projectCount = await prisma.project.count({
      where: { userId: req.user.id },
    });
    
    if (projectCount >= 4) {
      return res.status(400).json({ message: 'Maximum project limit reached (4)' });
    }
    
    const project = await prisma.project.create({
      data: {
        title,
        description,
        userId: req.user.id,
      },
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }
    
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
      },
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }
    
    // Delete all tasks associated with the project
    await prisma.task.deleteMany({
      where: { projectId: id },
    });
    
    // Delete the project
    await prisma.project.delete({
      where: { id },
    });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Task Routes
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        project: {
          userId: req.user.id,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const { title, description, status, projectId } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this project' });
    }
    
    const completedAt = status === 'COMPLETED' ? new Date() : null;
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        completedAt,
        projectId,
      },
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    const completedAt = status === 'COMPLETED' ? new Date() : task.completedAt;
    
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        completedAt,
      },
    });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/api/tasks/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    const completedAt = status === 'COMPLETED' ? new Date() : task.completedAt;
    
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
    });
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (task.project.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    await prisma.task.delete({
      where: { id },
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});