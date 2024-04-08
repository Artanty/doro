import { appendFile } from 'fs/promises';

export class ErrorLogger {
  private static logFilePath = './error.log';

  public static async logError(error: any) {
      try {
          const errorMessage = `Error: ${error.message}\nStack: ${error.stack}\nTimestamp: ${new Date().toISOString()}\n\n`;
          await appendFile(this.logFilePath, errorMessage);
      } catch (err) {
          console.error('Error logging error:', err);
      }
  }
}