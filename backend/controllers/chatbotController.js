// const mongoose = require("mongoose");
// const User = require("../models/User");
// const Project = require("../models/Project");
// const Task = require("../models/Task");
// const Client = require("../models/Client");
// const callGeminiAPI = require("../utils/geminiApi");

// // Database collections mapping
// const COLLECTIONS = {
//   USERS: "users",
//   PROJECTS: "projects",
//   TASKS: "tasks",
//   CLIENTS: "clients"
// };

// // Schema definitions for the AI to understand the data structure
// const SCHEMAS = {
//   [COLLECTIONS.USERS]: {
//     name: "String",
//     email: "String",
//     contact_number: "String",
//     address: "String",
//     skills: "[String]",
//     status: "String (active/inactive)",
//     preferences: {
//       languages: "[String]"
//     }
//   },
//   [COLLECTIONS.PROJECTS]: {
//     project_details: {
//       name: "String",
//       description: "String",
//       start_date: "Date",
//       end_date: "Date",
//       status: "String",
//       priority: "String",
//       progress: "Number"
//     },
//     client_id: "ObjectId (ref: Client)",
//     project_manager_id: "ObjectId (ref: User)",
//     project_leads: "[ObjectId] (ref: User)"
//   },
//   [COLLECTIONS.TASKS]: {
//     title: "String",
//     description: "String",
//     priority: "String (Low/Medium/High)",
//     status: "String (To-do/In Progress/Done)",
//     assigned_to: "[ObjectId] (ref: User)",
//     due_date: "Date",
//     progress: "Number"
//   },
//   [COLLECTIONS.CLIENTS]: {
//     client_name: "String",
//     client_contact: {
//       phone: "String",
//       email: "String"
//     },
//     projects: "[ObjectId] (ref: Project)"
//   }
// };

// /**
//  * Generate search examples based on collection schema
//  */
// function generateSearchExamples(collection) {
//   const examples = {
//     [COLLECTIONS.USERS]: [
//       {
//         query: "Find all active users with React and Node.js skills",
//         mongoQuery: {
//           filter: {
//             status: "active",
//             skills: { $all: ["React", "Node.js"] }
//           },
//           fields: ["name", "email", "skills", "status"]
//         }
//       },
//       {
//         query: "Show me users who can speak English and are from Mumbai",
//         mongoQuery: {
//           filter: {
//             "preferences.languages": "English",
//             address: /Mumbai/i
//           },
//           fields: ["name", "email", "address", "preferences.languages"]
//         }
//       }
//     ],
//     [COLLECTIONS.PROJECTS]: [
//       {
//         query: "List all high priority projects that are in progress",
//         mongoQuery: {
//           filter: {
//             "project_details.priority": "high",
//             "project_details.status": "in-progress"
//           },
//           fields: ["project_details.name", "project_details.status", "project_details.priority", "project_details.progress"]
//         }
//       },
//       {
//         query: "Find projects ending this month with progress less than 50%",
//         mongoQuery: {
//           filter: {
//             "project_details.end_date": {
//               $gte: new Date(),
//               $lte: new Date(new Date().setMonth(new Date().getMonth() + 1))
//             },
//             "project_details.progress": { $lt: 50 }
//           },
//           fields: ["project_details.name", "project_details.end_date", "project_details.progress"]
//         }
//       }
//     ],
//     [COLLECTIONS.TASKS]: [
//       {
//         query: "Show all high priority tasks that are not completed",
//         mongoQuery: {
//           filter: {
//             priority: "High",
//             status: { $ne: "Done" }
//           },
//           fields: ["title", "description", "status", "priority", "due_date"]
//         }
//       },
//       {
//         query: "Find overdue tasks assigned to active users",
//         mongoQuery: {
//           filter: {
//             due_date: { $lt: new Date() },
//             status: { $ne: "Done" }
//           },
//           fields: ["title", "assigned_to", "due_date", "status"]
//         }
//       }
//     ],
//     [COLLECTIONS.CLIENTS]: [
//       {
//         query: "List all clients with active projects",
//         mongoQuery: {
//           filter: {
//             projects: { $exists: true, $not: { $size: 0 } }
//           },
//           fields: ["client_name", "client_contact", "projects"]
//         }
//       },
//       {
//         query: "Find clients with specific contact information",
//         mongoQuery: {
//           filter: {
//             "client_contact.email": { $exists: true },
//             "client_contact.phone": { $exists: true }
//           },
//           fields: ["client_name", "client_contact"]
//         }
//       }
//     ]
//   };

