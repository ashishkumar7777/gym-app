const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    age: Number,
    joinDate: { type: Date, default: Date.now },
    membershipType: String,
    paymentStatus: {
        isPaid: Boolean,
        lastPaymentDate: Date,
        nextDueDate: Date,
        overdue: { type: Boolean, default: false }
    },
    assignedTrainer: String  // Could be ObjectId if you have a Trainer model
});

const MemberModel = mongoose.model("Member", MemberSchema);
module.exports = MemberModel;