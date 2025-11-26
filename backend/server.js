// const readlineSync = require("readline-sync");
// const express = require("express");
// const cors = require("cors");
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const { MongoClient } = require("mongodb");

// const GEMINI_API_KEY = "AIzaSyC-5L3dYN-fChqt99SwAyNNE0MIW5yUiF8";
// const MONGO_URI = "mongodb://localhost:27017";
// const DB_NAME = "1yourDatabase";
// const COLLECTION_NAME = "users";

// const app = express();
// app.use(cors());
// app.use(express.json());

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// async function convertToMongoQuery(userInput) {
//   const prompt = `
// You are an AI converting natural language into MongoDB filters.

// Schema:
// - name: String
// - email: String
// - skills: [String]
// - preferences.languages: [String]
// - address: String

// Examples:
// "Find users who know React" => { "skills": "React" }
// "Users from Mumbai" => { "address": /Mumbai/i }

// Only return the filter object in JSON format:
// "${userInput}"
//   `;
//   const result = await model.generateContent(prompt);
//   const response = result.response.text();
//   const json = response.match(/{[\s\S]*}/)?.[0];
//   return json ? JSON.parse(json) : {};
// }

// async function queryMongoDB(filter) {
//   const client = new MongoClient(MONGO_URI);
//   try {
//     await client.connect();
//     const db = client.db(DB_NAME);
//     const collection = db.collection(COLLECTION_NAME);
//     return await collection.find(filter).limit(10).toArray();
//   } finally {
//     await client.close();
//   }
// }

// async function summarizeWithGemini(data, userQuery) {
//   const cleaned = data.map(user => ({
//     name: user.name,
//     email: user.email,
//     address: user.address,
//     skills: user.skills,
//     languages: user.preferences?.languages || [],
//   }));

//   const prompt = `
// You're a helpful assistant. Based on this user query:
// "${userQuery}"

// Return a JSON array with the following fields per user:
// - name
// - email
// - address
// - skills (array of strings)
// - languages (array of strings)

// Respond ONLY with a valid JSON array, no explanation or markdown.
// Here is the data to work with:
// ${JSON.stringify(cleaned, null, 2)}
// `;

//   const result = await model.generateContent(prompt);
//   const jsonText = result.response.text();
//   const jsonMatch = jsonText.match(/\[.*\]/s); // match JSON array

//   if (!jsonMatch) throw new Error("Invalid response from Gemini");

//   const parsedData = JSON.parse(jsonMatch[0]);
//   return parsedData;
// }

// // Update the API endpoint
// app.post("/api/chat", async (req, res) => {
//   try {
//     const userInput = req.body.message;
//     const filter = await convertToMongoQuery(userInput);
//     const results = await queryMongoDB(filter);

//     if (results.length === 0) {
//       res.json({ data: [], message: "No matching users found." });
//     } else {
//       const data = await summarizeWithGemini(results, userInput);
//       res.json({ data, message: `Found ${data.length} matching users.` });
//     }
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// const PORT = 5001;
// app.listen(PORT, () => {
//   console.log(`🤖 Server running on http://localhost:${PORT}`);
// });

// // Remove the startChat(); line since we're now using Express endpoints
