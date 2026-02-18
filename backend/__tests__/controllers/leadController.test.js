const {
  createLead,
  getAllLeads,
  getLeadById,
  updateLead,
  deleteLead,
  updateLeadStatus,
} = require('../../controllers/leadController');
const Lead = require('../../models/Lead');
const MikrotikUser = require('../../models/MikrotikUser');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

jest.mock('../../models/Lead');
jest.mock('../../models/MikrotikUser');
jest.mock('express-validator');

describe('Lead Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { id: 'testLeadId' },
      user: { _id: 'testUserId', tenant: 'testTenant' },
      body: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a new lead', async () => {
      const leadData = {
        name: 'Test Lead',
        phoneNumber: '1234567890',
        leadSource: 'Website',
        desiredPackage: 'package1',
        notes: 'Some notes',
        agreedInstallationFee: 50,
        agreedMonthlySubscription: 100,
      };
      req.body = leadData;
      Lead.create.mockResolvedValue({ ...leadData, tenant: 'testTenant', totalAmount: 150 });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Lead' }));
    });

    it('should return 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Invalid input' }] });

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Invalid input' }] });
    });

    it('should return 400 if an error occurs during creation', async () => {
      req.body = { name: 'Test Lead' };
      Lead.create.mockRejectedValue(new Error('DB error'));

      await createLead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
    });
  });

  describe('getAllLeads', () => {
    it('should return all leads and dashboard stats', async () => {
      const mockLeads = [{ name: 'Lead 1' }];
      Lead.find.mockReturnThis();
      Lead.populate.mockResolvedValue(mockLeads);
      Lead.countDocuments.mockResolvedValueOnce(10) // totalLeads
                          .mockResolvedValueOnce(5)  // totalConvertedLeads
                          .mockResolvedValueOnce(3)  // newLeadsThisMonth
                          .mockResolvedValueOnce(2); // convertedLeadsThisMonth
      Lead.aggregate.mockResolvedValue([{ _id: { year: 2024, month: 1 }, newLeads: 1, convertedLeads: 1 }]);

      await getAllLeads(req, res);

      expect(Lead.find).toHaveBeenCalledWith({ tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        leads: mockLeads,
        dashboardStats: {
          totalLeads: 10,
          totalConvertedLeads: 5,
          newLeadsThisMonth: 3,
          convertedLeadsThisMonth: 2,
        },
        chartData: expect.any(Array),
      }));
    });

    it('should handle search and filter queries', async () => {
      req.query = { status: 'New', search: 'John' };
      Lead.find.mockReturnThis();
      Lead.populate.mockResolvedValue([]);
      Lead.countDocuments.mockResolvedValue(0);
      Lead.aggregate.mockResolvedValue([]);

      await getAllLeads(req, res);

      expect(Lead.find).toHaveBeenCalledWith(expect.objectContaining({
        status: 'New',
        $or: expect.any(Array),
      }));
    });
  });

  describe('getLeadById', () => {
    it('should return a single lead', async () => {
      const mockLead = { _id: 'testLeadId', name: 'Test Lead', tenant: 'testTenant' };
      Lead.findOne.mockReturnThis();
      Lead.populate.mockResolvedValue(mockLead);

      await getLeadById(req, res);

      expect(Lead.findOne).toHaveBeenCalledWith({ _id: 'testLeadId', tenant: 'testTenant' });
      expect(res.json).toHaveBeenCalledWith(mockLead);
    });

    it('should return 404 if lead not found', async () => {
      Lead.findOne.mockReturnThis();
      Lead.populate.mockResolvedValue(null);

      await getLeadById(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Lead not found'));
    });
  });

  describe('updateLead', () => {
    it('should update a lead', async () => {
      const mockLead = {
        _id: 'testLeadId',
        name: 'Old Name',
        phoneNumber: '111',
        agreedInstallationFee: 10,
        agreedMonthlySubscription: 20,
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({ name: 'New Name', phoneNumber: '222', totalAmount: 30 }),
      };
      req.body = { name: 'New Name', phoneNumber: '222' };
      Lead.findOne.mockResolvedValue(mockLead);

      await updateLead(req, res);

      expect(mockLead.name).toBe('New Name');
      expect(mockLead.phoneNumber).toBe('222');
      expect(mockLead.totalAmount).toBe(30);
      expect(mockLead.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
    });

    it('should return 404 if lead not found', async () => {
      Lead.findOne.mockResolvedValue(null);

      await updateLead(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Lead not found'));
    });
  });

  describe('deleteLead', () => {
    it('should delete a lead', async () => {
      const mockLead = {
        _id: 'testLeadId',
        tenant: 'testTenant',
        deleteOne: jest.fn().mockResolvedValue({}),
      };
      Lead.findOne.mockResolvedValue(mockLead);

      await deleteLead(req, res);

      expect(mockLead.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Lead removed' });
    });

    it('should return 404 if lead not found', async () => {
      Lead.findOne.mockResolvedValue(null);

      await deleteLead(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Lead not found'));
    });
  });

  describe('updateLeadStatus', () => {
    it('should update lead status', async () => {
      const mockLead = {
        _id: 'testLeadId',
        status: 'New',
        statusHistory: [],
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({ status: 'Contacted' }),
      };
      req.body = { status: 'Contacted' };
      Lead.findOne.mockResolvedValue(mockLead);

      await updateLeadStatus(req, res);

      expect(mockLead.status).toBe('Contacted');
      expect(mockLead.statusHistory).toHaveLength(1);
      expect(mockLead.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'Contacted' }));
    });

    it('should convert lead to Mikrotik user if status is Converted and createMikrotikUser is true', async () => {
      const mockLead = {
        _id: 'testLeadId',
        status: 'New',
        statusHistory: [],
        tenant: 'testTenant',
        save: jest.fn().mockResolvedValue({ status: 'Converted', isConverted: true, mikrotikUser: 'newMikrotikUserId' }),
      };
      req.body = {
        status: 'Converted',
        createMikrotikUser: true,
        mikrotikUsername: 'testuser',
        mikrotikPassword: 'password',
        mikrotikService: 'hotspot',
        mikrotikRouter: 'router1',
      };
      Lead.findOne.mockResolvedValue(mockLead);
      MikrotikUser.prototype.save = jest.fn().mockResolvedValue({ _id: 'newMikrotikUserId' });

      await updateLeadStatus(req, res);

      expect(mockLead.status).toBe('Converted');
      expect(mockLead.isConverted).toBe(true);
      expect(mockLead.mikrotikUser).toBe('newMikrotikUserId');
      expect(MikrotikUser.prototype.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'Converted' }));
    });

    it('should return 404 if lead not found', async () => {
      Lead.findOne.mockResolvedValue(null);
      req.body = { status: 'Contacted' };

      await updateLeadStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(new Error('Lead not found'));
    });
  });
});