const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Credentials = require("../models/Credentials");
const User = require("../models/User");

// Helper to generate a unique username from full name or email
const generateUniqueUsername = async (name = "", email = "") => {
  const cleaned = (str) =>
    String(str || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s.]/g, " ")
      .trim()
      .replace(/\s+/g, ".");
  let base = "";
  if (name) {
    const parts = cleaned(name).split(".");
    const first = parts[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1] : "";
    base = [first, last].filter(Boolean).join(".");
  }
  if (!base && email) {
    base = cleaned(email.split("@")[0]);
  }
  if (!base) base = "user";
  base = base.replace(/\.+/g, ".").replace(/^\.+|\.+$/g, "");
  if (!base) base = "user";

  // Ensure uniqueness
  let candidate = base;
  let suffix = 0;
  // Limit loop to avoid infinite
  while (await Credentials.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
};

// ✅ Get all users (Admin-only)
 const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("credentialId", "username role");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "credentialId",
      "username role"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// // ✅ Create a new user (Admin use case)
// const createUser = async (req, res) => {
//   try {
//     const {
//       username, password, role, name, email, contact_number, address, skills, preferences, profile_picture
//     } = req.body;

//     // Check if email already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "Email already registered" });

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create credentials first
//     const credential = new Credentials({ username, password: hashedPassword, role });
//     await credential.save();

//     // Check if profile picture URL is provided
//     if (!profile_picture || !profile_picture.url) {
//       return res.status(400).json({ message: "Profile picture URL is required" });
//     }

//     // Create User
//     const user = new User({
//       credentialId: credential._id,
//       name,
//       email,
//       contact_number,
//       address,
//       skills,
//       profile_picture,
//       preferences,
//     });
//     await user.save();

//     res.status(201).json({ message: "User created successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Error creating user", error });
//   }
// };

// ✅ Create a new user (Admin use case)

