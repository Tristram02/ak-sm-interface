import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Building } from './BuildingsPage';
import type { Room } from '../types/scheme.types';

interface DashboardProps { building: Building; }

// ── Device-specific parser (Chłodnictwo panel) ──────────────────────────────

interface DeviceItem {
  name: string;
  value: string;
  status: string;
  type: string;
  ctrlVal: string;
  alarm: string;
  online: string;
  defrost: string;
  modelname: string;
  nodetype: string;
  indent: string;
  isGroup: boolean;
}

function parseDevices(xml: string): DeviceItem[] {
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    return Array.from(doc.querySelectorAll('device')).map(el => {
      const childTxt = (tag: string) => el.querySelector(tag)?.textContent?.trim() ?? '';
      const attr     = (a: string)   => el.getAttribute(a) ?? '';
      return {
        name:      childTxt('name') || attr('name'),
        value:     attr('value'),
        status:    attr('status'),
        type:      childTxt('type'),
        ctrlVal:   attr('ctrl_val'),
        alarm:     attr('alarm'),
        online:    attr('online'),
        defrost:   attr('defrost'),
        modelname: attr('modelname'),
        nodetype:  attr('nodetype'),
        indent:    attr('indent'),
        isGroup:   attr('nodetype') === '255',
      };
    });
  } catch { return []; }
}

const STATUS_BG: Record<string, string> = {
  'Normal':            'rgba(16,185,129,0.12)',
  'Normal ctrl.':      'rgba(16,185,129,0.12)',
  'Adaptive SH ctrl':  'rgba(6,182,212,0.12)',
  'Modulating temp.':  'rgba(6,182,212,0.12)',
  'Standby':           'rgba(148,163,184,0.08)',
  'Defrost':           'rgba(59,130,246,0.12)',
  'Heat reclaim':      'rgba(245,158,11,0.12)',
  'Ther. cutout':      'rgba(245,158,11,0.12)',
  'AlmOff':            'rgba(148,163,184,0.08)',
  'err':               'rgba(239,68,68,0.12)',
};
const STATUS_COL: Record<string, string> = {
  'Normal':            '#10b981',
  'Normal ctrl.':      '#10b981',
  'Adaptive SH ctrl':  '#06b6d4',
  'Modulating temp.':  '#06b6d4',
  'Standby':           '#94a3b8',
  'Defrost':           '#3b82f6',
  'Heat reclaim':      '#f59e0b',
  'Ther. cutout':      '#f59e0b',
  'AlmOff':            '#94a3b8',
  'err':               '#ef4444',
};

