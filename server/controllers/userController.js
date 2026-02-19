import userModel from '../models/userModel.js';
import mongoose from 'mongoose';
import eventModel from '../models/eventModel.js';

export const getUserData = async (req, res) => {
    try {
        const userId = req.user.id; // Get user id from token
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.status(200).json({
            success: true,
            userData: {
                _id: user._id,       // 🟢 THE FIX: Now React knows who you are!
                name: user.name,
                email: user.email,   // Added for future NodeMailer tickets
                city: user.city,     // Added for Dashboard filtering
                isVerified: user.isVerified,
            }
        });
    } catch (error) {
        console.error('getUserData error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, city, profession, age, gender } = req.body;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { bio, city, profession, age, gender },
            { new: true, runValidators: true } // Returns the newly updated document
        ).select('-password'); // Exclude password from the returned object

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, message: 'Profile updated', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Get Public Profile (For the Mini-Profile Modal)
export const getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Prevent server crashes by checking if the ID is a valid MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID format' });
        }

        // 2. Fetch the user
        const user = await userModel.findById(id)
            .select('name bio city profession age gender averageRating totalRatings');
            
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found in database' });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Get public profile error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Rate a User (Uber-style running average)
// Rate a User (Uber-style running average)
export const rateUser = async (req, res) => {
    try {
        const { targetUserId, rating, eventId } = req.body; 
        const raterId = req.user.id;

        // Basic validation
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }
        if (String(raterId) === String(targetUserId)) {
            return res.status(400).json({ success: false, message: 'You cannot rate yourself!' });
        }
        if (!eventId) {
            return res.status(400).json({ success: false, message: 'Event ID is required to submit a rating' });
        }

        // 🟢 1. Check if the event exists and if the user already rated it
        const event = await eventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.ratedBy.includes(raterId)) {
            return res.status(400).json({ success: false, message: 'You have already rated the host for this event.' });
        }

        // 🟢 2. Fetch target user and calculate new math
        const targetUser = await userModel.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User to rate not found' });
        }

        const currentTotal = targetUser.totalRatings || 0;
        const currentAverage = targetUser.averageRating || 0;

        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + Number(rating)) / newTotal;

        targetUser.averageRating = newAverage;
        targetUser.totalRatings = newTotal;
        await targetUser.save();

        // 🟢 3. Lock the rating so they can't spam it again
        event.ratedBy.push(raterId);
        await event.save();

        // 🟢 4. Notify the rated user in real-time (if they're connected)
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${targetUserId}`).emit('userRated', {
                    userId: String(targetUserId),
                    averageRating: targetUser.averageRating,
                    totalRatings: targetUser.totalRatings
                });
            }
        } catch (emitErr) {
            console.error('Failed to emit userRated socket event:', emitErr);
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Rating submitted successfully!',
            newRating: newAverage.toFixed(1)
        });

    } catch (error) {
        console.error('Rate user error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};