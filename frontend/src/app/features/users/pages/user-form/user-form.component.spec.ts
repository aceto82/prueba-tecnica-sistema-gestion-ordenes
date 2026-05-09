import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { UserFormComponent } from './user-form.component';
import { UserStore } from '../../user.store';

function makeUserStoreMock() {
  return {
    users: signal([]).asReadonly(),
    loading: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    params: signal({ page: 0, size: 10, sort: 'id,asc' }).asReadonly(),
    totalElements: signal(0).asReadonly(),
    totalPages: signal(0).asReadonly(),
    selected: signal(null).asReadonly(),
    currentPage: computed(() => 0),
    hasNext: computed(() => false),
    isEmpty: computed(() => true),
    load: jest.fn(() => of(void 0)),
    selectById: jest.fn(() => of(void 0)),
    create: jest.fn(() => of({ id: 1, username: 'newuser', role: 'USER' })),
    update: jest.fn(() => of({ id: 1, username: 'updated', role: 'ADMIN' })),
    delete: jest.fn(() => of(void 0)),
  };
}

describe('UserFormComponent (smoke)', () => {
  let fixture: ComponentFixture<UserFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent, RouterTestingModule],
      providers: [
        { provide: UserStore, useValue: makeUserStoreMock() },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the New User heading', () => {
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('New User');
  });

  it('should render a form with submit button', () => {
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).not.toBeNull();
  });
});
