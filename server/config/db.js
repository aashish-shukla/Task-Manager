const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      process.exit(1);
    }

    // In development, if using localhost and connection fails, try in-memory
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
        return mongoose.connection;
      } catch {
        // Try in-memory server for local development
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          const memUri = mongod.getUri();
          await mongoose.connect(memUri);
          console.log('📦 Using in-memory MongoDB server for development');
          console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
          return mongoose.connection;
        } catch (memErr) {
          console.error('❌ Could not start in-memory MongoDB:', memErr.message);
          process.exit(1);
        }
      }
    }

    // Production: connect directly to the provided URI
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
