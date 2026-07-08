import { useState, useEffect, useCallback } from 'react';
import { reverseGeocode, ipToLocation } from '../utils/locationToConstituency.js';

const STORAGE_KEY = 'pp_constituency';

/**
 * useLocation — detects user location and reverse geocodes to constituency name
 *
 * Strategy:
 * 1. Try navigator.geolocation.getCurrentPosition
 * 2. If denied / unavailable, fall back to IP geolocation (ipapi.co)
 * 3. Reverse geocode coordinates via Nominatim → constituency name
 *
 * Returns: { constituency, lat, lon, loading, error, retry }
 */
export default function useLocation() {
  const [constituency, setConstituency] = useState(
    () => localStorage.getItem(STORAGE_KEY) || null
  );
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(async () => {
    setLoading(true);
    setError(null);

    let coords = null;

    // Step 1: Browser geolocation
    if (navigator.geolocation) {
      try {
        coords = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => reject(err),
            { timeout: 8000, maximumAge: 300000 }
          );
        });
      } catch (geoErr) {
        // Permission denied or unavailable — fall through to IP fallback
        console.info('Geolocation unavailable, falling back to IP:', geoErr.message);
      }
    }

    // Step 2: IP geolocation fallback
    if (!coords) {
      const ipLoc = await ipToLocation();
      if (ipLoc) {
        coords = { lat: ipLoc.lat, lon: ipLoc.lon };
      }
    }

    if (!coords) {
      setError('Could not determine your location. Please select your constituency manually.');
      setLoading(false);
      return;
    }

    setLat(coords.lat);
    setLon(coords.lon);

    // Step 3: Reverse geocode to constituency
    const name = await reverseGeocode(coords.lat, coords.lon);

    if (name) {
      setConstituency(name);
      localStorage.setItem(STORAGE_KEY, name);
    } else {
      setError('Location detected but could not identify constituency. Please select manually.');
    }

    setLoading(false);
  }, []);

  const updateConstituency = useCallback((name) => {
    setConstituency(name);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

  useEffect(() => {
    // Only auto-detect if we don't already have a cached constituency
    if (!constituency) {
      detect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { 
    constituency, 
    lat, 
    lon, 
    loading, 
    error, 
    retry: detect, 
    setConstituency: updateConstituency 
  };
}
