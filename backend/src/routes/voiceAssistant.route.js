import express from "express";
import multer from "multer";
import { transcribeAndExtract } from "../controllers/voiceAssistant.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temp folder for audio files

router.post("/transcribe-and-extract", authenticate, upload.single("audio"), transcribeAndExtract);

export default router;
