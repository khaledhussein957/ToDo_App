import { z } from "zod";

// Strong password validation function
const validateStrongPassword = (password: string) => {
  const upperCaseCount = (password.match(/[A-Z]/g) || []).length;
  const lowerCaseCount = (password.match(/[a-z]/g) || []).length;
  const digitCount = (password.match(/[0-9]/g) || []).length;
  const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;

  const errors = [];
  
  if (upperCaseCount < 2) {
    errors.push("2 uppercase letters");
  }
  if (lowerCaseCount < 2) {
    errors.push("2 lowercase letters");
  }
  if (digitCount < 2) {
    errors.push("2 digits");
  }
  if (symbolCount < 2) {
    errors.push("2 symbols");
  }

  return errors.length === 0 ? true : `Must have ${errors.join(", ")}`;
};

// Login Schema
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// Register Schema
export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .superRefine((password, ctx) => {
      const result = validateStrongPassword(password);
      if (result !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result as string,
        });
      }
    }),
});

// Update Profile Schema
export const updateProfileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  avatar: z.string().optional(),
});

// Update Password Schema
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters")
    .superRefine((password, ctx) => {
      const result = validateStrongPassword(password);
      if (result !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: result as string,
        });
      }
    }),
}).superRefine((data, ctx) => {
  // Ensure current password and new password are different
  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "New password must be different from current password",
      path: ["newPassword"],
    });
  }
});
