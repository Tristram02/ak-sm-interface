import React, { useState, useEffect } from 'react';
import type { SchemeObject, DeviceLink } from '../../types/scheme.types';
import type { DeviceIconType } from '../../types/scheme.types';
import { getDeviceIcon, ICON_LABELS, DEVICE_ICON_TYPES } from '../DeviceIcons';
import type { DeviceItem } from '../../pages/DashboardPage';

interface DetailPanelProps {
  obj: SchemeObject;
  deviceItems: DeviceItem[];
  onUpdate: (updated: SchemeObject) => void;
  onDelete: () => void;
  onClose: () => void;
  onOpenModal: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  obj, deviceItems, onUpdate, onDelete, onClose, onOpenModal,
}) => {
  const [label, setLabel] = useState(obj.label);
  const [iconType, setIconType] = useState<DeviceIconType>(obj.iconType ?? 'generic');
  const [link, setLink] = useState<DeviceLink | undefined>(obj.deviceLink);
  const [fontSize, setFontSize] = useState<number>(obj.fontSize ?? 0);

  useEffect(() => {
    setLabel(obj.label);
    setIconType(obj.iconType ?? 'generic');
    setLink(obj.deviceLink);
    setFontSize(obj.fontSize ?? 0);
  }, [obj.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    onUpdate({
      ...obj,
      label,
      fontSize: fontSize > 0 ? fontSize : undefined,
      iconType: obj.kind === 'device' ? iconType : undefined,
      deviceLink: link,
    });
  };

  const linkedDevice = link ? deviceItems.find(d => d.name === link.deviceName) : null;

  return (
    <div className="detail-panel">
      <div className="dp-header">
        <span className="dp-kind-badge">{obj.kind === 'room' ? '⬜ Pomieszczenie' : '⚙ Urządzenie'}</span>
        <button className="dp-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="dp-field">
        <label>Etykieta</label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} />
      </div>

      <div className="dp-field">
        <label>Czcionka: <strong>{fontSize > 0 ? `${fontSize}px` : 'auto'}</strong></label>
        <input type="range" min={0} max={36} step={1} value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          style={{ accentColor: 'var(--accent-primary)' }} />
      </div>

      {obj.kind === 'device' && (
        <div className="dp-field">
          <label>Ikona</label>
          <div className="dp-icon-grid">
            {DEVICE_ICON_TYPES.map(t => (
              <button key={t}
                className={`dp-icon-opt ${iconType === t ? 'selected' : ''}`}
                onClick={() => setIconType(t)} title={ICON_LABELS[t]}
              >
                {getDeviceIcon(t, 22, iconType === t ? '#38bdf8' : '#64748b')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dp-section">
        <h4>Powiązanie z danymi</h4>
        {deviceItems.length === 0 ? (
          <p className="dp-empty">Brak danych z dashboardu. Poczekaj na załadowanie.</p>
        ) : (
          <>
            <div className="dp-field">
              <label>Urządzenie</label>
              <select
                value={link?.deviceName ?? ''}
                onChange={e => {
                  const n = e.target.value;
                  if (!n) { setLink(undefined); return; }
                  setLink({ deviceName: n, showValue: true, showStatus: true });
                }}
              >
                <option value="">— brak powiązania —</option>
                {deviceItems.filter(d => !d.isGroup).map(d => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            {link && (
              <div className="dp-checkboxes">
                <label><input type="checkbox" checked={link.showValue}
                  onChange={e => setLink(l => l ? { ...l, showValue: e.target.checked } : l)} /> Wartość</label>
                <label><input type="checkbox" checked={link.showStatus}
                  onChange={e => setLink(l => l ? { ...l, showStatus: e.target.checked } : l)} /> Status</label>
              </div>
            )}
          </>
        )}
      </div>

      {linkedDevice && (
        <div className="dp-live-preview">
          <h4>Dane na żywo</h4>
          <div className="dpv-row"><span>Wartość</span><strong>{linkedDevice.value || '—'}</strong></div>
          <div className="dpv-row"><span>Status</span><strong>{linkedDevice.status || '—'}</strong></div>
          {linkedDevice.ctrlVal && <div className="dpv-row"><span>Setpoint</span><strong>{linkedDevice.ctrlVal}</strong></div>}
          {linkedDevice.alarm === '1' && <div className="dpv-alarm">⚠ Aktywny alarm</div>}
        </div>
      )}

      <div className="dp-actions">
        <button className="dp-save-btn" onClick={save}>Zapisz</button>
        {obj.deviceLink && (
          <button className="dp-details-btn" onClick={onOpenModal} title="Pokaż szczegóły urządzenia">
            📈 Szczegóły
          </button>
        )}
        <button className="dp-delete-btn" onClick={onDelete}>🗑</button>
      </div>
    </div>
  );
};
