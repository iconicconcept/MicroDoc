import express from "express";
import multer from "multer";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import { processVoiceLabReport } from "../controllers/voiceLab.controller.js";

const router = express.Router();

// temporary audio upload storage
const upload = multer({ dest: "uploads/audio/" });

router.post(
  "/create-audio-lab-report",
  authenticate,
  upload.single("audio"),
  processVoiceLabReport
);

export default router;
