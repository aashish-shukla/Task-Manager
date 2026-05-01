const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Use in-memory MongoDB for development if no real MongoDB is available
    if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1')) {
      try {
        // Try connecting to the configured URI first
        if (uri) {
          await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
          console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
          return mongoose.connection;
        }
      } catch {
        // Fall through to memory server
      }

      // Use in-memory MongoDB server
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('📦 Using in-memory MongoDB server for development');
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
