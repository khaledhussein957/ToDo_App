import type { NextFunction, Request, Response } from "express";

import { registerValidation, loginValidation } from "../validation/auth.validate.ts";

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = registerValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { error } = loginValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0]?.message });
    next();
}

