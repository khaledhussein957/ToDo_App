import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/protectRoute.middleware.ts";

import Category from "../model/category.model.ts";

export const createCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Name is required" });
        }

        const isCategoryExist = await Category.findOne({ name });
        if (isCategoryExist) {
            return res.status(400).json({ success: false, message: "Category already exists" });
        }

        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const category = await Category.create({ name, userId: user.userId });

        res.status(201).json({ success: true, message: "Category created successfully", category });

    } catch (error) {
        console.log("Error in createCategory", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAllCategories = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const categories = await Category.find({ userId: user.userId });
        if (!categories) {
            return res.status(404).json({ success: false, message: "No categories found" });
        }

        res.status(200).json({ success: true, categories });

    } catch (error) {
        console.log("Error in getAllCategories", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id || !name) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const isCategoryExist = await Category.findById(id);
        if (!isCategoryExist) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        if (isCategoryExist.userId.toString() !== user.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, { name }, { new: true });
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, message: "Category updated successfully", category: updatedCategory });

    } catch (error) {
        console.log("Error in updateCategory", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteCategory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: "Category id is required" });
        }
        
        const isCategoryExist = await Category.findById(id);
        if (!isCategoryExist) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        
        if (isCategoryExist.userId.toString() !== user.userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        
        const deletedCategory = await Category.findByIdAndDelete(id);
        
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        
        res.status(200).json({ success: true, message: "Category deleted successfully" });
        

    } catch (error) {
        console.log("Error in deleteCategory", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}