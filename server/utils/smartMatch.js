import Event from '../models/eventModel.js';
import User from '../models/userModel.js';

/**
 * Smart Match Score Engine
 * Computes a 0-100 compatibility score between a user and an event.
 * 
 * Factors (weights sum to 1.0):
 *   - Category Affinity   (0.30): How often the user joins events in this category
 *   - Host Reliability     (0.25): Host's trust score, rating, completion rate
 *   - Freshness/Urgency    (0.15): Events happening soon score higher
 *   - Social Proof         (0.15): Fill rate — events with more approved members attract more
 *   - Demographic Fit      (0.10): Age bracket similarity between user and host
 *   - Availability Match   (0.05): Does the event day match user's availability slots?
 */

const WEIGHTS = {
  categoryAffinity: 0.30,
  hostReliability: 0.25,
  freshness: 0.15,
  socialProof: 0.15,
  demographicFit: 0.10,
  availabilityMatch: 0.05,
};

/**
 * Build a category affinity map for a user based on their past event participation.
 * Returns { Cricket: 0.4, Football: 0.3, ... } (normalized to 0-1)
 */
async function buildCategoryAffinity(userId) {
  const pastEvents = await Event.find({
    $or: [
      { creator: userId },
      { 'requests.user': userId, 'requests.status': 'approved' },
    ],
    status: { $in: ['completed', 'upcoming', 'live'] },
  }).select('category').lean();

  if (pastEvents.length === 0) return {};

  const counts = {};
  for (const e of pastEvents) {
    counts[e.category] = (counts[e.category] || 0) + 1;
  }

  const max = Math.max(...Object.values(counts));
  const affinity = {};
  for (const [cat, count] of Object.entries(counts)) {
    affinity[cat] = count / max; // Normalize to 0-1
  }
  return affinity;
}

/**
 * Compute the match score between a user and a single event.
 * @param {Object} user - The user document (with age, availability, city)
 * @param {Object} event - The event document (populated with creator)
 * @param {Object} categoryAffinity - Pre-built affinity map for this user
 * @returns {number} Score 0-100
 */
function computeMatchScore(user, event, categoryAffinity) {
  const scores = {};

  // 1. Category Affinity (0-100)
  scores.categoryAffinity = (categoryAffinity[event.category] || 0) * 100;

  // 2. Host Reliability (0-100)
  const host = event.creator;
  if (host && typeof host === 'object') {
    const ratingScore = (host.averageRating || 0) * 20; // 0-100
    const trustScore = host.trustScore || 50;
    scores.hostReliability = ratingScore * 0.5 + trustScore * 0.5;
  } else {
    scores.hostReliability = 50; // Default for unknown host
  }

  // 3. Freshness / Urgency (0-100)
  // Events happening within 24h get max score, decays over 7 days
  const eventDate = new Date(event.date);
  const now = new Date();
  const hoursUntil = Math.max(0, (eventDate - now) / (1000 * 60 * 60));
  if (hoursUntil <= 24) {
    scores.freshness = 100;
  } else if (hoursUntil <= 72) {
    scores.freshness = 80;
  } else if (hoursUntil <= 168) { // 7 days
    scores.freshness = 60 - ((hoursUntil - 72) / 96) * 20;
  } else {
    scores.freshness = Math.max(10, 40 - (hoursUntil - 168) / 24);
  }

  // 4. Social Proof (0-100)
  // Fill rate: events that are 40-80% full are most attractive (sweet spot)
  const approvedCount = event.requests?.filter(r => r.status === 'approved').length || 0;
  const fillRate = event.requiredPeople > 0 ? approvedCount / event.requiredPeople : 0;
  if (fillRate >= 0.9) {
    scores.socialProof = 60; // Almost full — urgency but less room
  } else if (fillRate >= 0.4) {
    scores.socialProof = 100; // Sweet spot
  } else if (fillRate > 0) {
    scores.socialProof = 50 + fillRate * 75;
  } else {
    scores.socialProof = 30; // No one yet — lower confidence
  }

  // 5. Demographic Fit (0-100)
  // Age bracket: users within 5 years of host age get full score
  if (host && typeof host === 'object' && host.age && user.age) {
    const ageDiff = Math.abs(user.age - host.age);
    if (ageDiff <= 3) scores.demographicFit = 100;
    else if (ageDiff <= 5) scores.demographicFit = 80;
    else if (ageDiff <= 10) scores.demographicFit = 60;
    else scores.demographicFit = Math.max(20, 50 - ageDiff);
  } else {
    scores.demographicFit = 50; // Unknown
  }

  // 6. Availability Match (0-100)
  const eventDay = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  if (user.availability && user.availability.length > 0) {
    const matchingSlot = user.availability.find(slot => slot.day === eventDay);
    scores.availabilityMatch = matchingSlot ? 100 : 20;
  } else {
    scores.availabilityMatch = 50; // No availability set — neutral
  }

  // Weighted sum
  let totalScore = 0;
  for (const [factor, weight] of Object.entries(WEIGHTS)) {
    totalScore += (scores[factor] || 0) * weight;
  }

  return {
    total: Math.round(Math.min(100, Math.max(0, totalScore))),
    breakdown: scores,
  };
}

/**
 * Score and rank events for a specific user.
 * @param {string} userId 
 * @param {Array} events - Array of event documents (populated with creator)
 * @returns {Array} Events sorted by match score desc, each with `matchScore` field
 */
export async function rankEventsForUser(userId, events) {
  const user = await User.findById(userId).select('age city availability').lean();
  if (!user) return events;

  const categoryAffinity = await buildCategoryAffinity(userId);

  const scored = events.map(event => {
    const eventObj = event.toObject ? event.toObject() : { ...event };
    const { total, breakdown } = computeMatchScore(user, eventObj, categoryAffinity);
    return {
      ...eventObj,
      matchScore: total,
      matchBreakdown: breakdown,
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored;
}

/**
 * Get "For You" recommendations — top N events for a user
 */
export async function getRecommendations(userId, city, limit = 10) {
  const user = await User.findById(userId).select('age city availability blockedUsers').lean();
  if (!user) return [];

  const blockedIds = (user.blockedUsers || []).map(b => b.blockedUser);

  const events = await Event.find({
    status: { $in: ['upcoming', 'live'] },
    city: city || user.city,
    creator: { $nin: [...blockedIds, userId] }, // Exclude blocked & own events
  })
    .populate('creator', 'name averageRating totalRatings trustScore age')
    .lean();

  const categoryAffinity = await buildCategoryAffinity(userId);

  const scored = events
    .filter(e => e.creator) // Skip ghost events
    .map(event => {
      const { total, breakdown } = computeMatchScore(user, event, categoryAffinity);
      return { ...event, matchScore: total, matchBreakdown: breakdown };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return scored;
}

export { buildCategoryAffinity, computeMatchScore };
