import userModel from '../models/userModel.js';
import mongoose from 'mongoose';
import eventModel from '../models/eventModel.js';
import Notification from '../models/notificationModel.js';
import { checkAndGrantBadges } from '../utils/badgeEngine.js';

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
                _id: user._id,
                name: user.name,
                email: user.email,
                city: user.city,
                isVerified: user.isVerified,
                trustScore: user.trustScore || 50,
                availability: user.availability || [],
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
        const { bio, city, profession, age, gender, availability } = req.body;

        const updateData = {};
        if (bio !== undefined) updateData.bio = bio;
        if (city !== undefined) updateData.city = city;
        if (profession !== undefined) updateData.profession = profession;
        if (age !== undefined) updateData.age = age;
        if (gender !== undefined) updateData.gender = gender;
        if (availability !== undefined) updateData.availability = availability;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

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
            .select('name bio city profession age gender averageRating totalRatings trustScore eventsHosted eventsCompleted');
            
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

        // 1. Check if the event exists and is completed
        const event = await eventModel.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'You can only rate after the event is completed.' });
        }
        if (event.ratedBy.includes(raterId)) {
            return res.status(400).json({ success: false, message: 'You have already rated the host for this event.' });
        }

        // Verify the rater was an approved attendee or the host
        const isHost = String(event.creator) === String(raterId);
        const isApprovedGuest = event.requests.some(
            r => String(r.user) === String(raterId) && r.status === 'approved'
        );
        if (!isHost && !isApprovedGuest) {
            return res.status(403).json({ success: false, message: 'Only event participants can rate.' });
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
        // Recompute trust score
        if (typeof targetUser.computeTrustScore === 'function') {
            targetUser.computeTrustScore();
        }
        await targetUser.save();

        // Lock the rating so they can't spam it again
        event.ratedBy.push(raterId);
        await event.save();

        // Notify the rated user
        const notif = new Notification({
            recipient: targetUserId,
            sender: raterId,
            type: 'user_rated',
            message: `Someone rated you ${rating}/5 for "${event.title}"`,
            relatedEvent: eventId,
        });
        await notif.save();

        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`user:${targetUserId}`).emit('userRated', {
                    userId: String(targetUserId),
                    averageRating: targetUser.averageRating,
                    totalRatings: targetUser.totalRatings
                });
                io.to(`user:${targetUserId}`).emit('newNotification', notif);
            }
        } catch (emitErr) {
            // Non-critical - continue
        }

        // Check badges for the rated user (might earn 5-star host, top rated, etc.)
        try {
            const io = req.app.get('io');
            checkAndGrantBadges(targetUserId, io).catch(() => {});
        } catch (_) {}

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