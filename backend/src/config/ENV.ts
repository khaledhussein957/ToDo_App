import dotenv from "dotenv";

dotenv.config();

export const ENV = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
}