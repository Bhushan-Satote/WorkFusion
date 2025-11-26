const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

exports.verifyToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    console.log("🔍 Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }
    
    const token = authHeader.split(" ")[1];

    console.log("🔍 Extracted Token:", token ? "Present" : "Missing");

    if (!token) {
        return res.status(401).json({ message: "Access Denied. Invalid token format." });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log("🔍 Token Verified Successfully:", verified);
        
        req.user = {
            id: verified.userId || verified._id,
            _id: verified.userId || verified._id,
            credentialId: verified.credentialId || verified.userId || verified._id,
            role: verified.role,
            username: verified.username
        };
        
        console.log("✅ User set in req.user:", req.user);
        next();
    } catch (err) {
        console.log("❌ Token Verification Error:", err.message);
        return res.status(403).json({ message: "Invalid token" });
    }
}

exports.isAdmin = (req, res, next) => {
    console.log("🔍 Checking admin access for user:", req.user);
    if (!req.user || req.user.role !== "Admin") {
        return res.status(403).json({ message: "Access Denied. Admins only!" });
    }
    next();
};