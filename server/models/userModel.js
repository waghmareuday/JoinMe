import mongoose from "mongoose"; 

const availabilitySlotSchema = new mongoose.Schema({
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
}, { _id: false });

const blockedUserSchema = new mongoose.Schema({
    blockedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    blockedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Not specified', ''], default: '' },
    age: { type: Number, min: 0, max: 120, default: 0 },
    city: { type: String, trim: true, default: '' },
    profession: { type: String, required: false, trim: true },
    
    // OTP fields
    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: '' },
    resetOtpExpireAt: { type: Number, default: 0 },
    
    // Profile
    bio: { type: String, default: "Hey there! I'm looking forward to meeting new people and joining great events.", maxLength: 150 },
    avatar: { type: String, default: "" },
    
    // Trust & Rating
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    
    // Trust Score (computed by system)
    trustScore: { type: Number, default: 50, min: 0, max: 100 },
    eventsHosted: { type: Number, default: 0 },
    eventsCompleted: { type: Number, default: 0 },
    eventsCancelled: { type: Number, default: 0 },
    
    // Availability calendar
    availability: [availabilitySlotSchema],
    
    // Blocking
    blockedUsers: [blockedUserSchema],
    
    createdAt: { type: Date, default: Date.now },
});

// Indexes for performance
userSchema.index({ city: 1 });

// Virtual: compute trust score
userSchema.methods.computeTrustScore = function() {
    let score = 50; // Base score
    
    // Account age bonus (max +10)
    const daysOld = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
    score += Math.min(10, Math.floor(daysOld / 30));
    
    // Rating bonus (max +20)
    if (this.totalRatings >= 3) {
        score += Math.floor(this.averageRating * 4);
    }
    
    // Completion rate bonus (max +15)
    if (this.eventsHosted > 0) {
        const completionRate = this.eventsCompleted / this.eventsHosted;
        score += Math.floor(completionRate * 15);
    }
    
    // Cancellation penalty
    score -= this.eventsCancelled * 3;
    
    // Events hosted bonus (max +5)
    score += Math.min(5, this.eventsHosted);
    
    this.trustScore = Math.max(0, Math.min(100, score));
    return this.trustScore;
};

const userModel = mongoose.models.user || mongoose.model('user', userSchema);
export default userModel;