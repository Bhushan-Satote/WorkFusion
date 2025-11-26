const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import models
const Project = require("./backend/models/Project");
const Client = require("./backend/models/Client");
const User = require("./backend/models/User");
const Credentials = require("./backend/models/Credentials");

const createTestData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find the Project Lead user
    const projectLeadCredentials = await Credentials.findOne({ username: "projectlead" });
    if (!projectLeadCredentials) {
      console.log("❌ Project Lead user not found. Please run create-project-lead.js first");
      process.exit(1);
    }

    const projectLeadUser = await User.findOne({ credentialId: projectLeadCredentials._id });
    if (!projectLeadUser) {
      console.log("❌ Project Lead user profile not found");
      process.exit(1);
    }

    console.log("✅ Found Project Lead user:", projectLeadUser.name);

    // Find or create a Project Manager
    let projectManagerUser;
    const projectManagerCredentials = await Credentials.findOne({ role: "Project Manager" });
    if (projectManagerCredentials) {
      projectManagerUser = await User.findOne({ credentialId: projectManagerCredentials._id });
    }

    if (!projectManagerUser) {
      console.log("⚠️ No Project Manager found, using Admin as Project Manager");
      const adminCredentials = await Credentials.findOne({ role: "Admin" });
      projectManagerUser = { _id: adminCredentials._id, name: "Administrator" };
    }

    // Create or find a test client
    let testClient = await Client.findOne({ name: "Test Tech Solutions" });
    if (!testClient) {
      testClient = new Client({
        name: "Test Tech Solutions",
        email: "contact@testtechsolutions.com",
        contact_number: "+1-555-0123",
        address: "456 Business Ave, Tech City, TC 12345",
        company_details: {
          industry: "Technology",
          size: "Medium",
          website: "https://testtechsolutions.com"
        },
        projects: []
      });
      await testClient.save();
      console.log("✅ Test client created");
    } else {
      console.log("✅ Found existing test client");
    }

    // Create a test project with an epic assigned to the Project Lead
    const testProject = new Project({
      client_id: testClient._id,
      project_manager_id: projectManagerUser._id,
      project_details: {
        name: "E-Commerce Platform Development",
        description: "A comprehensive e-commerce platform with modern features including user authentication, product catalog, shopping cart, and payment processing.",
        start_date: new Date(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        status: "In Progress",
        priority: "High",
        progress: 25
      },
      kanban: {
        epics: [
          {
            name: "User Authentication System",
            description: "Implement secure user registration, login, password reset, and profile management features.",
            team_lead_id: projectLeadUser._id,
            team_members: [projectLeadUser._id],
            technologies: [
              { name: "React", version: "18.0", type: "Frontend" },
              { name: "Node.js", version: "18.0", type: "Backend" },
              { name: "JWT", version: "9.0", type: "Authentication" },
              { name: "bcrypt", version: "5.0", type: "Security" }
            ],
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            tasks: [],
            status: "In Progress"
          },
          {
            name: "Product Catalog Management",
            description: "Create a comprehensive product catalog with categories, search functionality, and inventory management.",
            team_lead_id: projectLeadUser._id,
            team_members: [projectLeadUser._id],
            technologies: [
              { name: "React", version: "18.0", type: "Frontend" },
              { name: "MongoDB", version: "6.0", type: "Database" },
              { name: "Express", version: "4.18", type: "Backend" }
            ],
            start_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
            tasks: [],
            status: "To Do"
          },
          {
            name: "Shopping Cart & Checkout",
            description: "Implement shopping cart functionality with secure checkout process and payment integration.",
            team_lead_id: projectLeadUser._id,
            team_members: [projectLeadUser._id],
            technologies: [
              { name: "React", version: "18.0", type: "Frontend" },
              { name: "Stripe", version: "10.0", type: "Payment" },
              { name: "Node.js", version: "18.0", type: "Backend" }
            ],
            start_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
            end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            tasks: [],
            status: "Not Started"
          }
        ]
      },
      project_leads: [projectLeadUser._id],
      attachments: []
    });

    await testProject.save();
    console.log("✅ Test project created with 3 epics assigned to Project Lead");

    // Update client's projects array
    testClient.projects.push(testProject._id);
    await testClient.save();
    console.log("✅ Client updated with project reference");

    console.log("\n🎉 Test data created successfully!");
    console.log("📋 What was created:");
    console.log("   • Client: Test Tech Solutions");
    console.log("   • Project: E-Commerce Platform Development");
    console.log("   • 3 Epics assigned to Project Lead:");
    console.log("     1. User Authentication System (In Progress)");
    console.log("     2. Product Catalog Management (To Do)");
    console.log("     3. Shopping Cart & Checkout (Not Started)");
    console.log("\n🚀 Now login as Project Lead to see these epics in your dashboard!");
    console.log("   Username: projectlead");
    console.log("   Password: password123");

  } catch (error) {
    console.error("❌ Error creating test data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run the script
createTestData();