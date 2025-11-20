import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePhotoCaption = async (base64Image: string): Promise<string> => {
  try {
    // Remove the data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: "Write a very short, nostalgic, or witty handwritten-style caption (max 4-5 words) for this photo. Do not use quotes. If a person is in it, be complimentary. If it's an object, describe the vibe.",
          },
        ],
      },
    });

    return response.text?.trim() || "Memories...";
  } catch (error) {
    console.error("Error generating caption:", error);
    return new Date().toLocaleDateString(); // Fallback to date
  }
};
