// require('dotenv').config();  // Load environment variables from .env
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const UserModel = require('./models/Users');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB using mongoose
// mongoose.connect(process.env.mongoURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch((err) => console.error('MongoDB connection error:', err));


// // Import CSV-related routes
// const exportCsvRoutes = require('./routes/exportCsv'); // Adjust the path if needed
// const importCsvRoutes = require('./routes/importCsv'); // Adjust the path if needed

// // Use the imported routes
// app.use('/api', exportCsvRoutes); // Route for exporting CSV
// app.use('/api', importCsvRoutes); // Route for importing CSV


// // Route to get all users
// app.get('/', (req, res) => {
//     UserModel.find({})
//         .then(users => res.json(users))
//         .catch(err => res.status().json(err));
// });

// // Route to get a user by ID
// app.get('/getUser/:id', (req, res) => {
//     const id = req.params.id;
//     UserModel.findById(id)
//         .then(user => res.json(user))
//         .catch(err => res.status(500).json(err));
// });

// // Route to update a user by ID
// app.put('/updateUser/:id', (req, res) => {
//     const id = req.params.id;
//     const { name, email, age } = req.body;
//     UserModel.findByIdAndUpdate(id, { name, email, age }, { new: true })
//         .then(updatedUser => res.json(updatedUser))
//         .catch(err => res.status(500).json(err));
// });

// // Route to delete a user by ID
// app.delete('/deleteUser/:id', (req, res) => {
//     const id = req.params.id;
//     UserModel.findByIdAndDelete(id)
//         .then(deletedUser => res.json(deletedUser))
//         .catch(err => res.status(500).json(err));
// });

// // Route to create a new user
// app.post('/createUser', (req, res) => {
//     UserModel.create(req.body)
//         .then(newUser => res.json(newUser))
//         .catch(err => res.status(500).json(err));
// });

// // Start the server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./models/Users');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
// const xlsx = require('xlsx');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');

// Initialize the app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB
mongoose.connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Route to get all users
// app.get('/', (req, res) => {
//     UserModel.find({})
//         .limit(5)
//         .then(users => res.json(users))
//         .catch(err => res.status(500).json(err));
// });
app.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5; // Set default limit to 5
        const page = parseInt(req.query.page) || 1; // Set default page to 1

        const totalUsers = await UserModel.countDocuments(); // Count total documents
        const users = await UserModel.find({})
            .limit(limit)
            .skip((page - 1) * limit); // Skip the records for previous pages

        res.json({
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
            users, // Return the paginated users
        });
    } catch (err) {
        res.status(500).json(err);
    }
});


// Route to create a new user
app.post('/createUser', (req, res) => {
    UserModel.create(req.body)
        .then(newUser => res.json(newUser))
        .catch(err => res.status(500).json(err));
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

// Route to export users as CSV
app.get('/api/exportUsers', async (req, res) => {
    try {
        const users = await UserModel.find({});
        if (!users || users.length === 0) {
            return res.status(404).send('No users found');
        }

        const csvWriter = createObjectCsvWriter({
            path: path.join(__dirname, 'users.csv'),
            header: [
                { id: 'name', title: 'Name' },
                { id: 'email', title: 'Email' },
                { id: 'age', title: 'Age' },
            ],
        });

        await csvWriter.writeRecords(users);
        res.download(path.join(__dirname, 'users.csv'), 'users.csv', (err) => {
            if (err) {
                console.error('Error downloading CSV:', err);
                res.status(500).send('Error downloading CSV');
            }
            fs.unlink(path.join(__dirname, 'users.csv'), (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        });
    } catch (error) {
        console.error('Error generating CSV:', error);
        res.status(500).send('Error generating CSV');
    }
});

// Route to import users from CSV
app.post('/api/importCsv', upload.single('file'), (req, res) => {
    const results = [];

    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    if (req.file.size === 0) {
        return res.status(400).send('Please enter valid data');
    }

    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (data) => {
            // Normalize header names
            const normalizedData = {
                name: data.name || data.Name,
                email: data.email || data.Email,
                age: data.age || data.Age,
            };
            results.push(normalizedData);
        })
        .on('end', async () => {
            try {
                // Check if results is empty or contains only empty fields
                const validResults = results.filter(row => {
                    return row.name && row.email && row.age; // All fields must be non-empty
                });

                if (validResults.length === 0) {
                    return res.status(400).send('Please enter valid data');
                }

                await UserModel.insertMany(validResults); // Insert only valid results
                res.send('CSV data imported successfully');
            } catch (error) {
                console.error('Error importing CSV data:', error);
                res.status(500).send('Error importing CSV data');
            } finally {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            }
        });
});


// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



