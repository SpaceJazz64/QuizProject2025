// ===== SELECT ELEMENTS =====
const quizContainer = document.getElementById("quizContainer");
const questionText = document.getElementById("questionText");
const answersDiv   = document.getElementById("answers");
const nextBtn      = document.getElementById("nextBtn");

// ===== VARIABLES =====
let questions = [];
let currentIndex = 0;
let score = 0;

// ===== FETCH QUESTIONS FROM BACKEND =====
async function loadQuestions() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        console.log("Loading questions with token:", !!token);
        const response = await fetch("/api/quiz", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        const data = await response.json();

        if (data.success) {
            questions = data.questions;
            showQuestion();
        } else {
            alert(data.message || "Could not load questions");
        }
    } catch (err) {
        console.error("Error loading questions:", err);
    }
}

// ===== SHOW CURRENT QUESTION =====
function showQuestion() {
    answersDiv.innerHTML = "";
    nextBtn.style.display = "none";

    if (currentIndex >= questions.length) {
        finishQuiz();
        return;
    }

    const q = questions[currentIndex];
    questionText.textContent = `Q${currentIndex + 1}: ${q.question}`;

    // Shuffle answer keys
    const answerKeys = ["A", "B", "C", "D"];
    shuffleArray(answerKeys);

    // Create buttons with CORRECT MAPPING
    answerKeys.forEach(key => {
        const btn = document.createElement("button");
        btn.textContent = q[key];
        btn.dataset.key = key; // store actual key (A/B/C/D)
        btn.addEventListener("click", (e) => selectAnswer(e.target.dataset.key));
        answersDiv.appendChild(btn);
    });
}

// ===== USER SELECTED AN ANSWER =====
function selectAnswer(selectedKey) {
    const q = questions[currentIndex];

    // Count score
    if (selectedKey === q.answer) {
        score++;
    }

    // Highlight correct and incorrect
    Array.from(answersDiv.children).forEach(btn => {
        if (btn.dataset.key === q.answer) {
            btn.style.backgroundColor = "#4CAF50"; // green
        } else {
            btn.style.backgroundColor = "#f44336"; // red
        }
        btn.disabled = true;
    });

    nextBtn.style.display = "inline-block";
}

// ===== NEXT QUESTION =====
nextBtn.addEventListener("click", () => {
    currentIndex++;
    showQuestion();
});

// ===== FINISH QUIZ =====
async function finishQuiz() {
    localStorage.setItem("lastScore", score);
    localStorage.setItem("totalQuestions", questions.length);

    questionText.textContent = "Quiz Completed!";
    answersDiv.innerHTML = `<p>Your score: ${score}/${questions.length}</p>`;
    nextBtn.style.display = "none";

    // Save score to backend (note endpoint: /api/save-score)
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No token found when saving score.");
        }

        console.log("About to send score:", score);

        const res = await fetch("/api/save-score", {           // <-- endpoint corrected
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ score, totalQuestions: questions.length })
        });

        // log network response for debugging
        const responseData = await res.json();
        console.log("Save-score response:", res.status, responseData);

        if (!responseData.success) {
            console.warn("Server responded with unsuccessful save:", responseData);
        }
    } catch (err) {
        console.error("Could not save score", err);
    }

    const resultsBtn = document.createElement("a");
    resultsBtn.href = "result.html";
    resultsBtn.textContent = "See Results";
    resultsBtn.className = "btn";
    answersDiv.appendChild(resultsBtn);
}

// ===== SHUFFLE ARRAY =====
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ===== START QUIZ =====
loadQuestions();
