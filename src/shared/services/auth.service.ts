// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn = !!sessionStorage.getItem('accessToken');

  constructor(private http: HttpClient, public router: Router) { }

  isAuthenticated() {
    return this.isLoggedIn;
  }

  login(data: { username: string; password: string; }): boolean {
    console.log(data);
    if (data.username.trim() === 'user@sendtech.com', data.password.trim() === 'password') {
      this.isLoggedIn = true;
      this.router.navigate(['/home']);
    }
    return false;
  }

  // OAuth settings for Salesforce
  private oauthSettings = {
    issuer: 'https://login.salesforce.com',
    redirectUri: 'https://login.salesforce.com/services/oauth2/callback',  // Example: 'https://your-app-url.com/oauth/callback'
    clientId: '3MVG9PwZx9R6_UreJ7pGOqAjPactZ4PlE.3xrcLSvO1smOsk4K0cCDaCjEJdqUDyaUXwtYrEElDjSAxRVfMy9',  // Your Salesforce consumer key
    scope: 'full',
    responseType: 'code',
    showDebugInformation: true,  // Useful for debugging
  };
}
