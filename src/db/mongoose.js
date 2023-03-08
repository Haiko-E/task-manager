import mongoose from 'mongoose';

const url = process.env.MONGOOSE_API;
export async function connectToMongo() {
  try {
    await mongoose.set('strictQuery', false);
    await mongoose.connect(url);
    console.log('connected to MongoDB');
  } catch (error) {
    console.log(error);
  }
}
