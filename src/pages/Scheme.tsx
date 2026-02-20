import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Room, RoomType, SelectionRect, RoomAnimState } from '../types/scheme.types';
import { ROOM_TYPE_META } from '../types/scheme.types';
import { getRoomIcon } from '../components/RoomIcons';
import { useAuth } from '../contexts/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

interface SchemeRecord {
  id: number;
  name: string;
  rows: number;
  cols: number;
  rooms: Room[];
  updated_at: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

let nextLocalId = 1;
const uid = () => `room-${nextLocalId++}`;

const normalize = (sel: SelectionRect): SelectionRect => ({
  rowStart: Math.min(sel.rowStart, sel.rowEnd),
  rowEnd:   Math.max(sel.rowStart, sel.rowEnd),
  colStart: Math.min(sel.colStart, sel.colEnd),
  colEnd:   Math.max(sel.colStart, sel.colEnd),
});

const overlaps = (a: SelectionRect, b: Room): boolean =>
  a.rowStart <= b.rowEnd && a.rowEnd >= b.rowStart &&
  a.colStart <= b.colEnd && a.colEnd >= b.colStart;

const inSel = (row: number, col: number, sel: SelectionRect | null): boolean => {
  if (!sel) return false;
  const n = normalize(sel);
  return row >= n.rowStart && row <= n.rowEnd && col >= n.colStart && col <= n.colEnd;
};

// ── Create-room panel ────────────────────────────────────────────────────────

const CreatePanel: React.FC<{
  selection: SelectionRect;
  onConfirm: (name: string, type: RoomType) => void;
  onCancel: () => void;
}> = ({ selection, onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('mroznia');
  const n = normalize(selection);
  const rows = n.rowEnd - n.rowStart + 1;
  const cols = n.colEnd - n.colStart + 1;

  return (
    <div className="create-panel">
      <h3 className="create-panel-title">Nowe pomieszczenie</h3>
      <p className="create-panel-info">Obszar: {rows} × {cols} ({rows * cols} komórek)</p>
      <div className="create-panel-field">
        <label htmlFor="room-name">Nazwa</label>
        <input id="room-name" type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="np. Mroźnia 1" autoFocus />
      </div>
      <div className="create-panel-field">
        <label>Typ</label>
        <div className="room-type-picker">
          {(Object.keys(ROOM_TYPE_META) as RoomType[]).map(t => (
            <button key={t}
              className={`room-type-option ${type === t ? 'selected' : ''}`}
              onClick={() => setType(t)}
              style={{ borderColor: type === t ? ROOM_TYPE_META[t].borderColor : undefined,
                       background:  type === t ? ROOM_TYPE_META[t].color : undefined }}
            >
              <span className="rto-icon">{getRoomIcon(t, 'active', 28)}</span>
              <span className="rto-label">{ROOM_TYPE_META[t].label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="create-panel-actions">
        <button className="create-confirm-btn"
          onClick={() => onConfirm(name.trim() || ROOM_TYPE_META[type].label, type)}>
          Utwórz
        </button>
        <button className="create-cancel-btn" onClick={onCancel}>Anuluj</button>
      </div>
    </div>
  );
};

// ── Room cell ────────────────────────────────────────────────────────────────

const RoomCell: React.FC<{ room: Room; selected: boolean; onClick: () => void }> = ({ room, selected, onClick }) => {
  const meta = ROOM_TYPE_META[room.type];
  return (
    <div
      className={`scheme-room ${selected ? 'scheme-room-selected' : ''} anim-${room.animState}`}
      style={{ gridRow: `${room.rowStart + 1} / ${room.rowEnd + 2}`,
               gridColumn: `${room.colStart + 1} / ${room.colEnd + 2}`,
               background: meta.color, borderColor: selected ? '#f1f5f9' : meta.borderColor }}
      onClick={e => { e.stopPropagation(); onClick(); }}
    >
      <div className="scheme-room-icon">{getRoomIcon(room.type, room.animState, 44)}</div>
      <span className="scheme-room-name">{room.name}</span>
    </div>
  );
};

// ── Scheme library sidebar ───────────────────────────────────────────────────

const SchemeSidebar: React.FC<{
  schemes: SchemeRecord[];
  activeId: number | null;
  creating: boolean;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onRename: (id: number, name: string) => void;
}> = ({ schemes, activeId, creating, onSelect, onCreate, onDelete, onRename }) => {
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
              <input className="sidebar-rename-input" value={editName}
                autoFocus
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

// ── Main Scheme page ─────────────────────────────────────────────────────────

interface SchemeProps { buildingId: number; }

export const Scheme: React.FC<SchemeProps> = ({ buildingId }) => {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Scheme library state ──
  const [schemes, setSchemes] = useState<SchemeRecord[]>([]);
  const [activeSchemeId, setActiveSchemeId] = useState<number | null>(null);
  // Ref mirrors state so debounced callbacks always see the latest value
  const activeSchemeIdRef = useRef<number | null>(null);
  const [libLoading, setLibLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // ── Grid / room state ──
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(12);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schemeName, setSchemeName] = useState('Schemat');

  // ── Interaction state ──
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const dragStart = useRef<{ row: number; col: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadScheme = (s: SchemeRecord) => {
    activeSchemeIdRef.current = s.id;
    setActiveSchemeId(s.id);
    setSchemeName(s.name);
    setRows(s.rows);
    setCols(s.cols);
    setRooms(s.rooms ?? []);
    setSelectedRoomId(null);
    setSelection(null);
    setShowCreate(false);
    setSaveStatus('saved');
  };

  // ── Load scheme list on mount ──
  useEffect(() => {
    fetch(`/api/buildings/${buildingId}/schemes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: SchemeRecord[]) => {
        setSchemes(data);
        if (data.length > 0) loadScheme(data[0]);
      })
      .catch(console.error)
      .finally(() => setLibLoading(false));
  }, [buildingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save (debounce 800ms) — uses ref so setTimeout captures current ID ──
  const triggerSave = (updatedRooms: Room[], updatedRows: number, updatedCols: number) => {
    const schemeId = activeSchemeIdRef.current;
    if (!schemeId) return;
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus('saving');
      fetch(`/api/buildings/${buildingId}/schemes/${schemeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ rows: updatedRows, cols: updatedCols, rooms: updatedRooms }),
      })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('unsaved'));
    }, 800);
  };

  const setRoomsAndSave = (updater: (prev: Room[]) => Room[]) => {
    setRooms(prev => {
      const next = updater(prev);
      triggerSave(next, rows, cols);
      return next;
    });
  };

  // ── Scheme library actions ──
  const handleCreate = async () => {
    setCreating(true);
    const res = await fetch(`/api/buildings/${buildingId}/schemes`, {
      method: 'POST', headers,
      body: JSON.stringify({ name: 'Nowy schemat', rows: 8, cols: 12, rooms: [] }),
    });
    const s = await res.json() as SchemeRecord;
    setSchemes(prev => [...prev, s]);
    loadScheme(s);
    setCreating(false);
  };

  const handleDeleteScheme = async (id: number) => {
    if (!confirm('Usunąć ten schemat?')) return;
    await fetch(`/api/buildings/${buildingId}/schemes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const remaining = schemes.filter(s => s.id !== id);
    setSchemes(remaining);
    if (activeSchemeId === id) {
      if (remaining.length > 0) loadScheme(remaining[0]);
      else { setActiveSchemeId(null); setRooms([]); }
    }
  };

  const handleRename = async (id: number, name: string) => {
    if (!name.trim()) return;
    await fetch(`/api/buildings/${buildingId}/schemes/${id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ name: name.trim() }),
    });
    setSchemes(prev => prev.map(s => s.id === id ? { ...s, name: name.trim() } : s));
    if (id === activeSchemeId) setSchemeName(name.trim());
  };

  // ── Grid interaction ──
  const occupiedSet = new Set(
    rooms.flatMap(r => {
      const cells: string[] = [];
      for (let row = r.rowStart; row <= r.rowEnd; row++)
        for (let col = r.colStart; col <= r.colEnd; col++)
          cells.push(`${row},${col}`);
      return cells;
    })
  );

  const startCell = (row: number, col: number) => {
    if (occupiedSet.has(`${row},${col}`)) return;
    setSelectedRoomId(null); setShowCreate(false); setIsSelecting(true);
    dragStart.current = { row, col };
    setSelection({ rowStart: row, rowEnd: row, colStart: col, colEnd: col });
  };

  const moveCell = (row: number, col: number) => {
    if (!isSelecting || !dragStart.current) return;
    setSelection({ rowStart: dragStart.current.row, rowEnd: row, colStart: dragStart.current.col, colEnd: col });
  };

  const endCell = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    if (selection) setShowCreate(true);
  };

  const handleConfirm = useCallback((name: string, type: RoomType) => {
    if (!selection) return;
    const n = normalize(selection);
    if (rooms.some(r => overlaps(n, r))) { alert('Wybrany obszar nakłada się na istniejące pomieszczenie.'); return; }
    const newRoom: Room = { id: uid(), name, type, rowStart: n.rowStart, rowEnd: n.rowEnd, colStart: n.colStart, colEnd: n.colEnd, animState: 'idle' };
    setRoomsAndSave(prev => [...prev, newRoom]);
    setSelection(null); setShowCreate(false);
  }, [selection, rooms]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleState = (id: string) => {
    const order: RoomAnimState[] = ['idle', 'active', 'warning', 'alarm'];
    setRoomsAndSave(prev => prev.map(r => r.id !== id ? r : { ...r, animState: order[(order.indexOf(r.animState) + 1) % order.length] }));
  };

  const handleDeleteRoom = () => {
    if (!selectedRoomId) return;
    setRoomsAndSave(prev => prev.filter(r => r.id !== selectedRoomId));
    setSelectedRoomId(null);
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null;

  const freeCells: { row: number; col: number }[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      if (!occupiedSet.has(`${row},${col}`))
        freeCells.push({ row, col });

  // ──────────────────────────────────────────────────────────────────────────

  if (libLoading) return <div className="scheme-page"><div className="scheme-loading"><div className="spinner" /></div></div>;

  return (
    <div className="scheme-page">
      {/* Toolbar */}
      <div className="scheme-toolbar">
        <span className="scheme-toolbar-title">{schemeName}</span>
        {activeSchemeId && (
          <span className={`save-status save-status-${saveStatus}`}>
            {saveStatus === 'saved' ? '✓ Zapisano' : saveStatus === 'saving' ? '⟳ Zapisywanie…' : '● Niezapisane'}
          </span>
        )}
        <div className="scheme-size-controls">
          <label>Wiersze</label>
          <input type="number" min={2} max={30} value={rows} onChange={e => {
            const v = Math.max(2, Math.min(30, Number(e.target.value)));
            setRows(v); const pruned = rooms.filter(r => r.rowEnd < v); setRooms(pruned); triggerSave(pruned, v, cols);
          }} />
          <label>Kolumny</label>
          <input type="number" min={2} max={30} value={cols} onChange={e => {
            const v = Math.max(2, Math.min(30, Number(e.target.value)));
            setCols(v); const pruned = rooms.filter(r => r.colEnd < v); setRooms(pruned); triggerSave(pruned, rows, v);
          }} />
        </div>
        <div className="scheme-toolbar-right">
          {selectedRoom && <>
            <button className="tb-btn tb-cycle" onClick={() => cycleState(selectedRoom.id)}>Zmień stan</button>
            <button className="tb-btn tb-delete" onClick={handleDeleteRoom}>Usuń pokój</button>
          </>}
          <button className="tb-btn tb-clear" onClick={() => { setRoomsAndSave(() => []); setSelectedRoomId(null); }}>Wyczyść wszystko</button>
        </div>
      </div>

      {/* Info bar for selected room */}
      {selectedRoom && (
        <div className="scheme-info-bar">
          <span className="sib-icon">{getRoomIcon(selectedRoom.type, selectedRoom.animState, 20)}</span>
          <strong>{selectedRoom.name}</strong>
          <span className="sib-sep">·</span><span>{ROOM_TYPE_META[selectedRoom.type].label}</span>
          <span className="sib-sep">·</span><span className={`state-pill-${selectedRoom.animState}`}>{selectedRoom.animState}</span>
        </div>
      )}

      {/* Workspace */}
      <div className="scheme-workspace">
        {/* Library sidebar */}
        <SchemeSidebar
          schemes={schemes}
          activeId={activeSchemeId}
          creating={creating}
          onSelect={id => {
            // Fetch full scheme (with rooms) when switching via sidebar
            fetch(`/api/buildings/${buildingId}/schemes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json())
              .then((s: SchemeRecord) => loadScheme(s))
              .catch(console.error);
          }}
          onCreate={() => void handleCreate()}
          onDelete={id => void handleDeleteScheme(id)}
          onRename={(id, name) => void handleRename(id, name)}
        />

        {/* Grid */}
        {activeSchemeId ? (
          <div className="scheme-grid"
            style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            onMouseLeave={endCell} onMouseUp={endCell} onClick={() => setSelectedRoomId(null)}
          >
            {freeCells.map(({ row, col }) => (
              <div key={`${row}-${col}`}
                className={`scheme-cell ${inSel(row, col, selection) ? 'scheme-cell-selected' : ''}`}
                style={{ gridRow: `${row + 1}`, gridColumn: `${col + 1}` }}
                onMouseDown={e => { e.preventDefault(); startCell(row, col); }}
                onMouseEnter={() => moveCell(row, col)}
              />
            ))}
            {rooms.map(room => (
              <RoomCell key={room.id} room={room} selected={room.id === selectedRoomId} onClick={() => setSelectedRoomId(room.id)} />
            ))}
          </div>
        ) : (
          <div className="scheme-no-active">
            <p>Wybierz lub utwórz schemat z listy po lewej stronie.</p>
          </div>
        )}

        {/* Create panel */}
        {showCreate && selection && (
          <div className="scheme-panel-wrap">
            <CreatePanel selection={selection} onConfirm={handleConfirm} onCancel={() => { setSelection(null); setShowCreate(false); }} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="scheme-legend">
        {(Object.keys(ROOM_TYPE_META) as RoomType[]).map(t => (
          <div key={t} className="legend-item">{getRoomIcon(t, 'idle', 18)}<span>{ROOM_TYPE_META[t].label}</span></div>
        ))}
        <div className="legend-states">
          {(['idle','active','warning','alarm'] as RoomAnimState[]).map(s => (
            <span key={s} className={`legend-state state-pill-${s}`}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
