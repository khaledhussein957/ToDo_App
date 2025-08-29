import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { ENV } from "../config/ENV.ts";

import User from "../model/user.model.ts";

export const registerController = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ userId: user._id }, ENV.JWT_SECRET as string);

    res
      .status(201)
      .json({
        success: true,
        message: "User created successfully",
        token,
        user,
      });
  } catch (error) {
    console.log("Error in registerController", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const isUserExist = await User.findOne({ email });
    if (!isUserExist) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      isUserExist.password
    );
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: isUserExist._id },
      ENV.JWT_SECRET as string
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        user: isUserExist,
      });
  } catch (error) {
    console.log("Error in loginController", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
