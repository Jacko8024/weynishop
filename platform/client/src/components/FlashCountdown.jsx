import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

export default function FlashCountdown({ endAt, compact = false, onEnd }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endAt).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const ms = Math.max(0, new Date(endAt).getTime() - Date.now());
      setRemaining(ms);
      if (ms === 0) { clearInterval(id); onEnd?.(); }
    }, 1000);
    return () => clearInterval(id);
  }, [endAt, onEnd]);

  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (compact) {
    return (
      <span className="price-num text-[11px] font-semibold text-flash">
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
    );
  }

  const Box = ({ v }) => (
    <span className="price-num inline-flex items-center justify-center w-9 h-9 rounded-md bg-black text-white text-base font-bold">
      {pad(v)}
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1">
      <Box v={h} />
      <span className="font-bold text-black">:</span>
      <Box v={m} />
      <span className="font-bold text-black">:</span>
      <Box v={s} />
    </span>
  );
}
