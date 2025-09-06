const fs = require("fs");
const file = __dirname + "/database.sqlite";
const exists = fs.existsSync(file);
if (!exists) fs.openSync(file, "w");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(file);

db.serialize(function () {
    console.log("Initializing database (idempotent)…");
    db.run("PRAGMA foreign_keys = ON");

    // Ensure tables exist (order chosen for FKs)
    db.run(`CREATE TABLE IF NOT EXISTS programs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            photo TEXT,
            program_id INTEGER,
            hobbies TEXT,
            FOREIGN KEY (program_id) REFERENCES programs (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_courses (
            user_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (course_id) REFERENCES courses (id),
            PRIMARY KEY (user_id, course_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS friend_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) NOT NULL DEFAULT 'pending',
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
    )`);

    // Seed Programs if empty
            // Seed in strict sequence; only seed dependents if parents were seeded in this run
            let seeded = { programs: false, courses: false, users: false }

            function ensurePrograms(next) {
                const names = ["Computer Science", "Mathematics", "Mechanical Engineering"]
                const stmt = db.prepare(
                    "INSERT INTO programs (name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM programs WHERE name = ?)"
                )
                let inserted = 0
                names.forEach(name => stmt.run(name, name, (e)=>{ if(!e) inserted++; }))
                stmt.finalize(() => {
                    if (inserted > 0) console.log("Ensured programs (added:", inserted, ")")
                    db.all("SELECT id, name FROM programs WHERE name IN (?, ?, ?)", names, (err, rows) => {
                        if (err) { console.error(err); return next({}); }
                        const map = {}
                        for (const r of rows) map[r.name] = r.id
                        seeded.programs = true
                        next({
                            cs: map["Computer Science"],
                            math: map["Mathematics"],
                            mech: map["Mechanical Engineering"],
                        })
                    })
                })
            }

        function seedCourses(next) {
            db.get("SELECT COUNT(*) AS c FROM courses", (err, row) => {
                if (err) { console.error(err); return next(); }
                if (row.c === 0) {
                    const stmt = db.prepare("INSERT INTO courses (name) VALUES (?)")
                    ;[
                        "Mathematics","Physics","Programming","Databases","Algorithms",
                        "Artificial Intelligence","Software Engineering","Data Science","Computer Networks","Web Development"
                    ].forEach(name => stmt.run(name))
                    stmt.finalize(() => { console.log("Seeded courses."); seeded.courses = true; next(); })
                } else next()
            })
        }

            function seedUsers(programIds, next) {
            db.get("SELECT COUNT(*) AS c FROM users", (err, row) => {
                if (err) { console.error(err); return next(); }
                if (row.c === 0) {
                    let stmt = db.prepare("INSERT INTO users (first_name, last_name, age, email, password, photo, program_id, hobbies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                    const run = (...args) => stmt.run(...args, (e)=>{ if(e) console.error("User seed error:", e.message) })
                        const cs = programIds.cs || null
                        const math = programIds.math || null
                        const mech = programIds.mech || null
                        run("Conor","McGregor",32,"conor.mcgregor@ufc.com","hashed_password","/images/conor.jpg",cs,"Reading")
                        run("Khabib","Nurmagomedov",31,"khabib.nurmagomedov@ufc.com","hashed_password","/images/Khabib.jpg",math,"Traveling")
                        run("Jon","Jones",34,"jon.jones@ufc.com","hashed_password","/images/jon.jpg",mech,"Cooking")
                        run("Israel","Adesanya",30,"israel.adesanya@ufc.com","hashed_password","/images/israel.jpg",cs,"Baking")
                        run("Francis","Ngannou",35,"francis.ngannou@ufc.com","hashed_password","/images/francis.jpg",math,"Photography")
                        run("Alexander","Volkanovski",33,"alexander.volkanovski@ufc.com","hashed_password","/images/alex.jpg",mech,"Drawing")
                        run("Islam","Makhachev",31,"islam.makhachev@ufc.com","hashed_password","/images/islam.jpg",cs,"Painting")
                        run("Leon","Edwards",30,"leon.edwards@ufc.com","hashed_password","/images/leon.jpg",math,"Playing music")
                        run("Sean","O'Malley",28,"sean.omalley@ufc.com","hashed_password","/images/sean.jpg",mech,"Singing")
                        run("Aljamain","Sterling",33,"aljamain.sterling@ufc.com","hashed_password","/images/aljamain.jpg",cs,"Dancing")
                        run("Charles","Oliveira",31,"charles.oliveira@ufc.com","hashed_password","/images/charles.jpg",math,"Gardening")
                        run("Max","Holloway",30,"max.holloway@ufc.com","hashed_password","/images/max.jpg",mech,"Knitting")
                        run("Dustin","Poirier",32,"dustin.poirier@ufc.com","hashed_password","/images/dustin.jpg",cs,"Crocheting")
                        run("Justin","Gaethje",34,"justin.gaethje@ufc.com","hashed_password","/images/justin.jpg",math,"Sewing")
                        run("Tony","Ferguson",38,"tony.ferguson@ufc.com","hashed_password","/images/tony.jpg",mech,"Embroidery")
                        run("Robert","Whittaker",32,"robert.whittaker@ufc.com","hashed_password","/images/robert.jpg",cs,"Jewelry making")
                        run("Stipe","Miocic",41,"stipe.miocic@ufc.com","hashed_password","/images/stipe.jpg",math,"Origami")
                        run("Ciryl","Gane",33,"ciryl.gane@ufc.com","hashed_password","/images/ciryl.jpg",mech,"Model building")
                        run("Petr","Yan",29,"petr.yan@ufc.com","hashed_password","/images/petr.jpg",cs,"Puzzling")
                        run("Brandon","Moreno",28,"brandon.moreno@ufc.com","hashed_password","/images/brandon.jpg",math,"Chess")
                        run("Alex","Pereira",36,"alex.pereira@ufc.com","hashed_password","/images/alexp.jpg",mech,"Card games")
                        run("Jiri","Prochazka",30,"jiri.prochazka@ufc.com","hashed_password","/images/jiri.jpg",cs,"Video gaming")
                        run("Jan","Blachowicz",39,"jan.blachowicz@ufc.com","hashed_password","/images/jan.jpg",math,"Blogging")
                        run("Demetrious","Johnson",36,"demetrious.johnson@ufc.com","hashed_password","/images/dj.jpg",mech,"Vlogging")
                        run("Henry","Cejudo",35,"henry.cejudo@ufc.com","hashed_password","/images/henry.jpg",cs,"Listening to podcasts")
                        run("TJ","Dillashaw",36,"tj.dillashaw@ufc.com","hashed_password","/images/tj.jpg",math,"Yoga")
                        run("Jorge","Masvidal",38,"jorge.masvidal@ufc.com","hashed_password","/images/jorge.jpg",mech,"Meditation")
                        run("Colby","Covington",35,"colby.covington@ufc.com","hashed_password","/images/colby.jpg",cs,"Running")
                        run("Gilbert","Burns",36,"gilbert.burns@ufc.com","hashed_password","/images/gilbert.jpg",math,"Cycling")
                        run("Paulo","Costa",32,"paulo.costa@ufc.com","hashed_password","/images/paulo.jpg",mech,"Swimming")
                        run("Dominick","Cruz",38,"dominick.cruz@ufc.com","hashed_password","/images/dominick.jpg",cs,"Hiking")
                        run("Brian","Ortega",32,"brian.ortega@ufc.com","hashed_password","/images/brian.jpg",math,"Camping")
                        run("Yair","Rodriguez",30,"yair.rodriguez@ufc.com","hashed_password","/images/yair.jpg",mech,"Fishing")
                        run("Calvin","Kattar",34,"calvin.kattar@ufc.com","hashed_password","/images/calvin.jpg",cs,"Horseback riding")
                        run("Stephen","Thompson",40,"stephen.thompson@ufc.com","hashed_password","/images/stephen.jpg",math,"Skiing")
                        run("Kamaru","Usman",36,"kamaru.usman@ufc.com","hashed_password","/images/kamaru.jpg",mech,"Snowboarding")
                        run("Belal","Muhammad",35,"belal.muhammad@ufc.com","hashed_password","/images/belal.jpg",cs,"Surfing")
                        run("Marvin","Vettori",31,"marvin.vettori@ufc.com","hashed_password","/images/marvin.jpg",math,"Sailing")
                        run("Glover","Teixeira",44,"glover.teixeira@ufc.com","hashed_password","/images/glover.jpg",mech,"Diving")
                        run("Rafael","Fiziev",30,"rafael.fiziev@ufc.com","hashed_password","/images/rafael.jpg",cs,"DIY")
                        run("Dan","Hooker",33,"dan.hooker@ufc.com","hashed_password","/images/dan.jpg",math,"Woodworking")
                        run("Tai","Tuivasa",31,"tai.tuivasa@ufc.com","hashed_password","/images/tai.jpg",mech,"Electronics tinkering")
                        run("Derrick","Lewis",39,"derrick.lewis@ufc.com","hashed_password","/images/derrick.jpg",cs,"Collecting")
                        run("Shavkat","Rakhmonov",29,"shavkat.rakhmonov@ufc.com","hashed_password","/images/shavkat.jpg",math,"Astronomy")
                        run("Merab","Dvalishvili",33,"merab.dvalishvili@ufc.com","hashed_password","/images/merab.jpg",mech,"Birdwatching")
                        run("Sean","Strickland",32,"sean.strickland@ufc.com","hashed_password","/images/seans.jpg",cs,"Volunteering")
                        run("Magomed","Ankalaev",31,"magomed.ankalaev@ufc.com","hashed_password","/images/magomed.jpg",math,"Acting")
                        run("Tom","Aspinall",30,"tom.aspinall@ufc.com","hashed_password","/images/tom.jpg",mech,"Writing")
                        run("Arman","Tsarukyan",27,"arman.tsarukyan@ufc.com","hashed_password","/images/arman.jpg",cs,"Filmmaking")
                        run("Bo","Nickal",26,"bo.nickal@ufc.com","hashed_password","/images/bo.jpg",math,"Board games")
                    stmt.finalize(() => { console.log("Seeded users."); seeded.users = true; next(); })
                } else next()
            })
        }

        function seedUserCourses(next) {
            // Only seed if this run also seeded users and courses (to avoid FK failures)
            if (!seeded.users || !seeded.courses) return next()
            db.get("SELECT COUNT(*) AS c FROM user_courses", (err, row) => {
                if (err) { console.error(err); return next(); }
                if (row.c === 0) {
                    const stmt = db.prepare("INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)")
                    ;[[1,1],[2,2],[26,7],[27,8],[28,9],[29,10],[3,1],[4,1],[5,2],[6,7],[7,8],[8,9],[9,10]]
                        .forEach(([u,c]) => stmt.run(u,c,(e)=>{ if(e) console.error("user_courses seed error:", e.message) }))
                    stmt.finalize(() => { console.log("Seeded user_courses."); next(); })
                } else next()
            })
        }

    function seedFriendRequests(next) {
            db.get("SELECT COUNT(*) AS c FROM friend_requests", (err, row) => {
                if (err) { console.error(err); return next(); }
                if (row.c === 0) {
                    const stmt = db.prepare("INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)")
                    ;[[1,2,"pending"],[3,1,"accepted"],[2,3,"pending"]]
                        .forEach(([s,r,st]) => stmt.run(s,r,st,(e)=>{ if(e) console.error("friend_requests seed error:", e.message) }))
                    stmt.finalize(() => { console.log("Seeded friend_requests."); next(); })
                } else next()
            })
        }

    function seedMessages(next) {
            db.get("SELECT COUNT(*) AS c FROM messages", (err, row) => {
                if (err) { console.error(err); return next(); }
                if (row.c === 0) {
                    const stmt = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)")
                    ;[
                        [1,2,"Hey Khabib, I'm sorry."],[2,1,"No problem Conor."],
                        [33,32,"Why can we never knock someone out in a fight? Are we weak?"],[32,33,"No, we are just too nice."],
                        [1,3,"Hey Jon, let's train together."],[3,1,"Sure Conor, let's do it."],
                        [2,3,"Hey Jon, can you help me with my training?"],[3,2,"Of course Khabib, I got you."],
                        [4,5,"Hey Dustin, let's train together."],[5,4,"Sure Justin, let's do it."]
                    ].forEach(([s,r,c]) => stmt.run(s,r,c,(e)=>{ if(e) console.error("messages seed error:", e.message) }))
                    stmt.finalize(() => { console.log("Seeded messages."); next(); })
                } else next()
            })
        }

        function showUsers() {
            db.each(
                "SELECT users.id, first_name, last_name, email, programs.name AS program FROM users LEFT JOIN programs ON users.program_id = programs.id",
                function (err, row) {
                    if (err) { console.error(err); return; }
                    console.log(`User ${row.id}: ${row.first_name} ${row.last_name} (${row.email}) - Program: ${row.program}`);
                }
            )
        }

        function normalizePasswords(next) {
            db.run("UPDATE users SET password = 'password' WHERE password = 'hashed_password'", function(err) {
                if (err) {
                    console.error('Error normalizing passwords:', err.message)
                } else if (this.changes > 0) {
                    console.log(`Updated ${this.changes} user password(s) to default 'password'.`)
                }
                next()
            })
        }

        function normalizeMessageSalutations(next) {
            // If content starts with "Hey <Name>,", replace <Name> with the actual receiver's first name
            db.run(
                "UPDATE messages SET content = 'Hey ' || (SELECT first_name FROM users WHERE users.id = messages.receiver_id) || substr(content, instr(content, ',')) WHERE content LIKE 'Hey %,%'",
                function(err) {
                    if (err) {
                        console.error('Error normalizing message salutations:', err.message)
                    } else if (this.changes > 0) {
                        console.log(`Normalized ${this.changes} message salutation(s).`)
                    }
                    next()
                }
            )
        }

            // Run chain
            ensurePrograms((programIds) =>
            seedCourses(() =>
                    seedUsers(programIds, () =>
                    seedUserCourses(() =>
                        seedFriendRequests(() =>
                            seedMessages(() => normalizePasswords(() => normalizeMessageSalutations(() => showUsers())))
                        )
                    )
                )
            )
        )
});
