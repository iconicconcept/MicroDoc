import fs from "fs";
import path from "path";
import OpenAI from "openai";
import LabReport from "../models/labReport.model.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processVoiceLabReport = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No audio file provided" });
    }

    const audioPath = path.resolve(req.file.path);

    // 1. Transcribe voice using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      response_format: "text",
    });

    const transcriptText = transcription.text || transcription;

    // 2. Ask GPT to structure it into lab report data
    const prompt = `
You are a medical lab assistant AI.
Extract a structured lab report object from the following voice transcription.
The lab report should include:
{
  "testType": "",
  "patientId": "",
  "sampleId": "",
  "pathogen": "",
  "testDate":"",
  "requestedBy": "",
  "specimenType":  "",
  "resultSummary": "",
  "remarks": "",
  "status": "",
}
Transcription:
"""${transcriptText}"""
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI lab assistant that structures spoken reports.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content?.trim();

    // Parse GPT JSON safely
    let structuredReport;
    try {
      structuredReport = JSON.parse(content);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Failed to parse AI response. Please try again.",
        aiResponse: content,
      });
    }

    // 3. Save to DB (optional: or preview before saving)
    const report = new LabReport({
      ...structuredReport,
      microbiologistId: req.user.userId,
    });
    await report.save();

    // cleanup audio
    fs.unlinkSync(audioPath);

    res.json({
      success: true,
      message: "Voice lab report created successfully",
      data: report,
    });
  } catch (error) {
    console.error("Voice lab report error:", error);
    res.status(500).json({ success: false, error: "Voice processing failed" });
  }
};
