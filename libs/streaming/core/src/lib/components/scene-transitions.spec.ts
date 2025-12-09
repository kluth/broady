import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SceneTransitions } from './scene-transitions';

describe('SceneTransitions', () => {
  let component: SceneTransitions;
  let fixture: ComponentFixture<SceneTransitions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SceneTransitions],
    }).compileComponents();

    fixture = TestBed.createComponent(SceneTransitions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
