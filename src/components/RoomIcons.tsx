import React from 'react';
import type { RoomAnimState } from '../types/scheme.types';

interface IconProps {
  state: RoomAnimState;
  size?: number;
}

// ── Mroźnia icon: snowflake ❄ ──────────────────────────────────────────────
export const MrozniaIcon: React.FC<IconProps> = ({ state, size = 48 }) => {
  const colorMap: Record<RoomAnimState, string> = {
    idle: '#94a3b8',
    active: '#06b6d4',
    warning: '#f59e0b',
    alarm: '#ef4444',
  };
  const color = colorMap[state];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`room-icon mroznia-icon state-${state}`}
    >
      {/* Central vertical bar */}
      <line x1="24" y1="4" x2="24" y2="44" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Central horizontal bar */}
      <line x1="4" y1="24" x2="44" y2="24" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Diagonals */}
      <line x1="9.37" y1="9.37" x2="38.63" y2="38.63" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="38.63" y1="9.37" x2="9.37" y2="38.63" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Branch tips – top */}
      <line x1="24" y1="4" x2="18" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="4" x2="30" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Branch tips – bottom */}
      <line x1="24" y1="44" x2="18" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="44" x2="30" y2="38" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Branch tips – left */}
      <line x1="4" y1="24" x2="10" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="24" x2="10" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Branch tips – right */}
      <line x1="44" y1="24" x2="38" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="44" y1="24" x2="38" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Centre dot */}
      <circle cx="24" cy="24" r="3.5" fill={color} />
    </svg>
  );
};

// ── Komora icon: storage crate / chamber ───────────────────────────────────
export const KomoraIcon: React.FC<IconProps> = ({ state, size = 48 }) => {
  const colorMap: Record<RoomAnimState, string> = {
    idle: '#94a3b8',
    active: '#8b5cf6',
    warning: '#f59e0b',
    alarm: '#ef4444',
  };
  const color = colorMap[state];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`room-icon komora-icon state-${state}`}
    >
      {/* Outer rectangle */}
      <rect x="6" y="10" width="36" height="28" rx="3" stroke={color} strokeWidth="3" />
      {/* Horizontal straps */}
      <line x1="6" y1="20" x2="42" y2="20" stroke={color} strokeWidth="2" />
      <line x1="6" y1="28" x2="42" y2="28" stroke={color} strokeWidth="2" />
      {/* Vertical strap */}
      <line x1="24" y1="10" x2="24" y2="38" stroke={color} strokeWidth="2" />
      {/* Corner dots */}
      <circle cx="15" cy="15" r="2" fill={color} />
      <circle cx="33" cy="15" r="2" fill={color} />
      <circle cx="15" cy="33" r="2" fill={color} />
      <circle cx="33" cy="33" r="2" fill={color} />
    </svg>
  );
};

export function getRoomIcon(
  type: 'mroznia' | 'komora',
  state: RoomAnimState,
  size?: number
): React.ReactElement {
  if (type === 'mroznia') return <MrozniaIcon state={state} size={size} />;
  return <KomoraIcon state={state} size={size} />;
}
