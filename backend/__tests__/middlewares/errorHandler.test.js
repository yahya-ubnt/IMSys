
const { errorHandler } = require('../../middlewares/errorHandler');
const httpMocks = require('node-mocks-http');

describe('Error Handling Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
  });

  it('should set status 500 if res.statusCode is 200 and return generic message in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Something went wrong');
    
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res._isJSON()).toBe(true);
    expect(res._getJSONData()).toEqual({
      message: 'Something went wrong',
      stack: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should use existing status code if not 200 and return generic message in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Not Found');
    res.statusCode = 404;

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res._isJSON()).toBe(true);
    expect(res._getJSONData()).toEqual({
      message: 'Not Found',
      stack: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return error stack in development environment', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Development Error');
    
    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res._isJSON()).toBe(true);
    expect(res._getJSONData().message).toBe('Development Error');
    expect(res._getJSONData().stack).toBeDefined();
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle custom error status codes in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Unauthorized');
    res.statusCode = 401;

    errorHandler(err, req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res._isJSON()).toBe(true);
    expect(res._getJSONData().message).toBe('Unauthorized');
    expect(res._getJSONData().stack).toBeDefined();
    expect(next).not.toHaveBeenCalled();
  });
});
