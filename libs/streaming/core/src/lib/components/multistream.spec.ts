import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Multistream } from './multistream';

describe('Multistream', () => {
  let component: Multistream;
  let fixture: ComponentFixture<Multistream>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Multistream],
    }).compileComponents();

    fixture = TestBed.createComponent(Multistream);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
