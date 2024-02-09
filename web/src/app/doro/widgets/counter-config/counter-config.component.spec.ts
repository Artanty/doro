import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterConfigComponent } from './counter-config.component';

describe('CounterConfigComponent', () => {
  let component: CounterConfigComponent;
  let fixture: ComponentFixture<CounterConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CounterConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
