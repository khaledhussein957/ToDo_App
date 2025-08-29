import express from "express";

import { registerController, loginController } from "../controller/auth.controller.ts";

import { register, login } from "../middleware/auth.middleware.ts";

const router = express.Router();

router.post("/register", register, registerController);
router.post("/login", login, loginController);

export default router;