import { Component, OnInit } from '@angular/core';
import { SalesforceService } from '../services/salesforce.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  records: any;
  userInfo: any;
  errorMessage: string | null = null;

  constructor(public salesforceService: SalesforceService) {}

  ngOnInit(): void {
    // Load records or user info on component initialization (optional)
    // this.loadRecords();
    // this.loadUserInfo();
  }

  // Load records from Salesforce
  loadRecords(): void {
    console.log('Attempting to load records...');
    if (!this.salesforceService.isAuthenticated()) {
      console.error('User is not authenticated. Please log in.');
      this.errorMessage = 'User is not authenticated. Please log in.';
      return;
    }

    this.salesforceService.getRecords('Account').subscribe(
      (data) => {
        this.records = data;
        console.log('Salesforce Data:', data);
      },
      (error) => {
        console.error('Error fetching data:', error);
        this.errorMessage = `Error fetching data: ${error.message || 'Unknown error'}`;
      }
    );
  }

  // Load user information to check if the access token is valid
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

  // Handle user login
  onLogin(token: string): void {
    this.salesforceService.setAccessToken(token);
    console.log('User logged in with access token:', token);
  }

  // Handle user logout
  onLogout(): void {
    this.salesforceService.clearAccessToken();
    console.log('User logged out');
    this.records = null;  // Clear records on logout
    this.userInfo = null; // Clear user info on logout
  }
}
