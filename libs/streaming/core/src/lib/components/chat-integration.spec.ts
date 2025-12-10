import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatIntegration } from './chat-integration';

describe('ChatIntegration', () => {
  let component: ChatIntegration;
  let fixture: ComponentFixture<ChatIntegration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatIntegration],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatIntegration);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
