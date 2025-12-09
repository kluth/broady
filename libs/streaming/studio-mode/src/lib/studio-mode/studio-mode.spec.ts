import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudioMode } from './studio-mode';

describe('StudioMode', () => {
  let component: StudioMode;
  let fixture: ComponentFixture<StudioMode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudioMode],
    }).compileComponents();

    fixture = TestBed.createComponent(StudioMode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
