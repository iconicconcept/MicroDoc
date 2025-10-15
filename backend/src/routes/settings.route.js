// routes/profile.routes.js
import express from "express";
import { body } from "express-validator";
// import { authenticate } from "../middleware/auth.js";
// import { handleValidationErrors } from "../middleware/validation.js";
// import {
//   getProfile,
//   updateProfile,
//   deleteProfile,
// } from "../controllers/profile.controller.js";

const router = express.Router();

// const updateProfileValidation = [
//   body("fullName").optional().notEmpty().withMessage("Full name cannot be empty"),
//   body("phone").optional().trim(),
//   body("specialty").optional().trim(),
//   body("department").optional().trim(),
//   body("hospital").optional().trim(),
//   body("bio").optional().trim(),
//   body("status").optional().isIn(["online", "busy", "offline"]),
//   body("visibility").optional().isBoolean(),
// ];

// router.get("/", authenticate, getProfile);
// router.put("/", authenticate, updateProfileValidation, handleValidationErrors, updateProfile);
// router.delete("/", authenticate, deleteProfile);

export default router;
