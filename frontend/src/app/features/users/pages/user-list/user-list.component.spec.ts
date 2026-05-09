import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { UserListComponent } from './user-list.component';
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
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(() => of(void 0)),
  };
}

describe('UserListComponent (smoke)', () => {
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent, RouterTestingModule],
      providers: [
        { provide: UserStore, useValue: makeUserStoreMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    fixture.detectChanges();
  });

  it('should render without errors', () => {
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should display the Users heading', () => {
    const heading = fixture.nativeElement.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Users');
  });

  it('should show the New User link', () => {
    const link = fixture.nativeElement.querySelector('a[routerlink="/users/new"], a[href="/users/new"]');
    expect(link).not.toBeNull();
  });
});
