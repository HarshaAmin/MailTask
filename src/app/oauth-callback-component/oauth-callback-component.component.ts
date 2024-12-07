// oauth-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-oauth-callback',
  template: '',
})
export class OAuthCallbackComponent implements OnInit {
  constructor(private oauthService: OAuthService) {}

  ngOnInit() {
    this.oauthService.tryLogin().then((loggedIn) => {
      if (loggedIn) {
        console.log('Logged in successfully');
      } else {
        console.error('Login failed');
      }
    });
  }
}
