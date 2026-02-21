import React, { useState } from 'react';
import type { DeviceIconType } from '../../types/scheme.types';
import { getDeviceIcon, ICON_LABELS, DEVICE_ICON_TYPES } from '../DeviceIcons';

interface DevicePickerDialogProps {
  onConfirm: (iconType: DeviceIconType, label: string) => void;
  onCancel: () => void;
}

export const DevicePickerDialog: React.FC<DevicePickerDialogProps> = ({ onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<DeviceIconType>('generic');
  const [label, setLabel] = useState('');

  return (
    <div className="device-picker-dialog">
      <p className="dpd-title">Wybierz typ urządzenia</p>
      <div className="dpd-grid">
        {DEVICE_ICON_TYPES.map(t => (
          <button key={t} className={`dpd-option ${selected === t ? 'selected' : ''}`}
            onClick={() => setSelected(t)}>
            {getDeviceIcon(t, 30, selected === t ? '#38bdf8' : '#94a3b8')}
            <span>{ICON_LABELS[t]}</span>
          </button>
        ))}
      </div>
      <div className="dpd-field">
        <label>Etykieta</label>
        <input value={label} onChange={e => setLabel(e.target.value)}
          placeholder={ICON_LABELS[selected]} />
      </div>
      <div className="dpd-actions">
        <button className="dpd-cancel" onClick={onCancel}>Anuluj</button>
        <button className="dpd-confirm" onClick={() => onConfirm(selected, label || ICON_LABELS[selected])}>
          Dodaj
        </button>
      </div>
    </div>
  );
};
