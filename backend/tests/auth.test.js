process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/mce-placement-portal-test';
process.env.JWT_SECRET = 'test_jwt_secret_must_be_very_long_and_secure';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Session = require('../models/Session');
const Leaderboard = require('../models/Leaderboard');

describe('Auth & Security API Integration Tests', () => {
  let userToken;
  let testUser;

  beforeAll(async () => {
    // Clear test collections
    await User.deleteMany({});
    await Session.deleteMany({});
    await Leaderboard.deleteMany({});
  });

  afterAll(async () => {
    // Close DB Connection
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new student and bootstrap their leaderboard', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('jane@example.com');

      // Verify Leaderboard bootstrapping
      const leaderRecord = await Leaderboard.findOne({ user: res.body.data.user._id });
      expect(leaderRecord).toBeDefined();
      expect(leaderRecord.totalScore).toBe(0);

      testUser = res.body.data.user;
    });

    it('should block registration with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Two',
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and return JWT + active session', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      
      userToken = res.body.data.token;

      // Verify Session creation
      const activeSession = await Session.findOne({ user: testUser._id, isActive: true });
      expect(activeSession).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile SSRF Validation', () => {
    it('should successfully update profile with a safe URL', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Jane Updated',
          profileImage: 'https://example.com/avatar.png',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.profileImage).toBe('https://example.com/avatar.png');
    });

    it('should block local network/private IP URL inputs to prevent SSRF', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          profileImage: 'http://localhost:5000/internal-admin',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
