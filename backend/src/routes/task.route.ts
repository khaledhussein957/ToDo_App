import express from "express";

import { createTask, updateTask, getTasks, completeTask, deleteTask } from "../controller/task.controller.ts";

import { createTask as createTaskMiddleware, updateTask as updateTaskMiddleware } from "../middleware/task.middleware.ts";
import { authMiddleware } from "../middleware/protectRoute.middleware.ts";
import taskUpload from "../middleware/taskUpload.ts";

const router = express.Router();

router.post("/create-task", authMiddleware, createTaskMiddleware, taskUpload.single('document'), createTask);
router.put("/update-task/:id", authMiddleware, updateTaskMiddleware, taskUpload.single('document'), updateTask);
router.get("/get-tasks", authMiddleware, getTasks);
router.put("/complete-task/:id", authMiddleware, completeTask);
router.delete("/delete-task/:id", authMiddleware, deleteTask);

export default router;