import React from 'react';
import { GRID_COLS, GRID_ROWS, TOOL_LABELS, type ToolMode } from '../../utils/schemeHelpers';

interface SchemeToolbarProps {
  tool: ToolMode;
  pdfOpacity: number;
  canvasZoom: number;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  hasActiveScheme: boolean;
  hasSelectedObj: boolean;
  pdfW: number;
  pdfH: number;
  onToolChange: (t: ToolMode) => void;
  onOpacityChange: (v: number) => void;
  onZoomChange: (updater: (z: number) => number) => void;
  onZoomReset: () => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSelected: () => void;
}

export const SchemeToolbar: React.FC<SchemeToolbarProps> = ({
  tool, pdfOpacity, canvasZoom, saveStatus, hasActiveScheme, hasSelectedObj,
  pdfW, pdfH, onToolChange, onOpacityChange, onZoomChange, onZoomReset,
  onPdfUpload, onDeleteSelected,
}) => (
  <div className="scheme-toolbar">
    {/* Save status indicator */}
    <span className={`save-status save-${saveStatus}`}>
      {saveStatus === 'saved' ? '✓' : saveStatus === 'saving' ? '⏳' : '●'}
    </span>

    {/* Tool selector */}
    <div className="scheme-tool-group">
      {(['select', 'room', 'device'] as ToolMode[]).map(t => (
        <button key={t} className={`tb-tool-btn ${tool === t ? 'active' : ''}`}
          onClick={() => onToolChange(t)}>
          {TOOL_LABELS[t]}
        </button>
      ))}
    </div>

    {/* PDF opacity slider */}
    <div className="scheme-opacity-control">
      <label title="0% = tylko obiekty, 100% = tylko PDF">
        🗺 Tło <strong>{Math.round(pdfOpacity * 100)}%</strong>
      </label>
      <input type="range" min={0} max={1} step={0.05} value={pdfOpacity}
        onChange={e => onOpacityChange(Number(e.target.value))} />
    </div>

    {/* Canvas zoom */}
    <div className="scheme-zoom-control">
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: 2 }}>Zoom</span>
      <button className="zoom-btn" onClick={() => onZoomChange(z => Math.max(0.25, +(z - 0.25).toFixed(2)))} title="Oddal">−</button>
      <span className="zoom-label">{Math.round(canvasZoom * 100)}%</span>
      <button className="zoom-btn" onClick={() => onZoomChange(z => Math.min(4, +(z + 0.25).toFixed(2)))} title="Przybliż">+</button>
      <button className="zoom-btn zoom-reset" onClick={onZoomReset} title="Reset">1:1</button>
    </div>

    {/* PDF upload */}
    {hasActiveScheme && (
      <label className="tb-upload-btn">
        📄 Wgraj PDF
        <input type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
          onChange={onPdfUpload} />
      </label>
    )}

    {/* Delete selected */}
    {hasSelectedObj && (
      <button className="tb-btn tb-delete" onClick={onDeleteSelected}>🗑 Usuń</button>
    )}

    {/* Canvas dimensions info */}
    {hasActiveScheme && (
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
        Canvas: {pdfW}×{pdfH}px · Siatka: {GRID_COLS}×{GRID_ROWS}
      </span>
    )}
  </div>
);
