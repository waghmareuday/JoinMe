import mongoose from "mongoose"; 

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true,
    },
    age: {
        type: Number,
        min: 1,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    profession: {
        type: String,
        required: false,
    },
    verifyOtp: {
        type: String,
        default: '',
    },
    verifyOtpExpireAt: {
        type: Number,
        default: 0,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    resetOtp: {
        type: String,
        default: '',
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0,
    },
    
    // 🟢 NEW: TRUST & PROFILE SYSTEM FIELDS
    bio: {
        type: String,
        default: "Hey there! I'm looking forward to meeting new people and joining great events.",
        maxLength: 150
    },
    avatar: {
        type: String,
        default: "" // We will generate a sleek initial-based avatar or let them upload one
    },
    averageRating: {
        type: Number,
        default: 0 // Will hold the 1-5 star average
    },
    totalRatings: {
        type: Number,
        default: 0 // How many people have rated this user
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;