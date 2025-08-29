import express from "express";

import { authMiddleware } from "../middleware/protectRoute.middleware.ts";
import { updateUser, updatePassword } from "../middleware/user.middleware.ts";
import upload from "../middleware/upload.ts";

import { getUserController, updateUserController, updatePasswordController, deleteUserController } from "../controller/user.controller.ts";

const router = express.Router();

router.get("/get-user", authMiddleware, getUserController);
router.put("/update-user", authMiddleware, upload.single("avatar"), updateUser, updateUserController);
router.put("/update-password", authMiddleware, updatePassword, updatePasswordController);
router.delete("/delete-user", authMiddleware, deleteUserController);

export default router;