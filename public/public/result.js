// ===== SELECT ELEMENTS =====
const scoreDisplay = document.getElementById("scoreDisplay");

// ===== GET SCORE FROM LOCAL STORAGE =====
const lastScore = localStorage.getItem("lastScore");
const totalQuestions = localStorage.getItem("totalQuestions") || 10;

if (lastScore !== null) {
    scoreDisplay.textContent = `Score: ${lastScore}/${totalQuestions}`;
} else {
    scoreDisplay.textContent = "No score found. Play a quiz first!";
}

// ===== OPTIONAL: CLEAR SCORE FROM LOCAL STORAGE AFTER DISPLAY =====
localStorage.removeItem("lastScore");
localStorage.removeItem("totalQuestions");
