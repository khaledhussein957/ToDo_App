import Joi from "joi";
import type { Request, Response, NextFunction } from "express";

// Validation schema for creating a notification
const createNotificationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).required()
    .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 1 character long",
      "string.max": "Title cannot exceed 100 characters",
      "any.required": "Title is required"
    }),
  message: Joi.string().trim().min(1).max(500).required()
    .messages({
      "string.empty": "Message is required",
      "string.min": "Message must be at least 1 character long",
      "string.max": "Message cannot exceed 500 characters",
      "any.required": "Message is required"
    }),
  taskId: Joi.string().required()
    .messages({
      "string.empty": "Task ID is required",
      "any.required": "Task ID is required"
    }),
  notifyAt: Joi.date().greater("now").required()
    .messages({
      "date.base": "Notification time must be a valid date",
      "date.greater": "Notification time must be in the future",
      "any.required": "Notification time is required"
    })
});

// Validation schema for updating a notification
const updateNotificationSchema = Joi.object({
  title: Joi.string().trim().min(1).max(100).optional()
    .messages({
      "string.empty": "Title cannot be empty",
      "string.min": "Title must be at least 1 character long",
      "string.max": "Title cannot exceed 100 characters"
    }),
  message: Joi.string().trim().min(1).max(500).optional()
    .messages({
      "string.empty": "Message cannot be empty",
      "string.min": "Message must be at least 1 character long",
      "string.max": "Message cannot exceed 500 characters"
    }),
  notifyAt: Joi.date().greater("now").optional()
    .messages({
      "date.base": "Notification time must be a valid date",
      "date.greater": "Notification time must be in the future"
    })
});

// Validation schema for notification query parameters
const notificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1)
    .messages({
      "number.base": "Page must be a number",
      "number.integer": "Page must be an integer",
      "number.min": "Page must be at least 1"
    }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10)
    .messages({
      "number.base": "Limit must be a number",
      "number.integer": "Limit must be an integer",
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100"
    }),
  status: Joi.string().valid("sent", "pending").optional()
    .messages({
      "string.empty": "Status cannot be empty",
      "any.only": "Status must be either 'sent' or 'pending'"
    })
});

// Validation schema for bulk delete
const bulkDeleteSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string()).min(1).max(50).required()
    .messages({
      "array.base": "Notification IDs must be an array",
      "array.min": "At least one notification ID is required",
      "array.max": "Cannot delete more than 50 notifications at once",
      "any.required": "Notification IDs array is required"
    })
});

// Middleware to validate create notification
export const validateCreateNotification = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = createNotificationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  // Replace validated values
  if (value) {
    Object.assign(req.body, value);
  }
  next();
};

// Middleware to validate update notification
export const validateUpdateNotification = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = updateNotificationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  // Replace validated values
  if (value) {
    Object.assign(req.body, value);
  }
  next();
};

// Middleware to validate notification query parameters
export const validateNotificationQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = notificationQuerySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  // Replace validated values
  if (value) {
    Object.assign(req.query, value);
  }
  next();
};

// Middleware to validate bulk delete
export const validateBulkDelete = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = bulkDeleteSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  // Replace validated values
  if (value) {
    Object.assign(req.body, value);
  }
  next();
};

// Export validation schemas for testing
export {
  createNotificationSchema,
  updateNotificationSchema,
  notificationQuerySchema,
  bulkDeleteSchema
};
