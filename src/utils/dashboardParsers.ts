// ── Device-specific parser (Chłodnictwo panel) ────────────────────────────────
import type { DeviceItem } from '../pages/DashboardPage';

export function parseDevices(xml: string): DeviceItem[] {
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

// ── Generic val parser (Alarmy / Wejścia panels) ──────────────────────────────
export interface ValItem {
  n: string; descr: string; val: string; unit: string; state: string;
  tag: string; allAttrs: Record<string, string>;
}

export function parseVals(xml: string): ValItem[] {
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

export function getError(xml: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const err = doc.documentElement?.getAttribute('error');
    if (err && err !== '0') return `Błąd urządzenia: ${err}`;
    return null;
  } catch { return null; }
}
