import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndEventScreenComponent } from './end-event-screen.component';

describe('EndEventScreenComponent', () => {
  let component: EndEventScreenComponent;
  let fixture: ComponentFixture<EndEventScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EndEventScreenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EndEventScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
