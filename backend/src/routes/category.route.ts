import express from "express";

import { createCategory, getAllCategories, updateCategory, deleteCategory } from "../controller/category.controller.ts";

import { createCategory as createCategoryMiddleware, updateCategory as updateCategoryMiddleware } from "../middleware/category.middleware.ts";
import { authMiddleware } from "../middleware/protectRoute.middleware.ts";

const router = express.Router();

router.post("/create-category", authMiddleware, createCategoryMiddleware, createCategory);
router.get("/get-all-categories", authMiddleware, getAllCategories);
router.put("/update-category/:id", authMiddleware, updateCategoryMiddleware, updateCategory);
router.delete("/delete-category/:id", authMiddleware, deleteCategory);


export default router;