//   return examples[collection] || [];
// }

// /**
//  * Process natural language query to handle common variations and typos
//  */
// function processNaturalLanguage(query) {
//   const processed = query.toLowerCase().trim();
  
//   const wordMappings = {
//     'usr': 'user',
//     'users': 'user',
//     'employees': 'user',
//     'staff': 'user',
//     'proj': 'project',
//     'projects': 'project',
//     'task': 'task',
//     'tasks': 'task',
//     'todos': 'task',
//     'client': 'client',
//     'clients': 'client',
//     'customer': 'client',
//     'customers': 'client',
//     'high': 'High',
//     'medium': 'Medium',
//     'low': 'Low',
//     'done': 'Done',
//     'completed': 'Done',
//     'in progress': 'In Progress',
//     'inprogress': 'In Progress',
//     'todo': 'To-do',
//     'to do': 'To-do',
//     'pending': 'To-do'
//   };

//   let processedQuery = processed;
//   Object.entries(wordMappings).forEach(([key, value]) => {
//     processedQuery = processedQuery.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
//   });

//   return processedQuery;
// }

// /**
//  * Main chatbot controller to handle user queries
//  */
// async function chatbotController(req, res) {
//   try {
//     const { message } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     const processedMessage = processNaturalLanguage(message);

//     let targetCollection = null;
//     if (processedMessage.includes("user")) {
//       targetCollection = COLLECTIONS.USERS;
//     } else if (processedMessage.includes("project")) {
//       targetCollection = COLLECTIONS.PROJECTS;
//     } else if (processedMessage.includes("task")) {
//       targetCollection = COLLECTIONS.TASKS;
//     } else if (processedMessage.includes("client")) {
//       targetCollection = COLLECTIONS.CLIENTS;
//     }

//     if (!targetCollection) {
//       return res.status(400).json({
//         error: "Please specify if you want to search users, projects, tasks, or clients"
//       });
//     }

//     const prompt = `
//       Based on this user query: "${processedMessage}"
//       For the collection: ${targetCollection}
//       With this schema: ${JSON.stringify(SCHEMAS[targetCollection], null, 2)}
      
//       Generate a MongoDB query that will:
//       1. Accurately filter based on the user's requirements
//       2. Return relevant fields only
//       3. Handle any mentioned conditions (dates, status, priority, etc.)
      
//       Example queries for reference:
//       ${JSON.stringify(generateSearchExamples(targetCollection), null, 2)}
      
//       Return only a valid JSON object with:
//       {
//         "filter": {MongoDB filter object},
//         "fields": [list of field names to return]
//       }
//     `;

//     const aiResponse = await callGeminiAPI(prompt);
//     let mongoQuery;

//     try {
//       mongoQuery = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
//     } catch (error) {
//       console.error("Error parsing AI response:", error);
//       return res.status(500).json({
//         error: "Failed to generate a valid database query",
//         aiResponse
//       });
//     }

//     let results;
//     switch (targetCollection) {
//       case COLLECTIONS.USERS:
//         results = await User.find(mongoQuery.filter)
//           .select(mongoQuery.fields.join(' '));
//         break;

//       case COLLECTIONS.PROJECTS:
//         results = await Project.find(mongoQuery.filter)
//           .populate('client_id', 'client_name client_contact')
//           .populate('project_manager_id', 'name email')
//           .populate('project_leads', 'name email')
//           .select(mongoQuery.fields.join(' '));
//         break;

//       case COLLECTIONS.TASKS:
//         results = await Task.find(mongoQuery.filter)
//           .populate('assigned_to', 'name email')
//           .populate('project_id', 'project_details.name')
//           .select(mongoQuery.fields.join(' '));
//         break;

//       case COLLECTIONS.CLIENTS:
//         results = await Client.find(mongoQuery.filter)
//           .populate({
//             path: 'projects',
//             select: 'project_details.name project_details.status'
//           })
//           .select(mongoQuery.fields.join(' '));
//         break;
//     }

