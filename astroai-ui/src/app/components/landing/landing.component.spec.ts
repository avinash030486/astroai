import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingComponent ],
      imports: [ RouterTestingModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have fireflies array', () => {
    expect(component.fireflies.length).toBe(7);
  });

  it('should navigate to birth-chart on startJourney', () => {
    const navigateSpy = spyOn(router, 'navigate');
    
    component.startJourney();
    
    expect(navigateSpy).toHaveBeenCalledWith(['/birth-chart']);
  });
});
