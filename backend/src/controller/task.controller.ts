import fs from "fs";
import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/protectRoute.middleware.ts";

import Task from "../model/task.model.ts";
import Category from "../model/category.model.ts";
import User from "../model/user.model.ts";

import cloudinary from "../config/cloudinary.ts";

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      dueDate,
      priority,
      tags,
      recurrence,
    } = req.body;
    
    if (!title || !category || !dueDate || !priority) {
      return res
        .status(400)
        .json({ success: false, message: "Title, category, due date, and priority are required" });
    }

    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const isUserExist = await User.findById(user.userId);
    if (!isUserExist) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isTaskExist = await Task.findOne({ title, userId: user.userId });
    if (isTaskExist) {
      return res
        .status(400)
        .json({ success: false, message: "Task already exists" });
    }

    const isCategoryExist = await Category.findById(category);
    if (!isCategoryExist) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

        // Handle file uploads (temporarily disabled)
    let document: string = "";
    if (req.file){
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "tasks",
        });
        document = result.secure_url;
    }

    const task = await Task.create({
      title,
      description,
      categoryId: category,
      dueDate,
      priority,
      tags: tags ? JSON.parse(tags) : [],
      recurrence,
      document,
      userId: user.userId,
    });

    res
      .status(201)
      .json({ success: true, message: "Task created successfully", task });
  } catch (error) {
    console.log("Error in createTask", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, category, dueDate, priority, tags, recurrence } = req.body;
        
        if (!id) {
            return res.status(400).json({ success: false, message: "Task ID is required" });
        }

        const user = req.user;
        if (!user) {
          return res
            .status(401)
            .json({ success: false, message: "User not authenticated" });
        }

        const isTaskExist = await Task.findById(id);
        if (!isTaskExist) {
          return res
            .status(404)
            .json({ success: false, message: "Task not found" });
        }

        const isCategoryExist = await Category.findById(category);
        if (!isCategoryExist) {
          return res
            .status(404)
            .json({ success: false, message: "Category not found" });
        }

        // Handle file uploads for updates (temporarily disabled)
        let document = isTaskExist.document || "";
        if (req.file){
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "tasks",
            });
            document = result.secure_url;
        }

        const updatedTask = await Task.findByIdAndUpdate(
          id, 
          { 
            title, 
            description, 
            categoryId: category, 
            dueDate, 
            priority, 
            tags: tags ? JSON.parse(tags) : isTaskExist.tags, 
            recurrence, 
            document,
            userId: user.userId 
          }, 
          { new: true }
        );

        res
          .status(200)
          .json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask,
          });
    } catch (error) {
      console.log("Error in updateTask", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const isUserExist = await User.findById(user.userId);
    if (!isUserExist) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const {
      page = 1,
      limit = 10,
      search = "",
      sort = "createdAt",
      order = "desc",
      categoryId = "",
      priority = "",
      status = "",
      startDate = "",
      endDate = "",
    } = req.query;

    const query: any = { userId: user.userId };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (priority) {
      query.priority = priority;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (startDate && endDate) {
      query.dueDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const totalTasks = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate("categoryId")
      .sort({ [sort as string]: order === "asc" ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const totalPages = Math.ceil(totalTasks / Number(limit));

    res
      .status(200)
      .json({ success: true, tasks, totalPages, currentPage: Number(page) });
  } catch (error) {
    console.log("Error in getTasks", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const completeTask = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Task id is required" });
    }

    const isTaskExist = await Task.findById(id);
    if (!isTaskExist) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const isTaskOwner = isTaskExist.userId.toString() === user.userId;
    if (!isTaskOwner) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const isTaskCompleted = isTaskExist.completed;
    if (isTaskCompleted) {
      return res
        .status(400)
        .json({ success: false, message: "Task already completed" });
    }

    const completedTask = await Task.findByIdAndUpdate(
      id,
      { completed: true },
      { new: true }
    );

    res
      .status(200)
      .json({
        success: true,
        message: "Task completed successfully",
        task: completedTask,
      });
  } catch (error) {
    console.log("Error in completeTask", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Task id is required" });
    }

    const isTaskExist = await Task.findById(id);
    if (!isTaskExist) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const isTaskOwner = isTaskExist.userId.toString() === user.userId;
    if (!isTaskOwner) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Delete attachments from Cloudinary if they exist
    if (isTaskExist.document) {
      try {
        const publicId = isTaskExist.document.split("/").pop()?.split(".")[0];
        if (publicId) {
            await cloudinary.uploader.destroy(publicId.toString());
        }
      } catch (cloudinaryError) {
        console.log("Error deleting attachment from Cloudinary:", cloudinaryError);
        // Continue with local deletion even if Cloudinary deletion fails
      }
    }


    const deletedTask = await Task.findByIdAndDelete(id);
    if (!deletedTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.log("Error in deleteTask", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
