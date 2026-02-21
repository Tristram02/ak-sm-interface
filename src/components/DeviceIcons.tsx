import React from 'react';
import type { DeviceIconType } from '../types/scheme.types';

interface IconProps { size?: number; color?: string; }

const CoolerIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="8" width="24" height="16" rx="3" />
    <line x1="4" y1="14" x2="28" y2="14" />
    <circle cx="10" cy="19" r="2" />
    <circle cx="22" cy="19" r="2" />
    <line x1="10" y1="17" x2="10" y2="14" />
    <line x1="22" y1="17" x2="22" y2="14" />
    <path d="M13 11 L16 8 L19 11" />
  </svg>
);

const CompressorIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="11" />
    <circle cx="16" cy="16" r="5" />
    <line x1="16" y1="5" x2="16" y2="11" />
    <line x1="16" y1="21" x2="16" y2="27" />
    <line x1="5" y1="16" x2="11" y2="16" />
    <line x1="21" y1="16" x2="27" y2="16" />
  </svg>
);

const EvaporatorIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="26" height="20" rx="2" />
    <line x1="3" y1="12" x2="29" y2="12" />
    <line x1="3" y1="18" x2="29" y2="18" />
    <line x1="3" y1="24" x2="29" y2="24" />
    <line x1="9"  y1="6" x2="9"  y2="26" strokeDasharray="2 2" />
    <line x1="16" y1="6" x2="16" y2="26" strokeDasharray="2 2" />
    <line x1="23" y1="6" x2="23" y2="26" strokeDasharray="2 2" />
  </svg>
);

const SensorIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="22" r="4" fill={color} opacity="0.3" />
    <line x1="16" y1="5" x2="16" y2="18" />
    <rect x="13" y="5" width="6" height="14" rx="3" />
    <path d="M8 10 Q4 16 8 22" strokeDasharray="2 2" />
    <path d="M24 10 Q28 16 24 22" strokeDasharray="2 2" />
  </svg>
);

const PumpIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="9" />
    <path d="M16 7 L20 16 L16 25 L12 16 Z" />
    <line x1="7"  y1="16" x2="4"  y2="16" />
    <line x1="25" y1="16" x2="28" y2="16" />
  </svg>
);

const FanIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="3" />
    <path d="M16 13 C16 10 12 6 8 8 C6 12 10 16 13 16" />
    <path d="M19 16 C22 16 26 12 24 8 C20 6 16 10 16 13" />
    <path d="M16 19 C16 22 20 26 24 24 C26 20 22 16 19 16" />
    <path d="M13 16 C10 16 6 20 8 24 C12 26 16 22 16 19" />
  </svg>
);

const ValveIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <polygon points="8,8 24,8 16,16" />
    <polygon points="8,24 24,24 16,16" />
    <line x1="3"  y1="16" x2="8"  y2="16" />
    <line x1="24" y1="16" x2="29" y2="16" />
    <line x1="16" y1="4"  x2="16" y2="8"  />
  </svg>
);

const GenericIcon: React.FC<IconProps> = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="20" height="20" rx="4" />
    <circle cx="16" cy="16" r="4" />
    <line x1="16" y1="6" x2="16" y2="12" />
    <line x1="16" y1="20" x2="16" y2="26" />
    <line x1="6" y1="16" x2="12" y2="16" />
    <line x1="20" y1="16" x2="26" y2="16" />
  </svg>
);

const ICON_MAP: Record<DeviceIconType, React.FC<IconProps>> = {
  cooler:     CoolerIcon,
  compressor: CompressorIcon,
  evaporator: EvaporatorIcon,
  sensor:     SensorIcon,
  pump:       PumpIcon,
  fan:        FanIcon,
  valve:      ValveIcon,
  generic:    GenericIcon,
};

export const ICON_LABELS: Record<DeviceIconType, string> = {
  cooler:     'Chłodnica',
  compressor: 'Agregat',
  evaporator: 'Parownik',
  sensor:     'Czujnik',
  pump:       'Pompa',
  fan:        'Wentylator',
  valve:      'Zawór',
  generic:    'Inne',
};

export const DEVICE_ICON_TYPES: DeviceIconType[] = [
  'cooler', 'compressor', 'evaporator', 'sensor', 'pump', 'fan', 'valve', 'generic',
];

export const getDeviceIcon = (type: DeviceIconType, size = 28, color = 'currentColor'): React.ReactElement => {
  const Comp = ICON_MAP[type] ?? GenericIcon;
  return <Comp size={size} color={color} />;
};
