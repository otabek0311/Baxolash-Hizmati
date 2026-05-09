import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getAIResponse, getChatHistory, clearChatHistory } from '../services/ai.service';

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  const { message } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ message: 'Xabar bo\'sh bo\'lishi mumkin emas' });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    res.status(503).json({ message: 'AI xizmati sozlanmagan. GEMINI_API_KEY ni .env faylda to\'ldiring.' });
    return;
  }
  try {
    const response = await getAIResponse(
      req.user!.id,
      message,
      req.user!.role,
      req.user!.name
    );
    res.json({ response });
  } catch (err: any) {
    console.error('AI error:', err?.message);
    res.status(500).json({ message: 'AI xizmatida xatolik yuz berdi' });
  }
};

export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await getChatHistory(req.user!.id);
    res.json(history);
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};

export const clearHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await clearChatHistory(req.user!.id);
    res.json({ message: 'Chat tarixi tozalandi' });
  } catch {
    res.status(500).json({ message: 'Server xatosi' });
  }
};
