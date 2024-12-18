import { Component, OnInit, OnDestroy ,ViewChild, ElementRef } from '@angular/core';

import { SalesforceService } from '../services/salesforce.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import {
  SentimentResponse,
  SuggestionsResponse
} from '../app/suggestion.interface';
import { Observable, throwError } from 'rxjs';

interface Email {
  subject: string;
  sender: string;
  receivedDateTime: string;
  bodyPreview: string;
  status: string;
  id: string;
  isRead: boolean;
  flagStatus: string;
  categories: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('textarea') textarea!: ElementRef; // Reference to the textarea

  private fileName: string = '';
  private fileType: string = '';
  private base64Content: string = '';

isComposeMode: boolean = false;
  correctedText = '';
  sentimentAnalysis: SentimentResponse | null = null;
  suggestions: string[] = [];
  inlineSuggestion: string | null = null; // Example inline suggestion
  suggestionPosition: { top: number; left: number } = { top: 0, left: 0 };
  cursorPosition: number = 0; // Declare cursorPosition to track the cursor index

  currentHighScoreSuggestion: string = ''; // Best suggestion to apply
  records: any;
  userInfo: any;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  emails: any[] = [];
  filteredEmails: any[] = [];

  emailtoSend = { to: '', subject: '', bodyPreview: '' };

  accessToken: string = '';
  selectedEmail: Email | null = null;
  isComposeModalOpen: boolean = false;
  email = { to: '', subject: '', bodyPreview: '' };
  selectedFilter = 'all';
  uEmail = 'SendTech@novigosolutions.com';
  userInput: string = '';
  categories: string[] = [];

  constructor(
    public salesforceService: SalesforceService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    } else {
      this.generateAccessToken();
    }

    this.loadEmails('Inbox');

    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  markAsRead(email: Email): void {
    email.status = 'read';
    this.filterEmails(this.selectedFilter);
  }

  handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeComposeModal();
    }
  }

  openComposeModal(): void {
    this.isComposeModalOpen = true;
  }

  closeComposeModal(): void {
    this.isComposeModalOpen = false;
  }

  // sendEmail(): void {
  //   const { to, subject, bodyPreview } = this.email;
  //   console.log('Sending email:', { to, subject, bodyPreview });
  //   this.closeComposeModal();
  // }

  sendEmail() {
   
    this.salesforceService
      .sendEmail(
        this.emailtoSend.to,
        this.emailtoSend.subject,
        this.emailtoSend.bodyPreview,
        this.fileName,
        this.fileType,
        this.base64Content
      )
      .subscribe(
        (response) => {
          console.log('Email sent successfully! ' + JSON.stringify(response));
          console.log('Email sent successfully! ' + response);
        },
        (error) => {
          console.error('Error:', JSON.stringify(error));
        }
      );
	  this.isComposeMode = false; // Return to email list
  }

  loadEmails(folder: string = 'Inbox'): void {
    const endpoint = `${environment.salesforce.salesforceApiBaseUrl}/OutlookEmailService/*`;
    const endpointCatergory = `${environment.salesforce.salesforceApiBaseUrl}/EmailCategorizationEndpoint/*`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const userId = 'Send.Tech@novigo-solutions.com';

    this.http
      .get(`${endpoint}?userId=${userId}&folder=${folder}`, { headers })
      .subscribe(
        (data: any) => {
          console.log('Emails loaded:', data);
          this.emails = data.emails;
          this.filteredEmails = data.emails;
          // this.salesforceService.categorizeEmails(this.emails).subscribe((response) => {
          //   this.categories = response.categories;
          // });
          const endpointCategory = `${environment.salesforce.salesforceApiBaseUrl}/services/apexrest/api/parse-emails`;
          this.http.post(endpointCategory, data.emails, { headers }).subscribe(
            (data: any) => {
              console.log('Emails loaded:', data);
              console.log('Categories:', data); // Assuming the response is an array or object of categories
              this.categories = data;
            },
            (error) => {
              console.error('Error loading emails:', error);
              this.errorMessage = `Error loading emails: ${error.message || 'Unknown error'}`;
            }
          );
        },
        (error) => {
          console.error('Error loading emails:', error);
          this.errorMessage = `Error loading emails: ${error.message || 'Unknown error'}`;
        }
      );
  }

  filterEmails(filter: string): void {
    this.selectedFilter = filter;
    if (filter === 'read') {
      this.filteredEmails = this.emails.filter(
        (email) => email.status === 'read'
      );
    } else if (filter === 'unread') {
      this.filteredEmails = this.emails.filter(
        (email) => email.status === 'unread'
      );
    } else {
      this.filteredEmails = this.emails;
    }
  }

  viewEmailDetails(email: any): void {
    this.selectedEmail = email;
	    this.isComposeMode = false; // Exit compose mode
  }
