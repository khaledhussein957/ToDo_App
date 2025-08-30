import type { NextFunction, Request, Response } from "express";

import { createTaskValidation, updateTaskValidation } from "../validation/task.validate.ts";

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = createTaskValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = updateTaskValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}