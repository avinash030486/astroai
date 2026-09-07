/**
 * useGyroCamera.ts
 *
 * Shared hook for all VR/immersive screens.
 * Returns device compass heading (0–360°) and pitch (tilt up/down in degrees)
 * using expo-location (heading) + expo-sensors DeviceMotion (tilt).
 *
 * No camera permission required — works purely with gyroscope + compass.
 *
 * Smooth low-pass filter is applied to both axes to eliminate sensor shiver/jitter.
 */

import { useState, useEffect, useRef } from 'react';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';
import * as Location from 'expo-location';

const RAD = 180 / Math.PI;

/**
 * Low-pass filter strength — 0 = raw (all jitter), 1 = frozen.
 * 0.12 keeps a nice responsive-but-smooth feel.
 */
const HEADING_ALPHA = 0.12;  // compass smoothing
const PITCH_ALPHA   = 0.15;  // tilt smoothing (slightly more aggressive)

/** Shortest-path interpolation for circular heading (handles 359° → 1° wrap). */
function lerpHeading(prev: number, next: number, alpha: number): number {
  let delta = next - prev;
  if (delta >  180) delta -= 360;
  if (delta < -180) delta += 360;
  return (prev + delta * alpha + 360) % 360;
}

export interface GyroCameraState {
  heading: number;   // smoothed compass bearing 0–360°
  pitch:   number;   // smoothed degrees — positive = tilting up, negative = down
  ready:   boolean;  // sensors are active
}

export function useGyroCamera(): GyroCameraState {
  const [heading, setHeading] = useState(180);
  const [pitch,   setPitch]   = useState(0);
  const [ready,   setReady]   = useState(false);

  // Mutable refs hold the current smoothed values between sensor callbacks
  // without triggering re-renders on every raw sample.
  const smoothHeading = useRef(180);
  const smoothPitch   = useRef(0);

  useEffect(() => {
    let headingSub: { remove: () => void } | null = null;
    let rafId: number | null = null;
    let running = true;

    // Publish smoothed values to React state at 30 fps — decoupled from raw 80ms sensor rate.
    const publishLoop = () => {
      if (!running) return;
      setHeading(h => {
        const next = smoothHeading.current;
        return Math.abs(lerpHeading(h, next, 1) - h) > 0.02 ? next : h; // skip no-op renders
      });
      setPitch(p => {
        const next = smoothPitch.current;
        return Math.abs(next - p) > 0.02 ? next : p;
      });
      rafId = requestAnimationFrame(publishLoop);
    };

    (async () => {
      // ── Compass ───────────────────────────────────────────────────────────
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const sub = await Location.watchHeadingAsync(h => {
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          smoothHeading.current = lerpHeading(smoothHeading.current, raw, HEADING_ALPHA);
        });
        headingSub = { remove: () => sub.remove() };
      }

      // ── Gyroscope pitch ───────────────────────────────────────────────────
      await DeviceMotion.requestPermissionsAsync();
      DeviceMotion.setUpdateInterval(50); // 20 fps raw; we smooth on top
      DeviceMotion.addListener((m: DeviceMotionMeasurement) => {
        if (m.rotation) {
          const rawPitch = (m.rotation.beta ?? 0) * RAD;
          smoothPitch.current = smoothPitch.current + (rawPitch - smoothPitch.current) * PITCH_ALPHA;
        }
      });

      setReady(true);
      publishLoop(); // start the animation-frame publish loop
    })();

    return () => {
      running = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      headingSub?.remove();
      DeviceMotion.removeAllListeners();
    };
  }, []);

  return { heading, pitch, ready };
}

// ── Shared coordinate-to-screen utility used by all VR screens ────────────────
export const VR_FOV_H = 75; // horizontal field-of-view (degrees)
export const VR_FOV_V = 55; // vertical field-of-view

export function vrToScreen(
  az: number, alt: number,
  deviceAz: number, devicePitch: number,
  W: number, H: number,
): { x: number; y: number; inView: boolean } {
  let dAz = az - deviceAz;
  if (dAz >  180) dAz -= 360;
  if (dAz < -180) dAz += 360;
  const dAlt   = alt - devicePitch;
  const inView = Math.abs(dAz) < VR_FOV_H / 2 && Math.abs(dAlt) < VR_FOV_V / 2;
  const x = W / 2 + (dAz  / (VR_FOV_H / 2)) * (W / 2);
  const y = H / 2 - (dAlt / (VR_FOV_V / 2)) * (H / 2);
  return { x, y, inView };
}
