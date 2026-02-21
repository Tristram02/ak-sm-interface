import React from 'react';
import type { DeviceItem } from '../../pages/DashboardPage';

export const STATUS_BG: Record<string, string> = {
  'Normal':            'rgba(16,185,129,0.12)',
  'Normal ctrl.':      'rgba(16,185,129,0.12)',
  'Adaptive SH ctrl':  'rgba(6,182,212,0.12)',
  'Modulating temp.':  'rgba(6,182,212,0.12)',
  'Standby':           'rgba(148,163,184,0.08)',
  'Defrost':           'rgba(59,130,246,0.12)',
  'Heat reclaim':      'rgba(245,158,11,0.12)',
  'Ther. cutout':      'rgba(245,158,11,0.12)',
  'AlmOff':            'rgba(148,163,184,0.08)',
  'err':               'rgba(239,68,68,0.12)',
};

export const STATUS_COL: Record<string, string> = {
  'Normal':            '#10b981',
  'Normal ctrl.':      '#10b981',
  'Adaptive SH ctrl':  '#06b6d4',
  'Modulating temp.':  '#06b6d4',
  'Standby':           '#94a3b8',
  'Defrost':           '#3b82f6',
  'Heat reclaim':      '#f59e0b',
  'Ther. cutout':      '#f59e0b',
  'AlmOff':            '#94a3b8',
  'err':               '#ef4444',
};

interface DeviceTableProps {
  items: DeviceItem[];
  emptyMsg: string;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({ items, emptyMsg }) => {
  if (items.length === 0) return <p className="dash-empty">{emptyMsg}</p>;
  return (
    <div className="dp-table-wrap">
      <table className="dp-table">
        <thead>
          <tr><th>Nazwa</th><th>Typ</th><th>Wartość</th><th>Setpoint</th><th>Status</th><th>⚠</th></tr>
        </thead>
        <tbody>
          {items.map((d, i) => {
            if (d.isGroup) {
              return (
                <tr key={i} className="dp-row-group">
                  <td colSpan={6} className="dp-cell-group">🏭 {d.name}</td>
                </tr>
              );
            }
            const hasAlarm = d.alarm === '1';
            const bg  = hasAlarm ? 'rgba(239,68,68,0.12)' : (STATUS_BG[d.status]  ?? '');
            const col = hasAlarm ? '#ef4444'              : (STATUS_COL[d.status] ?? 'var(--text-muted)');
            const indentPx = 0.6 + Number(d.indent || 0) * 0.8;
            return (
              <tr key={i} style={{ background: bg }}>
                <td className="dp-cell-descr" style={{ paddingLeft: `${indentPx}rem` }}>
                  {d.name || '—'}
                </td>
                <td className="dp-cell-tag">{d.type || '—'}</td>
                <td className="dp-cell-val">{d.value || '—'}</td>
                <td className="dp-cell-extra">{d.ctrlVal || '—'}</td>
                <td>
                  <span className="dp-status-badge" style={{ color: col, borderColor: col }}>
                    {d.defrost === '1' ? '🧊 ' : ''}{d.status || '—'}
                  </span>
                </td>
                <td className="dp-cell-alarm">{hasAlarm ? '🚨' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
