/**
 * Extract Tehsil/Taluk from address details, matching against our supported seeds list if possible.
 */
export function getTehsilFromAddress(addr) {
  if (!addr) return null;

  const fields = [
    addr.subdistrict,
    addr.suburb,
    addr.city_district,
    addr.town,
    addr.village,
    addr.city,
    addr.county
  ].filter(Boolean);

  const supportedTehsils = [
    'Varanasi', 'Pindra', 'Raja Talab',
    'Lucknow', 'Malihabad', 'Bakshi Ka Talab', 'Mohanlalganj', 'Chinhat', 'Kakori',
    'New Delhi', 'Chanakyapuri', 'Delhi Cantonment', 'Vasant Vihar', 'Connaught Place', 'Karol Bagh',
    'Borivali', 'Kandivali', 'Dahisar', 'Malad',
    'Bengaluru North', 'Bengaluru South', 'Bengaluru East', 'Shivajinagar', 'Vasanth Nagar'
  ];

  for (const f of fields) {
    const val = f.toLowerCase().trim();
    for (const t of supportedTehsils) {
      if (val.includes(t.toLowerCase()) || t.toLowerCase().includes(val)) {
        return t;
      }
    }
  }

  // Fallback to first available address field
  return fields[0] || null;
}

/**
 * Reverse geocode lat/lon → Tehsil name via Nominatim (OpenStreetMap)
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

    return getTehsilFromAddress(addr);
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

    if (res.ok) {
      const data = await res.json();
      if (data && !data.error && data.latitude && data.longitude) {
        return {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city || null,
          region: data.region || null,
        };
      }
    }
  } catch (err) {
    console.warn('ipapi.co failed:', err.message);
  }

  // Fallback to ip-api.com
  try {
    const res = await fetch('https://ip-api.com/json/');
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && data.lat && data.lon) {
        return {
          lat: data.lat,
          lon: data.lon,
          city: data.city || null,
          region: data.regionName || null,
        };
      }
    }
  } catch (err) {
    console.warn('ip-api.com failed:', err.message);
  }

  return null;
}
