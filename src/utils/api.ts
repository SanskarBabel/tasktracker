import axios from 'axios';
import { Project, Task, TaskStatus } from '../types';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';

// Add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Project API
export const getProjects = async (): Promise<Project[]> => {
  const response = await axios.get('/projects');
  return response.data;
};

export const getProjectById = async (id: string): Promise<Project> => {
  const response = await axios.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (project: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  const response = await axios.post('/projects', project);
  return response.data;
};

export const updateProject = async (id: string, project: Partial<Project>): Promise<Project> => {
  const response = await axios.put(`/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await axios.delete(`/projects/${id}`);
};

// Task API
export const getTasks = async (): Promise<Task[]> => {
  const response = await axios.get('/tasks');
  return response.data;
};

export const getTaskById = async (id: string): Promise<Task> => {
  const response = await axios.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'updatedAt'>): Promise<Task> => {
  const response = await axios.post('/tasks', task);
  return response.data;
};

export const updateTask = async (id: string, task: Partial<Task>): Promise<Task> => {
  const response = await axios.put(`/tasks/${id}`, task);
  return response.data;
};

export const updateTaskStatus = async (id: string, status: TaskStatus): Promise<Task> => {
  const response = await axios.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await axios.delete(`/tasks/${id}`);
};

// User API
export const updateUser = async (id: string, userData: Partial<{
  name: string;
  country: string;
}>): Promise<void> => {
  await axios.put(`/users/${id}`, userData);
};