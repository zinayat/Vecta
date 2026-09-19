import mongoose from "mongoose";

// Cache the connection across hot reloads (dev) and warm serverless invocations
// (Vercel) - without this, every route handler invocation would open a new
// connection and eventually exhaust the connection pool.
const globalForMongoose = globalThis;

let cached = globalForMongoose._vectaMongoose;
if (!cached) {
  cached = globalForMongoose._vectaMongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
