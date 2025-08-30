import Joi from "joi";

export const createTaskValidation = Joi.object({
    title: Joi.string().required().min(3).max(100).messages({
        "any.required": "Title is required",
        "string.empty": "Title is required",
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title must be less than 100 characters long",
    }),
    description: Joi.string().optional().min(3).max(1000).messages({
        "string.min": "Description must be at least 3 characters long",
        "string.max": "Description must be less than 1000 characters long",
    }),
    category: Joi.string().required().messages({
        "any.required": "Category is required",
        "string.empty": "Category is required",
    }),
    dueDate: Joi.string().optional().messages({
        "string.base": "Due date must be a valid string",
    }),
    priority: Joi.string().required().valid("high", "medium", "low").messages({
        "any.required": "Priority is required",
        "any.only": "Invalid priority",
    }),
    tags: Joi.string().optional().messages({
        "string.base": "Tags must be a JSON string",
    }),
    recurrence: Joi.string().optional().valid("Daily", "Weekly", "Monthly", null).messages({
        "any.only": "Invalid recurrence",
    }),
    // Attachments will be handled by multer middleware, not Joi validation
});

export const updateTaskValidation = Joi.object({
    title: Joi.string().optional().min(3).max(100).messages({
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title must be less than 100 characters long",
    }),
    description: Joi.string().optional().min(3).max(1000).messages({
        "string.min": "Description must be at least 3 characters long",
        "string.max": "Description must be less than 1000 characters long",
    }),
    category: Joi.string().optional().messages({
        "string.empty": "Category is required",
    }),
    dueDate: Joi.string().optional().messages({
        "string.base": "Due date must be a valid string",
    }),
    priority: Joi.string().optional().valid("high", "medium", "low").messages({
        "any.only": "Invalid priority",
    }),
    tags: Joi.string().optional().messages({
        "string.base": "Tags must be a JSON string",
    }),
    recurrence: Joi.string().optional().valid("Daily", "Weekly", "Monthly", null).messages({
        "any.only": "Invalid recurrence",
    }),
    // Attachments will be handled by multer middleware, not Joi validation
});