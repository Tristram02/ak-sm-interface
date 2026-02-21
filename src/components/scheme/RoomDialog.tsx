import React, { useState } from 'react';
import { ROOM_COLORS } from '../../utils/schemeHelpers';

interface RoomDialogProps {
  rows: number;
  cols: number;
  onConfirm: (label: string, colorIdx: number) => void;
  onCancel: () => void;
}

export const RoomDialog: React.FC<RoomDialogProps> = ({ rows, cols, onConfirm, onCancel }) => {
  const [label, setLabel] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  return (
    <div className="device-picker-dialog">
      <p className="dpd-title">Nowe pomieszczenie</p>
      <p className="dpd-info">{rows} × {cols} komórek</p>
      <div className="dpd-field">
        <label>Nazwa</label>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Np. Chłodnia A" autoFocus />
      </div>
      <div className="dpd-field">
        <label>Kolor</label>
        <div className="dpd-color-row">
          {ROOM_COLORS.map((c, i) => (
            <button key={i} className={`dpd-color-swatch ${colorIdx === i ? 'selected' : ''}`}
              style={{ background: c.border }} onClick={() => setColorIdx(i)} />
          ))}
        </div>
      </div>
      <div className="dpd-actions">
        <button className="dpd-cancel" onClick={onCancel}>Anuluj</button>
        <button className="dpd-confirm" onClick={() => onConfirm(label || 'Pomieszczenie', colorIdx)}>
          Dodaj
        </button>
      </div>
    </div>
  );
};
