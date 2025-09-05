class FriendRequest {
    constructor(id, senderId, receiverId, status) {
        this.id = id;
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.status = status;
    }

    // Haalt alle geaccepteerde vrienden op voor de opgegeven gebruikers-ID
    static async getFriends(db, userId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT DISTINCT u.id, u.first_name || ' ' || u.last_name AS name, u.photo, u.program_id, u.hobbies
                FROM users u
                JOIN friend_requests fr ON (u.id = fr.receiver_id OR u.id = fr.sender_id)
                WHERE fr.status = 'accepted'
                AND (
                    (fr.sender_id = ? AND fr.receiver_id = u.id) OR 
                    (fr.receiver_id = ? AND fr.sender_id = u.id)
                )
            `, [userId, userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    // Haalt alle openstaande vriendverzoeken op voor de opgegeven gebruikers-ID
    static async getPending(db, userId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT fr.id AS requestId, u.id, u.first_name || ' ' || u.last_name AS name, u.photo
                FROM friend_requests fr
                JOIN users u ON fr.sender_id = u.id
                WHERE fr.receiver_id = ? AND fr.status = 'pending'
            `, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    // Creëert een nieuw vriendverzoek
    static async create(db, senderId, receiverId) {
        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, 'pending')",
                [senderId, receiverId],
                function(err) {
                    if (err) return reject(err);
                    resolve({ success: true, id: this.lastID });
                }
            );
        });
    }

    // Update de status van een bestaand vriendverzoek
    static async update(db, requestId, status) {
        return new Promise((resolve, reject) => {
            db.run(
                "UPDATE friend_requests SET status = ? WHERE id = ?",
                [status, requestId],
                function(err) {
                    if (err) return reject(err);
                    resolve({ success: true, changes: this.changes });
                }
            );
        });
    }

    // Verwijdert een vriendverzoek tussen twee gebruikers
    static async remove(db, user1Id, user2Id) {
        return new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM friend_requests 
                 WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`,
                [user1Id, user2Id, user2Id, user1Id],
                function(err) {
                    if (err) return reject(err);
                    resolve({ success: true, changes: this.changes });
                }
            );
        });
    }
}

module.exports = FriendRequest;