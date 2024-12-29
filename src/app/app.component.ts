import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { SalesforceService } from '../services/salesforce.service';
import { EmojiService } from './emoji.service';
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
  id: string;
  subject: string;
  sender: string;
  to: string;
  senderName: string;
  senderEmail: string;
  recipientNames: string[];
  recipientEmails: string[];
  receivedDate: Date;
  receivedDateTime: string;
  bodyPreview: string;
  body: string;
  status: string;
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
  private suggestionTimeout: any;
  savedRange: Range | null = null;
  popupPosition = { top: '0px', left: '0px' };
  showColorPalette = false;
  inlineSuggestionVisible = false;
  inlineSuggestion: string | null = null;
  suggestionPosition: { top: number; left: number } | null = null;
  textColor: string = 'black'; // Default text color
  colorOptions = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff'
  ];
  colors: string[] = [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff'
  ];
  private fileName: string = '';
  private fileType: string = '';
  private base64Content: string = '';
  showEmojiPicker = false;
  staticCursonPosition: any;
  caretPosition: any;
  suggestions: string[] = [];
  isComposeMode: boolean = false;
  correctedText = '';
  sentimentAnalysis: SentimentResponse | null = null;
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
  emojiPickerVisible = false;
  selectedEmoji: string = '';
  emailData = {
    id: '',
    subject: '',
    bodyPreview: '',
    sender: '',
    status: '',
    flagStatus: '',
    body: ''
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
  private resetTimeout: any = null; // Variable to store the timeout ID
  constructor(
    public salesforceService: SalesforceService, // Inject SalesforceService
    private http: HttpClient, // Inject HttpClient
    private emojiService: EmojiService // Inject EmojiService
  ) {}
  ngOnInit(): void {
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    } else {
      this.generateAccessToken();
    }
    this.emojiService.isEmojiPickerVisible.subscribe((isVisible) => {
      this.emojiPickerVisible = isVisible;
    });
    this.emojiService.selectedEmoji$.subscribe((emoji) => {
      this.selectedEmoji = emoji;
    });
    this.loadEmails('Inbox');
    const contentEditableElement = document.getElementById('body');
    if (contentEditableElement) {
      contentEditableElement.addEventListener(
        'input',
        this.onContentEditableInput.bind(this)
      );
      contentEditableElement.addEventListener(
        'mouseup',
        this.onMouseUpOrClick.bind(this)
      ); // Listen to mouseup
      contentEditableElement.addEventListener(
        'click',
        this.onMouseUpOrClick.bind(this)
      ); // Listen to click
    }
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }
  toggleColorPalette() {
    console.log('toggle color palette clicked');
    this.showColorPalette = !this.showColorPalette;
  }
  openColorPicker(event: MouseEvent) {
    this.showColorPalette = !this.showColorPalette;
    if (this.showColorPalette) {
      setTimeout(() => {
        this.showColorPalette = false;
        console.log('Color picker closed automatically after timeout');
      }, 3000);
    }
  }
  applyColorToSelection(color: string) {
    console.log('color selected ' + color);
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) {
      console.warn('No selection found!');
      return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = range.toString(); // Get the selected text
    console.log('Selected Text:', selectedText); // Log the selected text
    const textarea = document.getElementById('body') as HTMLElement;
    const parentElement =
      range.commonAncestorContainer.nodeType === 3
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement);
    if (textarea.contains(parentElement)) {
      const span = document.createElement('span');
      span.style.color = color; // Apply the selected color
      span.appendChild(range.extractContents()); // Wrap selected text in a span
      range.insertNode(span);
      span.normalize();
      console.log(`Applied color ${color} to selection.`);
    } else {
      console.warn('Selection is not within the editable area.');
    }
    this.showColorPalette = false;
  }
  toggleColorPicker(event: MouseEvent) {
    this.showColorPalette = !this.showColorPalette;
  }
  getSelectedRange(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      console.log('Selected Range:', range);
      console.log('Selected Text:', range.toString());
      return range;
    }
    return null;
  }
  sanitizeInput(input: string): string {
    //console.log('Original Input:', input);
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    //console.log('Parsed HTML Document:', doc.body.innerHTML);
    const traverseNode = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        //console.log('Text Node:', node.textContent?.trim()); // Log text nodes
        return node.textContent?.trim() || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        //console.log('Element Tag:', element.tagName);
        if (element.tagName === 'BR') {
          //console.log('Found <BR> Tag'); // Log when <br> is found
          return '\n';
        } else if (element.tagName === 'DIV') {
          const content = traverseChildren(element);
          //console.log('Content inside <div>:', content); // Log content inside <div>
          return content.trim() ? `${content}\n` : '\n';
        } else if (element.tagName === 'B' || element.tagName === 'STRONG') {
          //console.log('Found <b> or <strong> Tag'); // Log when <b> or <strong> is found
          return ` <b>${traverseChildren(element)}</b> `;
        } else if (element.tagName === 'I' || element.tagName === 'EM') {
          //console.log('Found <i> or <em> Tag'); // Log when <i> or <em> is found
          return ` <i>${traverseChildren(element)}</i> `;
        } else if (element.tagName === 'U') {
          //console.log('Found <u> Tag'); // Log when <u> is found
          return ` <u>${traverseChildren(element)}</u> `;
        } else if (element.tagName === 'S' || element.tagName === 'STRIKE') {
          //console.log('Found <s> or <strike> Tag'); // Log when <s> or <strike> is found
          return ` <s>${traverseChildren(element)}</s> `;
        } else if (element.tagName === 'SPAN') {
          //console.log('Found <span> Tag'); // Log when <span> is found
          return ` <span>${traverseChildren(element)}</span> `;
        } else {
          //console.log('Traversing Other Tag:', element.tagName); // Log for other tags
          return traverseChildren(element);
        }
      }
      return '';
    };
    const traverseChildren = (node: HTMLElement): string => {
      //console.log('Traversing Children of:', node.tagName); // Log when traversing children
      return Array.from(node.childNodes).map(traverseNode).join('');
    };
    let sanitizedText = traverseChildren(doc.body).trim();
    //console.log('Sanitized Text:', sanitizedText); // Log the final sanitized text
    return sanitizedText;
  }

  traverseChildren(node: HTMLElement): string {
    return Array.from(node.childNodes)
      .map((child) =>
        child.nodeType === Node.TEXT_NODE ? child.textContent : ''
      )
      .join('');
  }
  moveCaretToEnd(target: HTMLElement) {
    const selection = window.getSelection();
    const range = document.createRange();
    target.focus();
    range.selectNodeContents(target);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  onContentEditableInput(event: Event) {
    //console.log('inside onContentedit');
    const target = event.target as HTMLElement;
    const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
    if (sanitizedText.length === 0) {
      this.inlineSuggestion = '';
      return;
    }
    this.updateSuggestionPosition();
    this.trackCaretRowAndColumn();
    //console.log('inside onContentedit 170');
    this.inlineSuggestion = this.getRandomSuggestion();

    //this.analyzeText(sanitizedText);
  }
  updateSuggestionPosition() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect) {
        this.suggestionPosition = {
          top: rect.bottom + window.scrollY, // 5px offset for regular input
          left: rect.left + window.scrollX
        };
      }
    }
  }
  onMouseUpOrClick(event: MouseEvent) {
    this.updateSuggestionPosition(); // Update position on mouseup or click
    const target = event.target as HTMLElement;
    const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
    if (sanitizedText.length > 0) {
      this.analyzeText(sanitizedText);
    }
  }
  getRandomSuggestion() {
    const dummySuggestions = [
      'Hello',
      'Hi',
      'you',
      'wanted',
      'regards',
      'data',
      'Add',
      'TestSuggestion'
    ];

    const index = Math.floor(Math.random() * dummySuggestions.length);
    return dummySuggestions[index];
  }
  setSuggestionPosition() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0); // Get the current range
    const rect = range.getBoundingClientRect(); // Get the position of the caret
    this.suggestionPosition = {
      top: rect.top + window.scrollY, // Adjust `20` as needed to offset the suggestion
      left: rect.left + window.scrollX
    };
  }
  setSuggestionPositionWithoutOffset() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0); // Get the current range
    const rect = range.getBoundingClientRect();
    this.suggestionPosition = {
      top: rect.top + window.scrollY, // Adjust `20` as needed to offset the suggestion
      left: rect.left + window.scrollX
    };
  }

  async analyzeText(text: string) {
    try {
      const accessToken = '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'; // Replace with your token
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
        throw new Error('Failed to fetch sentiment analysis');
      }
      const sentimentData = await sentimentResponse.json();
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
        throw new Error('Failed to fetch suggestions');
      }
      const suggestionsData = await suggestionResponse.json();
      this.suggestions = suggestionsData.map((item: any) =>
        item.token_str.trim()
      );

      // Set the suggestion after 3 seconds
      setTimeout(() => {
        this.inlineSuggestion = this.suggestions[0] || ''; // Set the first suggestion or empty string

        // Reset the suggestion after 27 seconds if no new action occurs
        this.resetTimeout = setTimeout(() => {
          this.inlineSuggestion = ''; // Set suggestion to empty after 30 seconds from the start
        }, 27000); // 27000ms = 27 seconds after setting the suggestion
      }, 3000); // 3000ms = 3 seconds
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

  // This function can be used to reset the timeout whenever there is a new action
  resetSuggestion() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout); // Clear the existing timeout
    }
    this.inlineSuggestion = this.suggestions[0] || ''; // Reset suggestion if needed
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' && this.inlineSuggestion) {
      event.preventDefault();
      const target = event.target as HTMLElement;
      //console.log('target.innerHTML.trim() before ' + target.innerHTML.trim());
      const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
      // console.log('sanitizedText after ' + sanitizedText);
      const textBefore = sanitizedText;
      const { row, column } = this.caretPosition;
      const lines = textBefore.split('\n');
      // console.log('row in final is ' + row);
      // console.log('lines in final is ' + JSON.stringify(lines));
      // console.log('lines length is ' + lines.length);
      let lineRow = 0;
      if (row < 0) {
        lineRow = 0; // If row is negative, default to the first line
      } else if (row >= lines.length) {
        lineRow = lines.length - 1; // If row exceeds the available lines, use the last line
      } else {
        lineRow = row; // Otherwise, use the row as it is
      }

      // Update the line where the suggestion will be inserted
      if (lineRow >= 0 && lineRow < lines.length) {
        const currentLine = lines[lineRow];
        const beforeCaret = currentLine.substring(0, column); // Text before the caret
        const afterCaret = currentLine.substring(column);
        lines[lineRow] =
          beforeCaret + ' ' + this.inlineSuggestion + ' ' + afterCaret;
      }

      let result = lines.map(
        (str) =>
          str
            .replaceAll('replace_as_bold_start', '<b>') // Replace start bold marker with <b>
            .replaceAll('replace_as_bold_end', '</b>') // Replace end bold marker with </b>
      );
      const updatedText = result.join('\n');
      console.log('Updated Text with Suggestion:', updatedText);
      const formattedHTML = result
        .map((line) => {
          // For empty lines, return <div><br></div>
          return line.trim() === '' ? '<div><br></div>' : `<div>${line}</div>`;
        })
        .join('');
      target.innerHTML = formattedHTML;
      this.inlineSuggestion = '';
      this.suggestions = [];
      this.moveCaretToEnd(target);
    }
  }

  trackCaretRowAndColumn() {
    //this.inlineSuggestion = '';
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
    const computedStyle = window.getComputedStyle(contentEditable);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const borderTopWidth = parseFloat(computedStyle.borderTopWidth);
    const offsetTop = containerRect.top + paddingTop + borderTopWidth;

    // Adjust row calculation to account for padding and extra spacing
    const row = Math.floor((caretRect.top - offsetTop) / lineHeight);

    const column = caretRect.left - containerRect.left;
    this.caretPosition = { row, column };
    return { row, column };
  }
  trackCursorPosition(event: KeyboardEvent) {
    const selection = window.getSelection();
    this.staticCursonPosition = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    this.suggestionPosition = {
      top: rect.bottom + window.scrollY, // 5px offset
      left: rect.left + window.scrollX
    };
  }

  toggleBold(event: Event) {
    console.log('inside bold selection');
    document.execCommand('bold');
    this.updateSuggestionPosition();
    this.trackCaretRowAndColumn();
    this.resetPositionData();
  }
  resetPositionData() {
    this.inlineSuggestion = '';
    this.suggestions = [];
  }

  toggleItalic(event: Event) {
    document.execCommand('italic');
    this.trackCaretRowAndColumn();
    this.resetPositionData();
  }

  toggleUnderline(event: Event) {
    document.execCommand('underline');
    this.trackCaretRowAndColumn();
    this.resetPositionData();
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

  openEmojiPicker(event: MouseEvent) {
    setTimeout(() => {
      // Toggle the visibility of the emoji picker
      this.emojiPickerVisible = !this.emojiPickerVisible;

      if (this.emojiPickerVisible) {
        // Calculate and set the popup position relative to the button
        const button = document.querySelector('.btn-action') as HTMLElement;
        const buttonRect = button.getBoundingClientRect();
        this.popupPosition = {
          top: buttonRect.bottom + 'px', // Position below the button
          left: buttonRect.left + 'px' // Align with the left edge of the button
        };

        // Auto-close the emoji picker after 3 seconds
        setTimeout(() => {
          this.emojiPickerVisible = false;
        }, 3000); // 3000ms = 3 seconds
      } else {
      }
    }, 30); // 30ms delay before toggling visibility
  }

  // Select an emoji
  onEmojiSelect(emoji: string) {
    this.selectedEmoji = emoji;
    this.emojiPickerVisible = false; // Close emoji picker after selecting
    this.selectedEmoji = '';
    this.insertEmojiIntoBody(emoji); // Optionally, insert emoji into the text area
  }

  // Clear selected emoji
  clearSelectedEmoji() {
    this.selectedEmoji = '';
  }

  insertEmojiIntoBody(emoji: string) {
    const textarea: HTMLElement = document.getElementById('body')!;
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range) {
      range.deleteContents();
      const emojiNode = document.createTextNode(emoji);
      range.insertNode(emojiNode);
    }
  }

  insertAtCaret(emoji: string) {
    const textarea = this.textarea.nativeElement;
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (range) {
      // Insert emoji at the caret position
      range.deleteContents();
      range.insertNode(document.createTextNode(emoji));

      // Move caret to the end of the inserted emoji
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }

  scheduleEmail() {
    console.log('Schedule Email clicked');
    // Implement email scheduling logic
  }

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
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    } else {
      this.generateAccessToken();
    }
    const url = `https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/OutlookEmailService/deleteEmail/${emailData.Id}`;

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
              this.categories = data;
            },
            (error) => {
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
  }

  toggleFlag(email: any): void {
    email.isFlagged = !email.isFlagged;
    this.updateEmail(email.Id, email.isFlagged ? 'flag' : 'unflag');
  }
  loadDraft(): void {
    this.loadEmails('Drafts');
  }

  loadTrash(): void {
    this.loadEmails('deleteditems');
    // Add your functionality for loadTrash here
  }

  correctGrammar(): void {
    if (!this.emailtoSend.bodyPreview.trim()) {
      this.errorMessage = 'Please enter some text to correct.';
      return;
    }
    this.salesforceService
      .correctGrammar(this.emailtoSend.bodyPreview)
      .subscribe({
        next: (response) => {
          this.correctedText = response;
          this.errorMessage = '';
        },
        error: (err) => {
          console.error('Error during grammar correction:', err);
          this.errorMessage = 'Failed to correct grammar. Please try again.';
        }
      });
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
