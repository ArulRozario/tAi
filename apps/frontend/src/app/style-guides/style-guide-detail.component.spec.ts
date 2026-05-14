import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StyleGuideDetailComponent } from './style-guide-detail.component';

describe('StyleGuideDetailComponent', () => {
  let component: StyleGuideDetailComponent;
  let fixture: ComponentFixture<StyleGuideDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StyleGuideDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StyleGuideDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
