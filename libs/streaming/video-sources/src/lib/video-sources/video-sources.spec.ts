import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoSources } from './video-sources';

describe('VideoSources', () => {
  let component: VideoSources;
  let fixture: ComponentFixture<VideoSources>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoSources],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoSources);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
