// ====== Imports ======
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Member = require('./models/Member');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

// ====== Config ======
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ====== Middleware ======
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // set frontend URL in .env on Render
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ====== MongoDB Connection ======
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ====== Auth Middleware ======
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; // store user info from token
    next();
  });
}

// ====== Routes ======

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Member.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Current user info
app.get('/me', authenticateToken, async (req, res) => {
  try {
    const member = await Member.findById(req.user.id);
    res.json(member);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

// Members CRUD
app.post("/members", async (req, res) => {
  try {
    const newMember = new Member(req.body);
    await newMember.save();
    res.json(newMember);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Error creating member', error: err });
  }
});

app.get('/members', authenticateToken, async (req, res) => {
  try {
    const members = await Member.find({});
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching members', error: err.message });
  }
});

app.get('/members/:id', authenticateToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching member', error: err.message });
  }
});

app.get('/members/unpaid', authenticateToken, async (req, res) => {
  try {
    const members = await Member.find({ 'paymentStatus.isPaid': false });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching unpaid members', error: err.message });
  }
});

app.put('/members/:id', authenticateToken, async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedMember) return res.status(404).json({ message: 'Member not found' });
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: 'Error updating member', error: err.message });
  }
});

app.put('/members/pay/:id', authenticateToken, async (req, res) => {
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
    if (!updatedMember) return res.status(404).json({ message: 'Member not found' });
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: 'Error updating payment status', error: err.message });
  }
});

app.delete('/members/:id', authenticateToken, async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete member', details: err });
  }
});

// Razorpay
app.post('/create-order', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  try {
    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ order_id: order.id });
  } catch (err) {
    res.status(500).json({ message: 'Order creation failed', error: err.message });
  }
});

app.post('/verify-payment', authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberId } = req.body;
  const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    try {
      await Member.findByIdAndUpdate(memberId, {
        'paymentStatus.isPaid': true,
        'paymentStatus.lastPaymentDate': new Date(),
        'paymentStatus.nextDueDate': new Date(new Date().setMonth(new Date().getMonth() + 1)),
        'paymentStatus.overdue': false
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, message: 'DB update failed' });
    }
  } else {
    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
});

// ====== Start Server ======
app.listen(PORT, () => {
  console.log(`🏋️‍♂️ Gym server is running on port ${PORT}`);
});
