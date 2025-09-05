async function fetchData(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

async function loadFriends() {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const friends = await fetchData(`/friends?userId=${userId}`);
        renderList("confirmedFriends", friends, friend => `
            <li>
                <img src="${friend.photo || '/images/default-profile.png'}" alt="${friend.name}" class="user-photo">
                <span>${friend.name}</span>
                <div class="friend-actions">
                    <button onclick="viewProfile(${friend.id}, true)" class="view-profile-btn">View Profile</button>
                    <button onclick="messageFriend(${friend.id})" class="message-button">Message</button>
                    <button onclick="unfriend(${friend.id})" class="unfriend-button">Unfriend</button>
                </div>
            </li>
        `);
    } catch (error) {
        console.error("Error loading friends:", error);
        alert("Failed to load friends. Please try again.");
    }
}

// Haalt de verzoeken op
async function loadPendingRequests() {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const requests = await fetchData(`/friend-requests?userId=${userId}`);
        renderList("requestsList", requests, request => `
            <li>
                <img src="${request.photo || '/images/default-profile.png'}" alt="${request.name}" class="user-photo">
                <span>${request.name}</span>
                <div class="request-actions">
                    <button onclick="respondToRequest(${request.requestId}, 'accepted')" class="accept-button">Accept</button>
                    <button onclick="respondToRequest(${request.requestId}, 'rejected')" class="reject-button">Reject</button>
                </div>
            </li>
        `);
    } catch (error) {
        console.error("Error loading friend requests:", error);
        alert("Failed to load friend requests. Please try again.");
    }
}

// Functie om asynchronisch de klasgenoten in te laden 
async function loadClassmates() {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();
    console.log("Loading classmates for user ID:", userId);

    try {
        const [friends, outgoingRequests] = await Promise.all([
            fetchData(`/friends?userId=${userId}`),
            fetchData(`/outgoing-requests?userId=${userId}`)
        ]);
        
        const friendIds = new Set();
        const pendingRequestIds = new Set();
        
        if (Array.isArray(friends)) {
            friends.forEach(friend => friendIds.add(friend.id));
        } else if (friends && typeof friends === 'object') {
            Object.values(friends).forEach(friend => friendIds.add(friend.id));
        }
        
        if (Array.isArray(outgoingRequests)) {
            outgoingRequests.forEach(request => pendingRequestIds.add(request.receiver_id));
        } else if (outgoingRequests && typeof outgoingRequests === 'object') {
            Object.values(outgoingRequests).forEach(request => pendingRequestIds.add(request.receiver_id));
        }
        
        const classmates = await fetchData(`/classmates?userId=${userId}`);
        console.log("Classmates data received:", classmates);
        
        renderList("courseMates", classmates, classmate => `
            <li>
                <img src="${classmate.photo || '/images/default-profile.png'}" alt="${classmate.name}" class="user-photo">
                <span class="classmate-name">${classmate.name}</span>
                <span class="classmate-program">${classmate.program || 'No program'}</span>
                ${friendIds.has(classmate.id) ?
                    `<div class="classmate-actions">
                        <button onclick="viewProfile(${classmate.id}, true)" class="view-profile-btn">View Profile</button>
                        <button onclick="messageFriend(${classmate.id})" class="message-button">Message</button>
                    </div>` :
                    pendingRequestIds.has(classmate.id) ?
                        `<span class="request-pending">Request Pending</span>` :
                        `<button onclick="sendFriendRequest(${classmate.id})" class="add-friend-button">Add Friend</button>
                         <button onclick="viewProfile(${classmate.id}, false)" class="view-limited-profile-btn">View Limited Profile</button>`
                }
            </li>
        `);
    } catch (error) {
        console.error("Error loading classmates:", error);
        alert("Failed to load classmates. Please try again.");
    }
}

