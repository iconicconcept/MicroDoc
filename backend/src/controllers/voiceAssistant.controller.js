import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeAndExtract = async (req, res) => {
  const filePath = req.file.path;
  const audioFile = fs.createReadStream(filePath);

  try {
    // Try OpenAI first
    const openaiResponse = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "json",
    });

    fs.unlinkSync(filePath);
    return res.json({
      success: true,
      provider: "openai",
      transcription: openaiResponse.text,
    });
  } catch (error) {
    const status = error?.status || error?.response?.status;
    console.warn("OpenAI transcription failed:", status);

    // Only fallback on quota/auth related failures
    if (status === 429 || status === 401) {
      console.log(" Switching to AssemblyAI fallback...");

      try {
        const transcriptText = await transcribeWithAssemblyAI(filePath);

        fs.unlinkSync(filePath);
        return res.json({
          success: true,
          provider: "assemblyai",
          transcription: transcriptText,
        });
      } catch (fallbackErr) {
        console.error("AssemblyAI fallback failed:", fallbackErr);
        fs.unlinkSync(filePath);
        return res.status(500).json({
          success: false,
          message: "All transcription services failed",
        });
      }
    }

    fs.unlinkSync(filePath);
    return res.status(500).json({
      success: false,
      message: "Transcription failed",
      error: error.message,
    });
  }
};

// AssemblyAI Fallback Helper
async function transcribeWithAssemblyAI(filePath) {
  const audioStream = fs.createReadStream(filePath);

  // Step 1: Upload audio to AssemblyAI
  const uploadRes = await axios.post(
    "https://api.assemblyai.com/v2/upload",
    audioStream,
    {
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY,
        "transfer-encoding": "chunked",
      },
    }
  );

  // Step 2: Create transcription job
  const transcriptRes = await axios.post(
    "https://api.assemblyai.com/v2/transcript",
    { audio_url: uploadRes.data.upload_url },
    {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
    }
  );

  // Step 3: Poll until transcription is complete
  let transcript;
  do {
    await new Promise((r) => setTimeout(r, 3000));
    const pollRes = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptRes.data.id}`,
      {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
      }
    );
    transcript = pollRes.data;
  } while (transcript.status !== "completed" && transcript.status !== "error");

  if (transcript.status === "error")
    throw new Error("AssemblyAI transcription error");

  return transcript.text;
}