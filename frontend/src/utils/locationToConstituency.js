/**
 * Reverse geocode lat/lon → constituency name via Nominatim (OpenStreetMap)
 * Priority: county > state_district > city_district > suburb > city
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PeoplesPriorities/1.0 (constituency-platform)',
      },
    });

    if (!res.ok) {
      console.warn(`Nominatim returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const addr = data?.address;

    if (!addr) return null;

    const constituency =
      addr.county ||
      addr.state_district ||
      addr.city_district ||
      addr.suburb ||
      addr.city ||
      addr.town ||
      addr.village ||
      null;

    return constituency || null;
  } catch (err) {
    console.warn('reverseGeocode failed:', err.message);
    return null;
  }
}

/**
 * Get approximate location from IP using ipapi.co
 * Returns { lat, lon, city, region } or null on failure
 */
export async function ipToLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.warn(`ipapi.co returned status ${res.status}`);
      return null;
    }

    const data = await res.json();

    if (data.error) {
      console.warn('ipapi.co error:', data.reason);
      return null;
    }

    if (!data.latitude || !data.longitude) {
      console.warn('ipapi.co: no coordinates in response');
      return null;
    }

    return {
      lat: data.latitude,
      lon: data.longitude,
      city: data.city || null,
      region: data.region || null,
    };
  } catch (err) {
    console.warn('ipToLocation failed:', err.message);
    return null;
  }
}
