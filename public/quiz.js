// ===== SELECT ELEMENTS =====
const quizContainer = document.getElementById("quizContainer");
const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const nextBtn = document.getElementById("nextBtn");
const startQuizBtn = document.getElementById("startQuizBtn");
const numQuestionsInput = document.getElementById("numQuestions");
const difficultySelect = document.getElementById("difficulty");

// ===== VARIABLES =====
let questions = [];
let currentIndex = 0;
let score = 0;

// ===== START QUIZ =====
startQuizBtn.addEventListener("click", () => {
    const amount = parseInt(numQuestionsInput.value) || 10;
    const difficulty = difficultySelect.value || "medium";
    loadQuestions(amount, difficulty);
});

// ===== FETCH QUESTIONS FROM SERVER =====
async function loadQuestions(amount = 10, difficulty = "medium") {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Please login first");
            window.location.href = "login.html";
            return;
        }

        const response = await fetch(`/api/quiz?amount=${amount}&difficulty=${difficulty}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Could not load questions");
            return;
        }

        questions = data.questions;
        currentIndex = 0;
        score = 0;

        document.querySelector(".quiz-settings").style.display = "none";
        quizContainer.style.display = "block";

        showQuestion();
    } catch (err) {
        console.error(err);
        alert("Error loading questions");
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

    const keys = ["A", "B", "C", "D"];
    keys.forEach(key => {
        const btn = document.createElement("button");
        btn.textContent = q[key];
        btn.addEventListener("click", () => selectAnswer(key));
        answersDiv.appendChild(btn);
    });
}

// ===== HANDLE ANSWER SELECTION =====
function selectAnswer(selectedKey) {
    const q = questions[currentIndex];
    const keys = ["A", "B", "C", "D"];

    // Highlight buttons
    Array.from(answersDiv.children).forEach((btn, i) => {
        const key = keys[i];
        if (key === q.answer) {
            btn.style.backgroundColor = "#4CAF50"; // green = correct
        } else if (key === selectedKey) {
            btn.style.backgroundColor = "#f44336"; // red = wrong
        } else {
            btn.style.backgroundColor = "#ddd"; // neutral
        }
        btn.disabled = true;
    });

    // Update score if correct
    if (selectedKey === q.answer) score++;

    nextBtn.style.display = "inline-block";
}

// ===== NEXT QUESTION =====
nextBtn.addEventListener("click", () => {
    currentIndex++;
    showQuestion();
});

// ===== FINISH QUIZ =====
async function finishQuiz() {
    questionText.textContent = "Quiz Completed!";
    answersDiv.innerHTML = `<p>Your score: ${score}/${questions.length}</p>`;
    nextBtn.style.display = "none";

    // Save score to server
    try {
        const token = localStorage.getItem("token");
        await fetch("/api/save-score", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ score, totalQuestions: questions.length })
        });
    } catch (err) {
        console.error("Could not save score", err);
    }

    const resultsBtn = document.createElement("a");
    resultsBtn.href = "result.html";
    resultsBtn.textContent = "See Results";
    resultsBtn.className = "btn";
    answersDiv.appendChild(resultsBtn);
}
