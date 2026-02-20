import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Main } from './pages/Main';
import { Scheme } from './pages/Scheme';
import './styles/index.css';

type Page = 'main' | 'scheme';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('main');

  return (
    <>
      <nav className="app-tab-nav">
        <button
          className={`tab-btn ${page === 'main' ? 'tab-active' : ''}`}
          onClick={() => setPage('main')}
        >
          AK-SM Control
        </button>
        <button
          className={`tab-btn ${page === 'scheme' ? 'tab-active' : ''}`}
          onClick={() => setPage('scheme')}
        >
          Schemat
        </button>
      </nav>
      {page === 'main'   && <Main />}
      {page === 'scheme' && <Scheme />}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
