import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoroComponent } from './doro.component';

describe('DoroComponent', () => {
  let component: DoroComponent;
  let fixture: ComponentFixture<DoroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoroComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DoroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
