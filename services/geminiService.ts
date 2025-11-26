import { GoogleGenerativeAI } from "@google/generative-ai";

// 初始化客户端 (假设这里能获取到环境变量，或者依赖外部注入)
const genAI = new GoogleGenerativeAI(process.env.API_KEY || (window as any).process?.env?.API_KEY || "");

export const generatePhotoCaption = async (base64Image: string): Promise<string> => {
  try {
    // 1. 获取特定的生成式模型实例 (这是新版 SDK 的关键步骤)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" }); // 注意：gemini-2.5-flash 可能还未公测，建议先用 gemini-1.5-flash 或 gemini-pro-vision

    // 2. 清理 Base64 前缀
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    // 3. 构造提示词 (Prompt)
    const prompt = "Write a very short, nostalgic, or witty handwritten-style caption (max 4-5 words) for this photo. Do not use quotes. If a person is in it, be complimentary. If it's an object, describe its vibe.";

    // 4. 构造图片部分 (注意格式变化)
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: "image/jpeg",
      },
    };

    // 5. 发送请求 (新版 API 调用方式)
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    
    return response.text().trim() || "Memories...";

  } catch (error) {
    console.error("Error generating caption:", error);
    return new Date().toLocaleDateString(); // 失败时回退到日期
  }
};
