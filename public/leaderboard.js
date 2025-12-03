// ===== LOAD LEADERBOARD =====
async function loadLeaderboard() {
    const list = document.getElementById("leaderboardList");
    const yourRankText = document.getElementById("yourRank");

    try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();

        if (!data.success) {
            list.innerHTML = "<li>Error loading leaderboard.</li>";
            return;
        }

        const leaderboard = data.leaderboard;

        // Clear and repopulate
        list.innerHTML = "";
        leaderboard.forEach((player, index) => {
            const li = document.createElement("li");
            li.textContent = `${player.username} — ${player.maxScore} pts`;
            list.appendChild(li);
        });

        // ===== SHOW USER'S OWN RANK IF LOGGED IN =====
        const token = localStorage.getItem("token");
        if (!token) {
            yourRankText.textContent = "Log in to see your rank.";
            return;
        }

        // Fetch user profile to get username
        const profileRes = await fetch("/api/profile", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const profileData = await profileRes.json();
        if (!profileData.success) {
            yourRankText.textContent = "";
            return;
        }

        const yourName = profileData.user.username;

        // Find user's rank in leaderboard
        const rankIndex = leaderboard.findIndex(p => p.username === yourName);

        if (rankIndex !== -1) {
            yourRankText.textContent = `⭐ Your Rank: #${rankIndex + 1}`;
        } else {
            yourRankText.textContent = `⭐ You are not in the top 10 yet. Keep playing!`;
        }

    } catch (err) {
        console.error(err);
        list.innerHTML = "<li>Server error.</li>";
    }
}

// Run on page load
loadLeaderboard();

