import mongoose from 'mongoose';

/**
 * Badge definitions (static catalog)
 * Badges are auto-computed, never manually assigned.
 */
export const BADGE_CATALOG = {
  first_event: {
    id: 'first_event',
    name: 'First Step',
    description: 'Hosted your first event',
    icon: '🎉',
    tier: 'bronze',
    condition: (user) => user.eventsHosted >= 1,
  },
  five_events: {
    id: 'five_events',
    name: 'Event Organizer',
    description: 'Hosted 5 events',
    icon: '🏆',
    tier: 'silver',
    condition: (user) => user.eventsHosted >= 5,
  },
  ten_events: {
    id: 'ten_events',
    name: 'Community Builder',
    description: 'Hosted 10 events',
    icon: '🌟',
    tier: 'gold',
    condition: (user) => user.eventsHosted >= 10,
  },
  twenty_five_events: {
    id: 'twenty_five_events',
    name: 'Event Master',
    description: 'Hosted 25 events',
    icon: '👑',
    tier: 'platinum',
    condition: (user) => user.eventsHosted >= 25,
  },
  five_star_host: {
    id: 'five_star_host',
    name: '5-Star Host',
    description: 'Achieved a perfect 5.0 average rating with 5+ ratings',
    icon: '⭐',
    tier: 'gold',
    condition: (user) => user.averageRating >= 4.9 && user.totalRatings >= 5,
  },
  top_rated: {
    id: 'top_rated',
    name: 'Top Rated',
    description: 'Average rating above 4.5 with 10+ ratings',
    icon: '💎',
    tier: 'platinum',
    condition: (user) => user.averageRating >= 4.5 && user.totalRatings >= 10,
  },
  trusted_member: {
    id: 'trusted_member',
    name: 'Trusted Member',
    description: 'Achieved trust score above 80',
    icon: '🛡️',
    tier: 'silver',
    condition: (user) => (user.trustScore || 0) >= 80,
  },
  reliable_host: {
    id: 'reliable_host',
    name: 'Reliable Host',
    description: 'Completed 5+ events with 0 cancellations',
    icon: '✅',
    tier: 'gold',
    condition: (user) => user.eventsCompleted >= 5 && (user.eventsCancelled || 0) === 0,
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Joined 10+ events hosted by others',
    icon: '🦋',
    tier: 'silver',
    // This one needs event count — checked separately
    condition: null, // Special handling
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran',
    description: 'Account older than 6 months',
    icon: '🎖️',
    tier: 'bronze',
    condition: (user) => {
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
      return (Date.now() - new Date(user.createdAt).getTime()) >= sixMonths;
    },
  },
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during the first month of launch',
    icon: '🚀',
    tier: 'gold',
    condition: (user) => {
      // First month: before Feb 2025 (adjust as needed)
      return new Date(user.createdAt) <= new Date('2025-08-01');
    },
  },
};

const badgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true,
  },
  badgeId: {
    type: String,
    required: true,
    enum: Object.keys(BADGE_CATALOG),
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Compound unique index: a user can only earn each badge once
badgeSchema.index({ user: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
