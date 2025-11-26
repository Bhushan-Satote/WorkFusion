const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Client = require("../models/Client");
const callGeminiAPI = require("../utils/geminiApi");

const COLLECTIONS = {
  USERS: "users",
  PROJECTS: "projects",
  TASKS: "tasks",
  CLIENTS: "clients"
};

const SCHEMAS = {
  [COLLECTIONS.USERS]: {
    name: "String",
    email: "String",

    contact_number: "String",
    address: "String",
    skills: "[String]",
    status: "String (active/inactive)",
    preferences: {
      languages: "[String]"
    }
  },
  [COLLECTIONS.PROJECTS]: {
    project_details: {
      name: "String",
      description: "String",
      start_date: "Date",
      end_date: "Date",
      status: "String",
      priority: "String",
      progress: "Number"
    },
    client_id: "ObjectId (ref: Client)",
    project_manager_id: "ObjectId (ref: User)",
    project_leads: "[ObjectId] (ref: User)"
  },
  [COLLECTIONS.TASKS]: {
    title: "String",
    description: "String",
    priority: "String (Low/Medium/High)",
    status: "String (To-do/In Progress/Done)",
    assigned_to: "[ObjectId] (ref: User)",
    due_date: "Date",
    progress: "Number"
  },
  [COLLECTIONS.CLIENTS]: {
    client_name: "String",
    client_contact: {
      phone: "String",
      email: "String"
    },
    projects: "[ObjectId] (ref: Project)"
  }
};

function generateSearchExamples(collection) {
  return {
    [COLLECTIONS.USERS]: [
      {
        query: "Find all active users with React and Node.js skills",
        mongoQuery: {
          filter: {
            status: "active",
            skills: { $all: ["React", "Node.js"] }
          },
          fields: ["name", "email", "skills", "status"]
        }
      },
      {
        query: "Show me users who can speak English and are from Mumbai",
        mongoQuery: {
          filter: {
            "preferences.languages": "English",
            address: /Mumbai/i
          },
          fields: ["name", "email", "address", "preferences.languages"]
        }
      }
    ],
    [COLLECTIONS.PROJECTS]: [
      {
        query: "List all high priority projects that are in progress",
        mongoQuery: {
          filter: {
            "project_details.priority": "high",
            "project_details.status": "in-progress"
          },
          fields: ["project_details.name", "project_details.status", "project_details.priority", "project_details.progress"]
        }
      }
    ],
    [COLLECTIONS.TASKS]: [
      {
        query: "Show all high priority tasks that are not completed",
        mongoQuery: {
          filter: {
            priority: "High",
            status: { $ne: "Done" }
          },
          fields: ["title", "description", "status", "priority", "due_date"]
        }
      }
    ],
    [COLLECTIONS.CLIENTS]: [
      {
        query: "List all clients with active projects",
        mongoQuery: {
          filter: {
            projects: { $exists: true, $not: { $size: 0 } }
          },
          fields: ["client_name", "client_contact", "projects"]
        }
      }
    ]
  }[collection] || [];
}

function processNaturalLanguage(query) {
  const processed = query.toLowerCase().trim();
  
  const wordMappings = {
    // User related terms
    'usr': 'user',
    'users': 'user',
    'user': 'user',
    'emp': 'user',
    'emps': 'user',
    'employee': 'user',
    'employees': 'user',
    'staff': 'user',
    'member': 'user',
    'members': 'user',
    'team': 'user',
    'person': 'user',
    'people': 'user',
    'worker': 'user',
    'workers': 'user',
    'list all': 'show all',
    'show all': 'show all',
    'get all': 'show all',
    'display': 'show',
    'find': 'show',
    'search': 'show',
    'tell me': 'show',
    
    // Project related
    'proj': 'project',
    'projects': 'project',
    'assignment': 'project',
    'assignments': 'project',
    
    // Task related
    'task': 'task',
    'tasks': 'task',
    'todos': 'task',
    'todo': 'task',
    'work': 'task',
    'works': 'task',
    'job': 'task',
    'jobs': 'task',
    
    // Client related
    'client': 'client',
    'clients': 'client',
    'customer': 'client',
    'customers': 'client',
    'vendor': 'client',
    'vendors': 'client',
    
    // Status and priority
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
    'done': 'Done',
    'completed': 'Done',
    'finished': 'Done',
    'in progress': 'In Progress',
    'inprogress': 'In Progress',
    'ongoing': 'In Progress',
    'processing': 'In Progress',
    'working': 'In Progress',
    'todo': 'To-do',
    'to do': 'To-do',
    'pending': 'To-do',
    'not started': 'To-do',
    'new': 'To-do'
  };

  let processedQuery = processed;
  Object.entries(wordMappings).forEach(([key, value]) => {
    processedQuery = processedQuery.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
  });

  return processedQuery;
}

