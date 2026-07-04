import { BehaviorSubject, Observable, Subject, switchMap, finalize, tap } from 'rxjs';
import { dd } from './dd';

export class ObservableVariable<T> {
  private _bs: BehaviorSubject<T>;
  private _isReady = false;
  private _isFetching = false;
  private _refreshTrigger = new Subject<void>();
  private _provider: (() => Observable<T>) | null = null;
  private _initialValue: T;
  private _isProviderSet: boolean = false;
  
  constructor(initialValue: T, isReady: boolean = false) {
    this._bs = new BehaviorSubject<T>(initialValue);
    this._initialValue = initialValue;
    this._isReady = isReady;
  }

  // Register the provider function that fetches data
  setProvider(provider: () => Observable<T>): this {
    if (this._isProviderSet) {
      return this;
    }
    this._provider = provider;
    this._isProviderSet = true;
    
    // Setup refresh trigger
    this._refreshTrigger.pipe(
      tap(() => {
        this._isFetching = true;
        this._isReady = false;
      }),
      switchMap(() => this._provider!().pipe(
        finalize(() => {
          this._isFetching = false;
        })
      ))
    ).subscribe({
      next: (data) => {
        this.next(data);
      },
      error: (error) => {
        this._isReady = true;
        throw new Error('Failed to fetch data:', error?.message ?? error);
      },
    });
    
    return this;
  }

  getValue(): T {
    return this._bs.getValue();
  }
  
  next(newValue: T): void {
    this._bs.next(newValue);
    this._isReady = true;
  }
  
  // Get the observable with lazy loading
  listen(): Observable<T> {
    if (this._isReady) {
      return this._bs.asObservable();
    }
    
    if (this._isFetching) {
      return this._bs.asObservable();
    }
    
    // First request - trigger refresh
    this.refresh();
    return this._bs.asObservable();
  }
  
  // Force refresh
  refresh(): void {
    if (!this._provider) {
      throw new Error('No provider registered. Call setProvider() first.');
    }
    this._refreshTrigger.next();
  }
  
  reset(): void {
    this._bs.next(this._initialValue);
    this._isReady = false;
    this._isFetching = false;
  }
}

export function obs$<T>(initialValue: T, isReady?: boolean): ObservableVariable<T> {
  return new ObservableVariable<T>(initialValue, isReady);
}