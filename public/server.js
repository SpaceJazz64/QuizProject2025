// ===== IMPORTS =====
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ===== MODELS =====
const User = require("./models/User");
const Score = require("./models/Score");

// ===== APP SETUP =====
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== HELPER FUNCTIONS =====
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function decodeHTML(html) {
    return html.replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

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

// GET QUIZ QUESTIONS (from Open Trivia DB)
// GET QUIZ QUESTIONS (from Open Trivia DB)
app.get("/api/quiz", authenticateToken, async (req, res) => {
    try {
        const amount = parseInt(req.query.amount) || 10;
        const difficulty = req.query.difficulty || "medium";

        const apiUrl = `https://opentdb.com/api.php?amount=${amount}&category=15&difficulty=${difficulty}&type=multiple`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.response_code !== 0) {
            return res.json({ success: false, message: "Could not fetch questions from API" });
        }

        // Transform API questions to format {question, A, B, C, D, answer}
        const questions = data.results.map(q => {
            // Decode all answers
            const correct = decodeHTML(q.correct_answer);
            const incorrect = q.incorrect_answers.map(a => decodeHTML(a));

            // Shuffle choices
            const choices = [...incorrect, correct];
            for (let i = choices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [choices[i], choices[j]] = [choices[j], choices[i]];
            }

            // Map to A/B/C/D
            const keyMap = ["A", "B", "C", "D"];
            const answerIndex = choices.indexOf(correct);

            return {
                question: decodeHTML(q.question),
                A: choices[0],
                B: choices[1],
                C: choices[2],
                D: choices[3],
                answer: keyMap[answerIndex] // correct key after shuffle
            };
        });

        res.json({ success: true, questions });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Could not load questions" });
    }
});


// SAVE QUIZ SCORE
app.post("/api/save-score", authenticateToken, async (req, res) => {
    try {
        const { score, totalQuestions } = req.body;
        if (typeof score !== "number" || isNaN(score)) {
            return res.status(400).json({ success: false, message: "Invalid score value" });
        }

        const newScore = await Score.create({
            userId: req.user.id,
            score,
            totalQuestions: totalQuestions || 10,
            date: new Date()
        });

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

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
