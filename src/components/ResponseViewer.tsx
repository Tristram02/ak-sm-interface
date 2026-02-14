import React, { useState } from 'react';
import type { XmlResponse } from '../types/xml.types';
import { formatXml } from '../utils/xmlBuilder';

interface ResponseViewerProps {
  response: XmlResponse | null;
  loading: boolean;
  error: string | null;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ response, loading, error }) => {
  const [showRaw, setShowRaw] = useState(false);

  const copyToClipboard = async () => {
    if (response?.rawXml) {
      try {
        await navigator.clipboard.writeText(response.rawXml);
        alert('Copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="response-viewer">
        <div className="loading">
          <div className="spinner"></div>
          <p>Sending command...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="response-viewer">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-viewer">
        <div className="no-response">
          <p>No response yet. Generate and send a command to see results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="response-viewer">
      <div className="response-header">
        <h2>Response</h2>
        <div className="response-controls">
          <button onClick={() => setShowRaw(!showRaw)} className="toggle-btn">
            {showRaw ? 'Show Parsed' : 'Show Raw XML'}
          </button>
          <button onClick={copyToClipboard} className="copy-btn">
            Copy to Clipboard
          </button>
        </div>
      </div>

      <div className="response-status">
        <span className={`status-badge ${response.error === 0 ? 'success' : 'error'}`}>
          {response.error === 0 ? 'Success' : `Error Code: ${response.error}`}
        </span>
        <span className="action-label">Action: {response.action}</span>
      </div>

      {showRaw ? (
        <div className="xml-display">
          <pre><code>{response.rawXml ? formatXml(response.rawXml) : 'No XML data'}</code></pre>
        </div>
      ) : (
        <div className="parsed-data">
          <h3>Parsed Data</h3>
          <pre><code>{JSON.stringify(response.data, null, 2)}</code></pre>
        </div>
      )}
    </div>
  );
};
