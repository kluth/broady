import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SceneManager } from './scene-manager';

describe('SceneManager', () => {
  let component: SceneManager;
  let fixture: ComponentFixture<SceneManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SceneManager],
    }).compileComponents();

    fixture = TestBed.createComponent(SceneManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
