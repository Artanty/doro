import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerWrapperComponent } from './timer-wrapper.component';

describe('TimerWrapperComponent', () => {
  let component: TimerWrapperComponent;
  let fixture: ComponentFixture<TimerWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerWrapperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TimerWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
