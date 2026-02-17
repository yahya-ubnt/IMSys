const { getBuildings, getBuilding, createBuilding, updateBuilding, deleteBuilding } = require('../../controllers/buildingController');
const Building = require('../../models/Building');

jest.mock('../../models/Building');

describe('buildingController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { tenant: 'tenant-1' },
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBuildings', () => {
    it('should get all buildings for a tenant', async () => {
      const mockBuildings = [{ name: 'Building A' }, { name: 'Building B' }];
      Building.find.mockResolvedValue(mockBuildings);

      await getBuildings(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBuildings });
    });
  });

  describe('getBuilding', () => {
    it('should get a single building by ID', async () => {
      req.params.id = 'building-1';
      const mockBuilding = { _id: 'building-1', name: 'Building A' };
      Building.findById.mockResolvedValue(mockBuilding);

      await getBuilding(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBuilding });
    });

    it('should return 404 if building not found', async () => {
        req.params.id = 'building-1';
        Building.findById.mockResolvedValue(null);
        await getBuilding(req, res, next);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
  });

  describe('createBuilding', () => {
    it('should create a building successfully', async () => {
      req.body = { name: 'New Building' };
      const mockBuilding = { _id: 'building-2', name: 'New Building' };
      Building.create.mockResolvedValue(mockBuilding);

      await createBuilding(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockBuilding });
    });
  });

  describe('updateBuilding', () => {
    it('should throw an error', async () => {
        req.params.id = 'building-1';
        req.body = { name: 'Updated Building' };
        Building.findById.mockResolvedValue({ _id: 'building-1' });
    
        await updateBuilding(req, res, next);
    
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
  });

  describe('deleteBuilding', () => {
    it('should throw an error', async () => {
        req.params.id = 'building-1';
        Building.findById.mockResolvedValue({ _id: 'building-1' });
    
        await deleteBuilding(req, res, next);
    
        expect(next).toHaveBeenCalledWith(expect.any(Error));
      });
  });
});
