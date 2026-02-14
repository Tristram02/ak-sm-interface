import type { XmlResponse } from '../types/xml.types';
import { parseXmlResponse } from '../utils/xmlBuilder';

export class ApiService {
  private static endpoint: string = 'http://95.171.115.243:6080/html/xml.cgi';

  /**
   * Set the API endpoint URL
   */
  static setEndpoint(ipAddress: string, port: number = 6080): void {
    this.endpoint = `http://${ipAddress}:${port}/html/xml.cgi`;
  }

  /**
   * Get the current API endpoint URL
   */
  static getEndpoint(): string {
    return this.endpoint;
  }

  /**
   * Send XML command to the device
   */
  static async sendCommand(xmlCommand: string): Promise<XmlResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
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
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Check if the device is reachable
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
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
