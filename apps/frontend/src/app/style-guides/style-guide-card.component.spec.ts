import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StyleGuideCardComponent } from './style-guide-card.component';

describe('StyleGuideCardComponent', () => {
  let component: StyleGuideCardComponent;
  let fixture: ComponentFixture<StyleGuideCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StyleGuideCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StyleGuideCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
