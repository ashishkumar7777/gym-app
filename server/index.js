const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Member = require('./models/Member');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'supersecretkey';
const bcrypt = require('bcrypt');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// MongoDB connection with error handling
mongoose.connect("mongodb://localhost:27017/gymDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ====== Gym Member Routes ====== //

// LOGIN ROUTE
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Member.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Login failed", error: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Login failed", error: "Invalid password" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Get all members
app.get('/members', async (req, res) => {
  try {
    const members = await Member.find({});
    res.json(members);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching members',
      error: err.message 
    });
  }
});

// Get single member by ID
app.get('/members/:id', async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching member',
      error: err.message 
    });
  }
});

// Get members with unpaid fees
app.get('/members/unpaid', async (req, res) => {
  try {
    const members = await Member.find({ 'paymentStatus.isPaid': false });
    res.json(members);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error fetching unpaid members',
      error: err.message 
    });
  }
});

// Create new member
app.post("/members", async (req, res) => {
  console.log("Incoming data:", req.body); //
  try {
    const newMember = new Member(req.body); // instantiate manually
    await newMember.save(); // triggers pre('save') middleware
    res.json(newMember);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Error creating member', error: err });
  }
});

// Update member details
app.put('/members/:id', async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ 
      message: 'Error updating member',
      error: err.message 
    });
  }
});

// Update payment status
app.put('/members/pay/:id', async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      { 
        'paymentStatus.isPaid': true,
        'paymentStatus.lastPaymentDate': new Date(),
        'paymentStatus.nextDueDate': new Date(new Date().setMonth(new Date().getMonth() + 1)),
        'paymentStatus.overdue': false
      },
      { new: true }
    );
    
    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ 
      message: 'Error updating payment status',
      error: err.message 
    });
  }
});

// Delete member
// Delete a member
app.delete('/members/:id', (req, res) => {
    const id = req.params.id;
    Member.findByIdAndDelete(id)
        .then(() => res.json({ message: 'Member deleted successfully' }))
        .catch(err => res.status(500).json({ error: 'Failed to delete member', details: err }));
});


// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🏋️‍♂️ Gym server is running on port ${PORT}`);
});