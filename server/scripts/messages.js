document.addEventListener("DOMContentLoaded", async function() {
    try {
        const userId = localStorage.getItem("userId");
        if (!userId) return redirectToLogin();
        
        const hasFriends = await checkFriends();
        
        if (!hasFriends) {
            showNoFriendsMessage();
        } else {
            await loadConversations();
            
            const urlParams = new URLSearchParams(window.location.search);
            const contactId = urlParams.get('contact');
            
            if (contactId) {
                await loadMessages(contactId);
            }
        }
    } catch (error) {
        console.error("Error loading initial data:", error);
    }
});

// Check whether the user has any friends
async function checkFriends() {
    const userId = localStorage.getItem("userId");
    try {
        const friends = await fetchData(`/friends?userId=${userId}`);
        return Array.isArray(friends) && friends.length > 0 || 
               (friends && typeof friends === 'object' && Object.keys(friends).length > 0);
    } catch (error) {
        console.error("Error checking friends:", error);
        return false;
    }
}

// Handle UI when there are no friends
function showNoFriendsMessage() {
    const conversationList = document.getElementById("conversationList");
    conversationList.innerHTML = '<li class="no-friends-message">You have no friends yet</li>';
    
    const messageHistory = document.getElementById("messageHistory");
    messageHistory.innerHTML = '';
    
    const currentChat = document.getElementById("currentChatName");
    currentChat.textContent = "No Conversations";
    
    const messageForm = document.getElementById("messageForm");
    messageForm.style.display = "none";
    
    const messageArea = document.getElementById("messageArea");
    const noFriendsDiv = document.createElement("div");
    noFriendsDiv.className = "no-friends-prompt";
    noFriendsDiv.innerHTML = `
        <p>You need to add friends before you can send messages.</p>
        <button id="findFriendsBtn" class="action-button">Find Friends</button>
    `;
    messageArea.appendChild(noFriendsDiv);
    
    document.getElementById("findFriendsBtn").addEventListener("click", () => {
        window.location.href = "/friends.html";
    });
}

// Fetch JSON helper
async function fetchData(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return response.json();
}

// Load messages for a conversation
async function loadMessages(contactId) {
    const userId = localStorage.getItem("userId");
    if (!userId) return redirectToLogin();

    document.querySelectorAll(".conversation-item").forEach(item => {
        item.classList.remove("selected");
        if (item.dataset.contactId === contactId) {
            item.classList.add("selected");
        }
    });

    // Get contact name from the current chat header
    const currentChatName = document.getElementById("currentChatName");
    const contactName = currentChatName.textContent.replace("Chat with ", "");

    const messages = await fetchData(`/messages?userId=${userId}&receiverId=${contactId}`);
    const messageHistory = document.getElementById("messageHistory");
    
    if (!messages || Object.keys(messages).length === 0) {
        messageHistory.innerHTML = "<div class='no-messages'>No messages yet. Start a conversation!</div>";
        return;
    }
    
    const messagesArray = Array.isArray(messages) 
        ? messages 
        : Object.values(messages);
    
    let messagesHTML = "";
    messagesArray.forEach(msg => {
        const isSentByMe = msg.sender_id == userId;
        messagesHTML += `
            <div class="message ${isSentByMe ? "sent" : "received"}">
                <span class="message-sender">${isSentByMe ? "You" : contactName}</span>
                <div class="message-content">${msg.content}</div>
            </div>
        `;
    });
    
    messageHistory.innerHTML = messagesHTML;
    messageHistory.scrollTop = messageHistory.scrollHeight;
}