//     const response = {
//       query: {
//         original: message,
//         processed: processedMessage,
//         collection: targetCollection
//       },
//       mongoQuery: mongoQuery,
//       results: results,
//       count: results.length,
//       timestamp: new Date()
//     };

//     res.json(response);

//   } catch (error) {
//     console.error("Chatbot Error:", error);
//     res.status(500).json({
//       error: "An error occurred while processing your request",
//       details: error.message
//     });
//   }
// }

// module.exports = {
//   chatbotController
// };

// if (!GEMINI_API_KEY) {
//   console.error("GEMINI_API_KEY is not defined in environment variables");
//   process.exit(1);
// }

// // Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// // Database collections mapping
// const COLLECTIONS = {
//   USERS: "users",
//   PROJECTS: "projects",
//   TASKS: "tasks",
//   CLIENTS: "clients"
// };

// // Schema definitions for the AI to understand the data structure
// const SCHEMAS = {
//   [COLLECTIONS.USERS]: {
//     name: "String",
//     email: "String",
//     contact_number: "String",
//     address: "String",
//     skills: "[String]",
//     status: "String (active/inactive)",
//     preferences: {
//       languages: "[String]"
//     }
//   },
//   [COLLECTIONS.PROJECTS]: {
//     project_details: {
//       name: "String",
//       description: "String",
//       start_date: "Date",
//       end_date: "Date",
//       status: "String",
//       priority: "String",
//       progress: "Number"
//     },
//     client_id: "ObjectId (ref: Client)",
//     project_manager_id: "ObjectId (ref: User)",
//     project_leads: "[ObjectId] (ref: User)"
//   },
//   [COLLECTIONS.TASKS]: {
//     title: "String",
//     description: "String",
//     priority: "String (Low/Medium/High)",
//     status: "String (To-do/In Progress/Done)",
//     assigned_to: "[ObjectId] (ref: User)",
//     due_date: "Date",
//     progress: "Number"
//   },
//   [COLLECTIONS.CLIENTS]: {
//     client_name: "String",
//     client_contact: {
//       phone: "String",
//       email: "String"
//     },
//     projects: "[ObjectId] (ref: Project)"
//   }
// };

// /**
//  * Generate search examples based on collection schema
//  */
// function generateSearchExamples(collection) {
//   const examples = {
//     [COLLECTIONS.USERS]: [
//       {
//         query: "Find all active users with React and Node.js skills",
//         mongoQuery: {
//           filter: {
//             status: "active",
//             skills: { $all: ["React", "Node.js"] }
//           },
//           fields: ["name", "email", "skills", "status"]
//         }
//       },
//       {
//         query: "Show me users who can speak English and are from Mumbai",
//         mongoQuery: {
//           filter: {
//             "preferences.languages": "English",
//             address: /Mumbai/i
//           },
//           fields: ["name", "email", "address", "preferences.languages"]
//         }
//       }
//     ],
//     [COLLECTIONS.PROJECTS]: [
//       {
//         query: "List all high priority projects that are in progress",
//         mongoQuery: {
//           filter: {
//             "project_details.priority": "high",
//             "project_details.status": "in-progress"
//           },
//           fields: ["project_details.name", "project_details.status", "project_details.priority", "project_details.progress"]
//         }
//       },
//       {
//         query: "Find projects ending this month with progress less than 50%",
//         mongoQuery: {
//           filter: {
//             "project_details.end_date": {
//               $gte: new Date(),
//               $lte: new Date(new Date().setMonth(new Date().getMonth() + 1))
//             },
//             "project_details.progress": { $lt: 50 }
//           },
//           fields: ["project_details.name", "project_details.end_date", "project_details.progress"]
//         }
//       }
//     ],
//     [COLLECTIONS.TASKS]: [
//       {
//         query: "Show all high priority tasks that are not completed",
//         mongoQuery: {
//           filter: {
//             priority: "High",
//             status: { $ne: "Done" }
//           },
//           fields: ["title", "description", "status", "priority", "due_date"]
//         }
//       },
//       {
//         query: "Find overdue tasks assigned to active users",
//         mongoQuery: {
//           filter: {
//             due_date: { $lt: new Date() },
//             status: { $ne: "Done" }
//           },
//           fields: ["title", "assigned_to", "due_date", "status"]
//         }
//       }
//     ],
//     [COLLECTIONS.CLIENTS]: [
//       {
//         query: "List all clients with active projects",
//         mongoQuery: {
//           filter: {
//             projects: { $exists: true, $not: { $size: 0 } }
//           },
//           fields: ["client_name", "client_contact", "projects"]
//         }
//       },
//       {
//         query: "Find clients with specific contact information",
//         mongoQuery: {
//           filter: {
//             "client_contact.email": { $exists: true },
//             "client_contact.phone": { $exists: true }
//           },
//           fields: ["client_name", "client_contact"]
//         }
//       }
//     ]
//   };

