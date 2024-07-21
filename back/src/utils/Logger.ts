import { appendFile, readFile, writeFile } from 'fs/promises';
import fs, { existsSync } from 'fs';
import { config } from 'dotenv';
import { MS_TIME } from '../core/constants';

config();
export interface ILogOptions { badge: string }
export type TLogOptions = Partial<ILogOptions>

export class Logger {
  private static logDirectory = './_logs';
  private static logEventsFilePath = `${Logger.logDirectory}/event.log`;
  private static logErrorsFilePath = `${Logger.logDirectory}/error.log`;

  public static async logError(error: Error, extra?: TLogOptions): Promise<void> {
    try {
      let extraText: string | undefined
      
      if (extra && extra.badge) {
          extraText = '[' + extra.badge.toUpperCase() + '] '
      } 

      const errorMessage = `${(extraText ?? '')}Error: ${error.message}\nStack: ${error.stack}\nTimestamp: ${new Date().toISOString()}\n\n`;
      
      // Check if the log file exists
      if (!fs.existsSync(this.logDirectory)) {
          fs.mkdirSync(this.logDirectory, { recursive: true });
      }
      if (!existsSync(this.logErrorsFilePath)) {
        await appendFile(this.logErrorsFilePath, errorMessage);
        return;
      }

      // Read the last entry from the log file
      const logContent = await readFile(this.logErrorsFilePath, 'utf8');
      const entries = logContent.split('\n\n').filter(entry => entry.trim() !== '');
      const lastEntry = entries[entries.length - 1];

      // Extract the timestamp from the last entry
      const lastTimestampMatch = lastEntry.match(/Timestamp: (.+)/);
      if (lastTimestampMatch) {
        const lastTimestamp = new Date(lastTimestampMatch[1]);
        const now = new Date();

        // Check if more than the specified threshold has passed since the last entry
        if (now.getTime() - lastTimestamp.getTime() > Logger.getLogsLength()) {
          // Clear the file and start from scratch
          await writeFile(this.logErrorsFilePath, errorMessage);
          return;
        }
      }

      // Append the new error entry
      await appendFile(this.logErrorsFilePath, errorMessage);
    } catch (err) {
      console.error('Error logging error:', err);
    }
  }

  public static async log(event: string, extra?: TLogOptions): Promise<void> {
    try {
      let extraText: string | undefined
      
      if (extra && extra.badge) {
          extraText = '[' + extra.badge.toUpperCase() + '] '
      } 

      const errorMessage = `${(extraText ?? '')}Event: ${event}\nTimestamp: ${new Date().toISOString()}\n\n`;
      
      // Check if the log file exists
      if (!fs.existsSync(this.logDirectory)) {
          fs.mkdirSync(this.logDirectory, { recursive: true });
      }
      if (!existsSync(this.logEventsFilePath)) {
        await appendFile(this.logEventsFilePath, errorMessage);
        return;
      }

      // Read the last entry from the log file
      const logContent = await readFile(this.logEventsFilePath, 'utf8');
      const entries = logContent.split('\n\n').filter(entry => entry.trim() !== '');
      const lastEntry = entries[entries.length - 1];

      // Extract the timestamp from the last entry
      const lastTimestampMatch = lastEntry.match(/Timestamp: (.+)/);
      if (lastTimestampMatch) {
        const lastTimestamp = new Date(lastTimestampMatch[1]);
        const now = new Date();

        if (now.getTime() - lastTimestamp.getTime() > Logger.getLogsLength()) {
          // Clear the file and start from scratch
          await writeFile(this.logEventsFilePath, errorMessage);
          return;
        }
      }

      await appendFile(this.logEventsFilePath, errorMessage);
    } catch (err) {
      console.error('Error logging event:', err);
    }
  }

  private static getLogsLength (): number {
    const logsLength = process.env.LOGS_LENGTH
    ? MS_TIME[process.env.LOGS_LENGTH as keyof typeof MS_TIME]
    : MS_TIME.WEEK

    return logsLength
  }
}

export function logError (error: unknown, extra?: TLogOptions): void {
  
  if (error instanceof Error) {
    console.error(error.message); 
  } else {
    console.error('An error occurred:', error);
    error = new Error(String(error))
  }

  Logger.logError(error as Error, extra)

}

export function log(event: string, extra?: TLogOptions): void {
  Logger.log(event, extra);
}