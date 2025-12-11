import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StreamingProtocols } from './streaming-protocols';

describe('StreamingProtocols', () => {
  let component: StreamingProtocols;
  let fixture: ComponentFixture<StreamingProtocols>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingProtocols],
    }).compileComponents();

    fixture = TestBed.createComponent(StreamingProtocols);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
