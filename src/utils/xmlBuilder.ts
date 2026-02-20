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

// Recursive type for fully-parsed XML nodes
export interface XmlNode {
  _tag: string;
  _attrs: Record<string, string>;
  _text?: string;
  _children: XmlNode[];
}

/**
 * Recursively parse a DOM Element into an XmlNode, capturing
 * every attribute and every child element — nothing is dropped.
 */
function parseElement(el: Element): XmlNode {
  const attrs: Record<string, string> = {};
  Array.from(el.attributes).forEach(a => {
    attrs[a.name] = a.value;
  });

  const children: XmlNode[] = [];
  Array.from(el.children).forEach(child => {
    children.push(parseElement(child));
  });

  // Direct text content (ignoring whitespace-only and child element text)
  const directText = Array.from(el.childNodes)
    .filter(n => n.nodeType === Node.TEXT_NODE)
    .map(n => n.textContent?.trim() ?? '')
    .join('')
    .trim();

  const node: XmlNode = { _tag: el.tagName, _attrs: attrs, _children: children };
  if (directText) node._text = directText;
  return node;
}

/**
 * Parse XML response string to extract ALL data from the entire XML tree.
 * Returns the root XmlNode (the <resp> element) plus top-level action/error
 * for backward compatibility with XmlResponse.
 */
export function parseXmlResponse(xmlString: string): Record<string, unknown> {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML response');
  }

  const resp = xmlDoc.documentElement;
  if (!resp) {
    throw new Error('No root element found');
  }

  const tree = parseElement(resp);

  return {
    action: resp.getAttribute('action') ?? '',
    error: parseInt(resp.getAttribute('error') ?? '0', 10),
    tree,
  };
}
