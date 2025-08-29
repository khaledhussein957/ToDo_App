import Joi from "joi";

export const registerValidation = Joi.object({
    name: Joi.string().required().min(3).max(50).messages({
        "any.required": "Name is required",
        "string.empty": "Name is required",
        "string.min": "Name must be at least 3 characters long",
        "string.max": "Name must be less than 50 characters long",
    }),
    email: Joi.string().email().required().messages({
        "any.required": "Email is required",
        "string.empty": "Email is required",
        "string.email": "Invalid email address",
    }),
    password: Joi.string().required().messages({
        "any.required": "Password is required",
        "string.empty": "Password is required",
    }),
});

export const loginValidation = Joi.object({
    email: Joi.string().email().required().messages({
        "any.required": "Email is required",
        "string.empty": "Email is required",
        "string.email": "Invalid email address",
    }),
    password: Joi.string().required().messages({
        "any.required": "Password is required",
        "string.empty": "Password is required",
    }),
});



