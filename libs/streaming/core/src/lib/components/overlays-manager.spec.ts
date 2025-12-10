import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlaysManager } from './overlays-manager';

describe('OverlaysManager', () => {
  let component: OverlaysManager;
  let fixture: ComponentFixture<OverlaysManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlaysManager],
    }).compileComponents();

    fixture = TestBed.createComponent(OverlaysManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
