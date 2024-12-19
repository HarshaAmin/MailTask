import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
//import DOMPurify from 'dompurify';
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
  showEmojiPicker = false;
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
  emojiPickerVisible = false;
  selectedEmoji: string = '';
  popupPosition: any = {}; // Position of the popup
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

    // Subscribe to selected emoji changes
    this.emojiService.selectedEmoji$.subscribe((emoji) => {
      this.selectedEmoji = emoji;
    });
    this.loadEmails('Inbox');

    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  sanitizeInput(input: string): string {
    console.log('Original Input:', input); // Log the original input

    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    console.log('Parsed HTML Document:', doc.body.innerHTML); // Log the parsed HTML content

    // Function to process each node
    const traverseNode = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        console.log('Text Node:', node.textContent?.trim()); // Log text nodes
        return node.textContent?.trim() || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        console.log('Element Tag:', element.tagName); // Log element tags for processing

        // Handle <br> as newlines
        if (element.tagName === 'BR') {
          console.log('Found <BR> Tag'); // Log when <br> is found
          return '\n';
        }

        // Handle <div> as newlines
        else if (element.tagName === 'DIV') {
          const content = traverseChildren(element);
          console.log('Content inside <div>:', content); // Log content inside <div>
          return content.trim() ? `${content}\n` : '\n';
        }

        // Handle <b>, <strong>, <i>, <em>, and other formatting tags
        else if (element.tagName === 'B' || element.tagName === 'STRONG') {
          console.log('Found <b> or <strong> Tag'); // Log when <b> or <strong> is found
          return ` <b>${traverseChildren(element)}</b> `;
        } else if (element.tagName === 'I' || element.tagName === 'EM') {
          console.log('Found <i> or <em> Tag'); // Log when <i> or <em> is found
          return ` <i>${traverseChildren(element)}</i> `;
        }

        // Handle <u> and other tags
        else if (element.tagName === 'U') {
          console.log('Found <u> Tag'); // Log when <u> is found
          return ` <u>${traverseChildren(element)}</u> `;
        }

        // Handle <s> or <strike> for strikethrough
        else if (element.tagName === 'S' || element.tagName === 'STRIKE') {
          console.log('Found <s> or <strike> Tag'); // Log when <s> or <strike> is found
          return ` <s>${traverseChildren(element)}</s> `;
        }

        // Handle <span> or other inline elements
        else if (element.tagName === 'SPAN') {
          console.log('Found <span> Tag'); // Log when <span> is found
          return ` <span>${traverseChildren(element)}</span> `;
        }

        // Traverse any unhandled tags
        else {
          console.log('Traversing Other Tag:', element.tagName); // Log for other tags
          return traverseChildren(element);
        }
      }
      return '';
    };

    // Function to process all children of an element
    const traverseChildren = (node: HTMLElement): string => {
      console.log('Traversing Children of:', node.tagName); // Log when traversing children
      return Array.from(node.childNodes).map(traverseNode).join('');
    };

    // Start sanitizing and processing the input
    let sanitizedText = traverseChildren(doc.body).trim();
    console.log('Sanitized Text:', sanitizedText); // Log the final sanitized text

    return sanitizedText;
  }

  traverseChildren(node: HTMLElement): string {
    return Array.from(node.childNodes)
      .map((child) =>
        child.nodeType === Node.TEXT_NODE ? child.textContent : ''
      )
      .join('');
  }

  // Move the caret to the end of the inserted text
  moveCaretToEnd(target: HTMLElement) {
    const selection = window.getSelection();
    const range = document.createRange();

    // Focus on the target
    target.focus();

    // Move caret to the end of the content
    range.selectNodeContents(target);
    range.collapse(false);

    // Apply the range to the selection
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  // sanitizeInput(input: string): string {
  //   // Parse the input HTML
  //   const parser = new DOMParser();
  //   const doc = parser.parseFromString(input, 'text/html');

  //   // Function to process each node
  //   const traverseNode = (node: ChildNode): string => {
  //     if (node.nodeType === Node.TEXT_NODE) {
  //       // Return text content for text nodes
  //       return node.textContent || '';
  //     } else if (node.nodeType === Node.ELEMENT_NODE) {
  //       const element = node as HTMLElement;

  //       // Handle specific elements
  //       if (element.tagName === 'BR') {
  //         return '\n'; // Replace <BR> with a newline
  //       } else if (element.tagName === 'DIV') {
  //         // Process children of <DIV> with a newline
  //         return traverseChildren(element) + '\n';
  //       } else {
  //         // Process other elements by traversing their children
  //         return traverseChildren(element);
  //       }
  //     }
  //     // Ignore unsupported node types
  //     return '';
  //   };

  //   // Function to process all child nodes of a given node
  //   const traverseChildren = (node: HTMLElement): string => {
  //     return Array.from(node.childNodes).map(traverseNode).join('');
  //   };

  //   // Start traversing from the body of the parsed document
  //   const sanitizedText = traverseChildren(doc.body).trim();

  //   return sanitizedText;
  // }
  onContentEditableInput(event: Event) {
    this.inlineSuggestion = '';
    //uncomment code 136
    // const target = event.target as HTMLElement;
    // this.emailtoSend.bodyPreview = target.innerHTML.trim();
    // const inputText = this.emailtoSend.bodyPreview;
    console.log('inside onContentedit');
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
    console.log('inside onContentedit 170');
    this.inlineSuggestion = this.getRandomSuggestion();
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

  // onContentEditableInput(event: Event) {
  //   // const target = event.target as HTMLElement;
  //   // this.emailtoSend.bodyPreview = target.innerHTML.trim();
  //   // const inputText = this.emailtoSend.bodyPreview;
  //   console.log('inside onContentedit');
  //   const target = event.target as HTMLElement;
  //   const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
  //   //const inputText = this.emailtoSend.bodyPreview;

  //   // Clear previous analysis if no input
  //   if (sanitizedText.length === 0) {
  //     this.inlineSuggestion = '';
  //     return;
  //   }

  //   // Adjust suggestion position with offset for normal typing
  //   const selection = window.getSelection();
  //   const rect = selection?.getRangeAt(0).getBoundingClientRect();

  //   if (rect) {
  //     this.suggestionPosition = {
  //       top: rect.bottom + window.scrollY + 6, // 5px offset for regular input
  //       left: rect.left + window.scrollX + 10
  //     };
  //   }
  //   console.log('inside onContentedit 170');
  //   this.analyzeText(sanitizedText);
  // }

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
    console.log('inside analyzeText');
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
        throw new Error('Failed to fetch sentiment analysis');
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
        throw new Error('Failed to fetch suggestions');
      }

      // const suggestionsData = await suggestionResponse.json();

      // // this.suggestions[0] = 'one';
      // // this.inlineSuggestion = this.suggestions[0] || ''; // Take the first suggestion

      // suggestionsData.map((item: any) => item.token_str.trim());
      // console.log(
      //   'inside analyzeText suggestionsData ' + JSON.stringify(suggestionsData)
      // );
      // this.inlineSuggestion = this.suggestions[0] || ''; // Take the first suggestion
      // console.log(
      //   'inside analyzeText inlineSuggestion ' + this.inlineSuggestion
      // );

      const suggestionsData = await suggestionResponse.json();

      // Trim the suggestion strings and store them
      this.suggestions = suggestionsData.map((item: any) =>
        item.token_str.trim()
      );

      // Take the first suggestion if available
      this.inlineSuggestion = this.suggestions[0] || '';

      console.log(
        'inside analyzeText suggestionsData ' + JSON.stringify(suggestionsData)
      );
      console.log(
        'inside analyzeText inlineSuggestion ' + this.inlineSuggestion
      );

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

      // Get the target element and sanitize its HTML content
      const target = event.target as HTMLElement;
      console.log('target.innerHTML.trim() before ' + target.innerHTML.trim());
      const sanitizedText = this.sanitizeInput(target.innerHTML.trim());

      console.log('sanitizedText after ' + sanitizedText);

      const textBefore = sanitizedText;
      const { row, column } = this.caretPosition;
      const lines = textBefore.split('\n');
      console.log('row in final is ' + row);
      console.log('lines in final is ' + JSON.stringify(lines));
      console.log('lines length is ' + lines.length);

      // Adjust row based on the caret position
      let lineRow = 0;

      // Ensure row is within bounds (preventing it from being negative or out of bounds)
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
        const afterCaret = currentLine.substring(column); // Text after the caret

        // Insert the suggestion text in the correct position
        lines[lineRow] =
          beforeCaret + ' ' + this.inlineSuggestion + ' ' + afterCaret;
      }

      let result = lines.map(
        (str) =>
          str
            .replaceAll('replace_as_bold_start', '<b>') // Replace start bold marker with <b>
            .replaceAll('replace_as_bold_end', '</b>') // Replace end bold marker with </b>
      );

      // Join lines back and log the updated text
      const updatedText = result.join('\n');
      console.log('Updated Text with Suggestion:', updatedText);

      const formattedHTML = result
        .map((line) => {
          // For empty lines, return <div><br></div>
          return line.trim() === '' ? '<div><br></div>' : `<div>${line}</div>`;
        })
        .join('');

      // Update the target innerHTML with the new lines
      target.innerHTML = formattedHTML;
      // target.innerHTML = lines
      //   .map((line) => {
      //     // Preserve empty lines by checking explicitly for empty strings
      //     return line.trim() === '' ? '<div><br></div>' : `<div>${line}</div>`;
      //   })
      //   .join('');

      // Reset inline suggestion and suggestions array
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

  // moveCaretToEnd(element: HTMLElement) {
  //   const range = document.createRange();
  //   const selection = window.getSelection();

  //   // Move the caret to the end of the element's content
  //   range.selectNodeContents(element);
  //   range.collapse(false);
  //   selection?.removeAllRanges();
  //   selection?.addRange(range);
  // }

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
    this.inlineSuggestion = '';
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

  // Toggle emoji picker visibility
  openEmojiPicker() {
    this.emojiPickerVisible = !this.emojiPickerVisible;

    if (this.emojiPickerVisible) {
      const button = document.querySelector('.btn-action') as HTMLElement;
      const buttonRect = button.getBoundingClientRect();

      this.popupPosition = {
        top: buttonRect.bottom + 'px', // Position below the button
        left: buttonRect.left + 'px' // Align with the left edge of the button
      };
    }
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

  // // Insert emoji into the contenteditable div
  // insertEmojiIntoBody(emoji: string) {
  //   const textarea: HTMLElement = document.getElementById('body')!;
  //   const selection = window.getSelection();
  //   const range = selection?.getRangeAt(0);

  //   if (range) {
  //     range.deleteContents();
  //     const emojiNode = document.createTextNode(emoji);
  //     range.insertNode(emojiNode);
  //   }
  // }

  // Insert emoji into the body (contenteditable area)
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
  // // Track caret position for inline suggestions
  // trackCaretRowAndColumn() {
  //   const textarea: HTMLElement = document.getElementById('body')!;
  //   const range = window.getSelection()?.getRangeAt(0);
  //   if (range) {
  //     const rect = range.getBoundingClientRect();
  //     this.suggestionPosition = { top: rect.top, left: rect.left + rect.width };
  //   }
  // }

  // addEmoji(event: any) {
  //   const emoji = event.emoji.native; // The selected emoji

  //   event.preventDefault(); // Stop default behavior (Tab behavior)

  //   // Get the target element and sanitize its HTML content
  //   const target = event.target as HTMLElement;
  //   console.log('target.innerHTML.trim() before ' + target.innerHTML.trim());
  //   const sanitizedText = this.sanitizeInput(target.innerHTML.trim());

  //   console.log('sanitizedText after ' + sanitizedText);

  //   const textBefore = sanitizedText;
  //   const { row, column } = this.caretPosition;
  //   const lines = textBefore.split('\n');
  //   console.log('row in final is ' + row);
  //   console.log('lines in final is ' + JSON.stringify(lines));
  //   console.log('lines length is ' + lines.length);

  //   // Adjust row based on the caret position
  //   let lineRow = 0;

  //   // Ensure row is within bounds (preventing it from being negative or out of bounds)
  //   if (row < 0) {
  //     lineRow = 0; // If row is negative, default to the first line
  //   } else if (row >= lines.length) {
  //     lineRow = lines.length - 1; // If row exceeds the available lines, use the last line
  //   } else {
  //     lineRow = row; // Otherwise, use the row as it is
  //   }

  //   // Update the line where the suggestion will be inserted
  //   if (lineRow >= 0 && lineRow < lines.length) {
  //     const currentLine = lines[lineRow];
  //     const beforeCaret = currentLine.substring(0, column); // Text before the caret
  //     const afterCaret = currentLine.substring(column); // Text after the caret

  //     // Insert the suggestion text in the correct position
  //     lines[lineRow] =
  //       beforeCaret + ' ' + this.inlineSuggestion + ' ' + afterCaret;
  //   }

  //   let result = lines.map(
  //     (str) =>
  //       str
  //         .replaceAll('replace_as_bold_start', '<b>') // Replace start bold marker with <b>
  //         .replaceAll('replace_as_bold_end', '</b>') // Replace end bold marker with </b>
  //   );

  //   // Join lines back and log the updated text
  //   const updatedText = result.join('\n');
  //   console.log('Updated Text with Suggestion:', updatedText);

  //   const formattedHTML = result
  //     .map((line) => {
  //       // For empty lines, return <div><br></div>
  //       return line.trim() === '' ? '<div><br></div>' : `<div>${line}</div>`;
  //     })
  //     .join('');

  //   // Update the target innerHTML with the new lines
  //   target.innerHTML = formattedHTML;
  //   // target.innerHTML = lines
  //   //   .map((line) => {
  //   //     // Preserve empty lines by checking explicitly for empty strings
  //   //     return line.trim() === '' ? '<div><br></div>' : `<div>${line}</div>`;
  //   //   })
  //   //   .join('');

  //   // Reset inline suggestion and suggestions array
  //   this.inlineSuggestion = '';
  //   this.suggestions = [];

  //   // Move caret to the end of the inserted text
  //   this.moveCaretToEnd(target);

  //   this.insertAtCaret(emoji);
  //   this.showEmojiPicker = false;
  // }
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
