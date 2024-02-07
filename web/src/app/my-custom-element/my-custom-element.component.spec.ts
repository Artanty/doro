import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCustomElementComponent } from './my-custom-element.component';

describe('MyCustomElementComponent', () => {
  let component: MyCustomElementComponent;
  let fixture: ComponentFixture<MyCustomElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCustomElementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyCustomElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