async function handleChat(req, res) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const processedMessage = processNaturalLanguage(message);

    let targetCollection = null;
    if (processedMessage.includes("user")) {
      targetCollection = COLLECTIONS.USERS;
    } else if (processedMessage.includes("project")) {
      targetCollection = COLLECTIONS.PROJECTS;
    } else if (processedMessage.includes("task")) {
      targetCollection = COLLECTIONS.TASKS;
    } else if (processedMessage.includes("client")) {
      targetCollection = COLLECTIONS.CLIENTS;
    }

    if (!targetCollection) {
      return res.status(400).json({
        error: "Please specify if you want to search users, projects, tasks, or clients"
      });
    }

    const prompt = `
      Based on this user query: "${processedMessage}"
      For the collection: ${targetCollection}
      With this schema: ${JSON.stringify(SCHEMAS[targetCollection], null, 2)}
      
      Generate a MongoDB query that will:
      1. Accurately filter based on the user's requirements
      2. Return relevant fields only
      3. Handle any mentioned conditions (dates, status, priority, etc.)
      
      Example queries for reference:
      ${JSON.stringify(generateSearchExamples(targetCollection), null, 2)}
      
      Return only a valid JSON object with:
      {
        "filter": {MongoDB filter object},
        "fields": [list of field names to return]
      }
    `;

    console.log('Sending prompt to Gemini:', prompt);
    const aiResponse = await callGeminiAPI(prompt);
    console.log('Received Gemini response:', aiResponse);
    
    let mongoQuery;
    try {
      // Clean up the response to handle potential markdown formatting
      const cleanedResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/```javascript\s*/g, '')
        .trim();
      
      console.log('Cleaned response:', cleanedResponse);
      mongoQuery = JSON.parse(cleanedResponse);
      
      // Validate the query structure
      if (!mongoQuery.filter || !mongoQuery.fields) {
        throw new Error('Invalid query structure - missing filter or fields');
      }

      console.log('Parsed MongoDB query:', mongoQuery);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Raw AI response:", aiResponse);
      
      // Fallback query if parsing fails
      mongoQuery = {
        filter: {},
        fields: ['name', 'email', 'status'] // Basic fields as fallback
      };
      
      // Still return a 200 response but with the fallback query
      console.log('Using fallback query:', mongoQuery);
    }

    console.log('Executing MongoDB query for collection:', targetCollection);
    let results;
    try {
      // If it's a "list all" or "show all" query, set default fields if none specified
      if (processedMessage.includes("show all") || processedMessage.includes("list all")) {
        mongoQuery.fields = mongoQuery.fields || [];
        switch (targetCollection) {
          case COLLECTIONS.USERS:
            mongoQuery.fields = ['name', 'email', 'contact_number', 'address', 'skills', 'status'];
            break;
          case COLLECTIONS.PROJECTS:
            mongoQuery.fields = ['project_details', 'client_id', 'project_manager_id'];
            break;
          case COLLECTIONS.TASKS:
            mongoQuery.fields = ['title', 'description', 'priority', 'status', 'assigned_to', 'due_date'];
            break;
          case COLLECTIONS.CLIENTS:
            mongoQuery.fields = ['client_name', 'client_contact', 'projects'];
            break;
        }
      }

      switch (targetCollection) {
        case COLLECTIONS.USERS:
          results = await User.find(mongoQuery.filter)
            .select(mongoQuery.fields.length ? mongoQuery.fields.join(' ') : null)
            .lean();
          break;

        case COLLECTIONS.PROJECTS:
          results = await Project.find(mongoQuery.filter)
            .populate('client_id', 'client_name client_contact')
            .populate('project_manager_id', 'name email')
            .populate('project_leads', 'name email')
            .select(mongoQuery.fields.join(' '))
            .lean();
          break;

        case COLLECTIONS.TASKS:
          results = await Task.find(mongoQuery.filter)
            .populate('assigned_to', 'name email')
            .populate('project_id', 'project_details.name')
            .select(mongoQuery.fields.join(' '))
            .lean();
          break;

        case COLLECTIONS.CLIENTS:
          results = await Client.find(mongoQuery.filter)
            .populate({
              path: 'projects',
              select: 'project_details.name',
              transform: doc => ({
                name: doc.project_details?.name || 'Unnamed Project'
              })
            })
            .select('client_name client_contact projects')
            .lean();
          break;
      }

      console.log(`Found ${results ? results.length : 0} results`);
      
      // If no results, provide a meaningful message
      if (!results || results.length === 0) {
        results = [];
        console.log('No results found for the query');
      }
    } catch (error) {
      console.error('Error executing MongoDB query:', error);
      throw error;
    }

    // Format the results based on collection type
    const formattedResults = results.map(result => {
      switch (targetCollection) {
        case COLLECTIONS.USERS:
          return {
            id: result._id,
            name: result.name,
            email: result.email,
            contact: result.contact_number,
            address: result.address,
            skills: result.skills,
            status: result.status
          };
        case COLLECTIONS.PROJECTS:
          return {
            id: result._id,
            name: result.project_details?.name,
            description: result.project_details?.description,
            status: result.project_details?.status,
            priority: result.project_details?.priority,
            progress: result.project_details?.progress,
            client: result.client_id,
            manager: result.project_manager_id
          };
        case COLLECTIONS.TASKS:
          return {
            id: result._id,
            title: result.title,
            description: result.description,
            status: result.status,
            priority: result.priority,
            assignedTo: result.assigned_to,
            dueDate: result.due_date,
            progress: result.progress
          };
        case COLLECTIONS.CLIENTS:
          return {
            id: result._id,
            name: result.client_name,
            'contact.email': result.client_contact?.email || 'Not provided',
            'contact.phone': result.client_contact?.phone || 'Not provided',
            projects: result.projects?.map(project => project.name).join(', ') || 'No projects'
          };
        default:
          return result;
      }
    });

    const response = {
      success: true,
      query: {
        original: message,
        processed: processedMessage,
        collection: targetCollection
      },
      mongoQuery: mongoQuery,
      results: formattedResults,
      count: formattedResults.length,
      timestamp: new Date(),
      message: formattedResults.length > 0 
        ? `Found ${formattedResults.length} matching ${targetCollection}. Displaying all data.`
        : `No ${targetCollection} found matching your criteria`
    };

    console.log('Sending response:', {
      ...response,
      results: `${results.length} items` // Log count instead of full results for clarity
    });

    res.json(response);

  } catch (error) {
    console.error("Chatbot Error:", error);
    res.status(500).json({
      error: "An error occurred while processing your request",
      details: error.message
    });
  }
}

/**
 * Get analytics about chatbot usage and performance
 */
async function analytics(req, res) {
  try {
    // Get counts from each collection
    const [userCount, projectCount, taskCount, clientCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments(),
      Client.countDocuments()
    ]);

    // Get status distributions
    const taskStatusDistribution = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const projectStatusDistribution = await Project.aggregate([
      { $group: { _id: "$project_details.status", count: { $sum: 1 } } }
    ]);

    // Get priority distributions
    const taskPriorityDistribution = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const projectPriorityDistribution = await Project.aggregate([
      { $group: { _id: "$project_details.priority", count: { $sum: 1 } } }
    ]);

    res.json({
      collectionStats: {
        users: userCount,
        projects: projectCount,
        tasks: taskCount,
        clients: clientCount
      },
      distributions: {
        taskStatus: taskStatusDistribution,
        projectStatus: projectStatusDistribution,
        taskPriority: taskPriorityDistribution,
        projectPriority: projectPriorityDistribution
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({
      error: "Failed to generate analytics",
      details: error.message
    });
  }
}

module.exports = {
  handleChat,
  analytics
};