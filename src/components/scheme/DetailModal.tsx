import React from 'react';
import type { SchemeObject } from '../../types/scheme.types';
import { getDeviceIcon, ICON_LABELS } from '../DeviceIcons';
import type { DeviceItem } from '../../pages/DashboardPage';

interface DetailModalProps {
  obj: SchemeObject;
  deviceItems: DeviceItem[];
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ obj, deviceItems, onClose }) => {
  const linked = obj.deviceLink
    ? deviceItems.find(d => d.name === obj.deviceLink!.deviceName)
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box detail-modal-box" onClick={e => e.stopPropagation()}>
        <div className="detail-modal-header">
          <h2>{obj.label}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {obj.kind === 'device' && obj.iconType && (
          <div className="detail-modal-icon">
            {getDeviceIcon(obj.iconType, 48, '#38bdf8')}
            <span>{ICON_LABELS[obj.iconType]}</span>
          </div>
        )}
        {linked ? (
          <div className="detail-modal-data">
            <h4>Dane urządzenia: <em>{linked.name}</em></h4>
            <div className="dmd-grid">
              {[
                { k: 'Wartość',  v: linked.value   || '—' },
                { k: 'Status',   v: linked.status  || '—' },
                { k: 'Setpoint', v: linked.ctrlVal || '—' },
                { k: 'Alarm',    v: linked.alarm === '1' ? '⚠ Aktywny' : 'Brak' },
                { k: 'Online',   v: linked.online  || '—' },
                { k: 'Odszrań.',  v: linked.defrost === '1' ? 'Tak' : 'Nie' },
                { k: 'Model',    v: linked.modelname || '—' },
                { k: 'Typ',      v: linked.type     || '—' },
              ].map(row => (
                <div key={row.k} className="dmd-row">
                  <span className="dmd-key">{row.k}</span>
                  <span className={`dmd-val ${row.k === 'Alarm' && linked.alarm === '1' ? 'alarm-val' : ''}`}>{row.v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="detail-modal-empty">Brak powiązania z danymi urządzenia.</p>
        )}
        <button className="modal-cancel" onClick={onClose}>Zamknij</button>
      </div>
    </div>
  );
};
