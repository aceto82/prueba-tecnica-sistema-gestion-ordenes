import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerDetailComponent } from './customer-detail.component';

describe('CustomerDetailComponent (smoke)', () => {
  let fixture: ComponentFixture<CustomerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the placeholder text', () => {
    expect(fixture.nativeElement.textContent).toContain('Customer detail');
  });
});
