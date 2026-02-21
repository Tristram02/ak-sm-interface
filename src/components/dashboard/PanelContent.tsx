import React from 'react';
import type { ValItem } from '../../utils/dashboardParsers';
import { ValTable } from './ValTable';

export interface PanelState {
  data: ValItem[];
  raw: string;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export const emptyPanel = (): PanelState => ({ data: [], raw: '', loading: false, error: null, lastUpdate: null });

export const PanelTimestamp: React.FC<{ state: PanelState }> = ({ state }) => (
  <div className="dp-meta">
    {state.loading && <span className="dpm-loading">⟳ Ładowanie…</span>}
    {state.error   && <span className="dpm-error" title={state.error}>⚠ Błąd</span>}
    {state.lastUpdate && !state.error && (
      <span className="dpm-ok">✓ {state.lastUpdate.toLocaleTimeString('pl-PL')}</span>
    )}
  </div>
);

interface PanelContentProps {
  state: PanelState;
  emptyMsg: string;
}

export const PanelContent: React.FC<PanelContentProps> = ({ state, emptyMsg }) => {
  const [showRaw, setShowRaw] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="dp-view-toggle">
        <button className={`dp-vtbtn ${!showRaw ? 'active' : ''}`} onClick={() => setShowRaw(false)}>Tabela</button>
        <button className={`dp-vtbtn ${showRaw  ? 'active' : ''}`} onClick={() => setShowRaw(true)}>Raw XML</button>
      </div>
      {showRaw
        ? <pre className="dp-raw">{state.raw || '(brak danych)'}</pre>
        : state.data.length > 0
          ? <ValTable items={state.data} />
          : <p className="dash-empty">{emptyMsg}</p>
      }
    </div>
  );
};
