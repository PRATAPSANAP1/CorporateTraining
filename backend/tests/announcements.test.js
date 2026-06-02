process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mce-placement-portal-test';
process.env.JWT_SECRET = 'test_jwt_secret_must_be_very_long_and_secure';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Session = require('../models/Session');
const Announcement = require('../models/Announcement');

describe('Announcements API Integration Tests', () => {
  let studentToken;
  let adminToken;
  let adminUser;
  let studentUser;
  let createdAnnouncementId;

  beforeAll(async () => {
    // Clear test collections
    await User.deleteMany({});
    await Session.deleteMany({});
    await Announcement.deleteMany({});

    // Register a student
    const studentReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student User',
        email: 'student@example.com',
        password: 'password123',
      });
    studentToken = studentReg.body.data.token;
    studentUser = studentReg.body.data.user;

    // Register an admin (first register normally, then update role programmatically)
    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
      });
    
    adminUser = await User.findById(adminReg.body.data.user._id);
    adminUser.role = 'admin';
    await adminUser.save();

    // Log in admin to get a valid token/session
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123',
      });
    adminToken = adminLogin.body.data.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/announcements', () => {
    it('should block non-admin from creating an announcement', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Hello Students',
          message: 'This is a test announcement',
          type: 'info'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to create an announcement', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Important System Maintenance',
          message: 'The portal will be down on Friday evening.',
          type: 'warning'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Important System Maintenance');
      expect(res.body.data.type).toBe('warning');
      createdAnnouncementId = res.body.data._id;
    });
  });

  describe('GET /api/announcements', () => {
    it('should allow authenticated student to retrieve announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBe('Important System Maintenance');
    });
  });

  describe('DELETE /api/announcements/:id', () => {
    it('should block student from deleting an announcement', async () => {
      const res = await request(app)
        .delete(`/api/announcements/${createdAnnouncementId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to delete an announcement', async () => {
      const res = await request(app)
        .delete(`/api/announcements/${createdAnnouncementId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify it's deleted from database
      const deletedAnnouncement = await Announcement.findById(createdAnnouncementId);
      expect(deletedAnnouncement).toBeNull();
    });
  });
});