//   return examples[collection] || [];
// }

// /**
//  * Process natural language query to handle common variations and typos
//  */
// function processNaturalLanguage(query) {
//   const processed = query.toLowerCase().trim();
  
//   // Common word mappings for typos and variations
//   const wordMappings = {
//     'usr': 'user',
//     'users': 'user',
//     'employees': 'user',
//     'staff': 'user',
//     'proj': 'project',
//     'projects': 'project',
//     'task': 'task',
//     'tasks': 'task',
//     'todos': 'task',
//     'client': 'client',
//     'clients': 'client',
//     'customer': 'client',
//     'customers': 'client',
//     'high': 'High',
//     'medium': 'Medium',
//     'low': 'Low',
//     'done': 'Done',
//     'completed': 'Done',
//     'in progress': 'In Progress',
//     'inprogress': 'In Progress',
//     'todo': 'To-do',
//     'to do': 'To-do',
//     'pending': 'To-do'
//   };

//   // Replace words based on mappings
//   let processedQuery = processed;
//   Object.entries(wordMappings).forEach(([key, value]) => {
//     processedQuery = processedQuery.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
//   });

//   return processedQuery;
// }

// /**
//  * Main chatbot controller to handle user queries
//  */
// async function chatbotController(req, res) {
//   try {
//     const { message } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     // Process and normalize user input
//     const processedMessage = processNaturalLanguage(message);

//     // Determine target collection
//     let targetCollection = null;
//     if (processedMessage.includes("user")) {
//       targetCollection = COLLECTIONS.USERS;
//     } else if (processedMessage.includes("project")) {
//       targetCollection = COLLECTIONS.PROJECTS;
//     } else if (processedMessage.includes("task")) {
//       targetCollection = COLLECTIONS.TASKS;
//     } else if (processedMessage.includes("client")) {
//       targetCollection = COLLECTIONS.CLIENTS;
//     }

//     if (!targetCollection) {
//       return res.status(400).json({
//         error: "Please specify if you want to search users, projects, tasks, or clients"
//       });
//     }

//     // Generate AI prompt with context
//     const prompt = `
//       Based on this user query: "${processedMessage}"
//       For the collection: ${targetCollection}
//       With this schema: ${JSON.stringify(SCHEMAS[targetCollection], null, 2)}
      
//       Generate a MongoDB query that will:
//       1. Accurately filter based on the user's requirements
//       2. Return relevant fields only
//       3. Handle any mentioned conditions (dates, status, priority, etc.)
      
//       Example queries for reference:
//       ${JSON.stringify(generateSearchExamples(targetCollection), null, 2)}
      
//       Return only a valid JSON object with:
//       {
//         "filter": {MongoDB filter object},
//         "fields": [list of field names to return]
//       }
//     `;

//     // Get query from AI
//     const aiResponse = await callGeminiAPI(prompt);
//     let mongoQuery;

//     try {
//       mongoQuery = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
//     } catch (error) {
//       console.error("Error parsing AI response:", error);
//       return res.status(500).json({
//         error: "Failed to generate a valid database query",
//         aiResponse
//       });
//     }

//     // Execute MongoDB query with proper population
//     let results;
//     switch (targetCollection) {
//       case COLLECTIONS.USERS:
//         results = await User.find(mongoQuery.filter)
//           .select(mongoQuery.fields.join(' '));
//         break;

//       case COLLECTIONS.PROJECTS:
//         results = await Project.find(mongoQuery.filter)
//           .populate('client_id', 'client_name client_contact')
//           .populate('project_manager_id', 'name email')
//           .populate('project_leads', 'name email')
//           .select(mongoQuery.fields.join(' '));
//         break;