const DeviceTable: React.FC<{ items: DeviceItem[]; emptyMsg: string }> = ({ items, emptyMsg }) => {
  if (items.length === 0) return <p className="dash-empty">{emptyMsg}</p>;
  return (
    <div className="dp-table-wrap">
      <table className="dp-table">
        <thead>
          <tr><th>Nazwa</th><th>Typ</th><th>Wartość</th><th>Setpoint</th><th>Status</th><th>⚠</th></tr>
        </thead>
        <tbody>
          {items.map((d, i) => {
            if (d.isGroup) {
              return (
                <tr key={i} className="dp-row-group">
                  <td colSpan={6} className="dp-cell-group">🏭 {d.name}</td>
                </tr>
              );
            }
            const hasAlarm = d.alarm === '1';
            const bg  = hasAlarm ? 'rgba(239,68,68,0.12)' : (STATUS_BG[d.status]  ?? '');
            const col = hasAlarm ? '#ef4444'              : (STATUS_COL[d.status] ?? 'var(--text-muted)');
            const indentPx = 0.6 + Number(d.indent || 0) * 0.8;
            return (
              <tr key={i} style={{ background: bg }}>
                <td className="dp-cell-descr" style={{ paddingLeft: `${indentPx}rem` }}>
                  {d.name || '—'}
                </td>
                <td className="dp-cell-tag">{d.type || '—'}</td>
                <td className="dp-cell-val">{d.value || '—'}</td>
                <td className="dp-cell-extra">{d.ctrlVal || '—'}</td>
                <td>
                  <span className="dp-status-badge" style={{ color: col, borderColor: col }}>
                    {d.defrost === '1' ? '🧊 ' : ''}{d.status || '—'}
                  </span>
                </td>
                <td className="dp-cell-alarm">{hasAlarm ? '🚨' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Generic parser (Alarmy / Wejścia panels) ─────────────────────────────────

interface ValItem {
  n: string; descr: string; val: string; unit: string; state: string;
  tag: string; allAttrs: Record<string, string>;
}

function parseVals(xml: string): ValItem[] {
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const root = doc.documentElement;
    if (!root) return [];
    let elements: Element[] = Array.from(root.querySelectorAll('val'));
    if (elements.length === 0) elements = Array.from(root.children);
    if (elements.length === 0) return [];
    return elements.map((el, i) => {
      const attrs: Record<string, string> = {};
      for (const a of Array.from(el.attributes)) attrs[a.name] = a.value;
      return {
        tag:   el.tagName,
        n:     attrs['n']     ?? attrs['id']    ?? String(i),
        descr: attrs['descr'] ?? attrs['name']  ?? attrs['type'] ?? el.tagName,
        val:   attrs['val']   ?? attrs['value'] ?? attrs['v']    ?? el.textContent?.trim() ?? '',
        unit:  attrs['unit']  ?? attrs['u']     ?? '',
        state: attrs['state'] ?? attrs['s']     ?? attrs['status'] ?? '',
        allAttrs: attrs,
      };
    });
  } catch { return []; }
}

function getError(xml: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const err = doc.documentElement?.getAttribute('error');
    if (err && err !== '0') return `Błąd urządzenia: ${err}`;
    return null;
  } catch { return null; }
}

const ValTable: React.FC<{ items: ValItem[] }> = ({ items }) => {
  const extraKeys = Array.from(
    new Set(items.flatMap(it => Object.keys(it.allAttrs)))
  ).filter(k => !['n','descr','val','unit','state'].includes(k));
  return (
    <div className="dp-table-wrap">
      <table className="dp-table">
        <thead>
          <tr>
            <th>#</th><th>Tag</th><th>Opis</th><th>Wartość</th><th>J.</th><th>Stan</th>
            {extraKeys.map(k => <th key={k}>{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={item.state === '1' ? 'dp-row-active' : ''}>
              <td className="dp-cell-n">{item.n}</td>
              <td className="dp-cell-tag">{item.tag}</td>
              <td className="dp-cell-descr">{item.descr || '—'}</td>
              <td className="dp-cell-val">{item.val !== '' ? item.val : '—'}</td>
              <td className="dp-cell-unit">{item.unit || '—'}</td>
              <td className="dp-cell-state">{item.state || '—'}</td>
              {extraKeys.map(k => (
                <td key={k} className="dp-cell-extra">{item.allAttrs[k] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Panel sub-components ─────────────────────────────────────────────────────

interface PanelState {
  data: ValItem[];
  raw: string;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}
const emptyPanel = (): PanelState => ({ data: [], raw: '', loading: false, error: null, lastUpdate: null });

const PanelTimestamp: React.FC<{ state: PanelState }> = ({ state }) => (
  <div className="dp-meta">
    {state.loading && <span className="dpm-loading">⟳ Ładowanie…</span>}
    {state.error   && <span className="dpm-error" title={state.error}>⚠ Błąd</span>}
    {state.lastUpdate && !state.error && (
      <span className="dpm-ok">✓ {state.lastUpdate.toLocaleTimeString('pl-PL')}</span>
    )}
  </div>
);

const PanelContent: React.FC<{ state: PanelState; emptyMsg: string }> = ({ state, emptyMsg }) => {
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

// ── Main component ───────────────────────────────────────────────────────────

export const DashboardPage: React.FC<DashboardProps> = ({ building }) => {
  const { token } = useAuth();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [deviceItems, setDeviceItems] = useState<DeviceItem[]>([]);
  const [chillingState, setChillingState] = useState<PanelState>(emptyPanel());
  const [alarms,        setAlarms]        = useState<PanelState>(emptyPanel());
  const [inputs,        setInputs]        = useState<PanelState>(emptyPanel());
  const [schemes, setSchemes] = useState<{ id: number; name: string; rooms: Room[] }[]>([]);

  // ── Devices sender (updates both deviceItems and chillingState) ──
  const sendCmdDevices = useCallback(async () => {
    const xml = '<cmd action="read_devices" nodetype="16" node="12" mod="0" point="0" />';
    setChillingState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/buildings/${building.id}/command`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/xml' },
        body: xml,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setDeviceItems(parseDevices(text));
      setChillingState({ data: [], raw: text, loading: false, error: getError(text), lastUpdate: new Date() });
    } catch (e) {
      setChillingState(prev => ({ ...prev, loading: false, error: e instanceof Error ? e.message : 'Błąd', lastUpdate: new Date() }));
    }
  }, [building.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generic sender ──
  const sendCmd = useCallback(async (cmdXml: string, setter: React.Dispatch<React.SetStateAction<PanelState>>) => {
    setter(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/buildings/${building.id}/command`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/xml' },
        body: cmdXml,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setter({ data: parseVals(text), raw: text, loading: false, error: getError(text), lastUpdate: new Date() });
    } catch (e) {
      setter(prev => ({ ...prev, loading: false, error: e instanceof Error ? e.message : 'Błąd', lastUpdate: new Date() }));
    }
  }, [building.id, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Staggered poll: t=0s, t+1s, t+2s; repeat every 60s ──
  useEffect(() => {
    const CMD_ALARMS = '<cmd action="read_device_alarms" nodetype="16" node="12" mod="0" point="0" />';
    const CMD_INPUTS = '<cmd action="read_inputs"        nodetype="16" node="12" mod="0" point="0" />';
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const poll = () => {
      void sendCmdDevices();
      t1 = setTimeout(() => void sendCmd(CMD_ALARMS, setAlarms),  1000);
      t2 = setTimeout(() => void sendCmd(CMD_INPUTS, setInputs),  2000);
    };
    poll();
    const interval = setInterval(poll, 60_000);
    return () => { clearInterval(interval); clearTimeout(t1); clearTimeout(t2); };
  }, [sendCmd, sendCmdDevices]);

  // ── Scheme list (Konfiguracja panel) ──
  useEffect(() => {
    fetch(`/api/buildings/${building.id}/schemes`, { headers: authHeader })
      .then(r => r.json())
      .then(data => setSchemes(data))
      .catch(console.error);
  }, [building.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const allRoomsCount = schemes.reduce((acc, s) => acc + (s.rooms ?? []).length, 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">{building.name}</h2>
          <p className="dashboard-sub">{building.ip_address}:{building.port}</p>
        </div>
        <span className="dashboard-updated">Odświeżanie co 60s</span>
      </div>

      <div className="dash-panels-2x2">

        {/* ── Chłodnictwo ── */}
        <div className="dash-panel">
          <div className="dash-panel-hdr">
            <span className="dph-icon">❄️</span>
            <h3>Chłodnictwo</h3>
            <span className="dph-cmd">read_devices</span>
            <PanelTimestamp state={chillingState} />
          </div>
          <div className="dash-panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <ChillingToggle deviceItems={deviceItems} raw={chillingState.raw} />
            </div>
          </div>
        </div>

        {/* ── Alarmy ── */}
        <div className="dash-panel">
          <div className="dash-panel-hdr">
            <span className="dph-icon">🔔</span>
            <h3>Alarmy</h3>
            <span className="dph-cmd">read_device_alarms</span>
            <PanelTimestamp state={alarms} />
          </div>
          <div className="dash-panel-body">
            <PanelContent state={alarms} emptyMsg="Brak aktywnych alarmów." />
          </div>
        </div>

        {/* ── Wejścia ── */}
        <div className="dash-panel">
          <div className="dash-panel-hdr">
            <span className="dph-icon">⚙️</span>
            <h3>Wejścia</h3>
            <span className="dph-cmd">read_inputs</span>
            <PanelTimestamp state={inputs} />
          </div>
          <div className="dash-panel-body">
            <PanelContent state={inputs} emptyMsg="Oczekiwanie na odpowiedź urządzenia…" />
          </div>
        </div>

        {/* ── Konfiguracja ── */}
        <div className="dash-panel">
          <div className="dash-panel-hdr">
            <span className="dph-icon">⚙️</span>
            <h3>Konfiguracja</h3>
          </div>
          <div className="dash-panel-body">
            <div className="dinfo-list">
              {[
                { k: 'Budynek',       v: building.name },
                { k: 'Adres IP',      v: building.ip_address, mono: true },
                { k: 'Port',          v: String(building.port), mono: true },
                ...(building.device_user ? [{ k: 'Login', v: building.device_user }] : []),
                { k: 'Schematy',      v: String(schemes.length) },
                { k: 'Pomieszczenia', v: String(allRoomsCount) },
              ].map(row => (
                <div key={row.k} className="dinfo-row">
                  <span className="dinfo-key">{row.k}</span>
                  <span className={`dinfo-val ${row.mono ? 'mono' : ''}`}>{row.v}</span>
                </div>
              ))}
            </div>
            {schemes.length > 0 && (
              <div className="dscheme-summary">
                <p className="dss-title">Schematy</p>
                {schemes.map(s => (
                  <div key={s.id} className="dss-row">
                    <span>📐 {s.name}</span>
                    <span className="dss-count">{(s.rooms ?? []).length} pom.</span>
                  </div>
                ))}
              </div>
            )}
            <RefreshCountdown interval={60} />
          </div>
        </div>

      </div>
    </div>
  );
};

// ── Chłodnictwo toggle (Tabela / Raw XML) ────────────────────────────────────
const ChillingToggle: React.FC<{ deviceItems: DeviceItem[]; raw: string }> = ({ deviceItems, raw }) => {
  const [showRaw, setShowRaw] = React.useState(false);
  return (
    <>
      <div className="dp-view-toggle">
        <button className={`dp-vtbtn ${!showRaw ? 'active' : ''}`} onClick={() => setShowRaw(false)}>Tabela</button>
        <button className={`dp-vtbtn ${showRaw  ? 'active' : ''}`} onClick={() => setShowRaw(true)}>Raw XML</button>
      </div>
      {showRaw
        ? <pre className="dp-raw">{raw || '(brak danych)'}</pre>
        : <DeviceTable items={deviceItems} emptyMsg="Oczekiwanie na odpowiedź urządzenia…" />
      }
    </>
  );
};

// ── Countdown timer ───────────────────────────────────────────────────────────
const RefreshCountdown: React.FC<{ interval: number }> = ({ interval }) => {
  const [seconds, setSeconds] = useState(interval);
  useEffect(() => {
    setSeconds(interval);
    const tick = setInterval(() => setSeconds(s => s <= 1 ? interval : s - 1), 1000);
    return () => clearInterval(tick);
  }, [interval]);
  return (
    <div className="refresh-countdown">
      <div className="rc-label">Następne odświeżenie za <strong>{seconds}s</strong></div>
      <div className="rc-bar"><div className="rc-fill" style={{ width: `${((interval - seconds) / interval) * 100}%` }} /></div>
    </div>
  );
};
