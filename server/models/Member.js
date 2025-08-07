const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MemberSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, required: true }, // <-- Add this line
    age: Number,
    number: Number,
    joinDate: { type: Date, default: Date.now },
    membershipType: String,
    paymentStatus: {
        isPaid: Boolean,
        lastPaymentDate: Date,
        nextDueDate: Date,
        overdue: { type: Boolean, default: false }
    },
    assignedTrainer: String
});

// Hash password before saving
MemberSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

const MemberModel = mongoose.model("Member", MemberSchema);
module.exports = MemberModel;
