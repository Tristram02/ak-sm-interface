import React from 'react';
import type { Building } from '../../pages/BuildingsPage';

interface BuildingForm {
  name: string;
  ip_address: string;
  port: number;
  device_user: string;
  device_password: string;
}

interface BuildingModalProps {
  editing: Building | null;
  form: BuildingForm;
  saving: boolean;
  onFormChange: (f: BuildingForm) => void;
  onSave: () => void;
  onClose: () => void;
}

export const BuildingModal: React.FC<BuildingModalProps> = ({
  editing, form, saving, onFormChange, onSave, onClose,
}) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box" onClick={e => e.stopPropagation()}>
      <h2>{editing ? 'Edytuj budynek' : 'Nowy budynek'}</h2>

      {(['name', 'ip_address'] as const).map(field => (
        <div className="modal-field" key={field}>
          <label>{field === 'name' ? 'Nazwa' : 'Adres IP'}</label>
          <input
            type="text"
            value={form[field]}
            onChange={e => onFormChange({ ...form, [field]: e.target.value })}
            placeholder={field === 'name' ? 'Magazyn Centralny' : '192.168.1.100'}
          />
        </div>
      ))}

      <div className="modal-field">
        <label>Port</label>
        <input
          type="number"
          value={form.port}
          onChange={e => onFormChange({ ...form, port: Number(e.target.value) })}
        />
      </div>

      <div className="modal-field">
        <label>Login urządzenia</label>
        <input
          type="text"
          value={form.device_user}
          onChange={e => onFormChange({ ...form, device_user: e.target.value })}
          placeholder="admin"
        />
      </div>

      <div className="modal-field">
        <label>Hasło urządzenia</label>
        <input
          type="password"
          value={form.device_password}
          onChange={e => onFormChange({ ...form, device_password: e.target.value })}
          placeholder="••••••••"
        />
      </div>

      <div className="modal-actions">
        <button className="modal-save" onClick={onSave} disabled={saving}>
          {saving ? 'Zapisywanie…' : 'Zapisz'}
        </button>
        <button className="modal-cancel" onClick={onClose}>Anuluj</button>
      </div>
    </div>
  </div>
);
