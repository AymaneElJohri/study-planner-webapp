var fs = require("fs");
var file = __dirname + "/database.sqlite";
var exists = fs.existsSync(file);

if (!exists) {
    fs.openSync(file, "w");
}

var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

db.serialize(function () {
    console.log("Creating tables...");
    // Maak tabellen als de database nog niet bestaat
    if (!exists) {

        // Tabel voor gebruikers
        db.run(`
            CREATE TABLE users (
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
            )
        `);

           // Tabel voor programma's
           db.run(`
            CREATE TABLE programs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        `);

        // Tabel voor cursussen
        db.run(`
            CREATE TABLE courses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        `);

        // Tabel voor gebruikers-cursusrelaties
        db.run(`
            CREATE TABLE user_courses (
                user_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (course_id) REFERENCES courses (id),
                PRIMARY KEY (user_id, course_id)
            )
        `);

        // Tabel voor vriendschapsverzoeken
        db.run(`
            CREATE TABLE friend_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) NOT NULL DEFAULT 'pending',
                FOREIGN KEY (sender_id) REFERENCES users (id),
                FOREIGN KEY (receiver_id) REFERENCES users (id)
            )
        `);

        // Tabel voor berichten
        db.run(`
            CREATE TABLE messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users (id),
                FOREIGN KEY (receiver_id) REFERENCES users (id)
            )
        `);
    }

    // Voeg voorbeeldgegevens toe
  
    // Voeg gebruikers toe
    // Voeg 50 UFC-vechters toe als gebruikers
stmt = db.prepare("INSERT INTO users (first_name, last_name, age, email, password, photo, program_id, hobbies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
stmt.run("Conor", "McGregor", 32, "conor.mcgregor@ufc.com", "hashed_password", "/images/conor.jpg", 1, "Reading");
stmt.run("Khabib", "Nurmagomedov", 31, "khabib.nurmagomedov@ufc.com", "hashed_password", "/images/Khabib.jpg", 2, "Traveling");
stmt.run("Jon", "Jones", 34, "jon.jones@ufc.com", "hashed_password", "/images/jon.jpg", 3, "Cooking");
stmt.run("Israel", "Adesanya", 30, "israel.adesanya@ufc.com", "hashed_password", "/images/israel.jpg", 1, "Baking");
stmt.run("Francis", "Ngannou", 35, "francis.ngannou@ufc.com", "hashed_password", "/images/francis.jpg", 2, "Photography");
stmt.run("Alexander", "Volkanovski", 33, "alexander.volkanovski@ufc.com", "hashed_password", "/images/alex.jpg", 3, "Drawing");
stmt.run("Islam", "Makhachev", 31, "islam.makhachev@ufc.com", "hashed_password", "/images/islam.jpg", 1, "Painting");
stmt.run("Leon", "Edwards", 30, "leon.edwards@ufc.com", "hashed_password", "/images/leon.jpg", 2, "Playing music");
stmt.run("Sean", "O'Malley", 28, "sean.omalley@ufc.com", "hashed_password", "/images/sean.jpg", 3, "Singing");
stmt.run("Aljamain", "Sterling", 33, "aljamain.sterling@ufc.com", "hashed_password", "/images/aljamain.jpg", 1, "Dancing");
stmt.run("Charles", "Oliveira", 31, "charles.oliveira@ufc.com", "hashed_password", "/images/charles.jpg", 2, "Gardening");
stmt.run("Max", "Holloway", 30, "max.holloway@ufc.com", "hashed_password", "/images/max.jpg", 3, "Knitting");
stmt.run("Dustin", "Poirier", 32, "dustin.poirier@ufc.com", "hashed_password", "/images/dustin.jpg", 1, "Crocheting");
stmt.run("Justin", "Gaethje", 34, "justin.gaethje@ufc.com", "hashed_password", "/images/justin.jpg", 2, "Sewing");
stmt.run("Tony", "Ferguson", 38, "tony.ferguson@ufc.com", "hashed_password", "/images/tony.jpg", 3, "Embroidery");
stmt.run("Robert", "Whittaker", 32, "robert.whittaker@ufc.com", "hashed_password", "/images/robert.jpg", 1, "Jewelry making");
stmt.run("Stipe", "Miocic", 41, "stipe.miocic@ufc.com", "hashed_password", "/images/stipe.jpg", 2, "Origami");
stmt.run("Ciryl", "Gane", 33, "ciryl.gane@ufc.com", "hashed_password", "/images/ciryl.jpg", 3, "Model building");
stmt.run("Petr", "Yan", 29, "petr.yan@ufc.com", "hashed_password", "/images/petr.jpg", 1, "Puzzling");
stmt.run("Brandon", "Moreno", 28, "brandon.moreno@ufc.com", "hashed_password", "/images/brandon.jpg", 2, "Chess");
stmt.run("Alex", "Pereira", 36, "alex.pereira@ufc.com", "hashed_password", "/images/alexp.jpg", 3, "Card games");
stmt.run("Jiri", "Prochazka", 30, "jiri.prochazka@ufc.com", "hashed_password", "/images/jiri.jpg", 1, "Video gaming");
stmt.run("Jan", "Blachowicz", 39, "jan.blachowicz@ufc.com", "hashed_password", "/images/jan.jpg", 2, "Blogging");
stmt.run("Demetrious", "Johnson", 36, "demetrious.johnson@ufc.com", "hashed_password", "/images/dj.jpg", 3, "Vlogging");
stmt.run("Henry", "Cejudo", 35, "henry.cejudo@ufc.com", "hashed_password", "/images/henry.jpg", 1, "Listening to podcasts");
stmt.run("TJ", "Dillashaw", 36, "tj.dillashaw@ufc.com", "hashed_password", "/images/tj.jpg", 2, "Yoga");
stmt.run("Jorge", "Masvidal", 38, "jorge.masvidal@ufc.com", "hashed_password", "/images/jorge.jpg", 3, "Meditation");
stmt.run("Colby", "Covington", 35, "colby.covington@ufc.com", "hashed_password", "/images/colby.jpg", 1, "Running");
stmt.run("Gilbert", "Burns", 36, "gilbert.burns@ufc.com", "hashed_password", "/images/gilbert.jpg", 2, "Cycling");
stmt.run("Paulo", "Costa", 32, "paulo.costa@ufc.com", "hashed_password", "/images/paulo.jpg", 3, "Swimming");
stmt.run("Dominick", "Cruz", 38, "dominick.cruz@ufc.com", "hashed_password", "/images/dominick.jpg", 1, "Hiking");
stmt.run("Brian", "Ortega", 32, "brian.ortega@ufc.com", "hashed_password", "/images/brian.jpg", 2, "Camping");
stmt.run("Yair", "Rodriguez", 30, "yair.rodriguez@ufc.com", "hashed_password", "/images/yair.jpg", 3, "Fishing");
stmt.run("Calvin", "Kattar", 34, "calvin.kattar@ufc.com", "hashed_password", "/images/calvin.jpg", 1, "Horseback riding");
stmt.run("Stephen", "Thompson", 40, "stephen.thompson@ufc.com", "hashed_password", "/images/stephen.jpg", 2, "Skiing");
stmt.run("Kamaru", "Usman", 36, "kamaru.usman@ufc.com", "hashed_password", "/images/kamaru.jpg", 3, "Snowboarding");
stmt.run("Belal", "Muhammad", 35, "belal.muhammad@ufc.com", "hashed_password", "/images/belal.jpg", 1, "Surfing");
stmt.run("Marvin", "Vettori", 31, "marvin.vettori@ufc.com", "hashed_password", "/images/marvin.jpg", 2, "Sailing");
stmt.run("Glover", "Teixeira", 44, "glover.teixeira@ufc.com", "hashed_password", "/images/glover.jpg", 3, "Diving");
stmt.run("Rafael", "Fiziev", 30, "rafael.fiziev@ufc.com", "hashed_password", "/images/rafael.jpg", 1, "DIY");
stmt.run("Dan", "Hooker", 33, "dan.hooker@ufc.com", "hashed_password", "/images/dan.jpg", 2, "Woodworking");
stmt.run("Tai", "Tuivasa", 31, "tai.tuivasa@ufc.com", "hashed_password", "/images/tai.jpg", 3, "Electronics tinkering");
stmt.run("Derrick", "Lewis", 39, "derrick.lewis@ufc.com", "hashed_password", "/images/derrick.jpg", 1, "Collecting");
stmt.run("Shavkat", "Rakhmonov", 29, "shavkat.rakhmonov@ufc.com", "hashed_password", "/images/shavkat.jpg", 2, "Astronomy");
stmt.run("Merab", "Dvalishvili", 33, "merab.dvalishvili@ufc.com", "hashed_password", "/images/merab.jpg", 3, "Birdwatching");
stmt.run("Sean", "Strickland", 32, "sean.strickland@ufc.com", "hashed_password", "/images/seans.jpg", 1, "Volunteering");
stmt.run("Magomed", "Ankalaev", 31, "magomed.ankalaev@ufc.com", "hashed_password", "/images/magomed.jpg", 2, "Acting");
stmt.run("Tom", "Aspinall", 30, "tom.aspinall@ufc.com", "hashed_password", "/images/tom.jpg", 3, "Writing");
stmt.run("Arman", "Tsarukyan", 27, "arman.tsarukyan@ufc.com", "hashed_password", "/images/arman.jpg", 1, "Filmmaking");
stmt.run("Bo", "Nickal", 26, "bo.nickal@ufc.com", "hashed_password", "/images/bo.jpg", 2, "Board games");
stmt.finalize();

    // Voeg programma's toe
    var stmt = db.prepare("INSERT INTO programs (name) VALUES (?)");
    stmt.run("Computer Science");
    stmt.run("Mathematics");
    stmt.run("Mechanical Engineering");
    stmt.finalize();

    // Voeg cursussen toe
    stmt = db.prepare("INSERT INTO courses (name) VALUES (?)");
    stmt.run("Mathematics");
    stmt.run("Physics");
    stmt.run("Programming");
    stmt.run("Databases");
    stmt.run("Algorithms");
    stmt.run("Artificial Intelligence");
    stmt.run("Software Engineering");
    stmt.run("Data Science");
    stmt.run("Computer Networks");
    stmt.run("Web Development");
    stmt.finalize();

    // Koppel gebruikers aan cursussen
    stmt = db.prepare("INSERT INTO user_courses (user_id, course_id) VALUES (?, ?)");
    stmt.run(1, 1); // Conor volgt Mathematics
    stmt.run(2, 2); // Khabib volgt Physics   
    stmt.run(26, 7); // TJ volgt Algorithms
    stmt.run(27, 8); // Jorge volgt Artificial Intelligence
    stmt.run(28, 9); // Colby volgt Software Engineering
    stmt.run(29, 10); // Gilbert volgt Data Science
    stmt.run(3, 1);    // Jon also takes Mathematics (same as Conor)
    stmt.run(4, 1);    // Israel also takes Mathematics
    stmt.run(5, 2);    // Francis also takes Physics (same as Khabib)
    stmt.run(6, 7);    // Alexander also takes Software Engineering (same as TJ)
    stmt.run(7, 8);    // Islam also takes Data Science (same as Jorge)
    stmt.run(8, 9);    // Leon also takes Computer Networks (same as Colby)
    stmt.run(9, 10);   // Sean also takes Web Development (same as Gilbert)

    stmt.finalize();

    // Voeg een vriendschapsverzoek toe
    stmt = db.prepare("INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)");
    stmt.run(1, 2, "pending"); // Conor stuurt een verzoek naar Khabib
    stmt.run(3, 1, "accepted"); // Jon accepteert het verzoek van Conor
    stmt.run(2, 3, "pending"); // Khabib stuurt een verzoek naar Jon
    stmt.finalize();

    // Voeg een bericht toe
    stmt = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)");
    stmt.run(1, 2, "Hey Khabib, I'm sorry."); // Conor stuurt een bericht naar Khabib
    stmt.run(2, 1, "No problem Conor."); // Khabib stuurt een bericht naar Conor
    stmt.run(33, 32, "Why can we never knock someone out in a fight? Are we weak?"); // Merab stuurt een bericht naar Sean
    stmt.run(32, 33, "No, we are just too nice."); // Sean stuurt een bericht naar Merab
    stmt.run(1, 3, "Hey Jon, let's train together."); // Conor stuurt een bericht naar Jon
    stmt.run(3, 1, "Sure Conor, let's do it."); // Jon stuurt een bericht naar Conor
    stmt.run(2, 3, "Hey Jon, can you help me with my training?"); // Khabib stuurt een bericht naar Jon
    stmt.run(3, 2, "Of course Khabib, I got you."); // Jon stuurt een bericht naar Khabib
    stmt.run(4, 5, "Hey Dustin, let's train together."); // Justin stuurt een bericht naar Dustin
    stmt.run(5, 4, "Sure Justin, let's do it."); // Dustin stuurt een bericht naar Justin

    stmt.finalize();

    // Toon alle gebruikers
    db.each("SELECT users.id, first_name, last_name, email, programs.name AS program FROM users LEFT JOIN programs ON users.program_id = programs.id", function (err, row) {
        console.log(`User ${row.id}: ${row.first_name} ${row.last_name} (${row.email}) - Program: ${row.program}`);
    });
});

db.close();