//       case COLLECTIONS.TASKS:
//         results = await Task.find(mongoQuery.filter)
//           .populate('assigned_to', 'name email')
//           .populate('project_id', 'project_details.name')
//           .select(mongoQuery.fields.join(' '));
//         break;

//       case COLLECTIONS.CLIENTS:
//         results = await Client.find(mongoQuery.filter)
//           .populate({
//             path: 'projects',
//             select: 'project_details.name project_details.status'
//           })
//           .select(mongoQuery.fields.join(' '));
//         break;
//     }

//     // Format and send response
//     const response = {
//       query: {
//         original: message,
//         processed: processedMessage,
//         collection: targetCollection
//       },
//       mongoQuery: mongoQuery,
//       results: results,
//       count: results.length,
//       timestamp: new Date()
//     };

//     res.json(response);

//   } catch (error) {
//     console.error("Chatbot Error:", error);
//     res.status(500).json({
//       error: "An error occurred while processing your request",
//       details: error.message
//     });
//   }
// }

// module.exports = {
//   chatbotController
// };

// // if (!GEMINI_API_KEY) {
// //   console.error("GEMINI_API_KEY is not defined in environment variables");
// // }

// // const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// // const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// // // Database collection names for reference
// // const COLLECTIONS = {
// //   USERS: "users",
// //   PROJECTS: "projects",
// //   TASKS: "tasks",
// //   CLIENTS: "clients"
// // };

// // // MongoDB connection
// // mongoose.connect(process.env.MONGODB_URI, {
// //   useNewUrlParser: true,
// //   useUnifiedTopology: true
// // }).then(() => {
// //   console.log("MongoDB connected successfully");
// // }).catch(err => {
// //   console.error("MongoDB connection error:", err);
// // });

// // /**
// //  * Get examples for different collections to use in the prompt
// //  * @param {string} collection - The collection name
// //  * @returns {string} - Examples for the specified collection
// //  */
// // function getExamplesForCollection(collection) {
// //   const examples = {
// //     [COLLECTIONS.USERS]: `
// // "Find users who know React and Python" => 
// // { "filter": { "skills": { "$all": ["React", "Python"] } }, "fields": ["name", "skills", "email"] }

// // "Show active users from Mumbai who speak English" => 
// // { "filter": { 
// //     "$and": [
// //       { "status": "active" },
// //       { "address": /Mumbai/i },
// //       { "preferences.languages": "English" }
// //     ]
// //   }, 
// //   "fields": ["name", "email", "address", "preferences.languages", "status"] 
// // }
// // `,
// //     [COLLECTIONS.PROJECTS]: `
// // "Find high priority projects that are in progress" => 
// // { "filter": { 
// //     "$and": [
// //       { "priority": "high" },
// //       { "status": "in-progress" }
// //     ]
// //   }, 
// //   "fields": ["name", "description", "status", "priority", "end_date"] 
// // }

// // "Show projects ending next month" => 
// // { "filter": { 
// //     "end_date": { 
// //       "$gte": "2023-06-01", 
// //       "$lt": "2023-07-01" 
// //     }
// //   }, 
// //   "fields": ["name", "description", "client", "end_date", "status"] 
// // }
// // `,
// //     [COLLECTIONS.TASKS]: `
// // "Find high priority tasks assigned to John" => 
// // { "filter": { 
// //     "$and": [
// //       { "priority": "high" },
// //       { "assignee.name": /John/i }
// //     ]
// //   }, 
// //   "fields": ["title", "description", "status", "priority", "due_date", "assignee"] 
// // }

// // "Show tasks due this week that are not completed" => 
// // { "filter": { 
// //     "$and": [
// //       { "due_date": { "$gte": "2023-05-22", "$lte": "2023-05-28" } },
// //       { "status": { "$ne": "done" } }
// //     ]
// //   }, 
// //   "fields": ["title", "status", "priority", "due_date", "assignee"] 
// // }
// // `,
// //     [COLLECTIONS.CLIENTS]: `
// // "Find active clients with projects" => 
// // { "filter": { 
// //     "$and": [
// //       { "status": "active" },
// //       { "projects": { "$exists": true, "$ne": [] } }
// //     ]
// //   }, 
// //   "fields": ["name", "email", "contact_person", "status", "projects"] 
// // }

