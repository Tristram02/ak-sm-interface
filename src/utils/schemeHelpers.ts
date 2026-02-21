import type { SelectionRect } from '../types/scheme.types';

// ── ID generator ──────────────────────────────────────────────────────────────
let _nextId = Date.now();
export const uid = () => `obj-${_nextId++}`;

// ── Selection helpers ─────────────────────────────────────────────────────────
export const normalize = (s: SelectionRect): SelectionRect => ({
  rowStart: Math.min(s.rowStart, s.rowEnd), rowEnd: Math.max(s.rowStart, s.rowEnd),
  colStart: Math.min(s.colStart, s.colEnd), colEnd: Math.max(s.colStart, s.colEnd),
});

// ── Grid constants ────────────────────────────────────────────────────────────
export const GRID_COLS = 100;
export const GRID_ROWS = 100;

// ── Tool mode ─────────────────────────────────────────────────────────────────
export type ToolMode = 'select' | 'room' | 'device';

export const TOOL_LABELS: Record<ToolMode, string> = {
  select: '↖ Zaznacz',
  room:   '⬜ Pomieszczenie',
  device: '⚙ Urządzenie',
};

// ── Room colours ──────────────────────────────────────────────────────────────
export const ROOM_COLORS = [
  { bg: 'rgba(6,182,212,0.18)',   border: '#06b6d4', label: 'Cyjan' },
  { bg: 'rgba(139,92,246,0.18)',  border: '#8b5cf6', label: 'Fiolet' },
  { bg: 'rgba(16,185,129,0.18)', border: '#10b981', label: 'Zielony' },
  { bg: 'rgba(245,158,11,0.18)', border: '#f59e0b', label: 'Bursztyn' },
  { bg: 'rgba(239,68,68,0.18)',  border: '#ef4444', label: 'Czerwony' },
  { bg: 'rgba(99,102,241,0.18)', border: '#6366f1', label: 'Indygo' },
];

export const ICON_COLOR = '#e2e8f0';
