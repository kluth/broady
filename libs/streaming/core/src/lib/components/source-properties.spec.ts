import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SourceProperties } from './source-properties';

describe('SourceProperties', () => {
  let component: SourceProperties;
  let fixture: ComponentFixture<SourceProperties>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SourceProperties],
    }).compileComponents();

    fixture = TestBed.createComponent(SourceProperties);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