// // "Show clients from New York" => 
// // { "filter": { "address": /New York/i }, 
// //   "fields": ["name", "contact_person", "address", "email", "phone"] 
// // }
// // `
// //   };

// //   return examples[collection] || examples[COLLECTIONS.USERS];
// // }


// // async function convertToMongoQuery(userInput, collection = COLLECTIONS.USERS) {
// //   const currentDate = new Date();
// //   const currentMonth = currentDate.getMonth() + 1;
// //   const currentYear = currentDate.getFullYear();
  
// //   // Define enhanced schemas with business context
// //   const schemas = {
// //     [COLLECTIONS.USERS]: `
// // SCHEMA:
// // - name: String (full name)
// // - email: String (unique, business email)
// // - contact_number: String (primary contact)
// // - address: String (office location)
// // - skills: [String] (technical and soft skills)
// // - profile_picture.url: String (avatar URL)
// // - profile_picture.upload_date: Date (last updated)
// // - preferences.languages: [String] (communication languages)
// // - status: String (enum: ['active', 'inactive'])
// // - additional_fields: Map<String> (custom attributes)

// // COMMON QUERIES:
// // 1. Skill-based search: "Find developers with React and Node.js skills"
// // 2. Location-based: "Show team members in Mumbai office"
// // 3. Availability: "List all active employees"
// // 4. Language preference: "Find users who speak Japanese"
// // 5. Combined filters: "Active developers with React skills in Mumbai"
// //     `,
// //     [COLLECTIONS.PROJECTS]: `
// // SCHEMA:
// // project_details: {
// //   name: String (project title)
// //   description: String (detailed overview)
// //   start_date: Date (kickoff date)
// //   end_date: Date (target completion)
// //   status: String (enum: ['Planning', 'In Progress', 'Completed', 'On Hold'])
// //   priority: String (enum: ['Low', 'Medium', 'High'])
// //   progress: Number (0-100)
// // }
// // client_id: ObjectId (reference to Client)
// // project_manager_id: ObjectId (reference to User)
// // kanban: {
// //   epics: [{
// //     name: String
// //     team_lead_id: ObjectId (reference to User)
// //     team_members: [ObjectId] (reference to User)
// //     technologies: [{
// //       name: String
// //       version: String
// //       type: String
// //     }]
// //     tasks: [{ task_id: ObjectId (reference to Task) }]
// //   }]
// // }

// // INTELLIGENT QUERIES:
// // 1. Timeline: "Show projects ending this quarter"
// // 2. Resource: "Find projects with React developers"
// // 3. Status: "List high priority projects in progress"
// // 4. Client: "Show all projects for client X"
// // 5. Performance: "Find projects behind schedule"
// //     `,
// //     [COLLECTIONS.TASKS]: `
// // SCHEMA:
// // - title: String (task name)
// // - description: String (detailed description)
// // - project_id: ObjectId (link to Project)
// // - epic_id: ObjectId (link to specific Epic)
// // - assigned_to: [ObjectId] (assigned team members)
// // - created_by: ObjectId (task creator)
// // - status: String (enum: ['To-do', 'In Progress', 'Done'])
// // - priority: String (enum: ['Low', 'Medium', 'High'])
// // - start_date: Date (commencement date)
// // - due_date: Date (deadline)
// // - progress: Number (0-100 completion)
// // - status_history: [{
// //     status: String
// //     changed_by: ObjectId
// //     changed_at: Date
// //   }]

// // INTELLIGENT QUERIES:
// // 1. Priority: "Show high priority tasks due this week"
// // 2. Status: "Find blocked or overdue tasks"
// // 3. Assignment: "List tasks assigned to team member X"
// // 4. Timeline: "Show tasks with approaching deadlines"
// // 5. Analytics: "Find tasks with frequent status changes"
// //     `,
// //     [COLLECTIONS.CLIENTS]: `
// // SCHEMA:
// // - client_name: String (company name)
// // - client_contact: {
// //     phone: String (primary contact)
// //     email: String (business email)
// //   }
// // - projects: [ObjectId] (associated projects)
// // - additional_fields: Map<String> (custom fields)

