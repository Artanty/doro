import { appendFile, readFile, writeFile } from 'fs/promises';
import fs, { existsSync } from 'fs';
import { config } from 'dotenv';
import { MS_TIME } from '../core/constants';

config();
export interface ILogOptions { badge: string }
export type TLogOptions = Partial<ILogOptions>

export class Logger {
  private static logDirectory = './_logs';
  private static logFilePath = {
    event: `${Logger.logDirectory}/event.log`,
    error: `${Logger.logDirectory}/error.log`,
  }

  public static async logError(error: Error, extra?: TLogOptions): Promise<Error | void> {

    let extraText: string | undefined
    
    if (extra && extra.badge) {
        extraText = '[' + extra.badge.toUpperCase() + '] '
    } 

    const errorMessage = `${(extraText ?? '')}Error: ${error.message}\nStack: ${error.stack}\nTimestamp: ${new Date().toISOString()}\n\n`;
    
    return Logger.saveToFile(errorMessage, 'error')
  }

  public static async log(event: string, extra?: TLogOptions): Promise<Error | void> {

    let extraText: string | undefined
    
    if (extra && extra.badge) {
        extraText = '[' + extra.badge.toUpperCase() + '] '
    }

    const date = new Date()

    const localeDateString = date.toTimeString().slice(0, 8)

    const errorMessage = `${(extraText ?? '')}Event: ${event}\n${localeDateString} (locale)\nTimestamp: ${date.toISOString()}\n\n`;
    
    return Logger.saveToFile(errorMessage, 'event')
  }

  private static async saveToFile (message: string, logType: 'event' | 'error') {
    const path = this.logFilePath[logType]
    // Check if the log file exists
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
    if (!existsSync(path)) {
      await appendFile(path, message);
      return;
    }
    
    // Read the last entry from the log file
    const logContent = await readFile(path, 'utf8');
    const entries = logContent.split('\n\n').filter(entry => entry.trim() !== '');
    const lastEntry = entries[entries.length - 1];

    if (lastEntry) {
      // Extract the timestamp from the last entry
      const lastTimestampMatch = lastEntry.match(/Timestamp: (.+)/);
      if (lastTimestampMatch) {
        const lastTimestamp = new Date(lastTimestampMatch[1]);
        const now = new Date();

        // Check if more than the specified threshold has passed since the last entry
        if (now.getTime() - lastTimestamp.getTime() > Logger.getLogsLength()) {
          // Clear the file and start from scratch
          await writeFile(path, message);
          return;
        }
      }
    }
    return await appendFile(path, message);
  }

  private static getLogsLength (): number {
    const logsLength = process.env.LOGS_LENGTH
    ? MS_TIME[process.env.LOGS_LENGTH as keyof typeof MS_TIME]
    : MS_TIME.WEEK

    return logsLength
  }
}

/**
 * use with await to assure writing in file is done. 
 */
export function logError (error: unknown, options?: TLogOptions): Promise<void | Error> {
  
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('An error occurred:', error);
    error = new Error(String(error))
  }

  return Logger.logError(error as Error, options)
}

export function log(event: string | any[], options?: TLogOptions): Promise<void | Error> {
  
  if (Array.isArray(event)) {
    event = event.join(', ')
  }

  // todo - вынести в метод. в зависимости от настроек подставлять таймстемп
  const badge = (options && options.badge) 
    ? '[' + options.badge.toUpperCase() + '] '
    : ''
  const message = `${badge} ${event}`;
  console.log(message)

  return Logger.log(event, options);
}