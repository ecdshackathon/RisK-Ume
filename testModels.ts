import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName: string) {
  try {
    console.log(`Testing ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Say hello",
    });
    console.log(`[SUCCESS] ${modelName}: ${response.text}`);
    return true;
  } catch (error: any) {
    console.log(`[FAILED] ${modelName}: ${error.message}`);
    return false;
  }
}

async function run() {
  const models = [
    "gemini-3.5-flash",
    "gemini-2.5-pro",
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-3.7-flash"
  ];
  
  for (const m of models) {
    await testModel(m);
  }
}

run();
