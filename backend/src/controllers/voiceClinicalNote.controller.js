import express from "express";
import multer from "multer";
import OpenAI from "openai";
import ClinicalNote from "./models/clinicalNote.model.js";
import Patient from "./models/patient.model.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI (replace with your preferred AI service)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 1. Transcribe Audio to Text
router.post(
  "/api/clinical-notes/transcribe",
  upload.single("audio"),
  async (req, res) => {
    try {
      const audioFile = req.file;

      if (!audioFile) {
        return res
          .status(400)
          .json({ success: false, message: "No audio file provided" });
      }

      // Using OpenAI Whisper for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en", // Adjust for Nigerian context (English, Yoruba, Hausa, Igbo if supported)
      });

      res.json({
        success: true,
        data: {
          transcript: transcription.text,
        },
      });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to transcribe audio",
        error: error.message,
      });
    }
  }
);

// 2. Extract Structured Data from Clinical Text
router.post("/api/clinical-notes/extract", async (req, res) => {
  try {
    const { transcript, patientContext } = req.body;

    if (!transcript) {
      return res
        .status(400)
        .json({ success: false, message: "No transcript provided" });
    }

    // Use AI to extract structured clinical data
    const systemPrompt = `You are a medical documentation assistant for healthcare practitioners in Nigeria. 
Extract structured clinical information from the provided text and return it in JSON format.

Extract these fields:
- chiefComplaint: The main reason for the visit
- diagnosis: The assessment or diagnosis
- plan: Treatment plan and recommendations
- type: "clinical", "lab", or "procedure"
- priority: "low", "medium", or "high"
- findings: Detailed clinical findings
- medications: List of medications mentioned
- vitals: Any vital signs mentioned

Return ONLY valid JSON, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const extractedData = JSON.parse(completion.choices[0].message.content);

    res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extract clinical data",
      error: error.message,
    });
  }
});

// 3. AI-Assisted Clinical Note Generation
router.post("/api/clinical-notes/generate", async (req, res) => {
  try {
    const { conversation, patientId } = req.body;

    // Get patient context for better accuracy
    let patientContext = "";
    if (patientId) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        patientContext = `Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}`;
      }
    }

    const systemPrompt = `You are a medical documentation assistant for Nigerian healthcare practitioners.
Generate a comprehensive clinical note based on the conversation history.

Format the note with these sections:
1. Chief Complaint
2. History of Present Illness
3. Assessment/Diagnosis
4. Plan/Treatment

Use clear medical terminology appropriate for Nigerian healthcare context.
${patientContext}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversation.map((msg) => ({
        role: msg.type === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      {
        role: "user",
        content: "Generate a complete clinical note from this conversation.",
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.5,
      max_tokens: 1000,
    });

    const generatedNote = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        note: generatedNote,
      },
    });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate clinical note",
      error: error.message,
    });
  }
});

// 4. Smart Patient Matching
router.post("/api/clinical-notes/match-patient", async (req, res) => {
  try {
    const { text } = req.body;

    // Get all patients
    const patients = await Patient.find().limit(50);

    // Use simple text matching (can be enhanced with AI)
    const matches = patients.filter((patient) => {
      const searchText = text.toLowerCase();
      return (
        searchText.includes(patient.name.toLowerCase()) ||
        searchText.includes(patient.patientId.toLowerCase()) ||
        (patient.phone && searchText.includes(patient.phone))
      );
    });

    res.json({
      success: true,
      data: {
        matches: matches.map((p) => ({
          id: p._id,
          name: p.name,
          patientId: p.patientId,
          age: p.age,
          gender: p.gender,
        })),
      },
    });
  } catch (error) {
    console.error("Patient matching error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to match patient",
      error: error.message,
    });
  }
});

// 5. Create Clinical Note with AI-Generated Content
router.post("/api/clinical-notes/create-with-ai", async (req, res) => {
  try {
    const {
      patientId,
      clinicianId,
      transcript,
      extractedData,
      type,
      priority,
    } = req.body;

    // Validate required fields
    if (!patientId || !clinicianId || !extractedData) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Generate summary if not provided
    let summary = extractedData.summary;
    if (!summary && transcript) {
      const summaryCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Summarize this clinical note in 2-3 sentences.",
          },
          { role: "user", content: transcript },
        ],
        max_tokens: 150,
      });
      summary = summaryCompletion.choices[0].message.content;
    }

    // Create clinical note
    const clinicalNote = new ClinicalNote({
      patientId,
      clinicianId,
      type: type || extractedData.type || "clinical",
      priority: priority || extractedData.priority || "medium",
      content: extractedData.content || transcript,
      transcript: transcript,
      summary: summary,
      chiefComplaint: extractedData.chiefComplaint,
      diagnosis: extractedData.diagnosis,
      plan: extractedData.plan,
      isSynced: true,
    });

    await clinicalNote.save();

    res.json({
      success: true,
      message: "Clinical note created successfully",
      data: clinicalNote,
    });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create clinical note",
      error: error.message,
    });
  }
});

// 6. Get AI Suggestions for Clinical Notes
router.post("/api/clinical-notes/suggestions", async (req, res) => {
  try {
    const { chiefComplaint, partialDiagnosis } = req.body;

    const systemPrompt = `You are a medical assistant providing diagnostic suggestions for Nigerian healthcare practitioners.
Based on the chief complaint, suggest possible diagnoses, recommended tests, and treatment approaches.
Consider conditions common in Nigeria.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Chief Complaint: ${chiefComplaint}\nPartial Diagnosis: ${
            partialDiagnosis || "None"
          }`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const suggestions = completion.choices[0].message.content;

    res.json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get suggestions",
      error: error.message,
    });
  }
});

export default router;
