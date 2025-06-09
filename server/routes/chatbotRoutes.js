// backend/routes/chatbotRoutes.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { format, subDays } from 'date-fns'; // Import date-fns for data formatting
import { verifyAuthToken } from '../middleware/authMiddleware.js'; // Adjust path as needed
// Assuming you have specific service functions to fetch data
import { getReadingsForUser } from '../services/glucoseService.js'; // Adjust path and function name
import { getMealsForUser } from '../services/mealService.js';     // Adjust path and function name
import { getDosesForUser } from '../services/insulinService.js';   // Adjust path and function name

dotenv.config();

const router = express.Router();

// Initialize Google Generative AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    // In a production app, you might want to stop the server or disable the chatbot feature
    // process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "YOUR_FALLBACK_API_KEY_IF_NEEDED"); // Use fallback or handle error

router.post('/', verifyAuthToken, async (req, res) => { // Apply authentication middleware
    try {
        const { message } = req.body;
        const userId = req.user.id; // User ID from the authenticated token
        const user = req.user; // Full user object might contain target glucose range

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: 'A valid message is required.' });
        }

        // 1. Fetch User-Specific Health Data
        // Fetch a reasonable amount of recent data
        const recentGlucoseReadings = await getReadingsForUser(userId, 50); // Fetch last 50 readings
        const recentMeals = await getMealsForUser(userId, 20); // Fetch last 20 meals
        const recentInsulinDoses = await getDosesForUser(userId, 20); // Fetch last 20 doses

        // Sort data for better chronological context if not already sorted by your service
        recentGlucoseReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        recentMeals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Latest first
        recentInsulinDoses.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Latest first

        // Prepare context for the AI
        let context = `The user is asking a question related to their diabetes management. Their details:
        Name: ${user.name}
        Email: ${user.email}
        Target Glucose Range: ${user.targetGlucoseRange?.min || '70'} - ${user.targetGlucoseRange?.max || '180'} mg/dL.
        Current Date: ${format(new Date(), 'EEEE, MMMM d, yyyy h:mm:ss a')} // Using full timestamp

        Here is the user's recent health data. Please analyze this data and use it to inform your answers, especially when asked about trends, averages, or specific recent events.

        --- Recent Glucose Readings (last ${recentGlucoseReadings.length}, latest first): ---
        ${recentGlucoseReadings.slice().reverse().map(r =>
            `- ${format(new Date(r.timestamp), 'MMM d, h:mm a')}: ${r.value} mg/dL (${r.mealContext || 'N/A'})`
        ).join('\n') || 'No recent glucose readings available.'}

        --- Recent Meals (last ${recentMeals.length}, latest first): ---
        ${recentMeals.map(m =>
            `- ${format(new Date(m.timestamp), 'MMM d, h:mm a')}: ${m.mealType}, ${m.totalCarbs}g carbs`
        ).join('\n') || 'No recent meal entries available.'}

        --- Recent Insulin Doses (last ${recentInsulinDoses.length}, latest first): ---
        ${recentInsulinDoses.map(d =>
            `- ${format(new Date(d.timestamp), 'MMM d, h:mm a')}: ${d.units} units of ${d.insulinType}`
        ).join('\n') || 'No recent insulin doses available.'}

        --- User's Question: ---
        ${message}

        Based on the above context and the user's question, provide a helpful and empathetic response regarding their diabetes management. If the question is outside the scope of the provided data or general diabetes management, politely state that you cannot answer it. Do not hallucinate data that is not provided. Keep answers concise and direct.
        `;

        // // You might want to truncate the context if it gets too long for the model's token limit
        // const MAX_CONTEXT_LENGTH = 16000;
        // if (context.length > MAX_CONTEXT_LENGTH) {
        //     context = context.substring(context.length - MAX_CONTEXT_LENGTH);
        //     context = "..." + context;
        // }

        // --- ADD THIS CONSOLE.LOG ---
        console.log("---------------------------------------");
        console.log("Prompt sent to Gemini:");
        console.log(context);
        console.log("---------------------------------------");
        // --- END OF CONSOLE.LOG ---


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

        res.status(500).json({ error: 'An unexpected error occurred with the AI service or data fetching.' });
    }
});

export default router;