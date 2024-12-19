import { Component, OnInit, OnDestroy ,ViewChild, ElementRef } from '@angular/core';
//import DOMPurify from 'dompurify';
import { SalesforceService } from '../services/salesforce.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { catchError, switchMap, map, tap } from 'rxjs/operators';
import {
  SentimentResponse,
  SuggestionsResponse
} from '../app/suggestion.interface';
import { Observable, throwError } from 'rxjs';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';

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

  suggestionPosition: { top: number; left: number } | null = null;
  staticCursonPosition: any;
  caretPosition: any;
  suggestions: string[] = [];

  isComposeMode: boolean = false;
  correctedText = '';
  sentimentAnalysis: SentimentResponse | null = null;
  inlineSuggestion: string | null = null; // Example inline suggestion
  cursorPosition: number = 0; // Declare cursorPosition to track the cursor index

  currentHighScoreSuggestion: string = ''; // Best suggestion to apply
  records: any;
  userInfo: any;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  emails: any[] = [];
  filteredEmails: Email[] = [];
  showDropdown = false;
  emailtoSend = { to: '', subject: '', bodyPreview: '' };

  accessToken: string = '';
  selectedEmail: Email | null = null;

  emailData = {
    id: '',
    subject: '',
    bodyPreview: '',
    sender: '',
    status: '',
    flagStatus: ''
  };
  isComposeModalOpen: boolean = false;
  email = { to: '', subject: '', bodyPreview: '' };
  selectedFilter = 'all';
  uEmail = 'SendTech@novigosolutions.com';
  userInput: string = '';
  categories: string[] = [];
  isBold = false;
  isItalic = false;
  isUnderline = false;
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

  sanitizeInput(input: string): string {
    // console.log('Input HTML:', input); // Log the raw input

    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    // console.log('Parsed DOM:', doc.body.innerHTML); // Log the parsed DOM structure

    // Function to handle each node
    const traverseNode = (node: ChildNode): string => {
      // console.log('Processing node:', node); // Log the current node

      if (node.nodeType === Node.TEXT_NODE) {
        // console.log('Text node content:', node.textContent); // Log text content
        return node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        // console.log('Element node tag:', element.tagName); // Log tag name

        if (element.tagName === 'BR') {
          // console.log('Found <br>, replacing with newline'); // Debug <br>
          return '\n';
        } else if (element.tagName === 'DIV') {
          // console.log('Found <div>, processing its children'); // Debug <div>
          return '\n' + traverseChildren(element);
        } else {
          // console.log(
          //   'Found other element, processing its children:',
          //   element.tagName
          // ); // Debug other elements
          return traverseChildren(element);
        }
      }
      //console.log('Ignoring unsupported node type:', node.nodeType); // Log unsupported nodes
      return '';
    };

    // Function to process all children of a node
    const traverseChildren = (node: HTMLElement): string => {
      //console.log('Traversing children of:', node.tagName || 'root body'); // Debug children traversal
      return Array.from(node.childNodes).map(traverseNode).join('');
    };

    // Start traversal from `doc.body`
    const sanitizedText = traverseChildren(doc.body).trim();
    console.log('Sanitized Text:', sanitizedText); // Log the final sanitized text
    return sanitizedText;
  }

  onContentEditableInput(event: Event) {
    // const target = event.target as HTMLElement;
    // this.emailtoSend.bodyPreview = target.innerHTML.trim();
    // const inputText = this.emailtoSend.bodyPreview;

    const target = event.target as HTMLElement;
    const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
    //const inputText = this.emailtoSend.bodyPreview;

    // Clear previous analysis if no input
    if (sanitizedText.length === 0) {
      this.inlineSuggestion = '';
      return;
    }

    // Adjust suggestion position with offset for normal typing
    const selection = window.getSelection();
    const rect = selection?.getRangeAt(0).getBoundingClientRect();

    if (rect) {
      this.suggestionPosition = {
        top: rect.bottom + window.scrollY + 6, // 5px offset for regular input
        left: rect.left + window.scrollX + 10
      };
    }

    this.analyzeText(sanitizedText);
  }

  // onContentEditableInput(event: Event) {
  //   const target = event.target as HTMLElement;
  //   const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
  //   this.emailtoSend.bodyPreview = sanitizedText;

  //   // Clear previous analysis if no input
  //   if (sanitizedText.length === 0) {
  //     this.inlineSuggestion = '';
  //     return;
  //   }
  //   // this.setSuggestionPosition();
  //   // this.analyzeText(sanitizedText);
  //   this.trackCursorPosition(event as KeyboardEvent);
  //   this.analyzeText(sanitizedText);
  // }
  setSuggestionPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0); // Get the current range
    const rect = range.getBoundingClientRect(); // Get the position of the caret

    // Adjust position based on rect and viewport
    this.suggestionPosition = {
      top: rect.top + window.scrollY + 6, // Adjust `20` as needed to offset the suggestion
      left: rect.left + window.scrollX + 10
    };
  }

  setSuggestionPositionWithoutOffset() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0); // Get the current range
    const rect = range.getBoundingClientRect(); // Get the position of the caret

    // Adjust position based on rect and viewport
    this.suggestionPosition = {
      top: rect.top + window.scrollY, // Adjust `20` as needed to offset the suggestion
      left: rect.left + window.scrollX + 1
    };
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
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ text })
        }
      );

      if (!sentimentResponse.ok) {
        // throw new Error('Failed to fetch sentiment analysis');
      }

      const sentimentData = await sentimentResponse.json();

      // Request for suggestions
      const inputData = `{ inputs: '${text} [MASK].' }`;
      const suggestionResponse = await fetch(
        'https://api-inference.huggingface.co/models/bert-base-uncased',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: inputData
        }
      );

      if (!suggestionResponse.ok) {
        //throw new Error('Failed to fetch suggestions');
      }

      const suggestionsData = await suggestionResponse.json();

      //  this.suggestions[0] = 'one';
      suggestionsData.map((item: any) => item.token_str.trim());
      this.inlineSuggestion = this.suggestions[0] || ''; // Take the first suggestion

      // Dynamically adjust suggestion position
      //this.setSuggestionPosition();

      // this.currentHighScoreSuggestion = this.suggestions[0];
      // this.inlineSuggestion = this.currentHighScoreSuggestion.replace(text, '');

      // // Set suggestion position dynamically
      // this.setSuggestionPosition();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching analysis:', error.message); // Safely accessing `message`
        this.errorMessage = `Analysis failed: ${error.message}`;
      } else {
        console.error('Unknown error:', error); // In case it's not an instance of Error
        this.errorMessage = `Analysis failed: An unknown error occurred.`;
      }
    }
  }

  insertAtCursor(suggestion: string) {
    const textarea = document.getElementById('body') as HTMLElement;
    const selection = window.getSelection();

    if (selection) {
      // Get the current selection range
      const range = selection.getRangeAt(0);

      // Remove any selected text (if any)
      range.deleteContents();

      // Create a text node with the suggestion
      const suggestionNode = document.createTextNode(suggestion);

      // Insert the suggestion at the cursor position
      range.insertNode(suggestionNode);

      // Move the cursor after the inserted suggestion
      range.setStartAfter(suggestionNode);
      range.setEndAfter(suggestionNode);

      // Update the selection to reflect the new cursor position
      selection.removeAllRanges();
      selection.addRange(range);

      // Optionally, scroll the contenteditable div to keep the cursor visible
      textarea.scrollTop = textarea.scrollHeight;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' && this.inlineSuggestion) {
      event.preventDefault(); // Stop default behavior (Tab behavior)

      //this.setSuggestionPositionWithoutOffset();

      // Set the suggestion position based on the cursor location, without offset for Tab

      // Apply the suggestion at the caret position
      const target = event.target as HTMLElement;
      console.log('target.innerHTML.trim() before ' + target.innerHTML.trim());
      const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
      console.log('sanitizedText before ' + sanitizedText);

      const textBefore = sanitizedText;
      const { row, column } = this.caretPosition;
      const lines = textBefore.split('\n');
      console.log('row in final is ' + row);
      console.log('lines in final is ' + lines);
      let lineRow = 0;
      if (row <= 0) {
        lineRow = row; // If the row is 0 or less, use the first line
      } else if (row - 1 < lines.length) {
        lineRow = row - 1; // Use the previous row if within bounds
      }
      if (lineRow >= 0 && lineRow < lines.length) {
        const currentLine = lines[lineRow];
        const beforeCaret = currentLine.substring(0, column);
        const afterCaret = currentLine.substring(column);

        // Update the current line with the suggestion
        lines[lineRow] =
          beforeCaret + ' ' + this.inlineSuggestion + ' ' + afterCaret;
      }
      const updatedText = lines.join('\n');
      console.log('Updated Text with Suggestion:', updatedText);
      target.innerHTML = lines
        .map((line) => `<div>${line}</div>`) // Wrap each line in a <div>
        .join('');
      this.inlineSuggestion = '';
      this.suggestions = [];
      // Move caret to the end of the inserted text
      this.moveCaretToEnd(target);
    }
  }
  applySuggestionAtCaret(textBefore: string, inlineSuggestion: string) {
    console.log('sanitizedText After ' + textBefore);
    const selection = this.staticCursonPosition;
    if (!selection || selection.rangeCount === 0) {
      return textBefore; // No selection, return unchanged text
    }

    const range = selection.getRangeAt(0);
    const caretOffset = range.startOffset;

    // Insert the suggestion into the text at the caret position
    const beforeCaret = textBefore.substring(0, caretOffset);
    const afterCaret = textBefore.substring(caretOffset);
    return beforeCaret + ' ' + inlineSuggestion + afterCaret;
  }

  trackCaretRowAndColumn() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null; // No selection
    }

    const range = selection.getRangeAt(0);
    const caretRect = range.getBoundingClientRect();

    // Get the bounding rectangle of the content-editable element
    const contentEditable = document.querySelector('.rich-text-area');
    if (!contentEditable) {
      return null;
    }

    const containerRect = contentEditable.getBoundingClientRect();

    // Calculate row and column
    const row = Math.floor(
      (caretRect.top - containerRect.top) / caretRect.height
    );
    const column = caretRect.left - containerRect.left;
    this.caretPosition = { row, column };
    return { row, column };
  }

  // }
  // }

  // applySuggestionAtCaret(text: string, suggestion: string): string {
  //   //const selection = window.getSelection();
  //   const selection = this.staticCursonPosition;
  //   if (!selection || selection.rangeCount === 0) {
  //     return text; // No selection, return unchanged text
  //   }

  //   const range = selection.getRangeAt(0);
  //   const caretOffset = range.startOffset;

  //   // Insert the suggestion into the text at the caret position
  //   const beforeCaret = text.substring(0, caretOffset);
  //   const afterCaret = text.substring(caretOffset);
  //   return beforeCaret + suggestion + afterCaret;
  // }

  moveCaretToEnd(element: HTMLElement) {
    const range = document.createRange();
    const selection = window.getSelection();

    // Move the caret to the end of the element's content
    range.selectNodeContents(element);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  trackCursorPosition(event: KeyboardEvent) {
    const selection = window.getSelection();
    this.staticCursonPosition = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Update suggestion position below the caret
    this.suggestionPosition = {
      top: rect.bottom + window.scrollY, // 5px offset
      left: rect.left + window.scrollX
    };
  }

  toggleBold(event: Event) {
    document.execCommand('bold');
  }

  toggleItalic(event: Event) {
    document.execCommand('italic');
  }

  toggleUnderline(event: Event) {
    document.execCommand('underline');
  }

  triggerFileInput() {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;
    // Handle file upload logic
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // triggerFileInput() {
  //   const fileInput = document.getElementById('file-input') as HTMLInputElement;
  //   if (fileInput) {
  //     fileInput.click();
  //   }
  // }

  // onFileSelected(event: any) {
  //   // Handle file selection logic
  //   const file = event.target.files[0];
  //   console.log('File selected:', file);
  // }

  addEmoji() {
    console.log('Add Emoji clicked');
    // Implement emoji picker logic
  }

  scheduleEmail() {
    console.log('Schedule Email clicked');
    // Implement email scheduling logic
  }
  // Toggle bold formatting
  // toggleBold(event: Event) {
  //   event.preventDefault();
  //   this.isBold = !this.isBold;
  //   this.applyTextFormatting();
  // }

  // // Toggle italic formatting
  // toggleItalic(event: Event) {
  //   event.preventDefault();
  //   this.isItalic = !this.isItalic;
  //   this.applyTextFormatting();
  // }

  // // Toggle underline formatting
  // toggleUnderline(event: Event) {
  //   event.preventDefault();
  //   this.isUnderline = !this.isUnderline;
  //   this.applyTextFormatting();
  // }

  // Apply formatting to the selected text
  applyTextFormatting() {
    const div = document.querySelector('#body') as HTMLElement;

    if (this.isBold) {
      document.execCommand('bold');
    }

    if (this.isItalic) {
      document.execCommand('italic');
    }

    if (this.isUnderline) {
      document.execCommand('underline');
    }
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
  deleteEmail(emailData: any): void {
    console.log('Delete button clicked for email:', emailData);
    console.log('Delete button clicked for email:', emailData.Id);
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    } else {
      this.generateAccessToken();
    }
    console.log('this.accessToken button clicked for email:', this.accessToken);
    const url = `https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/OutlookEmailService/deleteEmail/${emailData.Id}`;

    // return this.http
    //   .delete<any>(url, {
    //     headers: { Authorization: `Bearer ${this.accessToken}` }
    //   })
    //   .pipe(
    //     tap((response) => {
    //       console.log('Email deleted successfully:', response);
    //     }),
    //     catchError((error) => {
    //       console.error('Error deleting email:', error);
    //       return throwError(error);
    //     })
    //   );

    this.salesforceService.deleteEmail(emailData.Id).subscribe(
      (response) => {
        console.log('Email sent successfully! ' + JSON.stringify(response));
        console.log('Email sent successfully! ' + response);
      },
      (error) => {
        console.error('Error:', JSON.stringify(error));
      }
    );
    // this.isComposeMode = false; // Return to email list
  }

  // deleteEmail(emailId: string): Observable<any> {
  //   console.log('Inside API call delete, emailId:', emailId);
  //   const endpoint = `${environment.salesforce.salesforceApiBaseUrl}/OutlookEmailService/deleteEmail/${emailId}`;

  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${this.accessToken}`,
  //     'Content-Type': 'application/json'
  //   });

  //   return this.http.delete<any>(endpoint, { headers }).pipe(
  //     // Success response handling
  //     tap((response) => {
  //       console.log('Email deleted successfully:', response);
  //     }),
  //     catchError((error) => {
  //       console.error('Error deleting email:', error);
  //       this.errorMessage = `Error deleting email: ${error.message || 'Unknown error'}`;
  //       return throwError(error);
  //     })
  //   );
  // }

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
  changeTextColor() {
    console.log('Change text color functionality not implemented yet.');
  }

  // onFileSelected(event: Event) {
  //   const input = event.target as HTMLInputElement;

  //   if (input.files && input.files.length > 0) {
  //     const file = input.files[0]; // Get the selected file

  //     const reader = new FileReader();

  //     reader.onload = () => {
  //       const base64String = reader.result?.toString().split(',')[1]; // Extract base64 content

  //       if (!base64String) {
  //         console.error('Failed to read Base64 content.');
  //         return;
  //       }

  //       // Store file data
  //       this.fileName = file.name;
  //       this.fileType = file.type;
  //       this.base64Content = base64String;

  //       console.log('File ready to be sent:', this.fileName, this.fileType);
  //     };

  //     reader.readAsDataURL(file); // Convert file to Base64
  //   }
  // }

  correctGrammar(): void {
    console.log('Entering correctGrammar method...');

    if (!this.emailtoSend.bodyPreview.trim()) {
      console.log('No text entered for grammar correction.');
      this.errorMessage = 'Please enter some text to correct.';
      return;
    }

    console.log('Text to correct:', this.emailtoSend.bodyPreview);

    this.salesforceService
      .correctGrammar(this.emailtoSend.bodyPreview)
      .subscribe({
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

  fetchSuggestions(inputValue: string) {
    if (!inputValue) {
      this.suggestions = [];
      this.inlineSuggestion = '';
      return;
    }
  }

  calculateSuggestionPosition(textarea: HTMLTextAreaElement) {
    const textBeforeCursor = textarea.value.substring(
      0,
      textarea.selectionStart
    );

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
      padding: style.padding
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
      left: markerPosition.left - textareaPosition.left
    };

    document.body.removeChild(ghostDiv);
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
          localStorage.setItem('accessToken', this.accessToken);
          this.salesforceService.setAccessToken(this.accessToken);
        },
        (error) => {
          console.error('Failed to generate access token:', error);
          this.errorMessage = 'Failed to generate access token';
        }
      );
  }

  // triggerFileInput() {
  //   const fileInput = document.getElementById('file-input') as HTMLInputElement;
  //   fileInput.click();
  // }
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
