import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalesforceService {
  private apiUrl =
    'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/getEmails';
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      this.accessToken = savedToken;
      console.log('Access token loaded from localStorage:', this.accessToken);
    } else {
      console.log('No access token found in localStorage');
    }
  }

  // Save the access token to localStorage
  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
    console.log(
      'Access token set and saved to localStorage:',
      this.accessToken
    );
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Clear the access token (logout)
  clearAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    console.log('Access token cleared from localStorage');
  }

  // Get user emails
  getUserEmails(): Observable<string> {
    return this.http
      .get(this.apiUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        responseType: 'text'
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && localStorage.getItem('refreshToken')) {
            return this.refreshAccessToken().pipe(
              switchMap(() => this.getUserEmails())
            );
          }
          return throwError(error);
        })
      );
  }

  // Get records from Salesforce
  getRecords(objectName: string): Observable<any> {
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('Access token is not set!'));
    }

    const url = `${environment.salesforce.loginUrl}/services/data/${environment.salesforce.apiVersion}/sobjects/${objectName}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 401 && localStorage.getItem('refreshToken')) {
          return this.refreshAccessToken().pipe(
            switchMap(() => this.getRecords(objectName))
          );
        }
        return throwError(error);
      })
    );
  }

  // Refresh the access token
  private refreshAccessToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('Refresh token is not available.'));
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', environment.salesforce.clientId);
    body.set('client_secret', environment.salesforce.clientSecret);
    body.set('refresh_token', refreshToken);

    const url = `${environment.salesforce.loginUrl}/services/oauth2/token`;

    return this.http
      .post(url, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      })
      .pipe(
        switchMap((response: any) => {
          this.setAccessToken(response.access_token);
          console.log('acces token is ' + response);
          return response;
        }),
        catchError((error) => {
          console.error('Error refreshing access token:', error);
          this.clearAccessToken();
          return throwError(
            () => new Error('Session expired, please log in again.')
          );
        })
      );
  }

  // Get user info
  getUserInfo(): Observable<any> {
    const url = `${environment.salesforce.loginUrl}/services/oauth2/userinfo`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`
    });

    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 401 && localStorage.getItem('refreshToken')) {
          return this.refreshAccessToken().pipe(
            switchMap(() => this.getUserInfo())
          );
        }
        return throwError(error);
      })
    );
  }
}
