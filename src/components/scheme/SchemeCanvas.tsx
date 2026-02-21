import React, { useRef, useState } from 'react';
import type { SchemeObject, SelectionRect } from '../../types/scheme.types';
import type { DeviceItem } from '../../pages/DashboardPage';
import { PdfCanvas } from '../PdfCanvas';
import { LiveBadge } from './LiveBadge';
import { getDeviceIcon } from '../DeviceIcons';
import {
  GRID_COLS, GRID_ROWS, ROOM_COLORS, ICON_COLOR,
  normalize, type ToolMode,
} from '../../utils/schemeHelpers';

interface SchemeCanvasProps {
  pdfDataUrl: string | null;
  pdfOpacity: number;
  canvasZoom: number;
  pdfW: number;
  pdfH: number;
  objects: SchemeObject[];
  selectedId: string | null;
  tool: ToolMode;
  deviceItems: DeviceItem[];
  onObjectClick: (id: string) => void;
  onRoomCreate: (sel: SelectionRect) => void;
  onDevicePlace: (sel: SelectionRect) => void;
  onCanvasClick: () => void;
}

export const SchemeCanvas: React.FC<SchemeCanvasProps> = ({
  pdfDataUrl, pdfOpacity, canvasZoom, pdfW, pdfH, objects, selectedId,
  tool, deviceItems, onObjectClick, onRoomCreate, onDevicePlace, onCanvasClick,
}) => {
  const cellW = pdfW / GRID_COLS;
  const cellH = pdfH / GRID_ROWS;

  const dragRef = useRef<{ row: number; col: number } | null>(null);
  const [dragSel, setDragSel] = useState<SelectionRect | null>(null);
  const isSelecting = useRef(false);

  const svgPoint = (e: React.MouseEvent<SVGSVGElement>): { row: number; col: number } => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      col: Math.max(0, Math.min(GRID_COLS - 1, Math.floor((e.clientX - rect.left) / (cellW * canvasZoom)))),
      row: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor((e.clientY - rect.top)  / (cellH * canvasZoom)))),
    };
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'room' || tool === 'device') {
      const { row, col } = svgPoint(e);
      dragRef.current = { row, col };
      isSelecting.current = true;
      setDragSel({ rowStart: row, rowEnd: row, colStart: col, colEnd: col });
    }
  };

  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isSelecting.current && dragRef.current) {
      const { row, col } = svgPoint(e);
      setDragSel({ rowStart: dragRef.current.row, rowEnd: row, colStart: dragRef.current.col, colEnd: col });
    }
  };

  const onMouseUp = () => {
    if (isSelecting.current && dragSel) {
      isSelecting.current = false;
      const sel = normalize(dragSel);
      setDragSel(null);
      dragRef.current = null;
      if (tool === 'room')   onRoomCreate(sel);
      if (tool === 'device') onDevicePlace(sel);
    } else if (!isSelecting.current) {
      onCanvasClick();
    }
  };

  const normSel = dragSel ? normalize(dragSel) : null;

  return (
    <div style={{ position: 'relative', width: pdfW, height: pdfH, flexShrink: 0 }}>
      {/* PDF background */}
      <div style={{ position: 'absolute', inset: 0, opacity: pdfOpacity, pointerEvents: 'none' }}>
        {pdfDataUrl ? (
          <PdfCanvas dataUrl={pdfDataUrl} targetW={pdfW} targetH={pdfH} />
        ) : (
          <div className="scheme-canvas-empty">
            <span>Brak planu PDF — kliknij "📄 Wgraj PDF" w pasku narzędzi</span>
          </div>
        )}
      </div>

      {/* SVG overlay */}
      <svg
        style={{ position: 'absolute', inset: 0, display: 'block', opacity: 1 - pdfOpacity }}
        className={`scheme-svg-overlay tool-${tool}`}
        width={pdfW}
        height={pdfH}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { isSelecting.current = false; setDragSel(null); dragRef.current = null; }}
      >
        {/* Grid lines */}
        <g opacity={0.35}>
          {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * cellW} y1={0} x2={i * cellW} y2={pdfH}
              stroke="rgba(148,163,184,0.5)" strokeWidth={0.5} />
          ))}
          {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * cellH} x2={pdfW} y2={i * cellH}
              stroke="rgba(148,163,184,0.5)" strokeWidth={0.5} />
          ))}
        </g>

        {/* Drag preview */}
        {normSel && (
          <rect
            x={normSel.colStart * cellW} y={normSel.rowStart * cellH}
            width={(normSel.colEnd - normSel.colStart + 1) * cellW}
            height={(normSel.rowEnd - normSel.rowStart + 1) * cellH}
            fill="rgba(56,189,248,0.15)" stroke="#38bdf8" strokeWidth={2}
            strokeDasharray="6 3" style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Objects */}
        {objects.map(obj => {
          const x = obj.colStart * cellW;
          const y = obj.rowStart * cellH;
          const w = (obj.colEnd - obj.colStart + 1) * cellW;
          const h = (obj.rowEnd - obj.rowStart + 1) * cellH;
          const isSelected = obj.id === selectedId;
          const linked = obj.deviceLink
            ? deviceItems.find(d => d.name === obj.deviceLink!.deviceName)
            : null;
          const roomColorIdx = (obj as SchemeObject & { colorIdx?: number }).colorIdx ?? 0;
          const roomColor = ROOM_COLORS[roomColorIdx] ?? ROOM_COLORS[0];

          if (obj.kind === 'room') {
            const autoFs = Math.min(14, Math.max(9, w / Math.max(1, obj.label.length) * 1.4));
            const fs = obj.fontSize ?? autoFs;
            return (
              <g key={obj.id} onClick={e => { e.stopPropagation(); onObjectClick(obj.id); }}
                style={{ cursor: 'pointer' }}>
                <rect x={x} y={y} width={w} height={h}
                  fill={roomColor.bg}
                  stroke={isSelected ? '#f1f5f9' : roomColor.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  rx={4}
                />
                <text x={x + w / 2} y={y + h / 2 - (linked ? 10 : 0)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fs} fill="#f1f5f9" fontWeight="500">
                  {obj.label}
                </text>
                {linked && obj.deviceLink && (
                  <LiveBadge
                    x={x + w / 2} y={y + h / 2 + 12}
                    link={obj.deviceLink} device={linked}
                  />
                )}
                {isSelected && (
                  <rect x={x} y={y} width={w} height={h} fill="none"
                    stroke="#38bdf8" strokeWidth={2} strokeDasharray="6 3" rx={4} />
                )}
              </g>
            );
          } else {
            const cx = x + w / 2;
            const iconSize = Math.min(w, h) * 0.45;
            const autoFs = Math.max(8, Math.min(13, w / 6));
            const fs = obj.fontSize ?? autoFs;
            return (
              <g key={obj.id} onClick={e => { e.stopPropagation(); onObjectClick(obj.id); }}
                style={{ cursor: 'pointer' }}>
                <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4}
                  fill="rgba(15,23,42,0.6)"
                  stroke={isSelected ? '#38bdf8' : 'rgba(148,163,184,0.4)'}
                  strokeWidth={isSelected ? 2 : 1}
                  rx={6}
                />
                <foreignObject x={cx - iconSize / 2} y={y + h * 0.1} width={iconSize} height={iconSize}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSelected ? '#38bdf8' : ICON_COLOR }}>
                    {getDeviceIcon(obj.iconType ?? 'generic', iconSize, isSelected ? '#38bdf8' : ICON_COLOR)}
                  </div>
                </foreignObject>
                <text x={cx} y={y + h * 0.1 + iconSize + 4}
                  textAnchor="middle" dominantBaseline="hanging"
                  fontSize={fs} fill="#cbd5e1">
                  {obj.label}
                </text>
                {linked && obj.deviceLink && (
                  <LiveBadge x={cx} y={y + h + 15} link={obj.deviceLink} device={linked} anchor="bottom" />
                )}
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
};
