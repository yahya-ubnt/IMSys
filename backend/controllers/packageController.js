const asyncHandler = require('express-async-handler');
const Package = require('../models/Package');
const MikrotikRouter = require('../models/MikrotikRouter');

// @desc    Create a new Package
// @route   POST /api/mikrotik/packages
// @access  Private
const createPackage = asyncHandler(async (req, res) => {
  console.log('Received package creation request body:', req.body); // ADDED LOG
  const { mikrotikRouter, serviceType, name, price, status, profile, rateLimit } = req.body;

  if (!mikrotikRouter || !serviceType || !name || !price || !status) {
    res.status(400);
    throw new Error('Please add all required fields: mikrotikRouter, serviceType, name, price, status');
  }

  // Check if Mikrotik Router exists
  const routerExists = await MikrotikRouter.findById(mikrotikRouter);
  if (!routerExists) {
    res.status(404);
    throw new Error('Mikrotik Router not found');
  }

  if (serviceType === 'pppoe') {
    if (!profile) {
      res.status(400);
      throw new Error('For PPPoE packages, profile is required');
    }
    if (rateLimit) {
      res.status(400);
      throw new Error('PPPoE packages cannot have a rateLimit');
    }
  } else if (serviceType === 'static') {
    if (!rateLimit) {
      res.status(400);
      throw new Error('For Static packages, rateLimit is required');
    }
    if (profile) {
      res.status(400);
      throw new Error('Static packages cannot have a profile');
    }
  }

  const packageExists = await Package.findOne({ mikrotikRouter, serviceType, name });

  if (packageExists) {
    res.status(400);
    throw new Error('A package with this name, router, and service type already exists');
  }

  const newPackage = await Package.create({
    mikrotikRouter,
    serviceType,
    name,
    price,
    status,
    profile,
    rateLimit,
  });

  if (newPackage) {
    res.status(201).json(newPackage);
  } else {
    res.status(400);
    throw new Error('Invalid package data');
  }
});

// @desc    Get all Packages
// @route   GET /api/mikrotik/packages
// @access  Private
const getPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find({}).populate('mikrotikRouter');
  res.status(200).json(packages);
});

// @desc    Get single Package by ID
// @route   GET /api/mikrotik/packages/:id
// @access  Private
const getPackageById = asyncHandler(async (req, res) => {
  const singlePackage = await Package.findById(req.params.id).populate('mikrotikRouter');

  if (singlePackage) {
    res.status(200).json(singlePackage);
  } else {
    res.status(404);
    throw new Error('Package not found');
  }
});

// @desc    Update a Package
// @route   PUT /api/mikrotik/packages/:id
// @access  Private
const updatePackage = asyncHandler(async (req, res) => {
  const { mikrotikRouter, serviceType, name, price, status, profile, rateLimit } = req.body;

  const packageToUpdate = await Package.findById(req.params.id);

  if (!packageToUpdate) {
    res.status(404);
    throw new Error('Package not found');
  }

  const finalServiceType = serviceType || packageToUpdate.serviceType;

  // Validate fields based on serviceType during update as well
  if (finalServiceType === 'pppoe') {
    const finalProfile = profile !== undefined ? profile : packageToUpdate.profile;
    if (!finalProfile) {
      res.status(400);
      throw new Error('For PPPoE packages, profile is required');
    }
  } else if (finalServiceType === 'static') {
    const finalRateLimit = rateLimit !== undefined ? rateLimit : packageToUpdate.rateLimit;
    if (!finalRateLimit) {
      res.status(400);
      throw new Error('For Static packages, rateLimit is required');
    }
  }

  packageToUpdate.name = name !== undefined ? name : packageToUpdate.name;
  packageToUpdate.price = price !== undefined ? price : packageToUpdate.price;
  packageToUpdate.status = status !== undefined ? status : packageToUpdate.status;
  packageToUpdate.mikrotikRouter = mikrotikRouter !== undefined ? mikrotikRouter : packageToUpdate.mikrotikRouter;
  
  if (serviceType) {
    packageToUpdate.serviceType = serviceType;
  }

  if (packageToUpdate.serviceType === 'pppoe') {
    if (profile !== undefined) {
        packageToUpdate.profile = profile;
    }
    packageToUpdate.rateLimit = undefined;
  } else if (packageToUpdate.serviceType === 'static') {
    if (rateLimit !== undefined) {
        packageToUpdate.rateLimit = rateLimit;
    }
    packageToUpdate.profile = undefined;
  }

  const savedPackage = await packageToUpdate.save();

  res.status(200).json(savedPackage);
});

// @desc    Delete a Package
// @route   DELETE /api/mikrotik/packages/:id
// @access  Private
const deletePackage = asyncHandler(async (req, res) => {
  const singlePackage = await Package.findById(req.params.id);

  if (!singlePackage) {
    res.status(404);
    throw new Error('Package not found');
  }

  await Package.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: 'Package removed' });
});

module.exports = {
  createPackage,
  getPackages,
  getPackageById,
  updatePackage,
  deletePackage,
};
