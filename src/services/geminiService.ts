import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "YOUR_API_KEY"
});

export const getAIResponse = async (userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: "user", parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: "Siz 'QR Hujjat Tizimi' (QR Document System) uchun aqlli yordamchisiz. Tizim hujjatlarni yuklash, ularni PDF ga o'girish, sahifalarga ajratish va har bir sahifaga unikal QR kod joylashtirish imkonini beradi. Foydalanuvchilarga o'zbek tilida muloyim va foydali javob bering. Savollarga qisqa va londa javob qaytaring.",
        temperature: 0.7,
      },
    });

    return response.text || "Kechirasiz, savolingizni tushunmadim. Iltimos, qaytadan urinib ko'ring.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.";
  }
};
