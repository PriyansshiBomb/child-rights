const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

const ai = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Mock responses if API key is not present
const MOCK_ANSWERS = {
  default: "I'm your AI companion! If you give me an API key, I can tell you so much more about your rights. For now, just know that your rights are super important!",
  story: "Once upon a time, a brave young hero discovered their rights... (Please add a Gemini API key to hear the full story!)",
  report: "Your child has been doing great! Since you haven't added a Gemini API key, I can't generate a personalized report, but I can tell you they are making progress!",
  parentChat: "I'm the Parent AI Bot. Please add a Gemini API key for me to answer customized questions about your child's progress!",
  quiz: [
    {
      "question": "You don't have an API key! What happens because of this?",
      "options": ["A default quiz is loaded.", "The AI generates pure awesomeness.", "Nothing."],
      "correctAnswer": 0,
      "explanation": "Without an API key, we drop back to a hardcoded quiz!"
    }
  ]
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

// Route: POST /api/ai/parent/report
// Description: Generate a weekly/overall progress report for a parent
router.post('/parent/report', async (req, res) => {
  try {
    const { progress } = req.body;
    if (!ai) {
      return res.json({ report: MOCK_ANSWERS.report });
    }

    const systemPrompt = `You are a helpful AI assistant for parents. The user is a parent looking at their child's educational progress in a children's rights game.
Analyze the following progress JSON object and generate a short, friendly, natural-language report (3-4 sentences max).
Highlight what they explored and any areas they struggle with (if any score is low). Provide a tiny tip on how to reinforce the learning at home.`;

    const contents = `Progress Data: ${JSON.stringify(progress)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: systemPrompt, temperature: 0.7 }
    });

    res.json({ report: response.text });
  } catch (err) {
    console.error('AI Report Error:', err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// Route: POST /api/ai/parent/chat
// Description: Parent Q&A Bot based on child progress
router.post('/parent/chat', async (req, res) => {
  try {
    const { message, progress } = req.body;
    if (!ai) {
      return res.json({ response: MOCK_ANSWERS.parentChat });
    }

    const systemPrompt = `You are a helpful AI assistant specifically designed for parents whose children are playing an educational RPG game about children's rights.
You are given the child's raw progress data in JSON. Read this data to contextually answer the parent's questions. 
Be concise, encouraging, and actionable. Keep your answer brief.`;

    const contents = `Child's Progress Data: ${JSON.stringify(progress)}\n\nParent's question: ${message}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: { systemInstruction: systemPrompt, temperature: 0.7 }
    });

    res.json({ response: response.text });
  } catch (err) {
    console.error('AI Parent Chat Error:', err);
    res.status(500).json({ message: 'Failed to generate response' });
  }
});

// Route: POST /api/ai/quiz
// Description: AI-Powered Quiz Generator with Adaptive Difficulty
router.post('/quiz', async (req, res) => {
  try {
    const { zoneName, right, progress } = req.body;
    if (!ai) {
      return res.json({ questions: MOCK_ANSWERS.quiz });
    }

    const level = progress?.level || 1;
    // We check if they previously completed any node matching this right 
    // to determine their past performance.
    const history = progress?.zonesCompleted?.find(z => z.zoneId?.right === right || z.zoneId === right) || null;
    
    let contextStr = `The child is currently at XP Level ${level}. `;
    if (history) {
      contextStr += `They previously scored ${history.score}% on this topic. `;
      if (history.score >= 80) {
        contextStr += `Since they scored well, make the questions slightly harder, more nuanced, and engaging to keep them in the flow zone.`;
      } else {
        contextStr += `Since they struggled before, make the questions easier, more encouraging, and focus heavily on fundamental concepts.`;
      }
    } else {
      contextStr += `This is their first time taking a quiz on this right. Generate standard, accessible questions.`;
    }

    const systemPrompt = `You are a dynamic Quiz Generator for an educational RPG about children's rights.
Generate exactly 3 fresh, multiple-choice questions about the Right to ${right} for the zone '${zoneName}'.
ADAPTIVE DIFFICULTY INSTRUCTIONS: ${contextStr}

You MUST return a raw JSON array. DO NOT wrap the JSON in Markdown formatting like \`\`\`json.
Each element in the JSON array must follow this exact schema:
{
  "question": "The question text, kid friendly",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0, // The integer index (0-3) of the correct option
  "explanation": "Why this is correct (1 concise sentence)"
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate the JSON quiz.",
        config: { systemInstruction: systemPrompt, temperature: 0.8, responseMimeType: "application/json" }
    });

    const outputText = response.text.trim();
    let quizData;
    try {
      quizData = JSON.parse(outputText);
    } catch (e) {
      quizData = MOCK_ANSWERS.quiz; // Fail-safe
    }

    res.json({ questions: quizData });
  } catch (err) {
    console.error('AI Quiz Error:', err);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
});

module.exports = router;
