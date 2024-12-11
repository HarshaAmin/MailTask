import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SalesforceService {
  private apiUrl = 'https://novigosolutionspvtltd2-dev-ed.develop.my.site.com/services/apexrest/getEmails';
  private accessToken: string | null = null;

  getUserEmails() {
    return this.http.get(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('salesforceToken')}`,
      },
      responseType: 'text', // Since Apex is returning a string
    });
  }

  constructor(private http: HttpClient) {
    // On app initialization, check if there's a token in localStorage
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      this.accessToken = savedToken;
      console.log('Access token loaded from localStorage:', this.accessToken);
    } else {
      console.log('No access token found in localStorage');
    }
  }

  // Set the access token after successful login or token refresh
  setAccessToken(token: string): void {
    this.accessToken = token;
    // Save the token in localStorage for persistence across sessions
    localStorage.setItem('accessToken', token);
    console.log('Access token set and saved to localStorage:', this.accessToken);
  }

  // Check if the user is authenticated (token is present)
  isAuthenticated(): boolean {
    if (this.accessToken) {
      console.log('User is authenticated');
    } else {
      console.log('User is NOT authenticated');
    }
    return this.accessToken !== null;
  }

  // Get records from Salesforce using the stored access token
  getRecords(objectName: string): Observable<any> {
    if (!this.isAuthenticated()) {
      console.error('Error: Access token is not set!');
      return throwError(() => new Error('Access token is not set!'));

    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    const url = `${environment.salesforce.loginUrl}/services/data/${environment.salesforce.apiVersion}/sobjects/${objectName}`;

    console.log('Making API call to Salesforce:', url);

    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 401) {
          console.log('Access token expired or invalid, please log in again.');
        }
        console.error('Error fetching records from Salesforce:', error);
        return throwError(error);
      })
    );
  }

  // Get user info to validate the access token
  getUserInfo(): Observable<any> {
    if (!this.isAuthenticated()) {
      console.error('Error: Access token is not set!');
      return throwError('Access token is not set!');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    const url = `${environment.salesforce.loginUrl}/services/oauth2/userinfo`;

    console.log('Making API call to get user info:', url);

    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 401) {
          console.log('Access token expired or invalid.');
        }
        console.error('Error fetching user info from Salesforce:', error);
        return throwError(error);
      })
    );
  }

  // Refresh the access token using a refresh token (optional)
  refreshAccessToken(refreshToken: string): Observable<any> {
    console.log('Refreshing access token using refresh token:', refreshToken);

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('client_id', environment.salesforce.clientId);
    body.set('client_secret', environment.salesforce.clientSecret);
    body.set('refresh_token', refreshToken);

    const url = `${environment.salesforce.loginUrl}/services/oauth2/token`;

    console.log('Making API call to refresh access token:', url);

    return this.http.post(url, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    }).pipe(
      catchError((error) => {
        console.log('Error refreshing access token', error);
        return throwError(error);
      })
    );
  }

  // Clear access token (logout functionality)
  clearAccessToken(): void {
    console.log('Clearing access token...');
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    console.log('Access token cleared from localStorage');
  }
}
