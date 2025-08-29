import express from "express";
import jwt from "jsonwebtoken";

import { ENV } from "../config/ENV.ts";

export interface AuthenticatedRequest extends express.Request {
  user?: { userId: string };
  file?: Express.Multer.File | undefined;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).send("Missed token from cookies Unauthorized");
    }

    const decode = jwt.verify(token, ENV.JWT_SECRET as string) as { userId: string };

    if (!decode || !decode.userId) {
      return res.status(401).send("Error happen Unauthorized");
    }

    req.user = { userId: decode.userId };

    next();
  } catch (err) {
    console.log("Error in auth middleware:", err);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
