import React from 'react';
import type { ValItem } from '../../utils/dashboardParsers';

interface ValTableProps {
  items: ValItem[];
}

export const ValTable: React.FC<ValTableProps> = ({ items }) => {
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
