// ====== Imports ======
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
const PORT = 3002;
const JWT_SECRET = 'supersecretkey'; // store in env in real apps

const razorpay = new Razorpay({
  key_id: 'rzp_test_cGMp9Ibbd00J3B',
  key_secret: '8TMmNSVEOjgQtU5n466ZURLL',
});


// ====== Middleware ======
app.use(cors({
  origin: 'http://localhost:5173', // frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ====== MongoDB Connection ======
mongoose.connect("mongodb://localhost:27017/gymDB", {
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

// Login route
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

    // Create JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// for memberdashboard to redirect the details.
app.get('/me', authenticateToken, async (req, res) => {
  try {
    const member = await Member.findById(req.user.id); // req.user comes from JWT
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create new member
app.post("/members", async (req, res) => {
  //console.log("Incoming data:", req.body);
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

// Get all members (Protected)
app.get('/members', authenticateToken, async (req, res) => {
  try {
    const members = await Member.find({});
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching members', error: err.message });
  }
});

// Get single member by ID (Protected)
app.get('/members/:id', authenticateToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching member', error: err.message });
  }
});

// Get unpaid members (Protected)
app.get('/members/unpaid', authenticateToken, async (req, res) => {
  try {
    const members = await Member.find({ 'paymentStatus.isPaid': false });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching unpaid members', error: err.message });
  }
});

// Update member details (Protected)
app.put('/members/:id', authenticateToken, async (req, res) => {
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
    res.status(400).json({ message: 'Error updating member', error: err.message });
  }
});

// Update payment status (Protected)
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
    if (!updatedMember) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: 'Error updating payment status', error: err.message });
  }
});

// Delete member (Protected)
app.delete('/members/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  Member.findByIdAndDelete(id)
    .then(() => res.json({ message: 'Member deleted successfully' }))
    .catch(err => res.status(500).json({ error: 'Failed to delete member', details: err }));
});


//razorpay
app.post('/create-order', authenticateToken, async (req, res) => {
  const { amount } = req.body; // amount in paise

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

  const generated_signature = crypto.createHmac('sha256', razorpay.key_secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    // Signature is valid, update payment status in DB for memberId
    try {
      await Member.findByIdAndUpdate(memberId, {
        'paymentStatus.isPaid': true,
        'paymentStatus.lastPaymentDate': new Date(),
        'paymentStatus.nextDueDate': new Date(new Date().setMonth(new Date().getMonth() + 1)),
        'paymentStatus.overdue': false
      });
      res.json({ success: true });
    } catch (err) {
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
