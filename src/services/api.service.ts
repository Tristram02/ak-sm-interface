import type { XmlResponse } from '../types/xml.types';
import { parseXmlResponse } from '../utils/xmlBuilder';

/**
 * API Service — all device commands are now proxied through the api-service backend.
 * The backend reads the device IP/port/credentials from the DB, so we only send XML.
 */
export class ApiService {
  private static token: string = '';
  private static buildingId: number | null = null;

  static setToken(token: string): void {
    this.token = token;
  }

  static setBuildingId(id: number): void {
    this.buildingId = id;
  }

  static getBuildingId(): number | null {
    return this.buildingId;
  }

  private static authHeaders(): HeadersInit {
    return { Authorization: `Bearer ${this.token}` };
  }

  /**
   * Send XML command to the selected building's AK-SM device via the api-service proxy.
   */
  static async sendCommand(xmlCommand: string): Promise<XmlResponse> {
    if (!this.buildingId) throw new Error('No building selected');

    const response = await fetch(`/api/buildings/${this.buildingId}/command`, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/xml',
      },
      body: xmlCommand,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    const parsedData = parseXmlResponse(responseText);

    return {
      action: parsedData.action as string,
      error: parsedData.error as number,
      data: parsedData,
      rawXml: responseText,
    };
  }

  /**
   * Check if the device is reachable by sending a minimal command.
   */
  static async checkConnection(): Promise<boolean> {
    if (!this.buildingId) return false;
    try {
      const response = await fetch(`/api/buildings/${this.buildingId}/command`, {
        method: 'POST',
        headers: {
          ...this.authHeaders(),
          'Content-Type': 'application/xml',
        },
        body: '<cmd action="read_units" />',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