// // INTELLIGENT QUERIES:
// // 1. Portfolio: "Show clients with active projects"
// // 2. Analytics: "Find clients with most projects"
// // 3. Engagement: "List clients with projects ending soon"
// // 4. Contact: "Find clients by contact information"
// // 5. Status: "Show clients with delayed projects"
// //     `
// //   };

// //   // Get the schema for the specified collection
// //   const schema = schemas[collection] || schemas[COLLECTIONS.USERS];

// //   const prompt = `
// // You are an advanced AI assistant specialized in converting natural language queries into precise MongoDB queries for a project management system.

// // Context for ${collection}:
// // ${schema}

// // Generate a comprehensive query object with:
// // 1. filter: MongoDB filter object with intelligent conditions
// // 2. fields: Essential fields to return
// // 3. populate: Related data to include
// // 4. sort: Optimal sorting based on context
// // 5. limit: Reasonable result limit if needed

// // Consider these aspects:
// // 1. Time-based context (current date: ${currentDate})
// // 2. Relationship between collections
// // 3. Business priorities and urgency
// // 4. Natural data grouping and hierarchy
// // 5. Performance optimization

// // Handle these query patterns:
// // - Comparison: "older than", "more than", "less than", "before", "after"
// // - Text search: "contains", "like", "about", "related to"
// // - Status: "active", "completed", "in progress", "on hold", "todo", "done"
// // - Priority: "high priority", "medium priority", "low priority"
// // - Dates: "this month", "last week", "next month", "due soon"
// // - Combinations: "active projects with high priority due next month"

// // Examples for ${collection === COLLECTIONS.USERS ? 'users' : collection}:
// // ${getExamplesForCollection(collection)}

// // Only return the JSON object:
// // "${userInput}"
// //   `;

// //   const result = await model.generateContent(prompt);
// //   const response = result.response.text();
// //   const json = response.match(/{[\s\S]*}/)?.[0];
  
// //   // Default query if parsing fails
// //   const defaultQuery = {
// //     filter: {},
// //     fields: ["name", "email", "contact_number", "address", "skills", "profile_picture", "preferences.languages", "status"]
// //   };

// //   try {
// //     return json ? JSON.parse(json) : defaultQuery;
// //   } catch (error) {
// //     console.error("Error parsing Gemini response:", error);
// //     return defaultQuery;
// //   }
// // }

// // async function queryMongoose(collection, filter, fields) {
// //   let model;
  
// //   // Select the appropriate Mongoose model based on collection name
// //   switch(collection) {
// //     case COLLECTIONS.USERS:
// //       model = User;
// //       break;
// //     case COLLECTIONS.PROJECTS:
// //       model = Project;
// //       break;
// //     case COLLECTIONS.TASKS:
// //       model = Task;
// //       break;
// //     case COLLECTIONS.CLIENTS:
// //       model = Client;
// //       break;
// //     default:
// //       model = User; // Default to User model
// //   }
  
// //   // Convert fields array to MongoDB projection object
// //   const projection = fields.reduce((acc, field) => {
// //     switch(field) {
// //       case 'languages':
// //         acc['preferences.languages'] = 1;
// //         break;
// //       case 'profile_picture':
// //         acc['profile_picture.url'] = 1;
// //         acc['profile_picture.upload_date'] = 1;
// //         break;
// //       case 'contact_number':
// //         acc['contact_number'] = 1;
// //         break;
// //       case 'address':
// //         acc['address'] = 1;
// //         break;
// //       case 'skills':
// //         acc['skills'] = 1;
// //         break;
// //       case 'status':
// //         acc['status'] = 1;
// //         break;
// //       default:
// //         acc[field] = 1;
// //     }
// //     return acc;
// //   }, {});
  
// //   // Use Mongoose to query the database
// //   const result = await model.find(filter, projection).limit(10).lean();
// //   return result;
// // }

// // async function summarizeWithGemini(data, userQuery, fields) {
// //   const cleaned = data.map(user => {
// //     const result = {};
// //     fields.forEach(field => {
// //       switch(field) {
// //         case 'languages':
// //           result[field] = user.preferences?.languages || [];
// //           break;
// //         case 'profile_picture':
// //           result[field] = {
// //             url: user.profile_picture?.url || null,
// //             upload_date: user.profile_picture?.upload_date || null
// //           };
// //           break;
// //         case 'skills':
// //           result[field] = Array.isArray(user.skills) ? user.skills : [];
// //           break;
// //         default:
// //           result[field] = user[field] || null;
// //       }
// //     });
// //     return result;
// //   });

