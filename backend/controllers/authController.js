const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const authController = {

    signup: async (req, res) => {
       
       let connection;
        try {
       const {username, email, password, firstName, lastName} = req.body;

       if(!username || !email || !password) {
        return res.status(400).json({error: "All fields are required"})
       }

        connection = await pool.getConnection();

       const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ? or username = ?', [email, username]
       )

       if(existingUser.length > 0) {
        connection.release();
        return res.status(422).json({error: 'User with this email or username already exists'})
       }

       const hashedPassword = await bcrypt.hash(password, 12)

        await connection.query(
        'INSERT INTO users (username, email, password, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, firstName, lastName]
        )

        const [newUser] = await connection.query(
            'SELECT id, username, email, firstName, lastName FROM users WHERE email = ?', [email]
        )

        connection.release();

            const encodedToken = jwt.sign(
            { userId: newUser[0].id, username: newUser[0].username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
            );

            res.status(201).json({
            createdUser: newUser[0],
            encodedToken,
            });
        }
        catch (error) {
            console.error('Signup error:', error);
            if (connection) connection.release();
            res.status(500).json({ message: 'Server error during signup', error: error.message });
        }
        
    },

    login: async (req, res) => {
        let connection;

        try {

        const { email, password } = req.body;

        if (!email || !password) {
         
            return res.status(400).json({ error: 'Email and password are required' });
        }

        connection = await pool.getConnection();

        const [users] = await connection.query(
            'SELECT id, username, email, password, firstName, lastName FROM users WHERE email = ?', [email]
        )

        if (users.length === 0) {
            connection.release();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            connection.release();
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        connection.release();

        const encodedToken = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            foundUser: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        encodedToken,
        })

        }
        catch (error) {
          console.error('Login error:', error);
          if (connection) connection.release();
          return res.status(500).json({ message: 'Server error during login' });
        }
    }

};

module.exports = authController;