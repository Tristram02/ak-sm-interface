import type { CommandFormData, ReadValCommand } from '../types/xml.types';

/**
 * Build XML command string from command data
 */
export function buildXmlCommand(data: CommandFormData): string {
  const { action, nodetype, node, cid, vid, mod, point } = data;
  
  const attributes: string[] = [`action="${action}"`];
  
  if (nodetype !== undefined) attributes.push(`nodetype="${nodetype}"`);
  if (node !== undefined) attributes.push(`node="${node}"`);
  if (mod !== undefined) attributes.push(`mod="${mod}"`);
  if (point !== undefined) attributes.push(`point="${point}"`);
  
  // For read_val commands, add nested val elements if cid/vid are provided
  if (action === 'read_val' && (cid !== undefined || vid !== undefined)) {
    const valAttrs: string[] = [];
    if (nodetype !== undefined) valAttrs.push(`nodetype="${nodetype}"`);
    if (node !== undefined) valAttrs.push(`node="${node}"`);
    if (cid !== undefined) valAttrs.push(`cid="${cid}"`);
    if (vid !== undefined) valAttrs.push(`vid="${vid}"`);
    
    return `<cmd action="${action}"><val ${valAttrs.join(' ')} /></cmd>`;
  }
  
  return `<cmd ${attributes.join(' ')} />`;
}

/**
 * Build read_val command with multiple values
 */
export function buildReadValCommand(values: ReadValCommand[]): string {
  const valElements = values.map(val => {
    const attrs: string[] = [];
    if (val.nodetype !== undefined) attrs.push(`nodetype="${val.nodetype}"`);
    if (val.node !== undefined) attrs.push(`node="${val.node}"`);
    if (val.cid !== undefined) attrs.push(`cid="${val.cid}"`);
    if (val.vid !== undefined) attrs.push(`vid="${val.vid}"`);
    if (val.tag) attrs.push(`tag="${val.tag}"`);
    if (val.field) attrs.push(`field="${val.field}"`);
    
    return `<val ${attrs.join(' ')} />`;
  }).join('\n  ');
  
  return `<cmd action="read_val">\n  ${valElements}\n</cmd>`;
}

/**
 * Format XML string with indentation for display
 */
export function formatXml(xml: string): string {
  let formatted = '';
  let indent = 0;
  
  xml.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) indent--;
    formatted += '  '.repeat(indent) + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/)) indent++;
  });
  
  return formatted.substring(1, formatted.length - 2);
}

/**
 * Parse XML response string to extract data
 */
export function parseXmlResponse(xmlString: string): Record<string, unknown> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML response');
  }
  
  const resp = xmlDoc.querySelector('resp');
  if (!resp) {
    throw new Error('No response element found');
  }
  
  const result: Record<string, unknown> = {
    action: resp.getAttribute('action') || '',
    error: parseInt(resp.getAttribute('error') || '0', 10),
  };
  
  // Parse val elements
  const valElements = resp.querySelectorAll('val');
  if (valElements.length > 0) {
    result.values = Array.from(valElements).map(val => {
      const valData: Record<string, unknown> = {};
      
      Array.from(val.attributes).forEach(attr => {
        valData[attr.name] = attr.value;
      });
      
      if (val.textContent?.trim()) {
        valData.value = val.textContent.trim();
      }
      
      ['value', 'min', 'max', 'def'].forEach(tag => {
        const elem = val.querySelector(tag);
        if (elem?.textContent) {
          valData[tag] = elem.textContent.trim();
        }
      });
      
      return valData;
    });
  }
  
  return result;
}
