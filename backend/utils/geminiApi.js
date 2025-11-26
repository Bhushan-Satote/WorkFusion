const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not defined in environment variables");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Call the Gemini API with a prompt
 * @param {string} prompt - The user's query
 * @returns {Promise<string>} - The response from Gemini
 */
async function callGeminiAPI(prompt) {
  try {
    // Create a context-aware prompt for the Gemini model
    const enhancedPrompt = `
      You are an AI assistant for a project management system called WorkFusion.
      Answer the following query with helpful, accurate information:
      "${prompt}"
      
      If the query is about project management, team collaboration, or system features,
      provide detailed and relevant information. If you don't know the answer, say so clearly.
      
      Format your response in a clear, professional manner.
    `;

    const result = await model.generateContent(enhancedPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error processing your request. Please try again later.";
  }
}

module.exports = callGeminiAPI;