const request = require('supertest');
const express = require('express');
const { uploadImage } = require('../../controllers/uploadController');
const fs = require('fs');
const path = require('path');

describe('Upload Controller (Functional)', () => {
  let app;
  const uploadDir = path.join(__dirname, '../../uploads');

  beforeAll(() => {
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    app = express();
    app.post('/api/upload', uploadImage);
  });

  afterAll(() => {
    // Cleanup: We don't necessarily want to delete the whole directory 
    // as it might be used by dev, but we could delete test files if we tracked them.
    // For now, we'll leave it to avoid accidental data loss in the user's project.
  });

  it('should successfully upload an image and return the path', async () => {
    // Create a dummy image buffer
    const dummyImage = Buffer.from('fake-image-content');
    
    const res = await request(app)
      .post('/api/upload')
      .attach('image', dummyImage, 'test-image.png');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Image uploaded successfully');
    expect(res.body.image).toMatch(/^\/uploads\/image-\d+\.png$/);

    // Verify file actually exists on disk
    const savedPath = path.join(__dirname, '../..', res.body.image);
    expect(fs.existsSync(savedPath)).toBe(true);

    // Cleanup the specific test file
    fs.unlinkSync(savedPath);
  });

  it('should return 400 if no file is selected', async () => {
    const res = await request(app)
      .post('/api/upload');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No file selected');
  });

  it('should return 400 for invalid file types', async () => {
    const dummyTextFile = Buffer.from('fake-text-content');

    const res = await request(app)
      .post('/api/upload')
      .attach('image', dummyTextFile, 'test.txt');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Images only!');
  });
});
