async function fetchData(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}
//Functie om profiel op te halen
async function loadProfile() {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const profile = await fetchData(`/profile?userId=${userId}`);
        document.getElementById("profileName").textContent = `${profile.first_name} ${profile.last_name}`;
        document.getElementById("profilePhoto").src = profile.photo || "/images/placeholder.jpg";
        document.getElementById("profileMajor").textContent = profile.program || "No program";
        
        await loadUserCourses();
    } catch (error) {
        console.error("Error loading profile:", error);
        alert("Failed to load profile. Please try again.");
    }
}

//Functie om de cursussen van de gebruiker op te halen
async function loadUserCourses() {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const response = await fetchData(`/user/courses?userId=${userId}`);
        const coursesList = document.getElementById("coursesList");
        
        console.log("Courses data received:", response);
        
        let coursesData = [];
        
        if (Array.isArray(response)) {
            coursesData = response;
        } else if (response && typeof response === 'object') {
            if (Object.keys(response).some(key => !isNaN(parseInt(key)))) {
                coursesData = Object.values(response);
            } else {
                coursesData = response.courses || response.data || [];
            }
        }
        
        if (coursesData.length === 0) {
            coursesList.innerHTML = "<li>No courses enrolled yet</li>";
            return;
        }
        
        let coursesHTML = "";
        for (let i = 0; i < coursesData.length; i++) {
            const course = coursesData[i];
            coursesHTML += `
                <li>
                    ${course.name || "Unknown Course"}
                    <button onclick="removeCourse(${course.id})" class="remove-course">Remove</button>
                </li>
            `;
        }
        
        coursesList.innerHTML = coursesHTML;
    } catch (error) {
        console.error("Error loading courses:", error);
        alert("Failed to load courses. Please try again.");
    }
}

//Functie om beschikbare cursussen op te halen
async function loadAvailableCourses() {
    try {
        const response = await fetchData('/courses');
        let coursesData = [];
        
        if (Array.isArray(response)) {
            coursesData = response;
        } else if (response && typeof response === 'object') {
            if (Object.keys(response).some(key => !isNaN(parseInt(key)))) {
                coursesData = Object.values(response);
            } else {
                coursesData = response.courses || response.data || [];
            }
        }
        
        return coursesData;
    } catch (error) {
        console.error("Error loading available courses:", error);
        return [];
    }
}


//Functie om een cursus toe te voegen
async function addCourse(courseId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const result = await fetchData('/user/course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, courseId })
        });
        
        if (result.success) {
            loadUserCourses();
        }
    } catch (error) {
        console.error("Error adding course:", error);
        alert("Failed to add course. Please try again.");
    }
}

