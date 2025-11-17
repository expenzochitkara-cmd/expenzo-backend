import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/expenzo';
    
    const conn = await mongoose.connect(mongoURI, {
      // Options are no longer needed in Mongoose 6+
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit, allow server to run without DB for development
    console.log('⚠️  Server will continue without database connection');
  }
};

export default connectDB;
