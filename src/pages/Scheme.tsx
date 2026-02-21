import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  SchemeObject, SchemeRecord, SchemeSummary, DeviceIconType, SelectionRect,
} from '../types/scheme.types';
import { useAuth } from '../contexts/AuthContext';
import type { DeviceItem } from './DashboardPage';

import { uid } from '../utils/schemeHelpers';
import type { ToolMode } from '../utils/schemeHelpers';

import { SchemeSidebar } from '../components/scheme/SchemeSidebar';
import { SchemeToolbar } from '../components/scheme/SchemeToolbar';
import { SchemeCanvas } from '../components/scheme/SchemeCanvas';
import { DetailPanel } from '../components/scheme/DetailPanel';
import { DetailModal } from '../components/scheme/DetailModal';
import { DevicePickerDialog } from '../components/scheme/DevicePickerDialog';
import { RoomDialog } from '../components/scheme/RoomDialog';

export interface SchemeProps {
  buildingId: number;
  deviceItems: DeviceItem[];
}

export const Scheme: React.FC<SchemeProps> = ({ buildingId, deviceItems }) => {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Scheme list state ──────────────────────────────────────────────────────
  const [schemes, setSchemes] = useState<SchemeSummary[]>([]);
  const [activeScheme, setActiveScheme] = useState<SchemeRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Canvas state ───────────────────────────────────────────────────────────
  const [tool, setTool] = useState<ToolMode>('select');
  const [pdfOpacity, setPdfOpacity] = useState(0.5);
  const [canvasZoom, setCanvasZoom] = useState(1.0);

  // PDF dimensions stored in scheme.cols (width) / scheme.rows (height)
  const pdfW = activeScheme?.cols && activeScheme.cols > 0 ? activeScheme.cols : 1200;
  const pdfH = activeScheme?.rows && activeScheme.rows > 0 ? activeScheme.rows : 800;

  // ── Interaction state ──────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [pendingCell, setPendingCell] = useState<SelectionRect | null>(null);
  const [pendingRoom, setPendingRoom] = useState<SelectionRect | null>(null);

  const selectedObj = activeScheme?.objects?.find(o => o.id === selectedId) ?? null;

  // ── API helpers ────────────────────────────────────────────────────────────

  const triggerSave = useCallback((patch: Partial<SchemeRecord & { rows?: number; cols?: number }>) => {
    if (!activeScheme) return;
    setSaveStatus('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaveStatus('saving');
      fetch(`/api/buildings/${buildingId}/schemes/${activeScheme.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify(patch),
      })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('unsaved'));
    }, 800);
  }, [activeScheme?.id, buildingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateObjects = (updater: (prev: SchemeObject[]) => SchemeObject[]) => {
    if (!activeScheme) return;
    const next = updater(activeScheme.objects ?? []);
    const updated = { ...activeScheme, objects: next };
    setActiveScheme(updated);
    triggerSave({ objects: next });
  };

  // ── Load scheme list ───────────────────────────────────────────────────────

  const loadScheme = (id: number) => {
    fetch(`/api/buildings/${buildingId}/schemes/${id}`, { headers })
      .then(r => r.json())
      .then((data: SchemeRecord) => {
        setActiveScheme({ ...data, objects: data.objects ?? [] });
        setPdfOpacity(data.grid_opacity ?? 0.5);
        setSelectedId(null);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (!buildingId) return;
    fetch(`/api/buildings/${buildingId}/schemes`, { headers })
      .then(r => r.json())
      .then((data: SchemeSummary[]) => {
        setSchemes(data);
        if (data.length > 0 && !activeScheme) loadScheme(data[0].id);
      })
      .catch(console.error);
  }, [buildingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/buildings/${buildingId}/schemes`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: 'Nowy schemat', rows: 800, cols: 1200, rooms: [], objects: [] }),
      });
      const created: SchemeRecord = await res.json();
      setSchemes(prev => [...prev, created as unknown as SchemeSummary]);
      loadScheme(created.id);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Usunąć schemat?')) return;
    await fetch(`/api/buildings/${buildingId}/schemes/${id}`, { method: 'DELETE', headers });
    setSchemes(prev => prev.filter(s => s.id !== id));
    if (activeScheme?.id === id) setActiveScheme(null);
  };

  const handleRename = async (id: number, name: string) => {
    await fetch(`/api/buildings/${buildingId}/schemes/${id}`, {
      method: 'PUT', headers, body: JSON.stringify({ name }),
    });
    setSchemes(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    if (activeScheme?.id === id) setActiveScheme(prev => prev ? { ...prev, name } : prev);
  };

  // ── PDF upload — fixed 2560×1440 (2K) for crisp zoomed viewing ──────────────
  const PDF_W = 2560;
  const PDF_H = 1440;

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeScheme) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = { ...activeScheme, pdf_data: dataUrl, cols: PDF_W, rows: PDF_H };
      setActiveScheme(updated);
      triggerSave({ pdf_data: dataUrl, cols: PDF_W, rows: PDF_H });
    };
    reader.readAsDataURL(file);
  };

  // ── Opacity ────────────────────────────────────────────────────────────────

  const changeOpacity = (v: number) => {
    setPdfOpacity(v);
    if (activeScheme) setActiveScheme(prev => prev ? { ...prev, grid_opacity: v } : prev);
    triggerSave({ grid_opacity: v });
  };

  // ── Object creation ────────────────────────────────────────────────────────

  const handleRoomCreate = (sel: SelectionRect) => setPendingRoom(sel);

  const confirmRoom = (label: string, colorIdx: number) => {
    if (!pendingRoom) return;
    const newObj = {
      id: uid(), kind: 'room' as const,
      colStart: pendingRoom.colStart, colEnd: pendingRoom.colEnd,
      rowStart: pendingRoom.rowStart, rowEnd: pendingRoom.rowEnd,
      label, colorIdx,
    };
    updateObjects(prev => [...prev, newObj as SchemeObject]);
    setPendingRoom(null);
  };

  const handleDevicePlace = (sel: SelectionRect) => {
    setPendingCell(sel);
    setShowDeviceDialog(true);
  };

  const confirmDevice = (iconType: DeviceIconType, label: string) => {
    if (!pendingCell) return;
    const newObj: SchemeObject = {
      id: uid(), kind: 'device',
      colStart: pendingCell.colStart, colEnd: pendingCell.colEnd,
      rowStart: pendingCell.rowStart, rowEnd: pendingCell.rowEnd,
      label, iconType,
    };
    updateObjects(prev => [...prev, newObj]);
    setShowDeviceDialog(false);
    setPendingCell(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    updateObjects(prev => prev.filter(o => o.id !== selectedId));
    setSelectedId(null);
  };

  const handleObjectUpdate = (updated: SchemeObject) => {
    updateObjects(prev => prev.map(o => o.id === updated.id ? updated : o));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="scheme-page">
      <SchemeToolbar
        tool={tool}
        pdfOpacity={pdfOpacity}
        canvasZoom={canvasZoom}
        saveStatus={saveStatus}
        hasActiveScheme={!!activeScheme}
        hasSelectedObj={!!selectedObj}
        pdfW={pdfW}
        pdfH={pdfH}
        onToolChange={setTool}
        onOpacityChange={changeOpacity}
        onZoomChange={updater => setCanvasZoom(updater)}
        onZoomReset={() => setCanvasZoom(1)}
        onPdfUpload={handlePdfUpload}
        onDeleteSelected={handleDeleteSelected}
      />

      <div className="scheme-workspace">
        <SchemeSidebar
          schemes={schemes}
          activeId={activeScheme?.id ?? null}
          creating={creating}
          onSelect={id => loadScheme(id)}
          onCreate={() => void handleCreate()}
          onDelete={id => void handleDelete(id)}
          onRename={(id, name) => void handleRename(id, name)}
        />

        {/* Scrollable canvas area */}
        <div
          className="scheme-canvas-wrap"
          style={{ overflow: 'auto', flex: 1 }}
          onClick={e => {
            if (e.target === e.currentTarget && tool === 'select') setSelectedId(null);
          }}
        >
          {activeScheme ? (
            <div style={{
              width:  pdfW * canvasZoom,
              height: pdfH * canvasZoom,
              position: 'relative',
              flexShrink: 0,
            }}>
              <div style={{
                transform: `scale(${canvasZoom})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0, left: 0,
              }}>
                <SchemeCanvas
                  pdfDataUrl={activeScheme.pdf_data ?? null}
                  pdfOpacity={pdfOpacity}
                  canvasZoom={canvasZoom}
                  pdfW={pdfW}
                  pdfH={pdfH}
                  objects={activeScheme.objects ?? []}
                  selectedId={selectedId}
                  tool={tool}
                  deviceItems={deviceItems}
                  onObjectClick={id => setSelectedId(id)}
                  onRoomCreate={handleRoomCreate}
                  onDevicePlace={handleDevicePlace}
                  onCanvasClick={() => setSelectedId(null)}
                />
              </div>
            </div>
          ) : (
            <div className="scheme-no-active">
              <p>Wybierz lub utwórz schemat z listy po lewej stronie.</p>
            </div>
          )}
        </div>

        {selectedObj && (
          <DetailPanel
            obj={selectedObj}
            deviceItems={deviceItems}
            onUpdate={handleObjectUpdate}
            onDelete={handleDeleteSelected}
            onClose={() => setSelectedId(null)}
            onOpenModal={() => setShowDetailModal(true)}
          />
        )}
      </div>

      {/* ── Dialogs ── */}
      {pendingRoom && (
        <div className="modal-overlay" onClick={() => setPendingRoom(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <RoomDialog
              rows={pendingRoom.rowEnd - pendingRoom.rowStart + 1}
              cols={pendingRoom.colEnd - pendingRoom.colStart + 1}
              onConfirm={confirmRoom}
              onCancel={() => setPendingRoom(null)}
            />
          </div>
        </div>
      )}

      {showDeviceDialog && (
        <div className="modal-overlay" onClick={() => { setShowDeviceDialog(false); setPendingCell(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <DevicePickerDialog
              onConfirm={confirmDevice}
              onCancel={() => { setShowDeviceDialog(false); setPendingCell(null); }}
            />
          </div>
        </div>
      )}


      {showDetailModal && selectedObj && (
        <DetailModal
          obj={selectedObj}
          deviceItems={deviceItems}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};
