/**
 * useSkyPlanets.ts
 *
 * Computes real-time planet positions in the sky using:
 *  - GPS (latitude/longitude)
 *  - Device compass (magnetic heading) + tilt (pitch from DeviceMotion)
 *  - Simplified VSOP87 mean-elements ephemeris (accurate to ~1°)
 *
 * Returns each planet's:
 *  - Azimuth / Altitude in the sky
 *  - Whether it's currently visible (above horizon)
 *  - Normalized screen X/Y based on device pointing direction
 *  - Jyotish (Vedic) sign, meaning, house (if birth chart provided)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import * as Location from 'expo-location';

// ── Constants ────────────────────────────────────────────────────────────────
const DEG  = Math.PI / 180;
const RAD  = 180 / Math.PI;
const FOV_H = 60; // horizontal field-of-view in degrees (typical Android camera)
const FOV_V = 45; // vertical field-of-view

// ── Vedic sign lookup (sidereal) ─────────────────────────────────────────────
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

// Lahiri ayanamsha approx for J2000 + drift
function ayanamsha(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return 23.85 + 0.0136 * T; // degrees
}

function eclipticToSidereal(lon: number, jd: number): number {
  return ((lon - ayanamsha(jd)) % 360 + 360) % 360;
}

function signFromLon(lon: number): string {
  return SIGNS[Math.floor(lon / 30) % 12];
}

// ── Julian Date ───────────────────────────────────────────────────────────────
function toJulianDate(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5;
}

// ── Simplified planet orbital elements ───────────────────────────────────────
// [L0, L1, a, e0, e1, I, w, W] – all in degrees except a (AU)
// Source: Meeus "Astronomical Algorithms" Ch. 33 (low precision, ~1° accuracy)
interface OrbElems { L0:number; L1:number; a:number; e0:number; e1:number; I:number; w:number; W:number; }

const PLANETS: Record<string, { elems: OrbElems; jyotishName: string; emoji: string; color: string; jyotishRole: string }> = {
  Sun: {
    jyotishName: 'Surya', emoji: '☀️', color: '#FFD700',
    jyotishRole: 'Soul, authority, vitality, father, government',
    elems: { L0:280.459, L1:36000.770, a:1.000, e0:0.01671, e1:-0.0000418, I:0, w:282.938, W:0 }
  },
  Moon: {
    jyotishName: 'Chandra', emoji: '🌙', color: '#C0C0C0',
    jyotishRole: 'Mind, emotions, mother, nurturing, public image',
    elems: { L0:218.316, L1:481267.881, a:0.00257, e0:0.0549, e1:0, I:5.145, w:318.015, W:125.045 }
  },
  Mars: {
    jyotishName: 'Mangal', emoji: '🔴', color: '#FF4500',
    jyotishRole: 'Courage, energy, siblings, property, ambition, surgery',
    elems: { L0:355.433, L1:19140.296, a:1.524, e0:0.09341, e1:0.000090, I:1.851, w:286.502, W:49.559 }
  },
  Mercury: {
    jyotishName: 'Budha', emoji: '🟢', color: '#7FFF00',
    jyotishRole: 'Intellect, communication, trade, analytical thinking, skin',
    elems: { L0:252.251, L1:149472.675, a:0.387, e0:0.20563, e1:-0.000021, I:7.005, w:77.456, W:48.331 }
  },
  Jupiter: {
    jyotishName: 'Guru', emoji: '🟡', color: '#FFA500',
    jyotishRole: 'Wisdom, expansion, spirituality, children, wealth, teacher',
    elems: { L0:34.396, L1:3034.746, a:5.203, e0:0.04839, e1:-0.000162, I:1.304, w:14.728, W:100.556 }
  },
  Venus: {
    jyotishName: 'Shukra', emoji: '⚪', color: '#FFFFFF',
    jyotishRole: 'Love, beauty, luxury, relationships, arts, vehicles',
    elems: { L0:181.979, L1:58517.816, a:0.723, e0:0.00677, e1:-0.000048, I:3.395, w:131.533, W:76.680 }
  },
  Saturn: {
    jyotishName: 'Shani', emoji: '🪐', color: '#9370DB',
    jyotishRole: 'Discipline, karma, delay, longevity, service, law',
    elems: { L0:50.078, L1:1222.114, a:9.537, e0:0.05415, e1:-0.000287, I:2.485, w:92.861, W:113.716 }
  },
  Rahu: {
    jyotishName: 'Rahu', emoji: '🌑', color: '#555',
    jyotishRole: 'Obsession, foreign things, ambition, illusion, sudden events',
    elems: { L0:125.045, L1:-1934.136, a:0, e0:0, e1:0, I:0, w:0, W:0 }
  },
  Ketu: {
    jyotishName: 'Ketu', emoji: '💫', color: '#888',
    jyotishRole: 'Detachment, spirituality, liberation, past karma, intuition',
    elems: { L0:305.045, L1:-1934.136, a:0, e0:0, e1:0, I:0, w:0, W:0 }
  },
};

// ── Compute ecliptic longitude ───────────────────────────────────────────────

// Sun geocentric longitude (also used to find Earth's heliocentric position)
function computeSunGeoLon(T: number): number {
  const p = PLANETS['Sun'].elems;
  const L = ((p.L0 + p.L1 * T) % 360 + 360) % 360;
  const e = p.e0 + p.e1 * T;
  const M = ((L - p.w) % 360 + 360) % 360;
  const Mrad = M * DEG;
  const C = (2 * e - e * e * e / 4) * Math.sin(Mrad)
          + (5 / 4) * e * e * Math.sin(2 * Mrad)
          + (13 / 12) * e * e * e * Math.sin(3 * Mrad);
  return ((L + C * RAD) % 360 + 360) % 360;
}

// Heliocentric (x, y) in AU for a planet (excludes Sun/Moon/nodes)
function computePlanetHelioXY(name: string, T: number): { x: number; y: number } {
  const p = PLANETS[name].elems;
  const L = ((p.L0 + p.L1 * T) % 360 + 360) % 360;
  const e = p.e0 + p.e1 * T;
  const M = ((L - p.w) % 360 + 360) % 360;
  const Mrad = M * DEG;
  const C = (2 * e - e * e * e / 4) * Math.sin(Mrad)
          + (5 / 4) * e * e * Math.sin(2 * Mrad)
          + (13 / 12) * e * e * e * Math.sin(3 * Mrad);
  const trueL = ((L + C * RAD) % 360 + 360) % 360;
  const nu    = ((trueL - p.w) % 360 + 360) % 360;  // true anomaly
  const r     = p.a * (1 - e * e) / (1 + e * Math.cos(nu * DEG));
  return { x: r * Math.cos(trueL * DEG), y: r * Math.sin(trueL * DEG) };
}

function computeLongitude(name: string, T: number): number {
  const p = PLANETS[name].elems;

  if (name === 'Rahu') return ((p.L0 + p.L1 * T) % 360 + 360) % 360;
  // Ketu = Rahu + 180°. L0=305.045 already = 125.045+180, so no extra +180 needed.
  if (name === 'Ketu') return ((p.L0 + p.L1 * T) % 360 + 360) % 360;

  // Sun and Moon: elements are already geocentric — use direct formula
  if (name === 'Sun' || name === 'Moon') {
    const L = ((p.L0 + p.L1 * T) % 360 + 360) % 360;
    const e = p.e0 + p.e1 * T;
    const M = ((L - p.w) % 360 + 360) % 360;
    const Mrad = M * DEG;
    const C = (2 * e - e * e * e / 4) * Math.sin(Mrad)
            + (5 / 4) * e * e * Math.sin(2 * Mrad)
            + (13 / 12) * e * e * e * Math.sin(3 * Mrad);
    return ((L + C * RAD) % 360 + 360) % 360;
  }

  // True planets: convert heliocentric → geocentric by subtracting Earth's position
  // Earth's heliocentric longitude is exactly opposite to the Sun's geocentric longitude
  const { x: xp, y: yp } = computePlanetHelioXY(name, T);
  const earthLon = (computeSunGeoLon(T) + 180) % 360;  // Earth heliocentric lon
  const xe = Math.cos(earthLon * DEG);                  // r_earth ≈ 1 AU
  const ye = Math.sin(earthLon * DEG);
  return ((Math.atan2(yp - ye, xp - xe) * RAD) % 360 + 360) % 360;
}

// ── Ecliptic lon → RA/Dec (approximate, obliquity ~23.44°) ───────────────────
function eclipticToEquatorial(lon: number, lat = 0): { ra: number; dec: number } {
  const eps = 23.44 * DEG;
  const lRad = lon * DEG;
  const bRad = lat * DEG;
  const ra = Math.atan2(
    Math.sin(lRad) * Math.cos(eps) - Math.tan(bRad) * Math.sin(eps),
    Math.cos(lRad)
  ) * RAD;
  const dec = Math.asin(
    Math.sin(bRad) * Math.cos(eps) + Math.cos(bRad) * Math.sin(eps) * Math.sin(lRad)
  ) * RAD;
  return { ra: (ra + 360) % 360, dec };
}

// ── RA/Dec → Azimuth/Altitude for observer ───────────────────────────────────
function toHorizon(ra: number, dec: number, lat: number, lst: number): { az: number; alt: number } {
  const H    = ((lst - ra) % 360 + 360) % 360;   // Hour angle
  const Hrad = H * DEG;
  const dRad = dec * DEG;
  const pRad = lat * DEG;

  const sinAlt = Math.sin(dRad) * Math.sin(pRad)
               + Math.cos(dRad) * Math.cos(pRad) * Math.cos(Hrad);
  const alt    = Math.asin(Math.min(1, Math.max(-1, sinAlt))) * RAD;

  const cosAz  = (Math.sin(dRad) - Math.sin(alt * DEG) * Math.sin(pRad))
               / (Math.cos(alt * DEG) * Math.cos(pRad));
  let az = Math.acos(Math.min(1, Math.max(-1, cosAz))) * RAD;
  if (Math.sin(Hrad) > 0) az = 360 - az;

  return { az, alt };
}

// ── Local Sidereal Time ───────────────────────────────────────────────────────
function localSiderealTime(jd: number, lon: number): number {
  const T  = (jd - 2451545.0) / 36525;
  const th = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
           + 0.000387933 * T * T - T * T * T / 38710000;
  return ((th + lon) % 360 + 360) % 360;
}

// ── Map sky position → screen XY ─────────────────────────────────────────────
function toScreenXY(
  planetAz: number, planetAlt: number,
  deviceAz: number, devicePitch: number,
  screenW: number, screenH: number
): { x: number; y: number; inView: boolean } {
  let dAz  = planetAz - deviceAz;
  if (dAz >  180) dAz -= 360;
  if (dAz < -180) dAz += 360;
  const dAlt = planetAlt - devicePitch;

  // Planet must be ≥2° above horizon AND device must be tilted ≥5° skyward.
  // — 5° prevents overlays on walls/floors while still catching low-altitude planets.
  const inView = Math.abs(dAz) < FOV_H / 2 && Math.abs(dAlt) < FOV_V / 2
               && planetAlt > 2 && devicePitch > 5;
  const x = screenW / 2 + (dAz  / (FOV_H / 2)) * (screenW / 2);
  const y = screenH / 2 - (dAlt / (FOV_V / 2)) * (screenH / 2);

  return { x, y, inView };
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SkyPlanet {
  name: string;
  jyotishName: string;
  emoji: string;
  color: string;
  jyotishRole: string;
  az: number;
  alt: number;
  siderealSign: string;
  tropicalLon: number;
  x: number;
  y: number;
  inView: boolean;
  aboveHorizon: boolean;
}

export interface UseSkyPlanetsOptions {
  screenWidth: number;
  screenHeight: number;
}

export interface UseSkyPlanetsResult {
  planets: SkyPlanet[];
  locationGranted: boolean;
  motionGranted: boolean;
  heading: number;
  pitch: number;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

// ── Main Hook ─────────────────────────────────────────────────────────────────
export function useSkyPlanets({ screenWidth, screenHeight }: UseSkyPlanetsOptions): UseSkyPlanetsResult {
  const [planets, setPlanets]               = useState<SkyPlanet[]>([]);
  const [locationGranted, setLocationGranted] = useState(false);
  const [motionGranted, setMotionGranted]   = useState(false);
  const [heading, setHeading]               = useState(0);
  const [pitch, setPitch]                   = useState(0);
  const [latitude, setLatitude]             = useState<number | null>(null);
  const [longitude, setLongitude]           = useState<number | null>(null);
  const [error, setError]                   = useState<string | null>(null);

  const headingRef  = useRef(0);
  const pitchRef    = useRef(0);
  const latRef      = useRef<number | null>(null);
  const lonRef      = useRef<number | null>(null);

  // Compute planets from current device state
  const computePlanets = useCallback(() => {
    const lat = latRef.current;
    const lon = lonRef.current;
    if (lat == null || lon == null) return;

    const now = new Date();
    const jd  = toJulianDate(now);
    const T   = (jd - 2451545.0) / 36525;
    const lst = localSiderealTime(jd, lon);

    const result: SkyPlanet[] = Object.entries(PLANETS).map(([name, data]) => {
      const tropicalLon = computeLongitude(name, T);
      const siderealLon = eclipticToSidereal(tropicalLon, jd);
      const sign        = signFromLon(siderealLon);
      const { ra, dec } = eclipticToEquatorial(tropicalLon);
      const { az, alt } = toHorizon(ra, dec, lat, lst);
      const { x, y, inView } = toScreenXY(az, alt, headingRef.current, pitchRef.current, screenWidth, screenHeight);

      return {
        name, jyotishName: data.jyotishName, emoji: data.emoji,
        color: data.color, jyotishRole: data.jyotishRole,
        az, alt, siderealSign: sign, tropicalLon,
        x, y, inView, aboveHorizon: alt > 0,
      };
    });

    setPlanets(result);
  }, [screenWidth, screenHeight]);

  // Request permissions and start sensors
  useEffect(() => {
    let headingSub: { remove: () => void } | null = null;
    let motionSub: { remove: () => void } | null = null;

    (async () => {
      // Location
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== 'granted') {
        setError('Location permission is required to show planets in your sky.');
        return;
      }
      setLocationGranted(true);

      // Get one-shot position
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      latRef.current = pos.coords.latitude;
      lonRef.current = pos.coords.longitude;
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      // Compass heading (uses Location API on Android)
      const headingSubscription = await Location.watchHeadingAsync(h => {
        const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        headingRef.current = deg;
        setHeading(deg);
      });
      headingSub = { remove: () => headingSubscription.remove() };

      // Device motion for pitch (tilt up/down)
      const { status: motionStatus } = await DeviceMotion.requestPermissionsAsync();
      setMotionGranted(motionStatus === 'granted');
      DeviceMotion.setUpdateInterval(150);
      motionSub = DeviceMotion.addListener((motion: DeviceMotionMeasurement) => {
        let deg = 0;
        if (motion.rotation?.beta != null) {
          // W3C DeviceMotion convention: beta=0 when device lies flat face-up
          // (camera pointing straight up = 90° elevation).
          // elevation = 90° − beta_deg  →  0° at horizon, 90° pointing straight up.
          deg = 90 - motion.rotation.beta * RAD;
        } else if (motion.accelerationIncludingGravity) {
          // Fallback: derive tilt from gravity vector when rotation is unavailable.
          // z-axis (away from screen back) opposes gravity when face-up → +9.81.
          const { x = 0, y = 0, z = 0 } = motion.accelerationIncludingGravity;
          const g = Math.sqrt(x * x + y * y + z * z) || 9.81;
          deg = Math.asin(Math.max(-1, Math.min(1, z / g))) * RAD;
        }
        pitchRef.current = deg;
        setPitch(deg);
      });

      setError(null);
    })();

    // Recompute planet positions every second
    const timer = setInterval(computePlanets, 1000);

    return () => {
      clearInterval(timer);
      headingSub?.remove();
      motionSub?.remove();
      DeviceMotion.removeAllListeners();
    };
  }, [computePlanets]);

  return { planets, locationGranted, motionGranted, heading, pitch, latitude, longitude, error };
}
