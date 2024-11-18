import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  const path = `${process.env.MONGO_URL}/${DB_NAME}`;
  try {
    const connectionInstance = await mongoose.connect(path);

    console.log("DB connected at ", connectionInstance.connection.host);
  } catch (error) {
    console.log("DB setup failed", error);
    process.exit(1);
  }
};

export { connectDB };
