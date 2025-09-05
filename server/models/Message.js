class Message {
    constructor(id, senderId, receiverId, content, timestamp) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.content = content;
        this.timestamp = timestamp || new Date().toISOString();
    }

    // Haalt de conversatie op tussen twee gebruikers
    static async getConversation(db, userId, contactId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT m.*, 
                      s.first_name || ' ' || s.last_name as sender_name,
                      r.first_name || ' ' || r.last_name as receiver_name
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                   OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.timestamp ASC
            `, [userId, contactId, contactId, userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    // Haalt alle unieke gesprekken op voor een gebruiker
    static async getConversations(db, userId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT DISTINCT
                    CASE 
                        WHEN m.sender_id = ? THEN m.receiver_id
                        ELSE m.sender_id 
                    END as contact_id,
                    CASE 
                        WHEN m.sender_id = ? THEN r.first_name || ' ' || r.last_name
                        ELSE s.first_name || ' ' || s.last_name
                    END as contact_name
                FROM messages m
                JOIN users s ON m.sender_id = s.id
                JOIN users r ON m.receiver_id = r.id
                WHERE m.sender_id = ? OR m.receiver_id = ?
                ORDER BY m.timestamp DESC
            `, [userId, userId, userId, userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    // Maakt een nieuw bericht aan tussen twee gebruikers
    static async create(db, senderId, receiverId, content) {
        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
                [senderId, receiverId, content],
                function(err) {
                    if (err) return reject(err);
                    resolve({ success: true, id: this.lastID });
                }
            );
        });
    }
}

module.exports = Message;