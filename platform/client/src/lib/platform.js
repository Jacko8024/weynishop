import { Capacitor } from '@capacitor/core';

/**
 * Platform detection — single source of truth.
 *
 * IMPORTANT (spec §31/§32): "mobile app" features (onboarding intro,
 * native Google sign-in, mobile-only address/location UX) must key off
 * ACTUAL NATIVE PLATFORM PRESENCE, never off screen width
 * (window.innerWidth < 768 would wrongly trigger on the website when
 * viewed on a phone — that was the original intro-on-website bug).
 *
 *   Website (any width, any device) → isNativeApp() === false
 *   Capacitor Android/iOS app       → isNativeApp() === true
 */

/** True only inside the native Capacitor app (Android APK / iOS build). */
export const isNativeApp = () => Capacitor.isNativePlatform();

/** True on the normal website (desktop OR mobile browser). */
export const isWebApp = () => !Capacitor.isNativePlatform();

/** Native platform name ('android' | 'ios' | 'web'). */
export const nativePlatform = () => Capacitor.getPlatform();
