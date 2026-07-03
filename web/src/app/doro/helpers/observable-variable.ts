import { BehaviorSubject, Observable } from 'rxjs';

export class ObservableVariable<T> {
  private bs: BehaviorSubject<T>;
  
  constructor(
    initialValue: T,
  ) {
    this.bs = new BehaviorSubject<T>(initialValue);
  }

  getValue(): T {
    return this.bs.getValue();
  }
  
  next(newValue: T): void {
    this.bs.next(newValue);
  }
  
  listen(): Observable<T> {
    return this.bs.asObservable();
  }
}

export function obs$<T>(initialValue: T): ObservableVariable<T> {
  return new ObservableVariable<T>(initialValue);
}