//Functie om een cursus te verwijderen
async function removeCourse(courseId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    if (!confirm("Are you sure you want to remove this course? You'll still be friends with students from this course.")) {
        return;
    }

    try {
        const result = await fetchData(`/user/course?userId=${userId}&courseId=${courseId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            loadUserCourses();
        }
    } catch (error) {
        console.error("Error removing course:", error);
        alert("Failed to remove course. Please try again.");
    }
}

//Functie om een cursus toe te voegen via een modal
async function showAddCourseModal() {
    try {
        const coursesData = await loadAvailableCourses();
        console.log("Available courses:", coursesData);
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'addCourseModal';
        
        let optionsHTML = '';
        for (let i = 0; i < coursesData.length; i++) {
            const course = coursesData[i];
            optionsHTML += `<option value="${course.id}">${course.name}</option>`;
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Add Course</h3>
                <select id="courseSelect">
                    ${coursesData.length > 0 ? optionsHTML : '<option>No courses available</option>'}
                </select>
                <button id="confirmAddCourse">Add</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = "block";
        
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        
        const addBtn = modal.querySelector('#confirmAddCourse');
        addBtn.onclick = async () => {
            const courseId = modal.querySelector('#courseSelect').value;
            await addCourse(courseId);
            document.body.removeChild(modal);
        };
        
        window.onclick = (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        };
    } catch (error) {
        console.error("Error showing add course modal:", error);
        alert("Failed to load available courses. Please try again.");
    }
}

function redirectToLogin() {
    alert("You need to log in again.");
    window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    
    const coursesSection = document.getElementById("coursesSection");
    const addButton = document.createElement("button");
    addButton.textContent = "Add Course";
    addButton.className = "add-course-button";
    addButton.onclick = showAddCourseModal;
    coursesSection.insertBefore(addButton, document.getElementById("coursesList"));
});

document.addEventListener("DOMContentLoaded", function() {
    const profileInfo = document.getElementById("profileInfo");
    const editButton = document.createElement("button");
    editButton.textContent = "Edit Profile";
    editButton.id = "editProfileButton";
    editButton.className = "edit-button";
    editButton.onclick = showEditForm;
    profileInfo.appendChild(editButton);
});

function showEditForm() {
    const userId = localStorage.getItem("userId");
    const profileSection = document.getElementById("profileInfo");
    
    Array.from(profileSection.children).forEach(child => {
        child.style.display = "none";
    });
    
    const editForm = document.createElement("form");
    editForm.id = "profileEditForm";
    
    editForm.innerHTML = `
        <h3>Edit Your Profile</h3>
        <label for="editFirstName">First Name:</label>
        <input type="text" id="editFirstName" required>
        
        <label for="editLastName">Last Name:</label>
        <input type="text" id="editLastName" required>
        
        <label for="editAge">Age:</label>
        <input type="number" id="editAge" min="16" required>
        
        <label for="editEmail">Email:</label>
        <input type="email" id="editEmail" required>
        
        <label for="editProgramId">Program:</label>
        <select id="editProgramId">
            <option value="1">Computer Science</option>
            <option value="2">Mathematics</option>
            <option value="3">Mechanical Engineering</option>
        </select>
        
        <label for="editHobbies">Hobbies:</label>
        <input type="text" id="editHobbies">
        
        <label for="editPhoto">New Profile Photo:</label>
        <input type="file" id="editPhoto" accept="image/*">
        
        <div class="button-group">
            <button type="submit">Save Changes</button>
            <button type="button" id="cancelEdit">Cancel</button>
        </div>
    `;
    
    profileSection.appendChild(editForm);
    //Fetch functie om de huidige profielgegevens op te halen
    fetch(`/profile?userId=${userId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("editFirstName").value = data.first_name;
            document.getElementById("editLastName").value = data.last_name;
            document.getElementById("editAge").value = data.age;
            document.getElementById("editEmail").value = data.email;
            document.getElementById("editProgramId").value = data.program_id || 1;
            document.getElementById("editHobbies").value = data.hobbies || "";
        });
    
    document.getElementById("cancelEdit").addEventListener("click", () => {
        profileSection.removeChild(editForm);
        Array.from(profileSection.children).forEach(child => {
            child.style.display = "";
        });
    });
    
    editForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        
        const formData = new FormData();
        formData.append("firstName", document.getElementById("editFirstName").value);
        formData.append("lastName", document.getElementById("editLastName").value);
        formData.append("age", document.getElementById("editAge").value);
        formData.append("email", document.getElementById("editEmail").value);
        formData.append("programId", document.getElementById("editProgramId").value);
        formData.append("hobbies", document.getElementById("editHobbies").value);
        
        const photoInput = document.getElementById("editPhoto");
        if (photoInput.files.length > 0) {
            formData.append("photo", photoInput.files[0]);
        }
        
        try {
            const response = await fetch(`/profile/update?userId=${userId}`, {
                method: "POST",
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert("Profile updated successfully!");
                location.reload(); 
            } else {
                alert("Failed to update profile: " + result.message);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("An error occurred while updating your profile.");
        }
    });
}
