const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const fs = require("fs");
const session = require("express-session"); 
const User = require('./models/User');
const FriendRequest = require('./models/FriendRequest');
const Message = require('./models/Message');
const Course = require('./models/Course');
const security = require('./utils/security');
// Ensure database schema and seed data exist (idempotent)
require('./database');

const app = express();
const PORT = 8039;


// Apply logger middleware
function logger(req, res, next) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.url} ${req.ip}\n`;
    
    fs.appendFile('server.log', logMessage, (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
    
    console.log(logMessage);
    next();
}

app.use(logger);

//gebruik maken van een sessie
app.use(session({
    secret: 'student-network-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true
    }
}));



app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((req, res, next) => {
    if (req.body) {
        req.body = security.sanitizeObject(req.body);
    }
    next();
});

// Gebruik maken van res.JSON methode
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        return originalJson.call(this, security.sanitizeObject(data));
    };
    next();
});

//Middleware gebruikt voor authentication
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ success: false, message: "Authentication required" });
}

// Configuratie voor het opslaan van geüploade foto's
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/images'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, uniqueSuffix + '.' + extension);
  }
});

const upload = multer({ storage: storage });

// Database verbinding
const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

app.get("/profile", requireAuth, async (req, res) => {

    const userId = req.query.userId || req.session.userId;

    try {
        const user = await User.findById(db, userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ success: false, message: "Error fetching profile" });
    }
});

app.get("/friends", requireAuth, (req, res) => {
    const userId = req.query.userId || req.session.userId;

    // Query om alleen unieke vrienden op te halen
    db.all(`
        SELECT DISTINCT u.id, u.first_name || ' ' || u.last_name AS name, u.photo
        FROM users u
        JOIN friend_requests fr ON (u.id = fr.receiver_id OR u.id = fr.sender_id)
        WHERE fr.status = 'accepted'
        AND (
            (fr.sender_id = ? AND fr.receiver_id = u.id) OR 
            (fr.receiver_id = ? AND fr.sender_id = u.id)
        )
    `, [userId, userId], (err, rows) => {
        if (err) {
            console.error("Error fetching friends:", err.message);
            return res.status(500).json({ success: false, message: "Error fetching friends" });
        }
        res.json(rows);
    });
});

app.get("/friend-requests", requireAuth, (req, res) => {
    const userId = req.query.userId || req.session.userId;

    db.all(`
        SELECT fr.id AS requestId, u.id, u.first_name || ' ' || u.last_name AS name, u.photo
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
    `, [userId], (err, rows) => {
        if (err) {
            console.error("Error fetching friend requests:", err.message);
            return res.status(500).json({ success: false, message: "Error fetching friend requests" });
        }
        res.json(rows);
    });
});

app.get("/messages", (req, res) => {
    const { userId, receiverId } = req.query;
    if (!userId || !receiverId) return res.status(400).json({ success: false, message: "User ID and Receiver ID are required" });

    db.all(`
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC
    `, [userId, receiverId, receiverId, userId], (err, rows) => {
        if (err) return res.status(500).send("Error fetching messages");
        res.json(rows);
    });
});

app.post("/messages", (req, res) => {
    const { userId, receiverId, content } = req.body;
    if (!userId || !receiverId || !content) return res.status(400).json({ success: false, message: "All fields are required" });

    db.run("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)", 
        [userId, receiverId, content], function(err) {
        if (err) return res.status(500).send("Error sending message");
        res.json({ success: true, id: this.lastID });
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error("Error during login:", err.message);
            return res.status(500).json({ success: false, message: "Internal server error" });
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // Datasessie setten
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.userName = `${user.first_name} ${user.last_name}`;

        res.json({ success: true, userId: user.id });
    });
});

app.post("/register", upload.single("photo"), (req, res) => {
    const { firstName, lastName, age, email, password, programId, hobbies } = req.body;
    const photo = req.file ? `/images/${req.file.filename}` : null;

    db.run(
        "INSERT INTO users (first_name, last_name, age, email, password, photo, program_id, hobbies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [firstName, lastName, age, email, password, photo, programId, hobbies],
        function (err) {
            if (err) {
                console.error("Error during registration:", err.message);
                return res.status(500).json({ success: false, message: "Failed to register user" });
            }

            // Sessie creatie na het succesvole aanmaking
            req.session.userId = this.lastID;
            req.session.userEmail = email;
            req.session.userName = `${firstName} ${lastName}`;

            res.json({ success: true, userId: this.lastID });
        }
    );
});

app.post("/logout", (req, res) => {
    // Sessie afbreken na uitloggen
    req.session.destroy((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).json({ success: false, message: "Failed to logout" });
        }
        res.json({ success: true });
    });
});


app.post("/profile/update", upload.single("photo"), (req, res) => {
    const userId = req.query.userId;
    const { firstName, lastName, age, email, programId, hobbies } = req.body;
    
    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Is er een nieuwe foto check
    let photoUpdate = "";
    let photoParams = [];
    
    if (req.file) {
        photoUpdate = ", photo = ?";
        photoParams.push(`/images/${req.file.filename}`);
    }

    const query = `
        UPDATE users 
        SET first_name = ?, last_name = ?, age = ?, email = ?, program_id = ?, hobbies = ?${photoUpdate}
        WHERE id = ?
    `;
    
    const params = [
        firstName, 
        lastName, 
        age, 
        email, 
        programId, 
        hobbies, 
        ...photoParams, 
        userId
    ];

    db.run(query, params, function(err) {
        if (err) {
            console.error("Error updating profile:", err.message);
            return res.status(500).json({ success: false, message: "Failed to update profile" });
        }
        
        res.json({ success: true });
    });
});

app.get("/courses", async (req, res) => {
    try {
        const courses = await Course.getAll(db);
        res.json(courses);
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ success: false, message: "Error fetching courses" });
    }
});

app.get("/user/courses", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    try {
        const courses = await Course.getUserCourses(db, userId);
        res.json(courses);
    } catch (error) {
        console.error("Error fetching user courses:", error);
        res.status(500).json({ success: false, message: "Error fetching user courses" });
    }
});

app.post("/user/course", async (req, res) => {
    const { userId, courseId } = req.body;
    if (!userId || !courseId) {
        return res.status(400).json({ success: false, message: "User ID and Course ID are required" });
    }

    try {
        await Course.addUserCourse(db, userId, courseId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error adding user course:", error);
        res.status(500).json({ success: false, message: "Error adding user course" });
    }
});

app.delete("/user/course", async (req, res) => {
    const { userId, courseId } = req.query;
    if (!userId || !courseId) {
        return res.status(400).json({ success: false, message: "User ID and Course ID are required" });
    }

    try {
        await Course.removeUserCourse(db, userId, courseId);
        res.json({ success: true });
    } catch (error) {
        console.error("Error removing user course:", error);
        res.status(500).json({ success: false, message: "Error removing user course" });
    }
});

app.get("/classmates", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    try {
        const classmates = await Course.getClassmates(db, userId);
        res.json(classmates);
    } catch (error) {
        console.error("Error fetching classmates:", error);
        res.status(500).json({ success: false, message: "Error fetching classmates" });
    }
});


app.post("/friend-request", async (req, res) => {
    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
        return res.status(400).json({ success: false, message: "Sender ID and Receiver ID are required" });
    }

    try {
        const result = await FriendRequest.create(db, senderId, receiverId);
        res.json(result);
    } catch (error) {
        console.error("Error creating friend request:", error);
        res.status(500).json({ success: false, message: "Error creating friend request" });
    }
});

app.put("/friend-request/:requestId", async (req, res) => {
    const requestId = req.params.requestId;
    const { status } = req.body; // status kan 'accepted' of 'rejected'
    
    if (!requestId || !status) {
        return res.status(400).json({ success: false, message: "Request ID and status are required" });
    }
    
    if (status !== 'accepted' && status !== 'rejected') {
        return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'rejected'" });
    }

    try {
        // Haal het verzoek op om de betrokken gebruikers te kennen
        db.get("SELECT sender_id, receiver_id FROM friend_requests WHERE id = ?", [requestId], async (err, row) => {
            if (err) {
                console.error("Error fetching friend request:", err);
                return res.status(500).json({ success: false, message: "Error updating friend request" });
            }
            if (!row) {
                return res.status(404).json({ success: false, message: "Friend request not found" });
            }

            try {
                const result = await FriendRequest.update(db, requestId, status);
                if (status === 'accepted') {
                    // Verwijder eventueel omgekeerde pending verzoeken tussen dezelfde twee gebruikers
                    db.run(
                        `DELETE FROM friend_requests
                         WHERE status = 'pending'
                           AND id <> ?
                           AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`,
                        [requestId, row.sender_id, row.receiver_id, row.receiver_id, row.sender_id],
                        function (delErr) {
                            if (delErr) {
                                console.error("Error cleaning up reciprocal pending requests:", delErr);
                            }
                            return res.json(result);
                        }
                    );
                } else {
                    return res.json(result);
                }
            } catch (error) {
                console.error("Error updating friend request:", error);
                return res.status(500).json({ success: false, message: "Error updating friend request" });
            }
        });
    } catch (error) {
        console.error("Error updating friend request:", error);
        res.status(500).json({ success: false, message: "Error updating friend request" });
    }
});

app.delete("/unfriend", async (req, res) => {
    const { userId, friendId } = req.query;
    if (!userId || !friendId) {
        return res.status(400).json({ success: false, message: "User ID and Friend ID are required" });
    }

    try {
        const result = await FriendRequest.remove(db, userId, friendId);
        res.json(result);
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ success: false, message: "Error removing friend" });
    }
});

app.get("/conversations", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    try {
        const conversations = await Message.getConversations(db, userId);
        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ success: false, message: "Error fetching conversations" });
    }
});

app.get("/outgoing-requests", async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    db.all(`
        SELECT * FROM friend_requests 
        WHERE sender_id = ? AND status = 'pending'
    `, [userId], (err, rows) => {
        if (err) {
            console.error("Error fetching outgoing requests:", err.message);
            return res.status(500).json({ success: false, message: "Error fetching outgoing requests" });
        }
        res.json(rows);
    });
});

// Eindpunt om alle programmas te hebben
app.get("/programs", (req, res) => {
    db.all("SELECT id, name FROM programs ORDER BY name", (err, rows) => {
        if (err) {
            console.error("Error fetching programs:", err.message);
            return res.status(500).json({ success: false, message: "Error fetching programs" });
        }
        res.json(rows);
    });
});

app.get("/register.html", (req, res) => {
    db.all("SELECT id, name FROM programs ORDER BY name", (err, rows) => {
        if (err) {
            console.error("Error fetching programs:", err.message);
            return res.status(500).send("Error loading page");
        }

        const optionsHtml = rows
            .map(program => `<option value="${program.id}">${program.name}</option>`)
            .join("");

        const filePath = path.join(__dirname, "public", "register.html");
        fs.readFile(filePath, "utf8", (err, html) => {
            if (err) {
                console.error("Error reading register.html:", err.message);
                return res.status(500).send("Error loading page");
            }

            const updatedHtml = html.replace(
                '<option value="">Select a program</option>',
                `<option value="">Select a program</option>${optionsHtml}`
            );

            res.send(updatedHtml);
        });
    });
});

app.get("/session-check", (req, res) => {
    // Alleen als iemand ingelogd is, is diegene active
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            userId: req.session.userId,
            userName: req.session.userName
        });
    } else {
        // Alle data weghalen als login niet succesvol was
        if (req.session) {
            req.session.destroy(() => {
                res.json({ loggedIn: false });
            });
        } else {
            res.json({ loggedIn: false });
        }
    }
});

// Start de server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:8039`);
});

