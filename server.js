require('dotenv').config();


const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');


const app = express();
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});


const connectToDatabase = async () => {
    try {
        await pool.connect();
        console.log('Connected to PostgreSQL database');
    } catch (err) {
        console.error('Error connecting to PostgreSQL database:', err);
    }
};

connectToDatabase();

const JWT_SECRET = process.env.JWT_SECRET;

//signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO accounts (email, password_hash) VALUES ($1, $2)',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'User created successfully' });

  } catch (err) {
    if (err.code === '23505') {   // unique violation
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.error('Error inserting user into database:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM accounts WHERE email = $1', [email]);
    const user = result.rows[0];   // undefined if no match

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });

  } catch (err) {
    console.error('Error querying user from database:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//middleware to authenticate token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

//protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', userID: req.user.id });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// for testing use this commands : curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d '{"email":"a@a.com","password":"test123"}'

//curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"a@a.com","password":"test123"}'
//# copy the token from the response

//curl http://localhost:3000/protected -H "Authorization: Bearer <paste_token_here>"

//curl http://localhost:3000/protected   # no header — should 401
