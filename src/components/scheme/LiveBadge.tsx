import React, { useRef, useState, useLayoutEffect } from 'react';
import type { DeviceLink } from '../../types/scheme.types';
import type { DeviceItem } from '../../pages/DashboardPage';

interface LiveBadgeProps {
  x: number;
  y: number;
  link: DeviceLink;
  device: DeviceItem;
  anchor?: 'middle' | 'bottom';
}

export const LiveBadge: React.FC<LiveBadgeProps> = ({ x, y, link, device, anchor = 'middle' }) => {
  const textRef = useRef<SVGTextElement>(null);
  const [tw, setTw] = useState(0);

  const parts: string[] = [];
  if (link.showValue && device.value)  parts.push(device.value);
  if (link.showStatus && device.status) parts.push(device.status);
  if (parts.length === 0) return null;
  const text = parts.join(' · ');

  useLayoutEffect(() => {
    if (textRef.current) {
      setTw(textRef.current.getComputedTextLength());
    }
  }, [text]);

  const hasAlarm = device.alarm === '1';
  const fill = hasAlarm ? '#ef4444' : '#10b981';
  const badgeW = tw + 12;

  return (
    <g>
      <rect x={x - badgeW / 2} y={anchor === 'bottom' ? y - 16 : y - 4}
        width={badgeW} height={16} rx={8}
        fill={hasAlarm ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}
        stroke={fill} strokeWidth={1} />
      <text ref={textRef} x={x} y={anchor === 'bottom' ? y - 8 : y + 4}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fontWeight="600" fill={fill}>
        {text}
      </text>
    </g>
  );
};
