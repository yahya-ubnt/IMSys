const { uploadImage } = require('../../controllers/uploadController');
const multer = require('multer');

jest.mock('multer', () => {
    const multer = () => ({
      single: () => {
        return (req, res, next) => {
          req.file = { path: 'uploads/test.jpg' };
          next();
        };
      },
    });
    multer.diskStorage = () => {};
    return multer;
  });

describe('Upload Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should upload an image successfully', () => {
    uploadImage(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Image uploaded successfully',
      image: '/uploads/test.jpg',
    });
  });
});
