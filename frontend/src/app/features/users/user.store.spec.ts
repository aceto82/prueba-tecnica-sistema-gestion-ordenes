import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserStore } from './user.store';

describe('UserStore', () => {
  let store: UserStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    store = TestBed.inject(UserStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('load should set users and pagination signals', (done) => {
    store.load().subscribe({
      next: () => {
        expect(store.loading()).toBe(false);
        expect(store.users().length).toBe(2);
        expect(store.totalElements()).toBe(2);
        expect(store.totalPages()).toBe(1);
        expect(store.currentPage()).toBe(0);
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/users'
    );
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({
      content: [
        { id: 1, username: 'admin', role: 'ADMIN' },
        { id: 2, username: 'jdoe', role: 'USER' },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
    });
  });

  it('load should set error signal on failure', (done) => {
    store.load().subscribe({
      next: () => done.fail('Expected error'),
      error: () => {
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeTruthy();
        expect(store.users().length).toBe(0);
        done();
      },
    });

    const req = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/users'
    );
    req.flush({ detail: 'Server error' }, { status: 500, statusText: 'Server Error' });
  });

  it('create should prepend new user to list', (done) => {
    store.create({ username: 'newuser', password: 'pass123', role: 'USER' }).subscribe({
      next: (user) => {
        expect(user.id).toBe(3);
        expect(store.users().length).toBe(1);
        expect(store.users()[0].username).toBe('newuser');
        done();
      },
      error: done.fail,
    });

    const req = httpMock.expectOne('http://localhost:8080/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'newuser', password: 'pass123', role: 'USER' });
    req.flush({ id: 3, username: 'newuser', role: 'USER' });
  });

  it('update should replace user in list and selected', (done) => {
    // First load some users
    store.load().subscribe();
    const loadReq = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/users'
    );
    loadReq.flush({
      content: [{ id: 1, username: 'oldname', role: 'USER' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
    });

    // Now update
    store.update(1, { username: 'newname', role: 'ADMIN' }).subscribe({
      next: () => {
        expect(store.users()[0].username).toBe('newname');
        expect(store.users()[0].role).toBe('ADMIN');
        done();
      },
      error: done.fail,
    });

    const updateReq = httpMock.expectOne('http://localhost:8080/api/users/1');
    expect(updateReq.request.method).toBe('PUT');
    expect(updateReq.request.body).toEqual({ username: 'newname', role: 'ADMIN' });
    updateReq.flush({ id: 1, username: 'newname', role: 'ADMIN' });
  });

  it('delete should remove user from list', (done) => {
    // First load
    store.load().subscribe();
    const loadReq = httpMock.expectOne(
      (r) => r.url === 'http://localhost:8080/api/users'
    );
    loadReq.flush({
      content: [{ id: 1, username: 'admin', role: 'ADMIN' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      first: true,
      last: true,
    });

    // Delete
    store.delete(1).subscribe({
      next: () => {
        expect(store.users().length).toBe(0);
        expect(store.totalElements()).toBe(0);
        done();
      },
      error: done.fail,
    });

    const deleteReq = httpMock.expectOne('http://localhost:8080/api/users/1');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null, { status: 204, statusText: 'No Content' });
  });
});
