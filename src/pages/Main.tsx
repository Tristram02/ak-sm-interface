import React, { useState } from 'react';
import { CommandForm } from '../components/CommandForm';
import { ResponseViewer } from '../components/ResponseViewer';
import { ApiService } from '../services/api.service';
import type { XmlResponse } from '../types/xml.types';
import type { Building } from './BuildingsPage';
import '../styles/index.css';

interface MainProps {
  building: Building;
}

export const Main: React.FC<MainProps> = ({ building }) => {
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [response, setResponse] = useState<XmlResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCommandGenerated = (xml: string) => {
    setCurrentCommand(xml);
    setError(null);
  };

  const handleSendCommand = async () => {
    if (!currentCommand) { setError('Please generate a command first'); return; }
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await ApiService.sendCommand(currentCommand);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Danfoss AK-SM</h1>
        <p className="subtitle">XML Interface Control Panel</p>
        <div className="building-info-badge">
          <span className="bib-label">Urządzenie:</span>
          <span className="bib-value">{building.ip_address}:{building.port}</span>
          {building.device_user && (
            <><span className="bib-sep">·</span><span className="bib-value">{building.device_user}</span></>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="content-grid">
          <section className="command-section">
            <CommandForm onCommandGenerated={handleCommandGenerated} />
            {currentCommand && (
              <div className="send-section">
                <button className="send-btn" onClick={handleSendCommand} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Command'}
                </button>
              </div>
            )}
          </section>

          <section className="response-section">
            <ResponseViewer response={response} loading={loading} error={error} />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Danfoss AK XML Service v2.0.0</p>
      </footer>
    </div>
  );
};
