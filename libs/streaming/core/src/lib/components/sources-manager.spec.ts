import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SourcesManager } from './sources-manager';

describe('SourcesManager', () => {
  let component: SourcesManager;
  let fixture: ComponentFixture<SourcesManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourcesManager],
    }).compileComponents();

    fixture = TestBed.createComponent(SourcesManager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
