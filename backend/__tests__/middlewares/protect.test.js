
const httpMocks = require('node-mocks-http');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { protect, isSuperAdmin, isAdmin, isSuperAdminOrAdmin } = require('../../middlewares/protect');

jest.mock('jsonwebtoken');
jest.mock('../../models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    process.env.JWT_SECRET = 'testsecret'; // Set a dummy secret for testing
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should return 401 if no token is provided', async () => {
      await protect(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({ message: 'Not authorized, no token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalidtoken';
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      await protect(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({ message: 'Not authorized, token failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      req.headers.authorization = 'Bearer validtoken';
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await protect(req, res, next);
      expect(res.statusCode).toBe(401);
      expect(res._getJSONData()).toEqual({ message: 'Not authorized, user not found' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should attach user to req and call next if token is valid and user found', async () => {
      req.headers.authorization = 'Bearer validtoken';
      const mockUser = { _id: 'user123', roles: ['ADMIN'] };
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await protect(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should get token from cookies if available', async () => {
      req.cookies = { token: 'validcookie' };
      const mockUser = { _id: 'user123', roles: ['ADMIN'] };
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await protect(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('isSuperAdmin middleware', () => {
    it('should call next if user is SUPER_ADMIN', () => {
      req.user = { roles: ['SUPER_ADMIN'] };
      isSuperAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is not SUPER_ADMIN', () => {
      req.user = { roles: ['ADMIN'] };
      isSuperAdmin(req, res, next);
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData()).toEqual({ message: 'Not authorized as a Super Admin' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin middleware', () => {
    it('should call next if user is ADMIN', () => {
      req.user = { roles: ['ADMIN'] };
      isAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is not ADMIN', () => {
      req.user = { roles: ['SUPER_ADMIN'] }; // SUPER_ADMIN is not ADMIN
      isAdmin(req, res, next);
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData()).toEqual({ message: 'Not authorized as an Admin' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isSuperAdminOrAdmin middleware', () => {
    it('should call next if user is SUPER_ADMIN', () => {
      req.user = { roles: ['SUPER_ADMIN'] };
      isSuperAdminOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should call next if user is ADMIN', () => {
      req.user = { roles: ['ADMIN'] };
      isSuperAdminOrAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is neither SUPER_ADMIN nor ADMIN', () => {
      req.user = { roles: ['USER'] }; // Assuming a 'USER' role exists
      isSuperAdminOrAdmin(req, res, next);
      expect(res.statusCode).toBe(403);
      expect(res._getJSONData()).toEqual({ message: 'Not authorized for this resource' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
