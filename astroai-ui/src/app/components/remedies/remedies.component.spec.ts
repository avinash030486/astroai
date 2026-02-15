import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemediesComponent } from './remedies.component';

describe('RemediesComponent', () => {
  let component: RemediesComponent;
  let fixture: ComponentFixture<RemediesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RemediesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemediesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
