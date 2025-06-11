// backend/routes/chatbotRoutes.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { auth } from '../middleware/auth.js'; // Corrected import path for authentication middleware
import GlucoseReading from '../models/GlucoseReading.js';
import InsulinDose from '../models/InsulinDose.js';
import { format } from 'date-fns';

dotenv.config();

const router = express.Router();

// Initialize Google Generative AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper functions to get last readings
async function getLastGlucoseReading(userId) {
    return await GlucoseReading.findOne({ user: userId }).sort({ timestamp: -1 }).lean();
}

async function getLastInsulinDose(userId) {
    return await InsulinDose.findOne({ user: userId }).sort({ timestamp: -1 }).lean();
}

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    // In a production app, you might want to stop the server or disable the chatbot feature
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "AIzaSyAf5d1ecihJMLnWeFwl8roOj9Fgj6MIc_k"); // Replace with a strong fallback or ensure env variable is set

router.post('/', auth, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        const userName = req.user.name || 'valued user'; // Get user's name from auth, default to 'valued user'

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'A valid message is required.' });
        }

        let glucoseReading = null;
        let insulinDose = null;

        if (userId) {
            glucoseReading = await getLastGlucoseReading(userId);
            insulinDose = await getLastInsulinDose(userId);
        }

        let glucoseInfo = glucoseReading
            ? `Most recent glucose reading: ${glucoseReading.value} mg/dL recorded on ${format(new Date(glucoseReading.timestamp), 'MMM d, h:mm a')}.`
            : 'No recent glucose readings available for this user.';

        let insulinInfo = insulinDose
            ? `Most recent insulin dose: ${insulinDose.units} units recorded on ${format(new Date(insulinDose.timestamp), 'MMM d, h:mm a')}.`
            : 'No recent insulin doses available for this user.';

        let context = `You are a helpful and encouraging chatbot named DiaSync. Your purpose is to provide general information about diabetes, healthy lifestyle, and common FAQs, always in an encouraging and supportive tone.
        Address the user by their name, which is **${userName}**.

        **CRITICAL NOTE:** You have access to the user's most recent glucose and insulin readings for informational context. However, you are **NOT a medical professional and are NOT a substitute for professional medical advice, diagnosis, or treatment plans.** Always advise ${userName} to consult their healthcare provider for any medical concerns.

        Here is ${userName}'s current health context:
        - ${glucoseInfo}
        - ${insulinInfo}

        ${userName} is asking: "${message}".

        Please provide a helpful, general, and encouraging response based on your knowledge base and the provided context. If the user asks for personalized medical advice, diagnosis, or specific treatment plans, politely state your limitations and firmly direct them to consult their healthcare provider, reiterating your encouragement for their journey.`;

        // --- Console log the prompt sent to Gemini ---
        // console.log("---------------------------------------");
        // console.log("Prompt sent to Gemini (personalized & encouraging):");
        // console.log(context);
        // console.log("---------------------------------------");
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

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Authentication failed. Please log in again.' });
        }
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