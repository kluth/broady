import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreamingCore } from './streaming-core';

describe('StreamingCore', () => {
  let component: StreamingCore;
  let fixture: ComponentFixture<StreamingCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingCore],
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingCore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