// //   const prompt = `
// // You're a helpful assistant. Based on this user query:
// // "${userQuery}"

// // Analyze and return the most relevant data based on the query context.
// // Consider:
// // 1. Query intent and relevance
// // 2. Data completeness
// // 3. Natural ordering (e.g., alphabetical for names, recent first for dates)
// // 4. Remove duplicates and invalid entries

// // Return a JSON array with only these requested fields: ${fields.join(', ')}
// // Respond ONLY with a valid JSON array, no explanation or markdown.
// // Here is the data to work with:
// // ${JSON.stringify(cleaned, null, 2)}
// //   `;

// //   const result = await model.generateContent(prompt);
// //   const jsonText = result.response.text();
// //   const jsonMatch = jsonText.match(/\[.*\]/s);
// //   if (!jsonMatch) throw new Error("Invalid response from Gemini");
// //   return JSON.parse(jsonMatch[0]);
// // }

// // /**
// //  * Determine which collection to query based on user input
// //  * @param {string} userInput - The user's query
// //  * @returns {string} - The collection name to query
// //  */
// // function determineCollection(userInput) {
// //   const input = userInput.toLowerCase();
  
// //   if (input.includes('project') || input.includes('projects')) {
// //     return COLLECTIONS.PROJECTS;
// //   } else if (input.includes('task') || input.includes('tasks')) {
// //     return COLLECTIONS.TASKS;
// //   } else if (input.includes('client') || input.includes('clients')) {
// //     return COLLECTIONS.CLIENTS;
// //   } else {
// //     // Default to users collection
// //     return COLLECTIONS.USERS;
// //   }
// // }

// // /**
// //  * Handle general queries that don't require database access
// //  * @param {string} userInput - The user's query
// //  * @returns {Object|null} - Response object or null if not a general query
// //  */
// // async function handleGeneralQuery(userInput) {
// //   const input = userInput.toLowerCase();
  
// //   // Check if this is a general question about the system
// //   if (input.includes('help') || input.includes('what can you do')) {
// //     return {
// //       data: [],
// //       message: "I can help you find information about users, projects, tasks, and clients in the WorkFusion system. Try asking questions like 'Find active users who know React' or 'Show me projects with deadline this month'."
// //     };
// //   }
  
// //   // Check if this is a greeting
// //   if (input.match(/^(hi|hello|hey|greetings).{0,10}$/i)) {
// //     return {
// //       data: [],
// //       message: "Hello! I'm your WorkFusion assistant. How can I help you today?"
// //     };
// //   }
  
// //   return null; // Not a general query
// // }

// // exports.handleChat = async (req, res) => {
// //   try {
// //     const userInput = req.body.message;
    
// //     // First check if this is a general query
// //     const generalResponse = await handleGeneralQuery(userInput);
// //     if (generalResponse) {
// //       return res.json(generalResponse);
// //     }
    
// //     // Determine which collection to query
// //     const collection = determineCollection(userInput);
    
// //     // Convert user input to MongoDB query
// //      const { filter, fields } = await convertToMongoQuery(userInput, collection);
    
// //     // Query the database
// //     const results = await queryMongoose(collection, filter, fields);

// //     if (results.length === 0) {
// //       // If no results, try to give a helpful response using Gemini
// //       const aiResponse = await callGeminiAPI(
// //         `The user asked: "${userInput}", but no matching data was found in the ${collection} collection. Provide a helpful response.`
// //       );
      
// //       return res.json({ 
// //         data: [], 
// //         message: aiResponse || `No matching ${collection} found.` 
// //       });
// //     }

// //     // Summarize results with Gemini
// //     const data = await summarizeWithGemini(results, userInput, fields);
    
// //     res.json({ 
// //       data, 
// //       message: `Found ${data.length} matching ${collection} with fields: ${fields.join(', ')}.` 
// //     });
// //   } catch (err) {
// //     console.error('Error in handleChat:', err);
// //     res.status(500).json({ 
// //       error: err.message,
// //       message: "Sorry, I encountered an error processing your request. Please try again later."
// //     });
// //   }
// // };


