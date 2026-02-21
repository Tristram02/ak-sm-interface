import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Building } from './BuildingsPage';
import type { Room } from '../types/scheme.types';

import { parseDevices, parseVals, getError } from '../utils/dashboardParsers';
import { emptyPanel, PanelTimestamp, PanelContent } from '../components/dashboard/PanelContent';
import type { PanelState } from '../components/dashboard/PanelContent';
import { ChillingToggle } from '../components/dashboard/ChillingToggle';
import { RefreshCountdown } from '../components/dashboard/RefreshCountdown';

export interface DeviceItem {
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

interface DashboardProps {
  building: Building;
  onDeviceItemsChange?: (items: DeviceItem[]) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ building, onDeviceItemsChange }) => {
  const { token } = useAuth();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [deviceItems, setDeviceItems] = useState<DeviceItem[]>([]);
  const [chillingState, setChillingState] = useState<PanelState>(emptyPanel());
  const [alarms,        setAlarms]        = useState<PanelState>(emptyPanel());
  const [inputs,        setInputs]        = useState<PanelState>(emptyPanel());
  const [schemes, setSchemes] = useState<{ id: number; name: string; rooms: Room[] }[]>([]);

  // ── Devices poll ────────────────────────────────────────────────────────────
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
      const items = parseDevices(text);
      setDeviceItems(items);
      onDeviceItemsChange?.(items);
      setChillingState({ data: [], raw: text, loading: false, error: getError(text), lastUpdate: new Date() });
    } catch (e) {
      setChillingState(prev => ({ ...prev, loading: false, error: e instanceof Error ? e.message : 'Błąd', lastUpdate: new Date() }));
    }
  }, [building.id, token, onDeviceItemsChange]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generic command ─────────────────────────────────────────────────────────
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

  // ── Staggered poll ──────────────────────────────────────────────────────────
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

  // ── Scheme list ─────────────────────────────────────────────────────────────
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
