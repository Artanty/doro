import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, skip } from 'rxjs/operators';

export class ObservableVariable<T> {
  private subject: BehaviorSubject<T>;
  private validator?: (value: T) => boolean;
  private initialValue: T;
  private wasSet = false; // Track if value was ever set after creation
  
  constructor(
    initialValue: T, 
    options?: {
      validator?: (value: T) => boolean;
      distinct?: boolean;
    }
  ) {
    this.initialValue = initialValue;
    this.subject = new BehaviorSubject<T>(initialValue);
    this.validator = options?.validator;
  }
  
  get value(): T {
    return this.subject.getValue();
  }

  get req(): NonNullable<T> {
    const value = this.subject.getValue();
    
    if (value === null || value === undefined) {
      throw new Error(`Expected non-null value but got ${value}`);
    }
    
    return value as NonNullable<T>;
  }

  getValue(): T {
    return this.subject.getValue();
  }
  
  setValue(newValue: T) {
    if (this.validator && !this.validator(newValue)) {
      throw new Error(`Invalid value: ${newValue}`);
    }
    this.subject.next(newValue);
    this.wasSet = true; // Mark that a real value was set
  }
  
  next(newValue: T): boolean {
    try {
      this.setValue(newValue);
      return true;
    } catch {
      return false;
    }
  }
  
  update(updater: (currentValue: T) => T): boolean {
    try {
      this.setValue(updater(this.value));
      return true;
    } catch {
      return false;
    }
  }
  
  get $(): BehaviorSubject<T> {
    return this.subject;
  }

  // Regular listen - includes everything (including initial)
  listen(): Observable<T> {
    return this.subject.asObservable();
  }

  // Listen only for real changes (skips initial value, but includes current value if it was set)
  listenReal(): Observable<T> {
    if (this.wasSet) {
      // If value was set before, include current value
      return this.subject.asObservable();
    } else {
      // If never set, skip the initial value
      return this.subject.asObservable().pipe(skip(1));
    }
  }

  // Listen with option to skip initial value
  // listen(options?: { skipInitial?: boolean }): Observable<T> {
  //   if (!options?.skipInitial) {
  //     return this.subject.asObservable();
  //   }
    
  //   // Skip initial only if value was never set
  //   if (!this.wasSet) {
  //     return this.subject.asObservable().pipe(skip(1));
  //   }
    
  //   // Value was set before, include current value
  //   return this.subject.asObservable();
  // }
  
  // Check if a real value was ever set
  get isSet(): boolean {
    return this.wasSet;
  }
  
  get listenReq(): Observable<NonNullable<T>> {
    return this.subject.asObservable()
      .pipe(filter(res => {
        return res !== null && res !== undefined;
      })) as Observable<NonNullable<T>>;
  }
  
  get distinct$(): Observable<T> {
    return this.subject.pipe(distinctUntilChanged());
  }
  
  map<R>(mapper: (value: T) => R): Observable<R> {
    return this.subject.pipe(map(mapper));
  }
  
  subscribe(callback: (value: T) => void) {
    return this.subject.subscribe(callback);
  }
  
  complete(): void {
    this.subject.complete();
  }
  
  get isCompleted(): boolean {
    return this.subject.isStopped;
  }
  
  reset(initialValue?: T): void {
    this.subject.next(initialValue !== undefined ? initialValue : this.initialValue);
    this.wasSet = false; // Reset the flag when resetting
  }
  
  // Force set without marking as "set" (useful for initial data load)
  setSilent(newValue: T) {
    if (this.validator && !this.validator(newValue)) {
      throw new Error(`Invalid value: ${newValue}`);
    }
    this.subject.next(newValue);
    // Don't set wasSet flag
  }
}

export function obs$<T>(initialValue: T): ObservableVariable<T> {
  return new ObservableVariable<T>(initialValue);
}