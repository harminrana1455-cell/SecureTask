const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

// Use a different DB name from auth.test.js to avoid collision when running with --runInBand
const MONGO_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.replace(/\/[^/]+$/, '/securetask_tasks_test')
  : 'mongodb://localhost:27017/securetask_tasks_test';

let token;
let token2;
let userId;

beforeAll(async () => {
  // Connect if not already connected (runInBand: auth.test closed its connection)
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  } else {
    // Switch to the tasks test DB
    await mongoose.connection.close();
    await mongoose.connect(MONGO_URI);
  }
  await User.deleteMany({});
  await Task.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Task.deleteMany({});

  const res1 = await request(app).post('/api/auth/register').send({
    name: 'User One',
    email: 'user1@example.com',
    password: 'password123',
  });
  expect(res1.statusCode).toBe(201);
  token = res1.body.data.token;
  userId = res1.body.data.user._id;

  const res2 = await request(app).post('/api/auth/register').send({
    name: 'User Two',
    email: 'user2@example.com',
    password: 'password123',
  });
  expect(res2.statusCode).toBe(201);
  token2 = res2.body.data.token;
});

describe('Tasks - Create', () => {
  it('should create a task successfully', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Task', priority: 'High', status: 'Todo' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Task');
    expect(res.body.data.userId).toBe(userId);
  });

  it('should reject task creation with missing title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ priority: 'High' });
    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('should reject task with invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', priority: 'Critical' });
    expect(res.statusCode).toBe(422);
  });

  it('should reject task with invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test', status: 'Done' });
    expect(res.statusCode).toBe(422);
  });
});

describe('Tasks - Read', () => {
  beforeEach(async () => {
    await Task.create([
      { title: 'Task A', priority: 'High', status: 'Todo', userId },
      { title: 'Task B', priority: 'Low', status: 'Completed', userId },
    ]);
  });

  it('should retrieve all tasks for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('should retrieve a single task by ID', async () => {
    const tasks = await Task.find({ userId });
    const res = await request(app)
      .get(`/api/tasks/${tasks[0]._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(tasks[0]._id.toString());
  });

  it('should filter tasks by status', async () => {
    const res = await request(app)
      .get('/api/tasks?status=Todo')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('Todo');
  });

  it('should prevent user from accessing another user task', async () => {
    const tasks = await Task.find({ userId });
    const res = await request(app)
      .get(`/api/tasks/${tasks[0]._id}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('Tasks - Update', () => {
  let taskId;
  beforeEach(async () => {
    const task = await Task.create({ title: 'Update Me', priority: 'Low', status: 'Todo', userId });
    taskId = task._id.toString();
  });

  it('should update a task successfully', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Task', priority: 'High', status: 'In Progress' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.title).toBe('Updated Task');
    expect(res.body.data.status).toBe('In Progress');
  });

  it('should prevent updating another user task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked', priority: 'Low', status: 'Todo' });
    expect(res.statusCode).toBe(404);
  });
});

describe('Tasks - Delete', () => {
  let taskId;
  beforeEach(async () => {
    const task = await Task.create({ title: 'Delete Me', priority: 'Low', status: 'Todo', userId });
    taskId = task._id.toString();
  });

  it('should delete a task successfully', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    const deleted = await Task.findById(taskId);
    expect(deleted).toBeNull();
  });

  it('should prevent deleting another user task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(404);
  });
});

describe('Tasks - Complete', () => {
  it('should mark a task as completed', async () => {
    const task = await Task.create({ title: 'Complete Me', priority: 'Medium', status: 'Todo', userId });
    const res = await request(app)
      .patch(`/api/tasks/${task._id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('Completed');
  });
});

describe('Dashboard - Stats', () => {
  it('should return dashboard statistics', async () => {
    await Task.create([
      { title: 'T1', status: 'Todo', priority: 'Low', userId },
      { title: 'T2', status: 'In Progress', priority: 'Medium', userId },
      { title: 'T3', status: 'Completed', priority: 'High', userId },
    ]);
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.todo).toBe(1);
    expect(res.body.data.inProgress).toBe(1);
    expect(res.body.data.completed).toBe(1);
    expect(typeof res.body.data.overdue).toBe('number');
  });
});

describe('Health Endpoints', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.uptime).toBeDefined();
  });

  it('should return database health status', async () => {
    const res = await request(app).get('/api/health/db');
    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.database).toBe('mongodb');
  });
});