const createUser = async (req, res) => {
  try {
    const { password, role, name, email } = req.body;

    // Validate required fields (username will be auto-generated)
    if (!password || !role || !name || !email) {
      return res.status(400).json({ 
        message: "Required fields missing", 
        required: ["password", "role", "name", "email"] 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a unique username from the full name or email
    const username = await generateUniqueUsername(name, email);

    // Create credentials first
    const credential = new Credentials({
      username,
      password: hashedPassword,
      role,
    });
    await credential.save();

    // Create User with only essential fields
    const user = new User({
      credentialId: credential._id,
      name,
      email,
      // Set default empty values for optional fields
      contact_number: "",
      address: "",
      skills: [],
      preferences: {},
      profile_picture: null
    });
    
    await user.save();

    // Return populated user so frontend has username and role immediately
    const populatedUser = await User.findById(user._id).populate("credentialId", "username role");

    res.status(201).json({ 
      message: "User created successfully. User can login to complete their profile.", 
      user: populatedUser 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// ✅ Register User (Public Sign-Up)
const registerUser = async (req, res) => {
  try {
    const { username: providedUsername, name, contact_number, email, password, role } = req.body;

    let existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine username (generate if not provided)
    const username = providedUsername || await generateUniqueUsername(name, email);

    // Create Credentials
    const credential = new Credentials({
      username,
      password: hashedPassword,
      role,
    });
    await credential.save();

    // Create User profile
    const user = new User({ credentialId: credential._id, name, email });
    await user.save();

    const populated = await User.findById(user._id).populate("credentialId", "username role");
    res.status(201).json({ message: "User registered successfully", user: populated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Login User
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find credentials using username
    const credentials = await Credentials.findOne({ username });
    if (!credentials) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (username not found)" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, credentials.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials (password mismatch)" });
    }

    // Check if user is active
    const user = await User.findOne({ credentialId: credentials._id });
    if (!user || user.status === 'inactive') {
      return res
        .status(403)
        .json({ message: "Account is inactive. Please contact administrator." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { credentialId: credentials._id, role: credentials.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Update user details (Authenticated users)

// const updateUser = async (req, res) => {
//   try {
//     const { name, email, contact_number, address, skills, preferences } =
//       req.body;

//     // Find the user by ID
//     const user = await User.findById(req.params.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Update fields
//     user.name = name || user.name;
//     user.email = email || user.email;
//     user.contact_number = contact_number || user.contact_number;
//     user.address = address || user.address;
//     user.skills = skills || user.skills;
//     user.preferences = preferences || user.preferences;

//     await user.save();
//     res.json({ message: "User updated successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// ✅ Update user details (PATCH)
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      contact_number,
      address,
      skills,
      profile_picture,
      role
    } = req.body;
    const { preferences } = req.body;

    // Find the user by ID
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If role is provided, validate and update it
    if (role) {
      const validRoles = ["Admin", "Employee", "Project Manager", "Project Lead"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          message: "Invalid role",
          validRoles: validRoles
        });
      }

      // Update role in Credentials
      const credentials = await Credentials.findById(user.credentialId);
      if (!credentials) {
        return res.status(404).json({ message: "Credentials not found" });
      }
      credentials.role = role;
      await credentials.save();
    }

    // Update only the fields that are provided
    if (name) user.name = name;
    if (email) {
      // Check if new email already exists for other users
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    if (contact_number) user.contact_number = contact_number;
    if (address) user.address = address;

    // Normalize inputs that may come as comma-separated strings
    const toStringArray = (val) => {
      if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
      return undefined;
    };

    if (skills !== undefined) {
      const arr = toStringArray(skills);
      if (arr) user.skills = arr;
    }

    if (profile_picture) {
      user.profile_picture = {
        url: profile_picture.url,
        upload_date: new Date()
      };
    }

    // Languages may come nested under preferences or at top-level
    let languagesInput;
    if (preferences && typeof preferences === 'object' && 'languages' in preferences) {
      languagesInput = preferences.languages;
    } else if ('languages' in req.body) {
      languagesInput = req.body.languages;
    }
    const languagesArr = toStringArray(languagesInput);
    if (languagesArr) {
      user.preferences = {
        ...(user.preferences || {}),
        languages: languagesArr
      };
    }

    await user.save();

    // Fetch updated user with populated credentials
    const updatedUser = await User.findById(user._id)
      .populate('credentialId', 'username role');

    res.json({ 
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// ✅ Deactivate user (Admin-only) - Replaces the deleteUser function
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update user status to inactive instead of deleting
    user.status = 'inactive';
    await user.save();

    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error('Error deactivating user:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Reactivate user (Admin-only)
const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update user status to active
    user.status = 'active';
    await user.save();
    res.json({ message: "User reactivated successfully" });
  } catch (error) {
    console.error('Error reactivating user:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get current authenticated user (by credentialId in token)
const getMe = async (req, res) => {
  try {
    const { credentialId } = req.user || {};
    if (!credentialId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ credentialId }).populate(
      "credentialId",
      "username role"
    );
    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const hasFaceData = Boolean(
      user.faceData && (user.faceData.front || user.faceData.left || user.faceData.right)
    );

    res.json({ user, hasFaceData });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Register or update face data for current user
const registerFaceData = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log('Registering face data for user:', userId);

    const { front, left, right, frontDescriptor, leftDescriptor, rightDescriptor } = req.body || {};
    if (!front && !left && !right && !frontDescriptor && !leftDescriptor && !rightDescriptor) {
      return res.status(400).json({ message: "At least one face image or descriptor must be provided" });
    }

    const updateData = {
      faceData: {
        front: front ?? undefined,
        left: left ?? undefined,
        right: right ?? undefined,
        frontDescriptor: frontDescriptor ?? undefined,
        leftDescriptor: leftDescriptor ?? undefined,
        rightDescriptor: rightDescriptor ?? undefined,
      }
    };

    Object.keys(updateData.faceData).forEach((key) => {
      if (updateData.faceData[key] === undefined) {
        delete updateData.faceData[key];
      }
    });

    console.log('Finding user to update:', userId);
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: false }
    );
    
    console.log('User update result:', user ? 'Success' : 'Not found');

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.json({ message: "Face data saved", faceData: user.faceData });
  } catch (error) {
    console.error("❌ Error saving face data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  registerUser,
  loginUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  getMe,
  registerFaceData,
  // deleteUser, // Remove or comment out this line
};