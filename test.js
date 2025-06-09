import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, Gemini! how are you ?");
    const response = await result.response;
    console.log(response.text());
  } catch (err) {
    console.error("Error testing Gemini API:", err);
  }
}

test();
