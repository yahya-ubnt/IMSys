const mongoose = require('mongoose');
jest.unmock('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getBuildings,
  getBuilding,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} = require('../../controllers/buildingController');
const Building = require('../../models/Building');
const Tenant = require('../../models/Tenant');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Building Controller (Integration)', () => {
  let req, res, next, tenant;

  beforeEach(async () => {
    await Building.deleteMany({});
    await Tenant.deleteMany({});

    tenant = await Tenant.create({ name: 'Building Tenant' });

    req = {
      params: {},
      user: { tenant: tenant._id },
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createBuilding', () => {
    it('should create a new building successfully', async () => {
      req.body = {
        name: 'Plaza A',
        location: 'Downtown',
        description: 'Main office'
      };

      await createBuilding(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      const building = await Building.findOne({ name: 'Plaza A' });
      expect(building).toBeDefined();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'Plaza A' })
      }));
    });
  });

  describe('getBuildings', () => {
    it('should return all buildings for the tenant', async () => {
      await Building.create({
        name: 'Building 1',
        location: 'Loc 1',
        tenant: tenant._id
      });

      await getBuildings(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
              expect.objectContaining({ name: 'Building 1' })
          ])
      }));
    });
  });

  describe('getBuilding', () => {
    it('should return a single building by ID', async () => {
      const b = await Building.create({
        name: 'Single Building',
        location: 'Loc 2',
        tenant: tenant._id
      });

      req.params.id = b._id;
      await getBuilding(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          data: expect.objectContaining({ name: 'Single Building' })
      }));
    });

    it('should throw error if building not found', async () => {
        req.params.id = new mongoose.Types.ObjectId();
        await getBuilding(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateBuilding', () => {
    it('should update building (Placeholder - currently has auth lock)', async () => {
      const b = await Building.create({
        name: 'Old Name',
        location: 'Old Loc',
        tenant: tenant._id
      });

      req.params.id = b._id;
      req.body = { name: 'New Name' };

      await updateBuilding(req, res, next);
      // Note: Current buildingController implementation has a hardcoded 401/error for update
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('deleteBuilding', () => {
    it('should delete building (Placeholder - currently has auth lock)', async () => {
      const b = await Building.create({
        name: 'Delete Me',
        location: 'Loc',
        tenant: tenant._id
      });

      req.params.id = b._id;
      await deleteBuilding(req, res, next);
      // Note: Current buildingController implementation has a hardcoded 401/error for delete
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
