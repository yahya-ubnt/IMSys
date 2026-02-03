process.env.JWT_SECRET = 'test_secret_key_12345';
process.env.MONGO_URI = 'mongodb://fake-host:27017/test_db';
process.env.PORT = '5001';
process.env.NODE_ENV = 'test';
// 32 bytes = 64 hex chars
process.env.ENCRYPTION_KEY = '0000000000000000000000000000000000000000000000000000000000000000';