//Stuurt een vriendverzoek aan
async function sendFriendRequest(receiverId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const result = await fetchData(`/friend-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: userId, receiverId })
        });

        if (result.success) {
            alert("Friend request sent successfully!");
            await loadClassmates();
        }
    } catch (error) {
        console.error("Error sending friend request:", error);
        alert("Failed to send friend request. Please try again.");
    }
}

//Verwerkt de verzoeken
async function respondToRequest(requestId, status) {
    try {
        const result = await fetchData(`/friend-request/${requestId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (result.success) {
            alert(`Friend request ${status}!`);
            loadPendingRequests();
            if (status === 'accepted') {
                loadFriends();
            }
        }
    } catch (error) {
        console.error(`Error ${status} friend request:`, error);
        alert(`Failed to ${status} friend request. Please try again.`);
    }
}

//Verwijderd een vriend
async function unfriend(friendId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    if (!confirm("Are you sure you want to unfriend this person?")) {
        return;
    }

    try {
        const result = await fetchData(`/unfriend?userId=${userId}&friendId=${friendId}`, {
            method: "DELETE"
        });

        if (result.success) {
            alert("Friend removed successfully!");
            await loadFriends();
            await loadClassmates();
        }
    } catch (error) {
        console.error("Error unfriending:", error);
        alert("Failed to unfriend. Please try again.");
    }
}

async function viewProfile(friendId, isFriend) {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    try {
        const profile = await fetchData(`/profile?userId=${friendId}`);
        
        const modal = document.getElementById("friendProfileModal");
        const content = document.getElementById("friendProfileContent");
        
        if (isFriend) {
            content.innerHTML = `
                <div class="friend-profile-header">
                    <img src="${profile.photo || '/images/default-profile.png'}" class="friend-profile-photo" alt="${profile.first_name} ${profile.last_name}">
                    <div class="friend-profile-info">
                        <h2 class="friend-profile-name">${profile.first_name} ${profile.last_name}</h2>
                        <p class="friend-profile-program">Program: ${profile.program || 'Not specified'}</p>
                        <p class="friend-profile-email">Email: ${profile.email}</p>
                        <p class="friend-profile-hobbies">Hobbies: ${profile.hobbies || 'Not specified'}</p>
                    </div>
                </div>
                <div class="friend-profile-buttons">
                    <button onclick="messageFriend(${profile.id})" class="profile-button">Message</button>
                    <button onclick="unfriend(${profile.id})" class="profile-button">Unfriend</button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="friend-profile-header limited-profile">
                    <img src="${profile.photo || '/images/default-profile.png'}" class="friend-profile-photo" alt="${profile.first_name} ${profile.last_name}">
                    <div class="friend-profile-info">
                        <h2 class="friend-profile-name">${profile.first_name} ${profile.last_name}</h2>
                        <p class="profile-limited-notice">To see more details, send a friend request.</p>
                    </div>
                </div>
                <div class="friend-profile-buttons">
                    <button onclick="sendFriendRequest(${profile.id})" class="profile-button">Add Friend</button>
                </div>
            `;
        }
        
        modal.style.display = "block";
        
        const closeBtn = document.getElementsByClassName("close-modal")[0];
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
        
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    } catch (error) {
        console.error("Error viewing profile:", error);
        alert("Failed to load profile. Please try again.");
    }
}

function renderList(elementId, items, templateFn) {
    const container = document.getElementById(elementId);
    
    let itemsArray = items;
    if (items && typeof items === 'object' && !Array.isArray(items)) {
        if (Object.keys(items).some(key => !isNaN(parseInt(key)))) {
            itemsArray = Object.values(items);
        }
    }
    
    if (Array.isArray(itemsArray) && itemsArray.length > 0) {
        let html = "";
        for (let i = 0; i < itemsArray.length; i++) {
            html += templateFn(itemsArray[i]);
        }
        container.innerHTML = html;
    } else {
        container.innerHTML = "<li>No items found</li>";
    }
}

function redirectToLogin() {
    alert("You need to log in again.");
    window.location.href = "/login.html";
}

function messageFriend(friendId) {
    window.location.href = `/messages.html?contact=${friendId}`;
}

document.addEventListener("DOMContentLoaded", () => {
    loadFriends();
    loadPendingRequests();
    loadClassmates();
});
