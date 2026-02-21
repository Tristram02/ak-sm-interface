import React, { useState, useEffect } from 'react';

interface RefreshCountdownProps {
  interval: number;
}

export const RefreshCountdown: React.FC<RefreshCountdownProps> = ({ interval }) => {
  const [seconds, setSeconds] = useState(interval);
  useEffect(() => {
    setSeconds(interval);
    const tick = setInterval(() => setSeconds(s => s <= 1 ? interval : s - 1), 1000);
    return () => clearInterval(tick);
  }, [interval]);

  return (
    <div className="refresh-countdown">
      <div className="rc-label">Następne odświeżenie za <strong>{seconds}s</strong></div>
      <div className="rc-bar"><div className="rc-fill" style={{ width: `${((interval - seconds) / interval) * 100}%` }} /></div>
    </div>
  );
};
