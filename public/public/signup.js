const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stops page from refreshing

    const username = document.getElementById("username").value;
    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Send info to backend
    const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (data.success) {
        alert("Account created successfully! Please log in.");
        window.location.href = "login.html"; // redirect
    } else {
        alert(data.message || "Signup failed.");
    }
});
