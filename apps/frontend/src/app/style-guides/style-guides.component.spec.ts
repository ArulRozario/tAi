import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StyleGuidesComponent } from './style-guides.component';

describe('StyleGuidesComponent', () => {
  let component: StyleGuidesComponent;
  let fixture: ComponentFixture<StyleGuidesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StyleGuidesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StyleGuidesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
