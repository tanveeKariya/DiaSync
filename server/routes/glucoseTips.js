// server/routes/glucoseTips.js (or similar file)
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai'); // Make sure this import is correct

// IMPORTANT: Load your API key securely from environment variables
// Make sure you have GEMINI_API_KEY in your .env file in the backend root
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

// Initialize Gemini
// This condition ensures it only tries to initialize if the key is present
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

router.post('/generate-tip', async (req, res) => {
  // ... (your existing logic to extract data from req.body) ...

  try {
    let aiResponse;

    if (genAI) { // Check if genAI was successfully initialized
      // --- Gemini API call ---
      const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Using gemini-pro model
      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text(); // Extract the text content from the response
    } else {
      // Handle the case where Gemini API key is not configured
      return res.status(500).json({ message: 'Gemini API not configured. Check GEMINI_API_KEY.' });
    }

    res.status(200).json({ tip: aiResponse });

  } catch (error) {
    console.error('Error generating AI tip with Gemini:', error); // Specific error log
    res.status(500).json({ message: 'Failed to generate dietary tip from AI.' });
  }
});

module.exports = router;