import Joi from "joi";

export const updateUserValidation = Joi.object({
    name: Joi.string().min(3).max(50).messages({
        "string.min": "Name must be at least 3 characters long",
        "string.max": "Name must be less than 50 characters long",
    }),
    email: Joi.string().email().messages({
        "string.email": "Invalid email address",
    }),
    avatar: Joi.string().uri().messages({
        "string.uri": "Invalid avatar URL",
    }),
});

export const updatePasswordValidation = Joi.object({
    currentPassword: Joi.string().required().min(8).messages({
        "any.required": "Current password is required",
        "string.empty": "Current password is required",
        "string.min": "Current password must be at least 8 characters long",
    }),
    newPassword: Joi.string().required().min(8).messages({
        "any.required": "New password is required",
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters long",
    }),
});