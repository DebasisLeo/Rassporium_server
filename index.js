require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});


db.connect((err) => {
    if (err) {
        console.error('MySQL connection error:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

app.get('/', (req, res) => {
    res.send("boss is sitting")
});


app.get('/menu', (req, res) => {
    const sqlQuery = 'SELECT * FROM menu'; 
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching menu:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results); 
        }
    });
});

app.get('/reviews', (req, res) => {
    const sqlQuery = 'SELECT * FROM reviews'; 
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results); 
        }
    });
});
app.get('/carts', (req, res) => {
    const userEmail = req.query.email;

    let sqlQuery = 'SELECT * FROM carts';
    const params = [];

    if (userEmail) {
        sqlQuery += ' WHERE email = ?';
        params.push(userEmail);
    }

    db.query(sqlQuery, params, (err, results) => {
        if (err) {
            console.error('Error fetching carts:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});


app.delete('/carts/:id', (req, res) => {
    const cartId = req.params.id;

    const sql = `DELETE FROM carts WHERE id = ?`;
    db.query(sql, [cartId], (err, result) => {
        if (err) {
            console.error('Error deleting cart item:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json({ deletedCount: result.affectedRows });
        }
    });
});

app.get('/users', (req, res) => {
    const sqlQuery = 'SELECT * FROM users'; 
    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            res.json(results); 
        }
    });
});



app.post('/users', (req, res) => {
    const { name, email, photoURL } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and Email are required' });
    }

    const sqlQuery = `
        INSERT INTO users (name, email, photoURL)
        VALUES (?, ?, ?)
    `;

    db.query(sqlQuery, [name, email, photoURL], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({
            insertedId: result.insertId,
            message: "User added successfully"
        });
    });
});


app.post('/carts', (req, res) => {
    const { menuId, email, name, image, price } = req.body;

    if (!menuId || !email || !name || !image || !price) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `
        INSERT INTO carts (menuId, email, name, image, price)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [menuId, email, name, image, price], (err, result) => {
        if (err) {
            console.error('Error inserting into cart:', err);
            res.status(500).json({ error: "Database error" });
        } else {
            res.json({ insertedId: result.insertId });
        }
    });
});
app.listen(port, () => {
    console.log(`boss is running at ${port}`)
});
