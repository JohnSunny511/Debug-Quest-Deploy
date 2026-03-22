const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured");
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!connectionPromise) {
      connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    await connectionPromise;
    return mongoose.connection;
  } catch (_err) {
    connectionPromise = null;
    throw _err;
  }
};

module.exports = connectDB;
