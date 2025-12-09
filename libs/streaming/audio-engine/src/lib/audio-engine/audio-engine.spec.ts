import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AudioEngine } from './audio-engine';

describe('AudioEngine', () => {
  let component: AudioEngine;
  let fixture: ComponentFixture<AudioEngine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioEngine],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioEngine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
