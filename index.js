require('dotenv').config();  // Load environment variables from .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./models/Users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB using mongoose
mongoose.connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Route to get all users
app.get('/', (req, res) => {
    UserModel.find({})
        .then(users => res.json(users))
        .catch(err => res.status().json(err));
});

// Route to get a user by ID
app.get('/getUser/:id', (req, res) => {
    const id = req.params.id;
    UserModel.findById(id)
        .then(user => res.json(user))
        .catch(err => res.status(500).json(err));
});

// Route to update a user by ID
app.put('/updateUser/:id', (req, res) => {
    const id = req.params.id;
    const { name, email, age } = req.body;
    UserModel.findByIdAndUpdate(id, { name, email, age }, { new: true })
        .then(updatedUser => res.json(updatedUser))
        .catch(err => res.status(500).json(err));
});

// Route to delete a user by ID
app.delete('/deleteUser/:id', (req, res) => {
    const id = req.params.id;
    UserModel.findByIdAndDelete(id)
        .then(deletedUser => res.json(deletedUser))
        .catch(err => res.status(500).json(err));
});

// Route to create a new user
app.post('/createUser', (req, res) => {
    UserModel.create(req.body)
        .then(newUser => res.json(newUser))
        .catch(err => res.status(500).json(err));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
