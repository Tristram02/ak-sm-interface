import React, { useState } from 'react';
import type { SchemeSummary } from '../../types/scheme.types';

interface SchemeSidebarProps {
  schemes: SchemeSummary[];
  activeId: number | null;
  creating: boolean;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
}

export const SchemeSidebar: React.FC<SchemeSidebarProps> = ({
  schemes, activeId, creating, onSelect, onCreate, onDelete, onRename,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  return (
    <div className="scheme-sidebar">
      <div className="scheme-sidebar-header">
        <span>Schematy</span>
        <button className="sidebar-new-btn" onClick={onCreate} disabled={creating}>+</button>
      </div>
      {schemes.length === 0
        ? <p className="sidebar-empty">Brak schematów. Kliknij + aby utworzyć.</p>
        : schemes.map(s => (
          <div key={s.id}
            className={`sidebar-item ${s.id === activeId ? 'sidebar-item-active' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            {editingId === s.id ? (
              <input className="sidebar-rename-input" value={editName} autoFocus
                onChange={e => setEditName(e.target.value)}
                onBlur={() => { onRename(editingId, editName); setEditingId(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onRename(editingId, editName); setEditingId(null); }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="sidebar-item-name">{s.name}</span>
            )}
            <div className="sidebar-item-actions" onClick={e => e.stopPropagation()}>
              <button title="Zmień nazwę" onClick={() => { setEditingId(s.id); setEditName(s.name); }}>✏️</button>
              <button title="Usuń" onClick={() => onDelete(s.id)}>🗑️</button>
            </div>
          </div>
        ))
      }
    </div>
  );
};
