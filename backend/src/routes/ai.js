const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Mock responses if API key is not present
const MOCK_ANSWERS = {
  default: "I'm your AI companion! If you give me an API key, I can tell you so much more about your rights. For now, just know that your rights are super important!",
  story: "Once upon a time, a brave young hero discovered their rights... (Please add a Gemini API key to hear the full story!)"
};

// Route: POST /api/ai/chat
// Description: Chat with the AI Companion
router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!ai) {
      return res.json({ response: MOCK_ANSWERS.default });
    }

    const systemPrompt = `You are a friendly, encouraging, and highly knowledgeable AI Companion for children in an educational RPG game called 'Rights Quest'.
Your job is to explain children's rights in simple, kid-friendly language.
Be encouraging, use emojis, and keep your answers relatively short (1-3 sentences) so a child can easily read them.
Always refer to the context if provided.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context: ${context || 'General'}\nChild's question: ${message}`,
        config: { systemInstruction: systemPrompt, temperature: 0.7 }
    });

    res.json({ response: response.text });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ message: 'Failed to generate response' });
  }
});

// Route: GET /api/ai/story/:right
// Description: Get a contextual story about a specific right
router.get('/story/:right', async (req, res) => {
  try {
    const { right } = req.params;
    
    if (!ai) {
      return res.json({ story: `Once upon a time in the land of ${right}, a young hero learned about their rights. (Add API key for full story!)` });
    }

    const systemPrompt = `You are an AI Storyteller in an educational RPG game for children called 'Rights Quest'.
The player has just entered the zone representing the Right to ${right}.
Tell a short (3-4 sentences max), engaging story about a child or character who learns the importance of the Right to ${right}.
Make it sound like an introduction to an RPG quest level. Use emojis.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please tell the story for the Right to ${right}.`,
        config: { systemInstruction: systemPrompt, temperature: 0.8 }
    });

    res.json({ story: response.text });
  } catch (err) {
    console.error('AI Story Error:', err);
    res.status(500).json({ message: 'Failed to generate story' });
  }
});

module.exports = router;
