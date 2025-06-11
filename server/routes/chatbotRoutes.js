// backend/routes/chatbotRoutes.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
// Removed date-fns as it's not needed without date-specific data formatting
// Removed verifyAuthToken as it's not needed if you don't need user context
// Removed data service imports as they are no longer used

dotenv.config();

const router = express.Router();

// Initialize Google Generative AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    // In a production app, you might want to stop the server or disable the chatbot feature
    // process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "AIzaSyAf5d1ecihJMLnWeFwl8roOj9Fgj6MIc_k"); // Use fallback or handle error

// Removed verifyAuthToken middleware since we are removing personalization
router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'A valid message is required.' });
        }

        // The prompt now only includes the user's message, without personalized health data.
        let context = `The user is asking: "${message}". Please provide a helpful response. If the question is outside the scope of general knowledge or typical assistant capabilities, politely state that you cannot answer it.`;

        // --- Console log the prompt sent to Gemini ---
        console.log("---------------------------------------");
        console.log("Prompt sent to Gemini (non-personalized):");
        console.log(context);
        console.log("---------------------------------------");
        // --- End of Console log ---


        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent([
            { text: context }
        ]);

        const responseText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
            res.json({ reply: responseText });
        } else {
            console.error('Gemini API response did not contain expected text content:', result);
            res.status(500).json({ error: 'Failed to get a valid response from the AI.' });
        }

    } catch (error) {
        console.error('Error in /api/chatbot (from chatbotRoutes.js):', error);

        if (error.response) {
            console.error('AI service detailed error:', error.response.data);
            return res.status(error.response.status).json({
                error: `AI service error: ${error.response.data?.message || error.response.statusText || 'Unknown'}`
            });
        } else if (error.message.includes('API key')) {
             return res.status(401).json({ error: 'AI service authentication failed. Please check your API key.' });
        }

        res.status(500).json({ error: 'An unexpected error occurred with the AI service.' });
    }
});

export default router;