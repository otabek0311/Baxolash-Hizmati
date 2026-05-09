import { GoogleGenAI } from '@google/genai';
import { prisma } from '../utils/prisma';

const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

if (apiKeys.length === 0) {
  console.error('XATO: Hech qanday GEMINI_API_KEY .env da ko\'rsatilmagan!');
}

let currentKeyIndex = 0;

const isQuotaError = (error: unknown): boolean => {
  const msg = String(error).toLowerCase();
  return msg.includes('quota') || msg.includes('429') || msg.includes('rate limit') || msg.includes('resource_exhausted');
};

const SYSTEM_INSTRUCTION = `Siz "QR Hujjat Tizimi" uchun professional AI yordamchisiz.
Sizning vazifalaringiz:
1. Foydalanuvchilarga tizim bo'yicha yordam berish
2. Hujjatlar haqida ma'lumot berish (agar so'ralsa)
3. Statistika va hisobotlarni tahlil qilish
4. Shubhali faoliyatlar haqida ogohlantirish
5. O'zbek tilida aniq va lo'nda javob berish

Siz quyidagi ma'lumotlarga ega bo'lasiz:
- Foydalanuvchi roli va nomi
- Tizim statistikasi (real-time)
- So'nggi audit log ma'lumotlari

Har doim professional, qisqa va foydali javob bering.`;

export const getAIResponse = async (
  userId: string,
  userMessage: string,
  userRole: string,
  userName: string
): Promise<string> => {
  if (apiKeys.length === 0) {
    throw new Error('AI xizmat sozlanmagan');
  }

  const auditWhere = userRole === 'XODIM' ? { userId } : {};

  const [stats, recentAudit, chatHistory] = await Promise.all([
    prisma.document.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: auditWhere,
      include: { user: { select: { name: true } } },
    }),
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const statsText = stats.map(s => `${s.status}: ${s._count.id} ta`).join(', ');
  const auditText = recentAudit
    .map(a => `${a.user?.name || 'Tizim'}: ${a.action} (${a.createdAt.toLocaleString('uz-UZ')})`)
    .join('\n');

  const contextualInstruction = `${SYSTEM_INSTRUCTION}

Joriy foydalanuvchi: ${userName} (${userRole})
Tizim statistikasi: ${statsText}
So'nggi harakatlar:\n${auditText}`;

  const history = chatHistory.reverse().map(m => ({
    role: m.role as 'user' | 'model',
    parts: [{ text: m.content }],
  }));

  let aiText = 'Kechirasiz, javob bera olmadim.';
  const startIndex = currentKeyIndex;

  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const idx = (startIndex + attempt) % apiKeys.length;
    try {
      const client = new GoogleGenAI({ apiKey: apiKeys[idx] });
      const response = await client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction: contextualInstruction,
          temperature: 0.7,
        },
      });
      aiText = response.text || aiText;
      currentKeyIndex = idx;
      break;
    } catch (error) {
      if (isQuotaError(error) && attempt < apiKeys.length - 1) {
        continue;
      }
      throw error;
    }
  }

  await prisma.chatMessage.createMany({
    data: [
      { userId, role: 'user', content: userMessage },
      { userId, role: 'model', content: aiText },
    ],
  });

  return aiText;
};

export const getChatHistory = async (userId: string) => {
  return prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
};

export const clearChatHistory = async (userId: string) => {
  return prisma.chatMessage.deleteMany({ where: { userId } });
};
