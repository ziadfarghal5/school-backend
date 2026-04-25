const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
    await db.end();
    process.exit();
});

const getLastStudentID = async () => {
    const { rows } = await db.query('SELECT MAX(id) AS lastid FROM student');
    return rows[0].lastid || 0;
};

const getLastTeacherID = async () => {
    const { rows } = await db.query('SELECT MAX(id) AS lastid FROM teacher');
    return rows[0].lastid || 0;
};

app.get('/', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM student");
        return res.json({ message: "From Backend!!!", studentData: rows });
    } catch (error) {
        console.error('Error fetching student data:', error);
        return res.status(500).json({ error: 'Error fetching student data' });
    }
});

app.get('/student', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM student");
        return res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error fetching students' });
    }
});

app.get('/teacher', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM teacher");
        return res.json(rows);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error fetching teachers' });
    }
});

app.post('/addstudent', async (req, res) => {
    try {
        const lastStudentID = await getLastStudentID();
        const nextStudentID = lastStudentID + 1;

        const sql = `INSERT INTO student (id, name, roll_number, class) VALUES ($1, $2, $3, $4)`;
        await db.query(sql, [nextStudentID, req.body.name, req.body.rollNo, req.body.class]);
        return res.json({ message: 'Data inserted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error inserting data' });
    }
});

app.post('/addteacher', async (req, res) => {
    try {
        const lastTeacherID = await getLastTeacherID();
        const nextTeacherID = lastTeacherID + 1;

        const sql = `INSERT INTO teacher (id, name, subject, class) VALUES ($1, $2, $3, $4)`;
        await db.query(sql, [nextTeacherID, req.body.name, req.body.subject, req.body.class]);
        return res.json({ message: 'Data inserted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error inserting data' });
    }
});

app.delete('/student/:id', async (req, res) => {
    const studentId = req.params.id;

    try {
        await db.query('DELETE FROM student WHERE id = $1', [studentId]);

        const { rows } = await db.query('SELECT id FROM student ORDER BY id');

        const updatePromises = rows.map((row, index) => {
            const newId = index + 1;
            return db.query('UPDATE student SET id = $1 WHERE id = $2', [newId, row.id]);
        });

        await Promise.all(updatePromises);
        return res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error deleting student' });
    }
});

app.delete('/teacher/:id', async (req, res) => {
    const teacherID = req.params.id;

    try {
        await db.query('DELETE FROM teacher WHERE id = $1', [teacherID]);

        const { rows } = await db.query('SELECT id FROM teacher ORDER BY id');

        const updatePromises = rows.map((row, index) => {
            const newId = index + 1;
            return db.query('UPDATE teacher SET id = $1 WHERE id = $2', [newId, row.id]);
        });

        await Promise.all(updatePromises);
        return res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error deleting teacher' });
    }
});

app.listen(3500, () => {
    console.log("listening on Port 3500");
});