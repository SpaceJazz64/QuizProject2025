// ===== IMPORTS =====
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config();

// ===== MODELS =====
const User = require("./models/User");
const Score = require("./models/Score");

// ===== APP SETUP =====
const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== JWT AUTH MIDDLEWARE =====
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access denied" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
}

// ===== DATABASE CONNECTION =====
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// ===== ROUTES =====

// SIGNUP
app.post("/api/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.json({ success: false, message: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, email, password: hashedPassword });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Server error" });
    }
});

// LOGIN
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.json({ success: false, message: "Email not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.json({ success: false, message: "Invalid password" });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ success: true, token });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Server error" });
    }
});

// GET QUIZ QUESTIONS
app.get("/api/quiz", authenticateToken, (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, "questions.json"));
        const questions = JSON.parse(data);
        const shuffled = questions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 10);
        res.json({ success: true, questions: selected });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Could not load questions" });
    }
});

// SAVE QUIZ SCORE - improved debug + validation
app.post("/api/save-score", authenticateToken, async (req, res) => {
    try {
        console.log("DEBUG: /api/save-score called. body:", req.body);

        const { score, totalQuestions } = req.body;

        // Validate
        if (typeof score !== "number" || isNaN(score)) {
            console.warn("Invalid score received:", score);
            return res.status(400).json({ success: false, message: "Invalid score value" });
        }

        const newScore = await Score.create({
            userId: req.user.id,
            score,
            totalQuestions: totalQuestions || 10,
            date: new Date()
        });

        console.log("Saved score doc:", newScore);
        res.json({ success: true, score: newScore });
    } catch (err) {
        console.error("Error saving score:", err);
        res.status(500).json({ success: false, message: "Could not save score" });
    }
});


// GET PROFILE
app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        const scores = await Score.find({ userId: req.user.id }).sort({ date: -1 });
        res.json({ success: true, user, scores });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Could not fetch profile" });
    }
});

// GET LEADERBOARD
app.get("/api/leaderboard", async (req, res) => {
    try {
        const leaderboard = await Score.aggregate([
            { $group: { _id: "$userId", maxScore: { $max: "$score" } } },
            { $sort: { maxScore: -1 } },
            { $limit: 10 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { username: "$user.username", maxScore: 1 } }
        ]);

        res.json({ success: true, leaderboard });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Could not load leaderboard" });
    }
});

// START SERVER
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
