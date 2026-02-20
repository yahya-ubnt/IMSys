const mongoose = {
  Schema: function (schema) {
    return {
      schema: schema,
      statics: {},
      methods: {},
      pre: jest.fn(),
      post: jest.fn(),
      index: jest.fn(),
      virtual: jest.fn(() => ({
        get: jest.fn(),
      })),
      set: jest.fn(),
    };
  },
  Types: {
    ObjectId: jest.fn(() => 'mock-object-id'),
  },
  model: jest.fn().mockReturnValue({
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  }),
};

mongoose.Schema.Types = {
  ObjectId: jest.fn(() => 'mock-object-id'),
};

module.exports = mongoose;