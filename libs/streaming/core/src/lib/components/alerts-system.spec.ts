import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertsSystem } from './alerts-system';

describe('AlertsSystem', () => {
  let component: AlertsSystem;
  let fixture: ComponentFixture<AlertsSystem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsSystem],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsSystem);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
