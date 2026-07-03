import { BehaviorSubject, Observable, Subject, switchMap, finalize, tap } from 'rxjs';

export class ObservableVariable<T> {
  private bs: BehaviorSubject<T>;
  private isReady = false;
  private isFetching = false;
  private refreshTrigger = new Subject<void>();
  private provider: (() => Observable<T>) | null = null;
  private initialValue: T;
  
  constructor(initialValue: T) {
    this.bs = new BehaviorSubject<T>(initialValue);
    this.initialValue = initialValue;
  }

  // Register the provider function that fetches data
  setProvider(provider: () => Observable<T>): this {
    this.provider = provider;
    
    // Setup refresh trigger
    this.refreshTrigger.pipe(
      tap(() => {
        this.isFetching = true;
        this.isReady = false;
      }),
      switchMap(() => this.provider!().pipe(
        finalize(() => {
          this.isFetching = false;
        })
      ))
    ).subscribe({
      next: (data) => {
        this.next(data);
      },
      error: (error) => {
        this.isReady = true;
        throw new Error('Failed to fetch data:', error?.message ?? error);
      },
    });
    
    return this;
  }

  getValue(): T {
    return this.bs.getValue();
  }
  
  next(newValue: T): void {
    this.bs.next(newValue);
    this.isReady = true;
  }
  
  // Get the observable with lazy loading
  listen(): Observable<T> {
    if (this.isReady) {
      return this.bs.asObservable();
    }
    
    if (this.isFetching) {
      return this.bs.asObservable();
    }
    
    // First request - trigger refresh
    this.refresh();
    return this.bs.asObservable();
  }
  
  // Force refresh
  refresh(): void {
    if (!this.provider) {
      throw new Error('No provider registered. Call setProvider() first.');
    }
    this.refreshTrigger.next();
  }
  
  reset(): void {
    this.bs.next(this.initialValue);
    this.isReady = false;
    this.isFetching = false;
  }
}

export function obs$<T>(initialValue: T): ObservableVariable<T> {
  return new ObservableVariable<T>(initialValue);
}