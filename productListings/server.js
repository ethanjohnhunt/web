const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

require('dotenv').config();

// Enable CORS

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const app = express();

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors({
    origin: 'http://localhost:3000',
}));

const saltRounds = 10;

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String,
  });



const User = mongoose.model('User', UserSchema);

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Compare the plain-text password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Passwords match, login is successful
        res.status(200).json({ message: 'Login successful!', user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});



app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Check if the username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            return res.status(409).json({
                error: `Account already exists with this ${existingUser.username === username ? 'username' : 'email'
                    }.`
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Store the hashed password in the database
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).json({ error: 'An internal error occurred.' });
    }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
