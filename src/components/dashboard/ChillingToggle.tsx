import React from 'react';
import { DeviceTable } from './DeviceTable';
import type { DeviceItem } from '../../pages/DashboardPage';

interface ChillingToggleProps {
  deviceItems: DeviceItem[];
  raw: string;
}

export const ChillingToggle: React.FC<ChillingToggleProps> = ({ deviceItems, raw }) => {
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
