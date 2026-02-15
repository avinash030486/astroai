import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YearlyHoroscopeComponent } from './yearly-horoscope.component';

describe('YearlyHoroscopeComponent', () => {
  let component: YearlyHoroscopeComponent;
  let fixture: ComponentFixture<YearlyHoroscopeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YearlyHoroscopeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YearlyHoroscopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