openCompose() {
    this.isComposeMode = true; // Enable compose mode
    this.selectedEmail = null; // Hide email details
    this.emailtoSend = { to: '', subject: '', bodyPreview: '' }; // Reset form
  }
  toggleRead(email: any): void {
    email.status = email.status === 'unread' ? 'read' : 'unread';
    email.isRead = !email.isRead;
    this.updateEmail(email.Id, email.status);
    console.log('Email status changed:', email);
  }

  toggleFlag(email: any): void {
    email.isFlagged = !email.isFlagged;
    this.updateEmail(email.Id, email.isFlagged ? 'flag' : 'unflag');
    console.log('Email flag changed:', email);
  }

  // togglePin(email: any): void {
  //   email.isPinged = !email.isPinged;
  //   this.updateEmail(email.Id, email.isPinged ? 'pin' : 'unpin');
  //   console.log('Email pin status changed:', email);
  // }

  loadDraft(): void {
    console.log('Load Draft functionality');
    this.loadEmails('Drafts');
    // Add your functionality for loadDraft here
  }

  loadTrash(): void {
    console.log('Load Trash functionality');
    this.loadEmails('deleteditems');
    // Add your functionality for loadTrash here
  }
  // onFileSelected(event: Event): void {
  //   const inputElement = event.target as HTMLInputElement;
  //   if (inputElement?.files?.length) {
  //     const file = inputElement.files[0];
  //     console.log('Selected file:', file);
  //     // Handle the file selection here
  //   }
  // }


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0]; // Get the selected file
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1]; // Extract base64 content

        if (!base64String) {
          console.error('Failed to read Base64 content.');
          return;
        }

        // Store file data
        this.fileName = file.name;
        this.fileType = file.type;
        this.base64Content = base64String;

        console.log('File ready to be sent:', this.fileName, this.fileType);
      };

      reader.readAsDataURL(file); // Convert file to Base64
    }
  }

  correctGrammar(): void {
    console.log('Entering correctGrammar method...');

    if (!this.emailtoSend.bodyPreview.trim()) {
      console.log('No text entered for grammar correction.');
      this.errorMessage = 'Please enter some text to correct.';
      return;
    }

    console.log('Text to correct:', this.emailtoSend.bodyPreview);

    this.salesforceService.correctGrammar(this.emailtoSend.bodyPreview).subscribe({
      next: (response) => {
        console.log('Grammar correction response:', response);
        this.correctedText = response;
        this.errorMessage = '';
      },
      error: (err) => {
        console.error('Error during grammar correction:', err);
        this.errorMessage = 'Failed to correct grammar. Please try again.';
      }
    });

    console.log('Exiting correctGrammar method...');
  }

  onInputChange(event: any): void {
    const textarea = event.target as HTMLTextAreaElement;
    const inputText = this.emailtoSend.bodyPreview.trim();

    // Clear previous analysis if no input
    if (inputText.length === 0) {
      this.sentimentAnalysis = null;
      this.suggestions = [];
      this.inlineSuggestion = '';
      return;
    }
    //this.fetchSuggestions(inputText);
    // Call analyzeText to fetch sentiment and suggestions
    this.analyzeText(inputText);
  }

  fetchSuggestions(inputValue: string) {
    if (!inputValue) {
      this.suggestions = [];
      this.inlineSuggestion = '';
      return;
    }

  }

  // trackCursorPosition(event: KeyboardEvent) {
  //   const textarea = event.target as HTMLTextAreaElement;

  //   const { selectionStart } = textarea;
  //   const inputText = textarea.value.substring(0, selectionStart);

  //   // Calculate cursor position
  //   const position = this.calculateCursorPosition(textarea, inputText);

  //   // Update position
  //   this.suggestionPosition = position;
  // }

  trackCursorPosition(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;

    // Get the current cursor position in the textarea
    const cursorIndex = textarea.selectionStart || 0;

    // Update the cursorPosition property
    this.cursorPosition = cursorIndex;

    // Calculate the suggestion position
    this.calculateSuggestionPosition(textarea);
  }

  calculateSuggestionPosition(textarea: HTMLTextAreaElement) {
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);

    // Create a temporary div to measure cursor position
    const ghostDiv = document.createElement('div');
    const style = window.getComputedStyle(textarea);

    Object.assign(ghostDiv.style, {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      font: style.font,
      width: style.width,
      lineHeight: style.lineHeight,
      padding: style.padding,
    });

    ghostDiv.textContent = textBeforeCursor;

    const cursorMarker = document.createElement('span');
    cursorMarker.textContent = '|'; // Marker for the cursor position
    ghostDiv.appendChild(cursorMarker);

    document.body.appendChild(ghostDiv);

    // Calculate the marker's position
    const markerPosition = cursorMarker.getBoundingClientRect();
    const textareaPosition = textarea.getBoundingClientRect();

    // Update the suggestionPosition property with the relative position
    this.suggestionPosition = {
      top: markerPosition.top - textareaPosition.top,
      left: markerPosition.left - textareaPosition.left,
    };

    document.body.removeChild(ghostDiv);
  }
  
  // Handle Tab key press
  // onKeyDown(event: KeyboardEvent) {
  //   if (event.key === 'Tab' && this.currentHighScoreSuggestion) {
  //     event.preventDefault(); // Prevent default Tab behavior

  //     // Apply the suggestion to the body
  //     this.emailtoSend.bodyPreview = this.currentHighScoreSuggestion;

  //     // Clear inline suggestion after applying
  //     this.inlineSuggestion = '';
  //   }
  // }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' && this.currentHighScoreSuggestion) {
      event.preventDefault();
      this.emailtoSend.bodyPreview += this.inlineSuggestion;
      this.inlineSuggestion = '';
    }
  }

  async analyzeText(text: string) {
    try {
      const accessToken = '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'; // Replace with your token

      // Request for sentiment analysis
      const sentimentResponse = await fetch(
        'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}` // Include the access token in the header
          },
          body: JSON.stringify({ text })
        }
      );

      if (!sentimentResponse.ok) {
        throw new Error('Failed to fetch sentiment analysis');
      }

      const sentimentData = await sentimentResponse.json();

      const inputData = '{ inputs: ' + text + ' [MASK].}';

      // Request for suggestions
      const suggestionResponse = await fetch(
        'https://api-inference.huggingface.co/models/bert-base-uncased',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}` // Include the access token here as well
          },
          body: inputData
        }
      );

      if (!suggestionResponse.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const suggestionsData = await suggestionResponse.json();

      console.log('Sentiment Data:', sentimentData);
      console.log('Suggestions Data:', suggestionsData);

      this.suggestions = suggestionsData.map((item: any) => text+' '+item.token_str);
      console.log(
        'this.suggestions Data: with type ',
        typeof suggestionsData.suggestions + ' value ' + this.suggestions
      );

      
    // Display the highest scored suggestion inline
    this.currentHighScoreSuggestion = this.suggestions[0]; // Mock scoring logic
    this.inlineSuggestion = this.currentHighScoreSuggestion.replace(
      text,
      ''
    );


      //this.suggestions = suggestionsData.suggestions || [];
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching analysis:', error.message); // Safely accessing `message`
        this.errorMessage = `Analysis failed: ${error.message}`;
      } else {
        console.error('Unknown error:', error); // In case the error is not an instance of Error
        this.errorMessage = `Analysis failed: An unknown error occurred.`;
      }
    }
  }

  selectSuggestion(suggestion: string): void {
    this.emailtoSend.bodyPreview += ` ${suggestion}`;
  }

  updateEmail(emailId: string, action: string) {
    const endpoint = `${environment.salesforce.salesforceApiBaseUrl}/OutlookEmailService/*`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const userId = this.userInfo?.email || 'Send.Tech@novigo-solutions.com';
    const params = { messageId: emailId, action };

    this.http.patch(`${endpoint}`, null, { headers, params }).subscribe(
      (response: any) => {
        console.log('Email updated successfully:', response);
      },
      (error: any) => {
        console.error('Error updating email:', error);
      }
    );
  }

  generateAccessToken(): void {
    const tokenUrl =
      'https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/oauth2/token';
    const clientId =
      '';
    const clientSecret =
      '';

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
          localStorage.setItem('accessToken', this.accessToken);
          this.salesforceService.setAccessToken(this.accessToken);
        },
        (error) => {
          console.error('Failed to generate access token:', error);
          this.errorMessage = 'Failed to generate access token';
        }
      );
  }

  triggerFileInput() {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput.click();
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

  loadInbox(): void {
    console.log('Loading Inbox...');
    this.loadEmails('Inbox');
  }

  loadSent(): void {
    console.log('Loading Sent emails...');
    this.loadEmails('SentItems');
  }
}
