import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})


export class SalesforceService {
  private baseUrl =
    'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/OutlookEmailService';
  private openAIapiUrl =
    'https://api-inference.huggingface.co/models/vennify/t5-base-grammar-correction';
  private openAIapiKey = ''; // Replace with your OpenAI API Key

  private getEmailsUrl =
    'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/getEmails';
  private getSentEmailsUrl =
    'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/getSentEmails';

  private apiUrl =
    'https://api-inference.huggingface.co/models/bert-base-uncased';
  private apiUrlSentiment =
    'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment';

  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    // Try to load the access token from localStorage when service is initialized
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
    console.log('Access token set and saved to localStorage:', this.accessToken);
  }

  // Check if user is authenticated (i.e., has a valid access token)
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Clear the access token (logout)
  clearAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    console.log('Access token cleared from localStorage');
  }

  // Get sent emails from Salesforce (GET request)
  getSentEmails(): Observable<any> {
    return this.http
      .get(this.getSentEmailsUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        responseType: 'json',
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && localStorage.getItem('refreshToken')) {
            return this.refreshAccessToken().pipe(
              switchMap(() => this.getSentEmails()) // Retry after token refresh
            );
          }
          return throwError(error); // Propagate the error
        })
      );
  }

  // Get user emails from Salesforce (GET request)
  getUserEmails(): Observable<any> {
    return this.http
      .get(this.getEmailsUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
        responseType: 'json',
      })
      .pipe(
        catchError((error) => {
          if (error.status === 401 && localStorage.getItem('refreshToken')) {
            return this.refreshAccessToken().pipe(
              switchMap(() => this.getUserEmails()) // Retry after token refresh
            );
          }
          return throwError(error); // Propagate the error
        })
      );
  }

  // Get records (any Salesforce object) from Salesforce (GET request)
  getRecords(objectName: string): Observable<any> {
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('Access token is not set!'));
    }

    const url = `${environment.salesforce.loginUrl}/services/data/${environment.salesforce.apiVersion}/sobjects/${objectName}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 401 && localStorage.getItem('refreshToken')) {
          return this.refreshAccessToken().pipe(
            switchMap(() => this.getRecords(objectName)) // Retry after token refresh
          );
        }
        return throwError(error); // Propagate the error
      })
    );
  }

  // Refresh the access token using the stored refresh token
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
          'Content-Type': 'application/x-www-form-urlencoded',
        }),
      })
      .pipe(
        switchMap((response: any) => {
          this.setAccessToken(response.access_token);
          console.log('Access token refreshed:', response.access_token);
          return response; // Return the response containing the new access token
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

  // Get user info (e.g., username, email) from Salesforce
  getUserInfo(): Observable<any> {
    const url = `${environment.salesforce.loginUrl}/services/oauth2/userinfo`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
    });

    return this.http.get(url, { headers }).pipe(
      catchError((error) => {
        if (error.status === 401 && localStorage.getItem('refreshToken')) {
          return this.refreshAccessToken().pipe(
            switchMap(() => this.getUserInfo()) // Retry after token refresh
          );
        }
        return throwError(error); // Propagate the error
      })
    );
  }

  sendEmail(payload: {
    to: string,
    subject: string,
    body: string,
    fileName: any,
    fileType: any,
    base64Content: any
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sendEmail`, payload).pipe(map((response) => response),
      catchError((error) => {
        console.error('Error correcting grammar:', error);
        return throwError(() => new Error('Failed to correct grammar.'));
      })
    );
  }
}
