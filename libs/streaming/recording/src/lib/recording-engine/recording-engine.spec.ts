import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordingEngine } from './recording-engine';

describe('RecordingEngine', () => {
  let component: RecordingEngine;
  let fixture: ComponentFixture<RecordingEngine>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordingEngine],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordingEngine);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
