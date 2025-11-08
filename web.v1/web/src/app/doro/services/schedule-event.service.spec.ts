import { TestBed } from '@angular/core/testing';

import { ScheduleEventService } from './schedule-event.service';

describe('ScheduleEventService', () => {
  let service: ScheduleEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScheduleEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
