class User {
    constructor(id, firstName, lastName, age, email, photo, programId, hobbies) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.age = age;
        this.email = email;
        this.photo = photo;
        this.programId = programId;
        this.hobbies = hobbies;
    }

    // Zoekt een gebruiker op via de ID
    static async findById(db, userId) {
        return new Promise((resolve, reject) => {
            db.get(
                "SELECT users.*, programs.name AS program FROM users LEFT JOIN programs ON users.program_id = programs.id WHERE users.id = ?", 
                [userId], 
                (err, row) => {
                    if (err) return reject(err);
                    if (!row) return resolve(null);
                    resolve(row);
                }
            );
        });
    }

    // Maakt een nieuwe gebruiker aan
    static async create(db, userData) {
        const { firstName, lastName, age, email, password, photo, programId, hobbies } = userData;
        
        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO users (first_name, last_name, age, email, password, photo, program_id, hobbies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [firstName, lastName, age, email, password, photo, programId, hobbies],
                function(err) {
                    if (err) return reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    // Update een bestaande gebruiker
    static async update(db, userId, userData) {
        const { firstName, lastName, age, email, programId, hobbies, photo } = userData;
        
        let query = `
            UPDATE users 
            SET first_name = ?, last_name = ?, age = ?, email = ?, program_id = ?, hobbies = ?
        `;
        
        let params = [firstName, lastName, age, email, programId, hobbies];
        
        if (photo) {
            query += ", photo = ?";
            params.push(photo);
        }
        
        query += " WHERE id = ?";
        params.push(userId);
        
        return new Promise((resolve, reject) => {
            db.run(query, params, function(err) {
                if (err) return reject(err);
                resolve({ success: true, changes: this.changes });
            });
        });
    }
}

module.exports = User;