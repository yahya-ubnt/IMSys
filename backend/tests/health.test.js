const request = require('supertest');
const mongoose = require('mongoose');

// Mock database connection to prevent startup errors
jest.mock('../config/db', () => jest.fn());

// Mock socket.io to avoid initializing a real server
jest.mock('../socket', () => ({
  init: () => ({
    use: jest.fn(),
    on: jest.fn(),
  }),
  getIO: () => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  }),
}));

const app = require('../server');

describe('API Health Check', () => {
  // We don't need to close mongoose here because we mocked it out
  
  it('should return a welcome message on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Referral and Commission System Backend API');
  });
});
