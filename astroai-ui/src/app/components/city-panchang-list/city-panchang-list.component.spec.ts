import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityPanchangListComponent } from './city-panchang-list.component';

describe('CityPanchangListComponent', () => {
  let component: CityPanchangListComponent;
  let fixture: ComponentFixture<CityPanchangListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CityPanchangListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CityPanchangListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
