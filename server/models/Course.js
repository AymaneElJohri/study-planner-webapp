// Course model: identifies a course and encapsulates DB operations
class Course {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    static async getAll(db) {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM courses ORDER BY name", (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static async getUserCourses(db, userId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT c.* FROM courses c
                JOIN user_courses uc ON c.id = uc.course_id
                WHERE uc.user_id = ?
                ORDER BY c.name
            `, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    static async addUserCourse(db, userId, courseId) {
        return new Promise((resolve, reject) => {
            db.run(
                "INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)",
                [userId, courseId],
                function(err) {
                    if (err) return reject(err);
                    resolve({ success: true });
                }
            );
        });
    }

    static async removeUserCourse(db, userId, courseId) {
        return new Promise((resolve, reject) => {
            db.run(
                "DELETE FROM user_courses WHERE user_id = ? AND course_id = ?",
                [userId, courseId],
                function(err) {
                    if (err) return reject(err);
                    resolve({ success: true, changes: this.changes });
                }
            );
        });
    }

    static async getClassmates(db, userId) {
        return new Promise((resolve, reject) => {
            db.all(`
                SELECT DISTINCT u.id, u.first_name || ' ' || u.last_name AS name, u.photo, p.name AS program
                FROM users u
                JOIN user_courses uc1 ON u.id = uc1.user_id
                JOIN user_courses uc2 ON uc1.course_id = uc2.course_id
                LEFT JOIN programs p ON u.program_id = p.id
                WHERE uc2.user_id = ? AND u.id != ?
            `, [userId, userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = Course;