// Login form handler
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (result.success) {
                localStorage.setItem("userId", result.userId);
                window.location.href = "/profile.html";
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("An error occurred during login. Please try again.");
        }
    });
}

// Registratie form handler
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("Registration form submitted");

        // Gebruik FormData om bestanden mee te kunnen sturen
        const formData = new FormData();
        formData.append("firstName", document.getElementById("firstName").value);
        formData.append("lastName", document.getElementById("lastName").value);
        formData.append("age", document.getElementById("age").value);
        formData.append("email", document.getElementById("email").value);
        formData.append("password", document.getElementById("password").value);
        formData.append("programId", document.getElementById("programSelect").value);
        formData.append("hobbies", document.getElementById("hobbies").value);
        
        // Voeg bestand toe als er een is geselecteerd
        const photoInput = document.getElementById("photo");
        if (photoInput.files.length > 0) {
            formData.append("photo", photoInput.files[0]);
        }

        try {
            const response = await fetch("/register", {
                method: "POST",
                body: formData 
            });
            const result = await response.json();

            if (result.success) {
                localStorage.setItem("userId", result.userId);
                window.location.href = "/profile.html";
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Registration failed:", error);
        }
    });
}

// Logout link handler
const logoutLink = document.getElementById("logoutLink");
if (logoutLink) {
    logoutLink.addEventListener("click", async function (event) {
        event.preventDefault();

        try {
            const response = await fetch("/logout", { method: "POST" });
            const result = await response.json();

            if (result.success) {
                localStorage.removeItem("userId");
                window.location.href = "/login.html";
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Logout failed:", error);
        }
    });
}


document.addEventListener("DOMContentLoaded", async () => {
    try {
    
        if (window.location.pathname !== "/login.html" && 
            window.location.pathname !== "/register.html" &&
            window.location.pathname !== "/" &&
            window.location.pathname !== "/index.html") {
            
            const response = await fetch("/session-check");
            const sessionData = await response.json();
            
            if (!sessionData.loggedIn) {
                localStorage.removeItem("userId");
                window.location.href = "/login.html";
            } else {
                // Update localStorage met de huidige sessie
                localStorage.setItem("userId", sessionData.userId);
            }
        }
    } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem("userId");
        if (window.location.pathname !== "/login.html" && 
            window.location.pathname !== "/register.html" &&
            window.location.pathname !== "/" &&
            window.location.pathname !== "/index.html") {
            window.location.href = "/login.html";
        }
    }
// Functie om programma's in te laden 
    const programSelect = document.getElementById("programSelect");
    if (programSelect) {
        try {
            const response = await fetch("/programs");
            if (!response.ok) throw new Error("Failed to fetch programs");

            const programs = await response.json();
            const programArray = Array.isArray(programs) ? programs : Object.values(programs);

            programArray.forEach(program => {
                const option = document.createElement("option");
                option.value = program.id;
                option.textContent = program.name;
                programSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading programs:", error);
        }
    }
});
