// backend/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // If the error object has a statusCode, use it
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
