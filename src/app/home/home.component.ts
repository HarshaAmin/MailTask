import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { EmailListComponent } from '../email-list/email-list.component';
import { EmailComponent } from '../email/email.component';
import { CommonService } from '../../shared/services/common.service';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SendMailComponent } from '../send-mail/send-mail.component';
import { NgClass } from '@angular/common';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Subscription } from 'rxjs';

interface Email {
  subject: string;
  sender: string;
  receivedDateTime: string;
  bodyPreview: string;
  status: string;
  id: string;
  isRead: string;
  isFlagged: string;
  isPinged: string;
}
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SideMenuComponent,
    EmailListComponent,
    EmailComponent,
    SendMailComponent,
    NgClass,
    SpinnerComponent
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  records: any;
  userInfo: any;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  emails: any[] = [];
  filteredEmails: any[] = [];
  openSendEmailModal: boolean = false;
  accessToken: string = '';
  selectedEmail: Email | null = null;
  currentTypeSelection: string = 'all';
  currentCategorySelection: string = 'primary';
  categories: string[] = [];
  loadEmailsSub: Subscription;

  selectedFilter = 'all';
  uEmail = 'SendTech@novigosolutions.com';



  constructor(
    public commonService: CommonService,
    public salesforceService: SalesforceService,
    private http: HttpClient
  ) {
    // Check for access token in localStorage first
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    } else {
      this.generateAccessToken();
    }

    this.loadEmails('Inbox');
  }

  ngAfterViewInit(): void {
    const socialItem = document.querySelectorAll('.social-item');
    socialItem.forEach((item: HTMLElement) =>
      item.addEventListener('click', (e) => {
        e.preventDefault();
        socialItem.forEach((item) => item.classList.remove('active'));
        item.classList.add('active');
        this.currentCategorySelection = item.id;
        this.toggleType(this.currentTypeSelection);
        // this.filterEmails(this.currentCategorySelection);
      }));

    const categoryItem = document.querySelectorAll('.filter-crit-item');
    categoryItem.forEach((item: HTMLElement) =>
      item.addEventListener('click', (e) => {
        e.preventDefault();
        categoryItem.forEach((item) => item.classList.remove('active'));
        item.classList.add('active');
        this.currentTypeSelection = item.id;
        console.log(item.id, "ID")
        this.toggleType(this.currentTypeSelection);
        // this.filterEmails(this.currentCategorySelection);
      }));

    this.loadEmailsSub = this.commonService.loadEmail.subscribe((data: string) => {
      this.loadEmails(data);
    });
  }

  filterEmails(type: string): void {
    this.filteredEmails = this.filteredEmails.filter((email) => email.category === type);
  }

  viewEmailDetails(email: any): void {
    this.selectedEmail = email;
  }

  toggleRead(email: any): void {
    // Implement your logic to mark an email as read or unread
    email.status = email.status === 'unread' ? 'read' : 'unread';
    // Update the email status in the backend if necessary
    console.log('Email status changed:', email);
  }

  toggleFlag(email: any): void {
    // Implement your logic to flag or unflag an email
    email.isFlagged = !email.isFlagged;
    console.log('Email flag changed:', email);
  }

  togglePing(email: any): void {
    // Implement your logic to pin or unpin an email
    email.isPinged = !email.isPinged;
    console.log('Email pin status changed:', email);
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
    this.commonService.activeSpinner = true;
    this.http
      .post(tokenUrl, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      })
      .subscribe(
        (response: any) => {
          this.commonService.activeSpinner = false;
          this.accessToken = response.access_token;
          console.log('Access token generated:', this.accessToken);
          localStorage.setItem('accessToken', this.accessToken);
          this.salesforceService.setAccessToken(this.accessToken);
        },
        (error) => {
          this.commonService.activeSpinner = false;
          console.error('Failed to generate access token:', error);
          this.errorMessage = 'Failed to generate access token';
        }
      );
  }
  // Load user info (example if needed)
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

  // Log in method
  onLogin(token: string): void {
    console.log('User logged in with access token:', token);
  }

  onLogout(): void {
    this.salesforceService.clearAccessToken();
    console.log('User logged out');
    this.records = null;
    this.userInfo = null;
  }

  toggleType(type) {
    if (type) {
      if (type === 'all') {
        this.filteredEmails = this.emails;
      } else {
        this.filteredEmails = this.emails.filter(
          (email) => email.status === type
        );
      }
      this.currentTypeSelection = type;
    }
  }

  get getCurrentType() {
    const firstLetter = this.currentTypeSelection.charAt(0);
    const firstLetterCap = firstLetter.toUpperCase();
    const remainingLetters = this.currentTypeSelection.slice(1);
    const capitalizedWord = firstLetterCap + remainingLetters;
    return capitalizedWord;
  }

  selectedEmailToggle(e) {
    this.selectedEmail = e;
    this.commonService.openEmailModal = false;
    this.commonService.toggleEmailSection = true;
  }

  openEmailModal() {
    this.commonService.openEmailModal = true;
    this.commonService.toggleEmailSection = true;
    this.commonService.type = 'send';
  }

  loadEmails(folder: string = 'Inbox'): void {
    const endpoint = `${environment.salesforce.salesforceApiBaseUrl}/OutlookEmailService/*`;
    const endpointCatergory = `${environment.salesforce.salesforceApiBaseUrl}/EmailCategorizationEndpoint/*`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const userId = 'Send.Tech@novigo-solutions.com';
    this.commonService.activeSpinner = true;
    this.commonService.openEmailModal = false;
    this.selectedEmail = null;

    this.http
      .get(`${endpoint}?userId=${userId}&folder=${folder}`, { headers })
      .subscribe(
        (data: any) => {
          console.log('Emails loaded:', data);
          this.emails = data.emails;
          this.filteredEmails = data.emails;
          // this.filterEmails(this.currentCategorySelection);
          const endpointCategory = `${environment.salesforce.salesforceApiBaseUrl}/services/apexrest/api/parse-emails`;
          this.http.post(endpointCategory, data.emails, { headers }).subscribe(
            (data: any) => {
              console.log('Emails loaded:', data);
              console.log('Categories:', data); // Assuming the response is an array or object of categories
              this.categories = data;
              this.commonService.activeSpinner = false;

            },
            (error) => {
              console.error('Error loading emails:', error);
              this.errorMessage = `Error loading emails: ${error.message || 'Unknown error'}`;
              this.commonService.activeSpinner = false;

            }
          );
        },
        (error) => {
          console.error('Error loading emails:', error);
          this.errorMessage = `Error loading emails: ${error.message || 'Unknown error'}`;
          this.commonService.activeSpinner = false;
        }
      );
  }

  selectType(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    console.log(e.target['id'])
    document.querySelector(".dropdown-selector").classList.toggle("active");
  }

  ngOnDestroy(): void {
    this.loadEmailsSub.unsubscribe();
  }
}
