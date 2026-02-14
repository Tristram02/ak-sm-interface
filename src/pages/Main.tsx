import React, { useState, useEffect } from 'react';
import { CommandForm } from '../components/CommandForm';
import { ResponseViewer } from '../components/ResponseViewer';
import { ApiService } from '../services/api.service';
import type { XmlResponse } from '../types/xml.types';
import '../styles/index.css';

export const Main: React.FC = () => {
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [response, setResponse] = useState<XmlResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ipAddress, setIpAddress] = useState<string>('95.171.115.243');
  const [port, setPort] = useState<number>(6080);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    ApiService.setEndpoint(ipAddress, port);
  }, []);

  const handleCommandGenerated = (xml: string) => {
    setCurrentCommand(xml);
    setError(null);
  };

  const handleSendCommand = async () => {
    if (!currentCommand) {
      setError('Please generate a command first');
      return;
    }

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

  const handleUpdateEndpoint = () => {
    ApiService.setEndpoint(ipAddress, port);
    setError(null);
    alert(`Endpoint updated to: ${ApiService.getEndpoint()}`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Danfoss AK-SM</h1>
        <p className="subtitle">XML Interface Control Panel</p>
        <button 
          className="settings-toggle" 
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ {showSettings ? 'Hide' : 'Show'} Settings
        </button>
      </header>

      {showSettings && (
        <section className="settings-section">
          <h3>Connection Settings</h3>
          <div className="settings-grid">
            <div className="form-group">
              <label htmlFor="ip-address">IP Address</label>
              <input
                id="ip-address"
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="95.171.115.243"
              />
            </div>
            <div className="form-group">
              <label htmlFor="port">Port</label>
              <input
                id="port"
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10))}
                placeholder="6080"
              />
            </div>
          </div>
          <button className="update-endpoint-btn" onClick={handleUpdateEndpoint}>
            Update Endpoint
          </button>
          <p className="current-endpoint">Current: {ApiService.getEndpoint()}</p>
        </section>
      )}

      <main className="app-main">
        <div className="content-grid">
          <section className="command-section">
            <CommandForm onCommandGenerated={handleCommandGenerated} />
            
            {currentCommand && (
              <div className="send-section">
                <button 
                  className="send-btn" 
                  onClick={handleSendCommand}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Command'}
                </button>
              </div>
            )}
          </section>

          <section className="response-section">
            <ResponseViewer 
              response={response} 
              loading={loading} 
              error={error} 
            />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Danfoss AK XML Service v1.0.0</p>
      </footer>
    </div>
  );
};
