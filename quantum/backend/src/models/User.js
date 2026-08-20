const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const UserInternal = mongoose.model('User', userSchema);

// Proxy to switch between real Mongoose model and Mock at runtime
module.exports = new Proxy(UserInternal, {
  get: (target, prop) => {
    const isMock = process.env.USE_MOCK_DB === 'true';
    if (prop === 'findOne' || prop === 'find' || prop === 'save') {
      console.log(`[PROXY] User.${prop} called. Mode: ${isMock ? 'MOCK' : 'REAL'}`);
    }
    const model = isMock
      ? require('./inMemoryDb').User
      : UserInternal;
    return model[prop];
  },
  construct: (target, args) => {
    const isMock = process.env.USE_MOCK_DB === 'true';
    console.log(`[PROXY] new User() created. Mode: ${isMock ? 'MOCK' : 'REAL'}`);
    const Model = isMock
      ? require('./inMemoryDb').User
      : UserInternal;
    return new Model(...args);
  }
});
