import Joi from "joi";
import type { Request, Response, NextFunction } from "express";

// Validation schema for analytics query parameters
const analyticsQuerySchema = Joi.object({
  period: Joi.number().integer().min(1).max(365).optional().default(30),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
}).custom((value, helpers) => {
  // If custom range is requested, both startDate and endDate are required
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) {
    return helpers.error("Start date and end date must both be provided for custom range");
  }
  
  // If both dates are provided, validate that startDate is before endDate
  if (value.startDate && value.endDate) {
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    
    if (start >= end) {
      return helpers.error("Start date must be before end date");
    }
    
    // Check if date range is not more than 1 year
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      return helpers.error("Date range cannot exceed 1 year");
    }
  }
  
  return value;
});

// Validation schema for custom range analytics
const customRangeSchema = Joi.object({
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
}).custom((value, helpers) => {
  const start = new Date(value.startDate);
  const end = new Date(value.endDate);
  
  if (start >= end) {
    return helpers.error("Start date must be before end date");
  }
  
  // Check if date range is not more than 1 year
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    return helpers.error("Date range cannot exceed 1 year");
  }
  
  return value;
});

// Middleware to validate analytics query parameters
export const validateAnalyticsQuery = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = analyticsQuerySchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  
  // Replace validated values
  Object.assign(req.query, value);
  next();
};

// Middleware to validate custom range parameters
export const validateCustomRange = (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = customRangeSchema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0]?.message
    });
  }
  
  // Replace validated values
  Object.assign(req.query, value);
  next();
};

// Export validation schemas for testing
export { analyticsQuerySchema, customRangeSchema };
