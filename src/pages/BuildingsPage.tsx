import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Building {
  id: number;
  name: string;
  ip_address: string;
  port: number;
  device_user: string | null;
  created_at: string;
}

interface BuildingsPageProps {
  onSelect: (building: Building) => void;
}

interface BuildingForm {
  name: string;
  ip_address: string;
  port: number;
  device_user: string;
  device_password: string;
}

const emptyForm = (): BuildingForm => ({
  name: '',
  ip_address: '',
  port: 6080,
  device_user: '',
  device_password: '',
});

export const BuildingsPage: React.FC<BuildingsPageProps> = ({ onSelect }) => {
  const { token, user, logout } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState<BuildingForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchBuildings = async () => {
    try {
      const res = await fetch('/api/buildings', { headers });
      if (!res.ok) throw new Error('Failed to load buildings');
      setBuildings(await res.json() as Building[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchBuildings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (b: Building) => {
    setEditing(b);
    setForm({ name: b.name, ip_address: b.ip_address, port: b.port, device_user: b.device_user ?? '', device_password: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editing ? `/api/buildings/${editing.id}` : '/api/buildings';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      await fetchBuildings();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Usuń budynek i wszystkie jego schematy?')) return;
    await fetch(`/api/buildings/${id}`, { method: 'DELETE', headers });
    setBuildings(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="buildings-page">
      <div className="buildings-header">
        <div>
          <h1>Obiekty</h1>
          <p className="buildings-subtitle">Zalogowano jako <strong>{user?.username}</strong></p>
        </div>
        <div className="buildings-header-actions">
          <button className="buildings-add-btn" onClick={openCreate}>+ Dodaj budynek</button>
          <button className="buildings-logout-btn" onClick={logout}>Wyloguj</button>
        </div>
      </div>

      {error && <div className="buildings-error">{error}</div>}

      {loading ? (
        <div className="buildings-loading"><div className="spinner" /></div>
      ) : buildings.length === 0 ? (
        <div className="buildings-empty">
          <p>Brak zdefiniowanych budynków. Dodaj pierwszy budynek aby rozpocząć.</p>
        </div>
      ) : (
        <div className="buildings-grid">
          {buildings.map(b => (
            <div key={b.id} className="building-card" onClick={() => onSelect(b)}>
              <div className="building-card-icon">🏭</div>
              <div className="building-card-info">
                <h3 className="building-card-name">{b.name}</h3>
                <span className="building-card-ip">{b.ip_address}:{b.port}</span>
                {b.device_user && <span className="building-card-user">Użytkownik: {b.device_user}</span>}
              </div>
              <div className="building-card-actions" onClick={e => e.stopPropagation()}>
                <button className="bca-edit" onClick={() => openEdit(b)}>✏️</button>
                <button className="bca-delete" onClick={() => void handleDelete(b.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edytuj budynek' : 'Nowy budynek'}</h2>

            {(['name', 'ip_address'] as const).map(field => (
              <div className="modal-field" key={field}>
                <label>{field === 'name' ? 'Nazwa' : 'Adres IP'}</label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'name' ? 'Magazyn Centralny' : '192.168.1.100'}
                />
              </div>
            ))}

            <div className="modal-field">
              <label>Port</label>
              <input
                type="number"
                value={form.port}
                onChange={e => setForm(f => ({ ...f, port: Number(e.target.value) }))}
              />
            </div>

            <div className="modal-field">
              <label>Login urządzenia</label>
              <input
                type="text"
                value={form.device_user}
                onChange={e => setForm(f => ({ ...f, device_user: e.target.value }))}
                placeholder="admin"
              />
            </div>

            <div className="modal-field">
              <label>Hasło urządzenia</label>
              <input
                type="password"
                value={form.device_password}
                onChange={e => setForm(f => ({ ...f, device_password: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <div className="modal-actions">
              <button className="modal-save" onClick={() => void handleSave()} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Zapisz'}
              </button>
              <button className="modal-cancel" onClick={() => setShowModal(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