async function sendMessage(event) {
    event.preventDefault();
    const userId = localStorage.getItem("userId");
    const contactId = document.getElementById("currentChatName").dataset.receiverId;
    const content = document.getElementById("messageInput").value.trim();

    if (!content || !userId || !contactId) return;

    try {
        const result = await fetchData(`/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, receiverId: contactId, content })
        });

        if (result.success) {
            document.getElementById("messageInput").value = "";
            await loadMessages(contactId);
            
            await loadConversations(false);
        }
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
    }
}

// Submit handler for sending messages
document.getElementById("messageForm").addEventListener("submit", sendMessage);

async function loadConversations(selectFirst = true) {
    try {
        const userId = localStorage.getItem("userId");
        const conversations = await fetchData(`/conversations?userId=${userId}`);
        const conversationList = document.getElementById("conversationList");
        conversationList.innerHTML = "";
        
        if (!conversations || Object.keys(conversations).length === 0) {
            const friends = await fetchData(`/friends?userId=${userId}`);
            const friendsArray = Array.isArray(friends) ? friends : Object.values(friends);
            
            if (!friendsArray || friendsArray.length === 0) {
                conversationList.innerHTML = "<li class='no-conversations'>No friends yet</li>";
                
                document.getElementById("messageHistory").innerHTML = 
                    "<div class='no-messages'>You need to add friends before you can send messages</div>";
                document.getElementById("messageForm").style.display = "none";
                return;
            }
            
            conversationList.innerHTML = "<li class='conversation-header'>Start a conversation with:</li>";
            
            friendsArray.forEach(friend => {
                const listItem = document.createElement("li");
                listItem.textContent = friend.name;
                listItem.dataset.contactId = friend.id;
                listItem.classList.add("conversation-item", "new-conversation");
                
                listItem.addEventListener("click", async () => {
                    selectConversation(listItem, friend.id, friend.name);
                });
                
                conversationList.appendChild(listItem);
            });
            
            document.getElementById("currentChatName").textContent = "Select a friend to start chatting";
            document.getElementById("messageHistory").innerHTML = 
                "<div class='no-messages'>Select a friend from the list to start a conversation</div>";
            document.getElementById("messageForm").style.display = "none";
            
            return;
        }
        
        const conversationsArray = Array.isArray(conversations) 
            ? conversations 
            : Object.values(conversations);
        
        conversationsArray.forEach(conversation => {
            const listItem = document.createElement("li");
            listItem.textContent = conversation.contact_name;
            listItem.dataset.contactId = conversation.contact_id;
            listItem.classList.add("conversation-item");
            
            listItem.addEventListener("click", () => {
                selectConversation(listItem, conversation.contact_id, conversation.contact_name);
            });
            
            conversationList.appendChild(listItem);
        });
        
        const newConvoOption = document.createElement("li");
        newConvoOption.textContent = "Start new conversation";
        newConvoOption.classList.add("new-conversation-option");
        newConvoOption.addEventListener("click", showFriendsList);
        conversationList.appendChild(newConvoOption);
        
        if (selectFirst && conversationsArray.length > 0) {
            conversationList.firstChild.click();
        }
    } catch (error) {
        console.error("Error loading conversations:", error);
    }
}
// Select a conversation in the UI
function selectConversation(element, contactId, contactName) {
    document.querySelectorAll(".conversation-item").forEach(item => {
        item.classList.remove("selected");
    });
    
    element.classList.add("selected");
    
    const currentChatName = document.getElementById("currentChatName");
    currentChatName.textContent = `Chat with ${contactName}`;
    currentChatName.dataset.receiverId = contactId;
    
    document.getElementById("messageForm").style.display = "flex";
    
    loadMessages(contactId);
}
// Show a modal list of friends to start a new conversation
async function showFriendsList() {
    try {
        const userId = localStorage.getItem("userId");
        const friends = await fetchData(`/friends?userId=${userId}`);
        const friendsArray = Array.isArray(friends) ? friends : Object.values(friends);
        
        const modal = document.createElement("div");
        modal.className = "modal";
        modal.id = "friendsListModal";
        
        let friendsListHTML = "";
        let newFriendsCount = 0;
        
        if (friendsArray.length === 0) {
            friendsListHTML = "<p>You have no friends yet.</p>";
        } else {
            friendsListHTML = "<ul class='friends-list'>";
            friendsArray.forEach(friend => {
                if (!document.querySelector(`.conversation-item[data-contact-id="${friend.id}"]`)) {
                    newFriendsCount++;
                    friendsListHTML += `
                        <li data-id="${friend.id}" data-name="${friend.name}">
                            <img src="${friend.photo || '/images/default-profile.png'}" alt="${friend.name}" class="friend-photo">
                            <span>${friend.name}</span>
                        </li>
                    `;
                }
            });
            friendsListHTML += "</ul>";
            
            if (newFriendsCount === 0) {
                friendsListHTML = "<p>You're already chatting with all your friends.</p>";
            }
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Start a new conversation</h3>
                ${friendsListHTML}
                ${(friendsArray.length === 0 || newFriendsCount === 0) ? 
                  '<button id="goToFriendsPage" class="action-button">Find Friends</button>' : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = "block";
        
        const friendItems = modal.querySelectorAll(".friends-list li");
        friendItems.forEach(item => {
            item.addEventListener("click", async () => {
                const contactId = item.dataset.id;
                const contactName = item.dataset.name;
                
                const conversationList = document.getElementById("conversationList");
                const newConversation = document.createElement("li");
                newConversation.textContent = contactName;
                newConversation.dataset.contactId = contactId;
                newConversation.classList.add("conversation-item");
                
                newConversation.addEventListener("click", () => {
                    selectConversation(newConversation, contactId, contactName);
                });
                
                conversationList.insertBefore(
                    newConversation, 
                    document.querySelector(".new-conversation-option")
                );
                
                selectConversation(newConversation, contactId, contactName);
                
                document.body.removeChild(modal);
            });
        });
        
        const findFriendsBtn = modal.querySelector("#goToFriendsPage");
        if (findFriendsBtn) {
            findFriendsBtn.addEventListener("click", () => {
                window.location.href = "/friends.html";
            });
        }
        
        const closeBtn = modal.querySelector(".close-modal");
        closeBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        
        window.onclick = (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        };
    } catch (error) {
        console.error("Error showing friends list:", error);
    }
}

function redirectToLogin() {
    alert("You need to log in again.");
    window.location.href = "/login.html";
}


setInterval(async () => {
    const currentChatName = document.getElementById("currentChatName");
    if (currentChatName.dataset.receiverId) {
        await loadMessages(currentChatName.dataset.receiverId);
    }
}, 5000);
