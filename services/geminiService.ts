import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeSpeechText = async (text: string): Promise<AnalysisResult> => {
  const ai = getAiClient();

  const prompt = `
    Analyze the following speech text. 
    1. Break it into natural, readable chunks (short phrases, max 8-12 words) suitable for a teleprompter screen. Ensure no chunk is too long to fit on a single screen.
    2. Estimate the natural reading duration in milliseconds for EACH chunk, assuming a moderate, clear speaking pace (approx 130-150 wpm).
    3. Provide a total estimated duration in seconds.
    4. Provide a very brief 1-sentence summary of the speech.

    Speech Text:
    "${text}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chunks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                suggestedDurationMs: { type: Type.INTEGER }
              },
              required: ["text", "suggestedDurationMs"]
            }
          },
          totalDurationSec: { type: Type.NUMBER },
          summary: { type: Type.STRING }
        },
        required: ["chunks", "totalDurationSec", "summary"]
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No response from Gemini");
  
  return JSON.parse(jsonText) as AnalysisResult;
};