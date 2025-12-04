async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch("/api/profile", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();

        if (!data.success) {
            alert("Could not load profile");
            return;
        }

        // Display username and email
        document.getElementById("username").textContent = data.user.username;
        document.getElementById("email").textContent = data.user.email;

        // Populate history table
        const tbody = document.querySelector("#historyTable tbody");
        tbody.innerHTML = "";

        if (data.scores.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td colspan="4">No quizzes played yet.</td>`;
            tbody.appendChild(tr);
            return;
        }

        data.scores.forEach((scoreEntry, index) => {
            const tr = document.createElement("tr");
            const date = new Date(scoreEntry.date);
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${scoreEntry.score}</td>
                <td>${scoreEntry.totalQuestions || 10}</td>
                <td>${date.toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Error loading profile:", err);
    }
}

// Load profile on page load
loadProfile();
