import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { WorkersApi } from './workers.api';

describe('WorkersApi', () => {
  it('should GET the own portfolio and a public one', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(WorkersApi);
    const http = TestBed.inject(HttpTestingController);

    api.me().subscribe();
    expect(http.expectOne(`${environment.apiUrl}/workers/me`).request.method).toBe('GET');
    api.get('u1').subscribe();
    expect(http.expectOne(`${environment.apiUrl}/workers/u1`).request.method).toBe('GET');
    http.verify();
  });
});
