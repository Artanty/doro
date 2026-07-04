import { BehaviorSubject, Observable, Subject, switchMap, finalize, tap, skipUntil, filter } from 'rxjs';
import { dd } from './dd';

export class ObservableVariable<T> {
  private _bs: BehaviorSubject<T>;
  private _readySubject = new BehaviorSubject<boolean>(false);
  private _isFetching = false;
  private _refreshTrigger = new Subject<void>();
  private _provider: (() => Observable<T>) | null = null;
  private _initialValue: T;
  private _isProviderSet: boolean = false;
  
  constructor(initialValue: T, isReady: boolean = false) {
    this._bs = new BehaviorSubject<T>(initialValue);
    this._initialValue = initialValue;
    this._readySubject.next(isReady);
  }

  setProvider(provider: () => Observable<T>): this {
    if (this._isProviderSet) {
      return this;
    }
    this._provider = provider;
    this._isProviderSet = true;
    
    this._refreshTrigger.pipe(
      tap(() => {
        this._isFetching = true;
        this._readySubject.next(false);
      }),
      switchMap(() => this._provider!().pipe(
        tap(() => {
          this._readySubject.next(true);
        }),
        finalize(() => {
          this._isFetching = false;
        })
      ))
    ).subscribe({
      next: (data) => {
        this.next(data);
        
      },
      error: (error) => {
        this._readySubject.next(true);
        console.error('Failed to fetch data:', error?.message ?? error);
      },
    });
    
    return this;
  }

  getValue(): T {
    return this._bs.getValue();
  }
  
  next(newValue: T): void {
    this._bs.next(newValue);
    this._readySubject.next(true);
  }
  
  listen(): Observable<T> {
    if (!this._isProviderSet) {
      if (this._readySubject.getValue()) {
        return this._bs.asObservable();
      }
      
      if (this._isFetching) {
        return this._bs.asObservable();
      }
      
      // First request - trigger refresh
      this.refresh();
      
      return this._bs.asObservable();
    } else {
      // If not ready and not fetching, trigger the load
      if (!this._readySubject.getValue() && !this._isFetching) {
        this.refresh();
      }
      
      // Skip emissions until ready
      return this._bs.asObservable().pipe(
        skipUntil(this._readySubject
          .pipe(
            filter(Boolean)
          )
        )
      );
    }
  }
  
  refresh(): void {
    if (!this._isProviderSet) {
      throw new Error('No provider registered. Call setProvider() first.');
    }
    this._refreshTrigger.next();
  }
  
  reset(): void {
    this._bs.next(this._initialValue);
    this._readySubject.next(true);
    this._isFetching = false;
  }
}

export function obs$<T>(initialValue: T, isReady?: boolean): ObservableVariable<T> {
  return new ObservableVariable<T>(initialValue, isReady);
}