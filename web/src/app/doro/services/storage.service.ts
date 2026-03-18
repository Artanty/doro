import { Injectable } from '@angular/core';

@Injectable()
export class StorageService {
  private readonly prefix = 'doro_'; // Optional prefix to avoid conflicts

  constructor() {}

  // Set a value in localStorage
  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Get a value from localStorage
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // Remove a value from localStorage
  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  // Clear all app-specific localStorage items
  clear(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Check if key exists
  has(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }

  // Get all keys
  keys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }

  // Get storage size (number of items)
  size(): number {
    return this.keys().length;
  }
}