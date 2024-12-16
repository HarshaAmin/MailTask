import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap, map, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { forkJoin } from 'rxjs';
import {
  SentimentResponse,
  SuggestionsResponse
} from '../app/suggestion.interface';

@Injectable({
  providedIn: 'root'
})
export class SalesforceService {
  private baseUrl =
    'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/OutlookEmailService';
  private openAIapiUrl =
    'https://api-inference.huggingface.co/models/vennify/t5-base-grammar-correction';
  private openAIapiKey = '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'; // Replace with your OpenAI API Key

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
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      this.accessToken = savedToken;
      console.log('Access token loaded from localStorage:', this.accessToken);
    } else {
      console.log('No access token found in localStorage');
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('accessToken', token);
    console.log(
      'Access token set and saved to localStorage:',
      this.accessToken
    );
  }

  getSentimentAnalysis(input: string): Observable<SentimentResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.huggingFaceApiKey}` // Use environment variable for the API key
    });
    const url = `${this.apiUrlSentiment}`;

    return this.http
      .post<SentimentResponse>(url, { inputs: input }, { headers })
      .pipe(
        tap((response) => {
          console.log('Sentiment response:', response);
        }),
        catchError((error) => {
          console.error('Error getting sentiment:', error);
          return throwError(() => new Error('Error getting sentiment.'));
        })
      );
  }

  getSuggestions(input: string): Observable<SuggestionsResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${environment.huggingFaceApiKey}` // Use environment variable for the API key
    });

    const body = { inputs: input + ' [MASK].' };

    return this.http
      .post<SuggestionsResponse>(this.apiUrl, body, { headers })
      .pipe(
        tap((response) => {
          console.log('Suggestions response:', response);
        }),
        catchError((error) => {
          console.error('Error getting suggestions:', error);
          return throwError(() => new Error('Error getting suggestions.'));
        })
      );
  }

  correctGrammar(input: string): Observable<string> {
    const apiKey = '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.openAIapiKey}`
    });

    // const body = {
    //   model: 'gpt-3.5-turbo', // or 'text-davinci-003' for older models
    //   messages: [
    //     {
    //       role: 'system',
    //       content: 'You are a grammar correction assistant. Correct the grammar and improve the readability of the following text.',
    //     },
    //     {
    //       role: 'user',
    //       content: input,
    //     },
    //   ],
    //   max_tokens: 500,
    // };

    // const body = {
    //   text: input,
    //   language: 'en',
    //   enabledOnly: false
    // };
    const body = JSON.stringify({ inputs: input });
    // const body = {
    //   inputs: [
    //     { role: 'system', content: 'You are a grammar correction assistant. Correct the grammar and improve the readability of the following text.' },
    //     { role: 'user', content: input }
    //   ],
    //   model: 'gpt-3.5-turbo', // Specify the correct model
    //   max_tokens: 500
    // };

    return this.http.post<any>(this.openAIapiUrl, body, { headers }).pipe(
      map((response) => response[0]?.generated_text),
      catchError((error) => {
        console.error('Error correcting grammar:', error);
        return throwError(() => new Error('Failed to correct grammar.'));
      })
    );
  }

  categorizeEmails(
    emailList: { subject: string; body: string }[]
  ): Observable<any> {
    return this.http.post(this.apiUrl, { emails: emailList });
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  clearAccessToken(): void {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
    console.log('Access token cleared from localStorage');
  }

  getSentEmails(): Observable<any> {
    return this.http
      .get(this.getSentEmailsUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      })
      .pipe(
        catchError((error) => this.handleAuthError(error, this.getSentEmails()))
      );
  }

  sendEmail(to: string, subject: string, body: string): Observable<any> {
    const payload = { toAddress: to, subject, bodyContent: body };
    return this.http.post<any>(`${this.baseUrl}/sendEmail`, payload).pipe(
      map((response) => response),
      catchError((error) => {
        console.error('Error correcting grammar:', error);
        return throwError(() => new Error('Failed to correct grammar.'));
      })
    );
    return this.http.post(`${this.baseUrl}/sendEmail`, payload);
  }

  // getUserEmails(): Observable<any> {
  //   return this.http.get(this.getEmailsUrl, {
  //     headers: { Authorization: `Bearer ${this.accessToken}` },
  //   }).pipe(
  //     catchError((error) => this.handleAuthError(error, this.getUserEmails()))
  //   );
  // }

  getRecords(objectName: string): Observable<any> {
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('Access token is not set!'));
    }

    const url = `${environment.salesforce.loginUrl}/services/data/${environment.salesforce.apiVersion}/sobjects/${objectName}`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`
    });

    return this.http
      .get(url, { headers })
      .pipe(
        catchError((error) =>
          this.handleAuthError(error, this.getRecords(objectName))
        )
      );
  }

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
          console.log('Access token refreshed:', response.access_token);
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

  private handleAuthError(
    error: any,
    retryFn: Observable<any>
  ): Observable<any> {
    if (error.status === 401 && localStorage.getItem('refreshToken')) {
      return this.refreshAccessToken().pipe(
        switchMap(() => retryFn) // Retry the original function after token refresh
      );
    }
    return throwError(error); // Propagate the error
  }

  getUserInfo(): Observable<any> {
    const url = `${environment.salesforce.loginUrl}/services/oauth2/userinfo`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`
    });

    return this.http
      .get(url, { headers })
      .pipe(
        catchError((error) => this.handleAuthError(error, this.getUserInfo()))
      );
  }
}
