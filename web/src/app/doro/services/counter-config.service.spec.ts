import { TestBed } from '@angular/core/testing';

import { CounterConfigService } from './counter-config.service';

describe('CounterConfigService', () => {
  let service: CounterConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CounterConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
