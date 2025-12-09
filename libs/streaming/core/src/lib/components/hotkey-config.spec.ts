import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HotkeyConfig } from './hotkey-config';

describe('HotkeyConfig', () => {
  let component: HotkeyConfig;
  let fixture: ComponentFixture<HotkeyConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotkeyConfig],
    }).compileComponents();

    fixture = TestBed.createComponent(HotkeyConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
