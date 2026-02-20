import React, { useState, useCallback, useRef } from 'react';
import type { Room, RoomType, SelectionRect, RoomAnimState } from '../types/scheme.types';
import { ROOM_TYPE_META } from '../types/scheme.types';
import { getRoomIcon } from '../components/RoomIcons';

// ── helpers ──────────────────────────────────────────────────────────────────

let nextId = 1;
const uid = () => `room-${nextId++}`;

const normalize = (sel: SelectionRect): SelectionRect => ({
  rowStart: Math.min(sel.rowStart, sel.rowEnd),
  rowEnd:   Math.max(sel.rowStart, sel.rowEnd),
  colStart: Math.min(sel.colStart, sel.colEnd),
  colEnd:   Math.max(sel.colStart, sel.colEnd),
});

const overlaps = (a: SelectionRect, b: Room): boolean => {
  return (
    a.rowStart <= b.rowEnd &&
    a.rowEnd   >= b.rowStart &&
    a.colStart <= b.colEnd &&
    a.colEnd   >= b.colStart
  );
};

const inSel = (row: number, col: number, sel: SelectionRect | null): boolean => {
  if (!sel) return false;
  const n = normalize(sel);
  return row >= n.rowStart && row <= n.rowEnd && col >= n.colStart && col <= n.colEnd;
};

// ── Create-room panel ────────────────────────────────────────────────────────

interface CreatePanelProps {
  selection: SelectionRect;
  onConfirm: (name: string, type: RoomType) => void;
  onCancel: () => void;
}

