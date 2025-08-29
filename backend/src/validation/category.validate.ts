import Joi from "joi";

export const createCategoryValidation = Joi.object({
    name: Joi.string().required().min(3).max(50).messages({
        "any.required": "Name is required",
        "string.empty": "Name is required",
        "string.min": "Name must be at least 3 characters long",
        "string.max": "Name must be less than 50 characters long",
    }),
});

export const updateCategoryValidation = Joi.object({
    name: Joi.string().required().min(3).max(50).messages({
        "any.required": "Name is required",
        "string.empty": "Name is required",
        "string.min": "Name must be at least 3 characters long",
        "string.max": "Name must be less than 50 characters long",
    }),
});