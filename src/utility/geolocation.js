/**
 * Browser Geolocation utility for auto-detecting user's city.
 * Falls back gracefully if geolocation is unavailable or denied.
 */

// Major Indian city coordinates for reverse-geocoding without an external API
const CITY_COORDS = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest supported city from coordinates
 */
function findNearestCity(lat, lng) {
  let nearest = null;
  let minDistance = Infinity;

  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const dist = haversineDistance(lat, lng, coords.lat, coords.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  // Only return if within 100km of a supported city
  return minDistance <= 100 ? nearest : null;
}

/**
 * Get user's current position using browser Geolocation API
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Auto-detect the user's city using browser geolocation
 * Falls back to null if unavailable, denied, or not near a supported city.
 * @returns {Promise<string|null>}
 */
export async function detectCity() {
  try {
    const { lat, lng } = await getCurrentPosition();
    const city = findNearestCity(lat, lng);
    return city;
  } catch (err) {
    console.warn('[Geo] City detection failed:', err.message);
    return null;
  }
}

/**
 * Check if geolocation permission is already granted (no prompt)
 * @returns {Promise<boolean>}
 */
export async function isGeolocationPermitted() {
  try {
    if (!('permissions' in navigator)) return false;
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted';
  } catch {
    return false;
  }
}

export { CITY_COORDS, findNearestCity };
