const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
        // Save JWT token
        localStorage.setItem("token", data.token);

        alert("Login successful!");
        window.location.href = "index.html";
    } else {
        alert(data.message || "Login failed.");
    }
});
