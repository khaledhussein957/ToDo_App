import type { NextFunction, Request, Response } from "express";

import { createCategoryValidation, updateCategoryValidation } from "../validation/category.validate.ts";

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = createCategoryValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = updateCategoryValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}