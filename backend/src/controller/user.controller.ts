import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import type { AuthenticatedRequest } from "../middleware/protectRoute.middleware.ts";

import User from "../model/user.model.ts";

import cloudinary from "../config/cloudinary.ts";
import { ENV } from "../config/ENV.ts";

export const getUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const userData = await User.findById(user.userId);
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userResponse = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    res.status(200).json({ success: true, user: userResponse });
  } catch (error) {
    console.log("Error in getUserController", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { name, email } = req.body;

    // check if email is already in use (excluding current user)
    const existingUser = await User.findOne({
      email,
      _id: { $ne: currentUser.userId },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Get current user data for avatar check
    const currentUserData = await User.findById(currentUser.userId);
    if (!currentUserData) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // file upload
    let avatar = currentUserData.avatar || "";
    if (req.file) {
      // Destroy previous image if exists
      if (currentUserData.avatar) {
        // delete the image in cloudinary
        const publicId = currentUserData.avatar.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId.toString());
          console.log("Previous avatar deleted from Cloudinary");
        }
      }
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "users",
      });
      avatar = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUser.userId,
      { name, email, avatar },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
    res
      .status(200)
      .json({
        success: true,
        message: "User updated successfully",
        user: userResponse,
      });
  } catch (error) {
    console.log("Error in updateUserController", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updatePasswordController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findById(currentUser.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
    if (isNewPasswordSame) {
      return res
        .status(400)
        .json({
          success: false,
          message: "New password cannot be the same as the current password",
        });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await User.findByIdAndUpdate(
      currentUser.userId,
      { password: hashedNewPassword },
      { new: true }
    );
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userResponse = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
    res
      .status(200)
      .json({
        success: true,
        message: "Password updated successfully",
        user: userResponse,
      });
  } catch (error) {
    console.log("Error in updatePasswordController", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteUserController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const user = await User.findByIdAndDelete(currentUser.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.avatar) {
      const publicId = user.avatar.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(publicId.toString());
      }
    }

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUserController", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
