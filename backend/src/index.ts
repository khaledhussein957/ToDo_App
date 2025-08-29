import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";

import { ENV } from "./config/ENV.ts";
import connectDB from "./config/db.ts";

import authRoutes from "./routes/auth.route.ts";

const app = express();
const PORT = ENV.PORT;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// static folder for uploads
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
    res.send("Hello World");
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});