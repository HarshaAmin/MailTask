import { Component, OnInit } from '@angular/core';
import { SalesforceService } from '../services/salesforce.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  records: any;
  userInfo: any;
  errorMessage: string | null = null;
  emails: any;
  accessToken: string = ''; // Store the access token
  selectedEmail: any = null;
  uEmail = 'SendTech@novigosolutions.com';

  constructor(
    public salesforceService: SalesforceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Automatically generate access token when the component loads
    this.generateAccessToken();

    // Automatically load emails when the component loads
    this.loadEmails();

    // Automatically load user info when the component loads
    //this.loadUserInfo();
  }
  viewEmailDetails(email: any): void {
    this.selectedEmail = email;
  }
  loadEmails(): void {
    const endpoint = `https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/OutlookEmailService/getUserEmails/`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const userId = 'Send.Tech@novigo-solutions.com'; // User ID

    this.http.get(`${endpoint}?userId=${userId}`, { headers }).subscribe(
      (data: any) => {
        console.log('Emails loaded:', data);
        this.emails = data.emails; // Assuming 'emails' is returned in the response
      },
      (error) => {
        console.error('Error loading emails:', error);
        this.errorMessage = `Error loading emails: ${error.message || 'Unknown error'}`;
      }
    );
  }

  generateAccessToken(): void {
    const tokenUrl =
      'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/oauth2/token';
    const clientId =
      '3MVG9PwZx9R6_UreJ7pGOqAjPactZ4PlE.3xrcLSvO1smOsk4K0cCDaCjEJdqUDyaUXwtYrEElDjSAxRVfMy9';
    const clientSecret =
      '8B671E68B5D8679368FE2C97B813DDA073DA4714564622B02D8CC38A11D37EF0';

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', clientId);
    body.set('client_secret', clientSecret);

    this.http
      .post(tokenUrl, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      })
      .subscribe(
        (response: any) => {
          this.accessToken = response.access_token;
          console.log('Access token generated:', this.accessToken);
          localStorage.setItem('accessToken', this.accessToken!);
          this.salesforceService.setAccessToken(this.accessToken);
        },
        (error) => {
          console.error('Failed to generate access token:', error);
          this.errorMessage = 'Failed to generate access token';
        }
      );
  }

  loadUserInfo(): void {
    console.log('Attempting to load user info...');
    if (!this.salesforceService.isAuthenticated()) {
      console.error('User is not authenticated. Please log in.');
      this.errorMessage = 'User is not authenticated. Please log in.';
      return;
    }

    this.salesforceService.getUserInfo().subscribe(
      (data) => {
        this.userInfo = data;
        console.log('User Info:', data);
      },
      (error) => {
        console.error('Error fetching user info:', error);
        this.errorMessage = `Error fetching user info: ${error.message || 'Unknown error'}`;
      }
    );
  }

  onLogin(token: string): void {
    console.log('User logged in with access token:', token);
  }

  onLogout(): void {
    this.salesforceService.clearAccessToken();
    console.log('User logged out');
    this.records = null;
    this.userInfo = null;
  }
}
