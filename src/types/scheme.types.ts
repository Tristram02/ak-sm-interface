// Scheme page – data types for building floor plan editor (v2)

// ── Legacy types (kept for backward-compat with backend rooms[] JSONB) ─────────
export type RoomAnimState = 'idle' | 'active' | 'warning' | 'alarm';
export type RoomType = 'mroznia' | 'komora';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  rowStart: number;
  colStart: number;
  rowEnd: number;
  colEnd: number;
  animState: RoomAnimState;
}

export interface SelectionRect {
  rowStart: number;
  colStart: number;
  rowEnd: number;
  colEnd: number;
}

export const ROOM_TYPE_META: Record<RoomType, { label: string; color: string; borderColor: string }> = {
  mroznia: { label: 'Mroźnia',  color: 'rgba(6,182,212,0.15)',  borderColor: '#06b6d4' },
  komora:  { label: 'Komora',   color: 'rgba(139,92,246,0.15)', borderColor: '#8b5cf6' },
};

// ── New v2 types ──────────────────────────────────────────────────────────────

/** Type of scheme object drawn on the floorplan */
export type SchemeObjectKind = 'room' | 'device';

/** Catalogue of device icons available */
export type DeviceIconType =
  | 'cooler'        // chłodnica
  | 'compressor'    // agregat / sprężarka
  | 'evaporator'    // parownik
  | 'sensor'        // czujnik temperatury
  | 'pump'          // pompa
  | 'fan'           // wentylator
  | 'valve'         // zawór
  | 'generic';      // generyczne/inne

/** Link to live dashboard data */
export interface DeviceLink {
  deviceName: string;         // matches DeviceItem.name from DashboardPage
  /** Which fields to display as overlay badge (value & status shown by default) */
  showValue: boolean;
  showStatus: boolean;
}

/** A single object (room rectangle or device icon) on the scheme canvas */
export interface SchemeObject {
  id: string;
  kind: SchemeObjectKind;
  // Grid coordinates (0-indexed, inclusive)
  colStart: number;
  rowStart: number;
  colEnd: number;    // spans multiple cells for both rooms and devices
  rowEnd: number;
  label: string;
  fontSize?: number;           // label font size in px (undefined = auto)
  iconType?: DeviceIconType;   // only for kind='device'
  deviceLink?: DeviceLink;     // optional live-data binding
}

/** Full scheme data loaded from API (single GET includes pdf_data) */
export interface SchemeRecord {
  id: number;
  name: string;
  rows: number;
  cols: number;
  rooms: Room[];               // legacy
  grid_opacity: number;        // 0 = transparent PDF (objects only), 1 = opaque PDF (plan only)
  objects: SchemeObject[];     // v2 objects
  pdf_data?: string | null;    // base64 data-URL of the uploaded PDF
  updated_at: string;
}

/** Summary row from list endpoint (no pdf_data) */
export type SchemeSummary = Omit<SchemeRecord, 'pdf_data'>;
