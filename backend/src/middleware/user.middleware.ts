import type { NextFunction, Request, Response } from "express";

import { updateUserValidation, updatePasswordValidation } from "../validation/user.validate.ts";

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = updateUserValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = updatePasswordValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}