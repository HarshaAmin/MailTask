// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private oauthService: OAuthService, private http: HttpClient) {}

  // OAuth settings for Salesforce
  private oauthSettings = {
    issuer: 'https://login.salesforce.com',
    redirectUri: 'https://login.salesforce.com/services/oauth2/callback',  // Example: 'https://your-app-url.com/oauth/callback'
    clientId: '3MVG9PwZx9R6_UreJ7pGOqAjPactZ4PlE.3xrcLSvO1smOsk4K0cCDaCjEJdqUDyaUXwtYrEElDjSAxRVfMy9',  // Your Salesforce consumer key
    scope: 'full',
    responseType: 'code',
    showDebugInformation: true,  // Useful for debugging
  };

  initOAuth() {
    this.oauthService.configure(this.oauthSettings);
    this.oauthService.loadDiscoveryDocumentAndTryLogin();
  }

  login() {
    this.oauthService.initCodeFlow();
  }

  logout() {
    this.oauthService.logOut();
  }

  getAccessToken() {
    return this.oauthService.getAccessToken();
  }

  // Optionally, you can get the user's profile information
  getUserInfo() {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${this.getAccessToken()}`
    );
    return this.http.get('https://your-instance.salesforce.com/services/data/vXX.0/sobjects/Account/', {
      headers,
    });
  }
}
