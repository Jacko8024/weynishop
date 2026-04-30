import { useState } from 'react';
import { Crosshair, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Reusable "Use my current location" button.
 *
 * Props:
 *  - onLocate({ lat, lng, accuracy }) — called on success
 *  - className — extra classes for the button
 *  - label — button text (default: "Use my current location")
 *
 * Handles permission denied / unavailable / timeout with friendly toasts.
 */
export default function GeolocationButton({ onLocate, className = '', label = 'Use my current location' }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported on this device.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        onLocate?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        toast.success('Location captured');
      },
      (err) => {
        setLoading(false);
        let message = 'Could not get your location. Please try again.';
        if (err.code === err.PERMISSION_DENIED) {
          message = 'Location permission denied. Please enable it in your browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = 'Your location is currently unavailable. Try again outdoors or with better signal.';
        } else if (err.code === err.TIMEOUT) {
          message = 'Locating timed out. Please try again.';
        }
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`btn-secondary text-sm gap-2 ${className}`}
      aria-busy={loading}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
      <span>{loading ? 'Locating…' : label}</span>
    </button>
  );
}
