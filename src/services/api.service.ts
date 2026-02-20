import type { XmlResponse } from '../types/xml.types';
import { parseXmlResponse } from '../utils/xmlBuilder';

export class ApiService {
  private static endpoint: string = 'https://95.171.115.243:6080/html/xml.cgi';
  private static username: string = '';
  private static password: string = '';

  /**
   * Set the API endpoint URL
   */
  static setEndpoint(ipAddress: string, port: number = 6080): void {
    this.endpoint = `https://${ipAddress}:${port}/html/xml.cgi`;
  }

  /**
   * Set authentication credentials
   */
  static setCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
  }

  /**
   * Get the current username
   */
  static getUsername(): string {
    return this.username;
  }

  /**
   * Inject user= and pass= attributes into a <cmd ...> XML string
   */
  private static injectCredentials(xmlCommand: string): string {
    if (!this.username && !this.password) return xmlCommand;
    const creds = `user="${this.username}" pass="${this.password}"`;
    return xmlCommand.replace(/(<cmd\b)/, `$1 ${creds}`);
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
      const commandWithCreds = this.injectCredentials(xmlCommand);
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: commandWithCreds,
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
      const pingCmd = this.injectCredentials('<cmd action="read_units" />');
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
        },
        body: pingCmd,
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
