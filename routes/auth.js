const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", [
  body("name").trim().isLength({ min: 1 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["student", "teacher", "admin"]).withMessage("Role must be student, teacher, or admin")
], async (req, res) => {
  try {
    console.log("Registration request received:", req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, institution, department } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists:", email);
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Generate studentId for students
    const userData = { name, email, password, role, institution, department };
    if (role === 'student') {
      // Generate a unique student ID (format: STU + timestamp + random)
      userData.studentId = 'STU' + Date.now() + Math.floor(Math.random() * 1000);
    }

    user = new User(userData);

    console.log("About to save user to MongoDB:", { name, email, role, institution, department });
    await user.save();
    console.log("User saved successfully to MongoDB");

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      console.log("User registered successfully:", { id: user.id, name: user.name, email: user.email, role: user.role });
      res.json({
        success: true,
        message: "Registration successful",
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }
      });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

router.post("/login", [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").exists().withMessage("Password is required")
], async (req, res) => {
  try {
    console.log("Login request received:", req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for user:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const payload = { user: { id: user.id, role: user.role } };

    jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      console.log("User logged in successfully:", { id: user.id, name: user.name, email: user.email, role: user.role });
      res.json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (clear token on client)
// @access  Private
router.post("/logout", auth, async (req, res) => {
  try {
    // Note: With JWT, logout is mainly handled client-side by removing token
    // In a more advanced setup, you might maintain a blacklist of invalidated tokens
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
});

module.exports = router;
