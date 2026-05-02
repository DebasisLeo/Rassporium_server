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

app.get('/menu/:id', (req, res) => {
    const id = req.params.id;

    const sql = `SELECT * FROM menu WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Fetch single menu error:", err);
            return res.status(500).json({ error: err.message });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.json(result[0]);
    });
});

app.post('/menu', (req, res) => {
    const { name, category, price, recipe, image } = req.body;

    console.log("Incoming menu data:", req.body);

    // validation
    if (!name || !category || price == null || !image) {
        return res.status(400).json({ error: "Required fields missing" });
    }

    const safeRecipe = recipe || "";

    const sql = `
        INSERT INTO menu (name, category, price, recipe, image)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, category, price, safeRecipe, image], (err, result) => {
        if (err) {
            console.error("Error inserting menu item:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json({
            insertedId: result.insertId,
            message: "Menu item added successfully"
        });
    });
});

app.delete('/menu/:id', (req, res) => {
    const id = req.params.id;

    console.log("Deleting item id:", id);

    const sql = `DELETE FROM menu WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Delete error:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json({
            deletedCount: result.affectedRows
        });
    });
});

app.patch('/menu/:id', (req, res) => {
    const id = req.params.id;
    const { name, category, price, recipe, image } = req.body;

    console.log("Updating item id:", id);
    console.log("Updated data:", req.body);

    // validation
    if (!name || !category || price == null || !image) {
        return res.status(400).json({ error: "Required fields missing" });
    }

    const safeRecipe = recipe || "";

    const sql = `
        UPDATE menu
        SET name = ?, category = ?, price = ?, recipe = ?, image = ?
        WHERE id = ?
    `;

    db.query(sql, [name, category, price, safeRecipe, image, id], (err, result) => {
        if (err) {
            console.error("Update error:", err);
            return res.status(500).json({ error: err.message });
        }

        res.json({
            modifiedCount: result.affectedRows
        });
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

app.get("/users/admin/:email", (req, res) => {
    const email = req.params.email;

    const sql = `SELECT role FROM users WHERE email = ? LIMIT 1`;

    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Error checking admin:", err);
            return res.status(500).json({ error: "Database error" });
        }

        if (results.length === 0) {
            return res.json({ admin: false });
        }

        const isAdmin = results[0].role === "admin";
        res.json({ admin: isAdmin });
    });
});

app.post('/users', (req, res) => {
    const { name, email, photoURL } = req.body; 

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and Email are required' });
    }

    const sqlQuery = `
        INSERT INTO users (name, email, photoURL, role)
        VALUES (?, ?, ?, ?)
    `;

    const defaultRole = "user";

    db.query(sqlQuery, [name, email, photoURL, defaultRole], (err, result) => {
        if (err) {
            console.error('Error inserting user:', err);
            return res.status(500).json({ error: err.message }); // better debug
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


//hiistory

app.post('/history/add', (req, res) => {
    const { user_email, action_type, item_name, details } = req.body;
  
    if (!user_email || !action_type)
      return res.status(400).json({ message: "Required fields missing" });
  
    
    const getUserIdSql = `SELECT id FROM users WHERE email = ? LIMIT 1`;
    db.query(getUserIdSql, [user_email], (err, users) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!users.length) return res.status(404).json({ error: "User not found" });
  
      const user_id = users[0].id;
  
      const sql = `
        INSERT INTO user_history (user_id, action_type, item_name, details)
        VALUES (?, ?, ?, ?)
      `;
  
      db.query(sql, [user_id, action_type, item_name, details], (err, result) => {
        if (err) {
          console.error("Error inserting history:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, message: "History Added" });
      });
    });
  });
  


  app.get('/history/:email', (req, res) => {
    const userEmail = req.params.email;
  
    const sql = `
      SELECT h.id, h.action_type, h.item_name, h.details, h.timestamp
      FROM user_history h
      JOIN users u ON h.user_id = u.id
      WHERE u.email = ?
      ORDER BY h.timestamp DESC
    `;
  
    db.query(sql, [userEmail], (err, results) => {
      if (err) {
        console.error("Error fetching history:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json(results);
    });
  });



  app.delete('/history/:email', (req, res) => {
    const userEmail = req.params.email;
  
    const getUserIdSql = `SELECT id FROM users WHERE email = ? LIMIT 1`;
    db.query(getUserIdSql, [userEmail], (err, users) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!users.length) return res.status(404).json({ error: "User not found" });
  
      const user_id = users[0].id;
      const deleteSql = `DELETE FROM user_history WHERE user_id = ?`;
  
      db.query(deleteSql, [user_id], (err, result) => {
        if (err) {
          console.error("Error clearing history:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ success: true, deletedCount: result.affectedRows });
      });
    });
  });

  //users view
  
  app.post('/views/add', (req, res) => {
    const { user_email, ip_address } = req.body;
    console.log("Payload received:", req.body);

    const getUserIdSql = `SELECT id FROM users WHERE email = ? LIMIT 1`;
    db.query(getUserIdSql, [user_email], (err, users) => {
        if (err) return res.status(500).json({ error: "Database error" });

        const user_id = users.length ? users[0].id : null;

        const sql = `INSERT INTO site_views (user_id, ip_address) VALUES (?, ?)`;
        db.query(sql, [user_id, ip_address || null], (err, result) => {
            if (err) {
                console.error("Error adding view:", err.sqlMessage);
                return res.status(500).json({ error: err.sqlMessage });
            }
            res.json({ success: true, insertedId: result.insertId });
        });
    });
});



app.get('/views/total', (req, res) => {
    const email = req.query.email;
    if(!email) return res.status(400).json({ error: "Email required" });

    db.query(`SELECT role FROM users WHERE email = ? LIMIT 1`, [email], (err, results) => {
        if(err) return res.status(500).json({ error: "Database error" });
        if(results.length === 0) return res.status(404).json({ error: "User not found" });
        if(results[0].role !== "admin") return res.status(403).json({ error: "Forbidden" });

        db.query(`SELECT COUNT(*) AS total_views FROM site_views`, (err, results) => {
            if(err) return res.status(500).json({ error: "Database error" });
            res.json({ total_views: results[0].total_views });
        });
    });
});



app.listen(port, () => {
    console.log(`boss is running at ${port}`)
});
