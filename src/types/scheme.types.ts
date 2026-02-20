// Scheme page – data types for building floor plan editor

/** Animation/status state driven by sensor readings */
export type RoomAnimState = 'idle' | 'active' | 'warning' | 'alarm';

/** Industrial cold-storage room types */
export type RoomType = 'mroznia' | 'komora';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  /** Grid coordinates (0-indexed, inclusive) */
  rowStart: number;
  colStart: number;
  rowEnd: number;
  colEnd: number;
  /** Animation/status state for icon */
  animState: RoomAnimState;
}

export interface SelectionRect {
  rowStart: number;
  colStart: number;
  rowEnd: number;
  colEnd: number;
}

export interface SchemeGridState {
  rows: number;
  cols: number;
  rooms: Room[];
}

export const ROOM_TYPE_META: Record<
  RoomType,
  { label: string; color: string; borderColor: string }
> = {
  mroznia: {
    label: 'Mroźnia',
    color: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06b6d4',
  },
  komora: {
    label: 'Komora',
    color: 'rgba(139, 92, 246, 0.15)',
    borderColor: '#8b5cf6',
  },
};
