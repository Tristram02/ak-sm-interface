import React, { useState } from 'react';
import type { XmlResponse } from '../types/xml.types';
import type { XmlNode } from '../utils/xmlBuilder';
import { formatXml } from '../utils/xmlBuilder';

interface ResponseViewerProps {
  response: XmlResponse | null;
  loading: boolean;
  error: string | null;
}

interface XmlNodeCardProps {
  node: XmlNode;
  depth?: number;
}

const XmlNodeCard: React.FC<XmlNodeCardProps> = ({ node, depth = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node._children.length > 0;
  const attrEntries = Object.entries(node._attrs);

  return (
    <div className="xml-node" style={{ '--depth': depth } as React.CSSProperties}>
      <div
        className={`xml-node-header ${hasChildren ? 'xml-node-collapsible' : ''}`}
        onClick={() => hasChildren && setCollapsed(c => !c)}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={e => {
          if (hasChildren && (e.key === 'Enter' || e.key === ' ')) setCollapsed(c => !c);
        }}
      >
        <span className="xml-tag-name">
          {hasChildren && (
            <span className="xml-collapse-icon">{collapsed ? '▶' : '▼'}</span>
          )}
          &lt;{node._tag}&gt;
        </span>

        {attrEntries.length > 0 && (
          <span className="xml-attrs">
            {attrEntries.map(([k, v]) => (
              <span key={k} className="xml-attr-badge">
                <span className="xml-attr-key">{k}</span>
                <span className="xml-attr-sep">=</span>
                <span className="xml-attr-val">{v}</span>
              </span>
            ))}
          </span>
        )}
      </div>

      {node._text && (
        <div className="xml-node-text">{node._text}</div>
      )}
      {hasChildren && !collapsed && (
        <div className="xml-children">
          {node._children.map((child, i) => (
            <XmlNodeCard key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

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

  const tree = (response.data as { tree?: XmlNode } | undefined)?.tree;

  return (
    <div className="response-viewer">
      <div className="response-header">
        <h2>Response</h2>
        <div className="response-controls">
          <button onClick={() => setShowRaw(r => !r)} className="toggle-btn">
            {showRaw ? 'Show Parsed' : 'Show Raw XML'}
          </button>
          <button onClick={copyToClipboard} className="copy-btn">
            Copy XML
          </button>
        </div>
      </div>

      <div className="response-status">
        <span className={`status-badge ${response.error === 0 ? 'success' : 'error'}`}>
          {response.error === 0 ? '✓ Success' : `✗ Error ${response.error}`}
        </span>
        <span className="action-label">Action: {response.action}</span>
      </div>

      {showRaw ? (
        <div className="xml-display">
          <pre><code>{response.rawXml ? formatXml(response.rawXml) : 'No XML data'}</code></pre>
        </div>
      ) : (
        <div className="parsed-data-tree">
          {tree ? (
            <XmlNodeCard node={tree} depth={0} />
          ) : (
            <p className="xml-empty">No structured data available.</p>
          )}
        </div>
      )}
    </div>
  );
};