const CreatePanel: React.FC<CreatePanelProps> = ({ selection, onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('mroznia');

  const n = normalize(selection);
  const rows = n.rowEnd - n.rowStart + 1;
  const cols = n.colEnd - n.colStart + 1;

  return (
    <div className="create-panel">
      <h3 className="create-panel-title">Nowe pomieszczenie</h3>
      <p className="create-panel-info">
        Obszar: {rows} × {cols} ({rows * cols} komórek)
      </p>

      <div className="create-panel-field">
        <label htmlFor="room-name">Nazwa</label>
        <input
          id="room-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="np. Mroźnia 1"
          autoFocus
        />
      </div>

      <div className="create-panel-field">
        <label>Typ</label>
        <div className="room-type-picker">
          {(Object.keys(ROOM_TYPE_META) as RoomType[]).map(t => (
            <button
              key={t}
              className={`room-type-option ${type === t ? 'selected' : ''}`}
              onClick={() => setType(t)}
              style={{
                borderColor: type === t ? ROOM_TYPE_META[t].borderColor : undefined,
                background:  type === t ? ROOM_TYPE_META[t].color       : undefined,
              }}
            >
              <span className="rto-icon">
                {getRoomIcon(t, 'active', 28)}
              </span>
              <span className="rto-label">{ROOM_TYPE_META[t].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="create-panel-actions">
        <button
          className="create-confirm-btn"
          onClick={() => onConfirm(name.trim() || ROOM_TYPE_META[type].label, type)}
        >
          Utwórz
        </button>
        <button className="create-cancel-btn" onClick={onCancel}>
          Anuluj
        </button>
      </div>
    </div>
  );
};

// ── Room cell ────────────────────────────────────────────────────────────────

interface RoomCellProps {
  room: Room;
  selected: boolean;
  onClick: () => void;
}

const RoomCell: React.FC<RoomCellProps> = ({ room, selected, onClick }) => {
  const meta = ROOM_TYPE_META[room.type];
  return (
    <div
      className={`scheme-room ${selected ? 'scheme-room-selected' : ''} anim-${room.animState}`}
      style={{
        gridRow:    `${room.rowStart + 1} / ${room.rowEnd + 2}`,
        gridColumn: `${room.colStart + 1} / ${room.colEnd + 2}`,
        background: meta.color,
        borderColor: selected ? '#f1f5f9' : meta.borderColor,
      }}
      onClick={e => { e.stopPropagation(); onClick(); }}
    >
      <div className="scheme-room-icon">
        {getRoomIcon(room.type, room.animState, 44)}
      </div>
      <span className="scheme-room-name">{room.name}</span>
    </div>
  );
};

// ── Main Scheme page ─────────────────────────────────────────────────────────

export const Scheme: React.FC = () => {
  const [rows, setRows] = useState(8);
  const [cols, setCols] = useState(12);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const dragStart = useRef<{ row: number; col: number } | null>(null);

  // Which cells are covered by rooms
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
    setSelectedRoomId(null);
    setShowCreate(false);
    setIsSelecting(true);
    dragStart.current = { row, col };
    setSelection({ rowStart: row, rowEnd: row, colStart: col, colEnd: col });
  };

  const moveCell = (row: number, col: number) => {
    if (!isSelecting || !dragStart.current) return;
    setSelection({
      rowStart: dragStart.current.row,
      rowEnd: row,
      colStart: dragStart.current.col,
      colEnd: col,
    });
  };

  const endCell = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    if (selection) {
      setShowCreate(true);
    }
  };

  const handleConfirm = useCallback((name: string, type: RoomType) => {
    if (!selection) return;
    const n = normalize(selection);
    // reject if overlaps any existing room
    if (rooms.some(r => overlaps(n, r))) {
      alert('Wybrany obszar nakłada się na istniejące pomieszczenie.');
      return;
    }
    const newRoom: Room = {
      id: uid(),
      name,
      type,
      rowStart: n.rowStart,
      rowEnd:   n.rowEnd,
      colStart: n.colStart,
      colEnd:   n.colEnd,
      animState: 'idle',
    };
    setRooms(prev => [...prev, newRoom]);
    setSelection(null);
    setShowCreate(false);
  }, [selection, rooms]);

  const handleCancel = () => {
    setSelection(null);
    setShowCreate(false);
  };

  const handleDeleteRoom = () => {
    if (!selectedRoomId) return;
    setRooms(prev => prev.filter(r => r.id !== selectedRoomId));
    setSelectedRoomId(null);
  };

  const cycleState = (id: string) => {
    const order: RoomAnimState[] = ['idle', 'active', 'warning', 'alarm'];
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = (order.indexOf(r.animState) + 1) % order.length;
      return { ...r, animState: order[next] };
    }));
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) ?? null;

  // Cells that need explicit rendering (not covered by rooms)
  const freeCells: { row: number; col: number }[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      if (!occupiedSet.has(`${row},${col}`))
        freeCells.push({ row, col });

  return (
    <div className="scheme-page">
      {/* ── Toolbar ── */}
      <div className="scheme-toolbar">
        <span className="scheme-toolbar-title">Schemat budynku</span>

        <div className="scheme-size-controls">
          <label>Wiersze</label>
          <input
            type="number"
            min={2}
            max={30}
            value={rows}
            onChange={e => {
              const v = Math.max(2, Math.min(30, Number(e.target.value)));
              setRows(v);
              setRooms(prev => prev.filter(r => r.rowEnd < v));
            }}
          />
          <label>Kolumny</label>
          <input
            type="number"
            min={2}
            max={30}
            value={cols}
            onChange={e => {
              const v = Math.max(2, Math.min(30, Number(e.target.value)));
              setCols(v);
              setRooms(prev => prev.filter(r => r.colEnd < v));
            }}
          />
        </div>

        <div className="scheme-toolbar-right">
          {selectedRoom && (
            <>
              <button className="tb-btn tb-cycle" onClick={() => cycleState(selectedRoom.id)}>
                Zmień stan ikony
              </button>
              <button className="tb-btn tb-delete" onClick={handleDeleteRoom}>
                Usuń pomieszczenie
              </button>
            </>
          )}
          <button className="tb-btn tb-clear" onClick={() => { setRooms([]); setSelectedRoomId(null); }}>
            Wyczyść wszystko
          </button>
        </div>
      </div>

      {/* ── Legend / selected info ── */}
      {selectedRoom && (
        <div className="scheme-info-bar">
          <span className="sib-icon">{getRoomIcon(selectedRoom.type, selectedRoom.animState, 20)}</span>
          <strong>{selectedRoom.name}</strong>
          <span className="sib-sep">·</span>
          <span>{ROOM_TYPE_META[selectedRoom.type].label}</span>
          <span className="sib-sep">·</span>
          <span className={`sib-state state-pill-${selectedRoom.animState}`}>{selectedRoom.animState}</span>
        </div>
      )}

      {/* ── Main workspace ── */}
      <div className="scheme-workspace">
        {/* Grid */}
        <div
          className="scheme-grid"
          style={{
            gridTemplateRows:    `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
          onMouseLeave={endCell}
          onMouseUp={endCell}
          onClick={() => setSelectedRoomId(null)}
        >
          {/* Free cells */}
          {freeCells.map(({ row, col }) => {
            const inSelection = inSel(row, col, selection);
            return (
              <div
                key={`${row}-${col}`}
                className={`scheme-cell ${inSelection ? 'scheme-cell-selected' : ''}`}
                style={{
                  gridRow:    `${row + 1}`,
                  gridColumn: `${col + 1}`,
                }}
                onMouseDown={e => { e.preventDefault(); startCell(row, col); }}
                onMouseEnter={() => moveCell(row, col)}
              />
            );
          })}

          {/* Room cells */}
          {rooms.map(room => (
            <RoomCell
              key={room.id}
              room={room}
              selected={room.id === selectedRoomId}
              onClick={() => setSelectedRoomId(room.id)}
            />
          ))}
        </div>

        {/* Create panel */}
        {showCreate && selection && (
          <div className="scheme-panel-wrap">
            <CreatePanel
              selection={selection}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="scheme-legend">
        {(Object.keys(ROOM_TYPE_META) as RoomType[]).map(t => (
          <div key={t} className="legend-item">
            {getRoomIcon(t, 'idle', 18)}
            <span>{ROOM_TYPE_META[t].label}</span>
          </div>
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
