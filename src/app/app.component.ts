import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked
} from '@angular/core';
import Quill, { Delta } from 'quill';
//import { Blot } from 'parchment'; // Blot class from Parchment

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
import { Blot } from 'parchment'; // Import Blot from Parchment
// Type casting to any to solve the "unknown" error
const InlineSuggestion = Quill.import('blots/inline') as any;

class InlineSuggestionBlot extends InlineSuggestion {
  static blotName = 'inline-suggestion'; // Custom name for the blot
  static tagName = 'span'; // Span tag for inline suggestion

  constructor(domNode: any) {
    super(domNode);
    domNode.classList.add('inline-suggestion'); // Add the custom class to the element
  }
}

// Register the custom blot with Quill
Quill.register(InlineSuggestionBlot);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './app.component.css']
})
export class AppComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
  @ViewChild('textarea') textarea!: ElementRef; // Reference to the textarea
  private suggestionTimeout: any;
  savedRange: Range | null = null;
  popupPosition = { top: '0px', left: '0px' };
  showColorPalette = false;
  inlineSuggestionVisible = false;
  // inlineSuggestion: string | null = null;
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
  //suggestions: string[] = [];
  isComposeMode: boolean = false;
  correctedText = '';
  sentimentAnalysis: SentimentResponse | null = null;
  cursorPosition: number = 0; // Declare cursorPosition to track the cursor index
  currentHighScoreSuggestion: string = ''; // Best suggestion to apply
  records: any;
  userInfo: any;
  //errorMessage: string | null = null;
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
  //private resetTimeout: any = null; // Variable to store the timeout ID
  quill: any;
  suggestions: { token_str: string; sequence: string }[] = [];
  inlineSuggestion: { token_str: string; sequence: string } = {
    token_str: '',
    sequence: ''
  };

  resetTimeout: any;
  errorMessage: string = '';
  private debounceTimeout: any;
  // Debounce timeout
  private typingTimeout: any;
  private lastAnalyzedText = '';
  private isEditorInitialized = false; // Flag to track if the editor has already been initialized
  private isAddingSuggestions = false; // Flag to avoid recursion when adding suggestions

  mockSuggestionsResponse = [
    {
      token_str: 'died',
      sequence: "{ inputs : ' hi, i wanted to inform you that d died. ' }"
    },
    {
      token_str: 'is',
      sequence: "{ inputs : ' hi, i wanted to inform you that d is. ' }"
    },
    {
      token_str: 'amazing',
      sequence: "{ inputs : ' hi, i wanted to inform you that is amazing. ' }"
    }
    // Add more mock data as needed
  ];
  constructor(
    public salesforceService: SalesforceService, // Inject SalesforceService
    private http: HttpClient, // Inject HttpClient
    private emojiService: EmojiService // Inject EmojiService
  ) {}

  ngAfterViewInit() {
    if (this.isComposeMode) {
      this.initializeEditor();
    }
  }

  ngAfterViewChecked() {
    const editorElement = document.getElementById('editor');
    if (editorElement && !this.quill) {
      this.initializeEditor();
    }
  }

  initializeEditor() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) {
      console.error('Editor element not found!');
      return;
    }

    if (this.isEditorInitialized) {
      return; // If editor is already initialized, don't reinitialize or bind again
    }

    this.quill = new Quill(editorElement, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: '1' }, { header: '2' }, { font: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['bold', 'italic', 'underline'],
          [{ align: [] }],
          ['link', 'blockquote', 'code-block'],
          ['image', 'video']
        ]
      }
    });

    // Focus on the editor
    this.quill.focus();

    // Add listener for text changes (bind this only once)
    this.quill.on('text-change', this.onTextChange.bind(this));

    // Set the flag indicating the editor is initialized
    this.isEditorInitialized = true;
  }

  onTextChange(delta: Delta, oldDelta: Delta, source: string) {
    console.log('onTextChange text before: ' + this.quill.getText().trim());
    const text = this.quill.getText().trim();

    // Prevent recursion if suggestions are being added
    if (this.isAddingSuggestions || !text) {
      return;
    }

    console.log('onTextChange text inside: ' + text);
    this.analyzeText(text);
  }

  addSuggestionsToEditor(
    suggestions: { token_str: string; sequence: string }[]
  ) {
    // Prevent triggering the onTextChange event while adding suggestions
    this.isAddingSuggestions = true;

    // Define the original text for position calculation
    const originalText = 'hi, i wanted to inform you that '; // Update as per actual text
    console.log('line 195 suggestions ' + suggestions);
    suggestions.forEach((suggestion) => {
      const { token_str, sequence } = suggestion;

      // Calculate the start and end position of the suggestion
      const start = sequence.indexOf(token_str); // Find the start position of the token in the sequence
      const end = start + token_str.length; // Calculate the end position of the token

      // Insert the suggestion text at the correct position
      this.quill.insertText(start, token_str, 'inline-suggestion');
      console.log('line 205 suggestions ' + suggestions);

      // Ensure the cursor moves to the end of the inserted suggestion
      this.quill.setSelection(end, end);
    });

    // Re-enable text-change event listener after suggestions are added
    this.isAddingSuggestions = false;
  }

  // onTextChange(delta: Delta, oldDelta: Delta, source: string) {
  //   console.log('onTextChange text before');
  //   const text = this.quill.getText().trim();
  //   console.log('onTextChange text' + text);

  //   // Clear any existing debounced function
  //   if (this.debounceTimeout) {
  //     clearTimeout(this.debounceTimeout);
  //   }

  //   // Call API only after 500ms of no text change
  //   this.debounceTimeout = setTimeout(() => {
  //     if (text) {
  //       console.log('onTextChange inside text' + text);
  //       this.analyzeText(text);
  //     }
  //   }, 500);
  // }

  async analyzeText(text: string) {
    /*
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
      const formattedSuggestions = suggestionsData.map((item: any) => ({
        token_str: item.token_str.trim(), // Token text (the word or fragment to insert)
        sequence: item.sequence // The sequence or context for the token
      }));

      // Clear old suggestions before adding new ones
      this.clearOldSuggestions();

      // Add the formatted suggestions to the editor
      this.addSuggestionsToEditor(formattedSuggestions);

      // Set the suggestion after 3 seconds
      setTimeout(() => {
        // Extract the first suggestion's token_str and assign it to inlineSuggestion
        this.inlineSuggestion = this.suggestions[0]?.token_str || ''; // Only assign the token_str

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
    }*/

    if (text === this.lastAnalyzedText) {
      return; // Don't analyze again if the text hasn't changed
    }

    this.lastAnalyzedText = text; // Update the last analyzed text
    try {
      // Mock the response to simulate the API call
      const mockSuggestionsData = this.mockSuggestionsResponse; // Use mock response

      // Format the mock response like the actual API response
      const formattedSuggestions = mockSuggestionsData.map((item: any) => ({
        token_str: item.token_str.trim(), // Token text (the word or fragment to insert)
        sequence: item.sequence // The sequence or context for the token
      }));

      // Pass the mock formatted suggestions to addSuggestionsToEditor
      this.addSuggestionsToEditor(formattedSuggestions);

      // Set the suggestion after 3 seconds (as in your original code)
      setTimeout(() => {
        this.inlineSuggestion = this.suggestions[0] || ''; // Set the first suggestion or empty string

        // Reset the suggestion after 27 seconds if no new action occurs
        this.resetTimeout = setTimeout(() => {
          //this.inlineSuggestion = ''; // Set suggestion to empty after 30 seconds
        }, 27000); // 27000ms = 27 seconds after setting the suggestion
      }, 3000); // 3000ms = 3 seconds
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  }

  clearOldSuggestions() {
    this.suggestions = [];
    this.inlineSuggestion = { token_str: '', sequence: '' }; // Reset to an empty object
  }

  // addSuggestionsToEditor(
  //   suggestions: { token_str: string; sequence: string }[]
  // ) {
  //   // Define the original text for position calculation
  //   const originalText = 'hi, i wanted to inform you that '; // Update as per actual text
  //   suggestions.forEach((suggestion) => {
  //     const { token_str, sequence } = suggestion;

  //     // Calculate the start and end position of the suggestion
  //     const start = sequence.indexOf(token_str); // Find the start position of the token in the sequence
  //     const end = start + token_str.length; // Calculate the end position of the token

  //     // Insert the suggestion text at the correct position
  //     this.quill.insertText(start, token_str, 'inline-suggestion');

  //     // Ensure the cursor moves to the end of the inserted suggestion
  //     this.quill.setSelection(end, end);
  //   });
  // }

  // // The callback for the text-change event
  // onTextChange(delta: Delta, oldDelta: Delta, source: string) {
  //   // You can choose to use 'delta', 'oldDelta', or 'source' in the function
  //   // For now, we will log the delta to see what it contains
  //   console.log('Text change detected:', delta);

  //   // You can process the changes or check for specific conditions
  //   const text = this.quill.getText().trim();
  //   if (text) {
  //     this.getSuggestions(text); // Call API to fetch suggestions
  //   }
  // }

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

    // const editor = document.getElementById('editor'); // editor can be null

    // if (editor) {
    //   // Now TypeScript knows that `editor` is not null
    //   this.quill = new Quill(editor, {
    //     theme: 'snow',
    //     modules: {
    //       toolbar: [
    //         [{ header: '1' }, { header: '2' }, { font: [] }],
    //         [{ list: 'ordered' }, { list: 'bullet' }],
    //         ['bold', 'italic', 'underline'],
    //         [{ align: [] }],
    //         ['link', 'blockquote', 'code-block'],
    //         ['image', 'video']
    //       ]
    //     }
    //   });

    //   this.quill.on('text-change', () => {
    //     const html = this.quill.root.innerHTML; // Get the HTML content
    //     this.emailtoSend.bodyPreview = html; // Sync with your model
    //   });
    // } else {
    //   console.error('Editor element not found!');
    // }

    // this.quill.on('text-change', () => {
    //   const html = this.quill.root.innerHTML; // Get the HTML content
    //   this.emailtoSend.bodyPreview = html; // Sync with your model
    // });

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
    //this.emailtoSend.bodyPreview = target.innerHTML; // Sync with model

    // Get plain text content (without HTML tags)
    const bodyContent = target.textContent || ''; // Just get the text content, no HTML tags

    this.emailtoSend.bodyPreview = bodyContent; // Sync with model

    const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
    if (sanitizedText.length === 0) {
      this.inlineSuggestion = { token_str: '', sequence: '' }; // Reset to an empty object
      return;
    }
    this.updateSuggestionPosition();
    this.trackCaretRowAndColumn();
    this.resetPositionData();
    //console.log('inside onContentedit 170');
    this.inlineSuggestion = { token_str: '', sequence: '' }; // Reset to an empty object

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
    this.updateSuggestionPosition();
    this.trackCaretRowAndColumn();
    this.resetPositionData();

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

  // async analyzeText(text: string) {
  //   try {
  //     const accessToken = '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'; // Replace with your token
  //     const sentimentResponse = await fetch(
  //       'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment',
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${accessToken}`
  //         },
  //         body: JSON.stringify({ text })
  //       }
  //     );
  //     if (!sentimentResponse.ok) {
  //       throw new Error('Failed to fetch sentiment analysis');
  //     }
  //     const sentimentData = await sentimentResponse.json();
  //     const inputData = `{ inputs: '${text} [MASK].' }`;
  //     const suggestionResponse = await fetch(
  //       'https://api-inference.huggingface.co/models/bert-base-uncased',
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${accessToken}`
  //         },
  //         body: inputData
  //       }
  //     );
  //     if (!suggestionResponse.ok) {
  //       throw new Error('Failed to fetch suggestions');
  //     }
  //     const suggestionsData = await suggestionResponse.json();
  //     this.suggestions = suggestionsData.map((item: any) =>
  //       item.token_str.trim()
  //     );
  //     const formattedSuggestions = suggestionsData.map((item: any) => ({
  //       token_str: item.token_str.trim(), // Token text (the word or fragment to insert)
  //       sequence: item.sequence // The sequence or context for the token
  //     }));

  //     // Now pass the correctly formatted suggestions to the addSuggestionsToEditor function
  //     this.addSuggestionsToEditor(formattedSuggestions);
  //     // Set the suggestion after 3 seconds
  //     setTimeout(() => {
  //       this.inlineSuggestion = this.suggestions[0] || ''; // Set the first suggestion or empty string

  //       // Reset the suggestion after 27 seconds if no new action occurs
  //       this.resetTimeout = setTimeout(() => {
  //         this.inlineSuggestion = ''; // Set suggestion to empty after 30 seconds from the start
  //       }, 27000); // 27000ms = 27 seconds after setting the suggestion
  //     }, 3000); // 3000ms = 3 seconds
  //   } catch (error: unknown) {
  //     if (error instanceof Error) {
  //       console.error('Error fetching analysis:', error.message); // Safely accessing `message`
  //       this.errorMessage = `Analysis failed: ${error.message}`;
  //     } else {
  //       console.error('Unknown error:', error); // In case it's not an instance of Error
  //       this.errorMessage = `Analysis failed: An unknown error occurred.`;
  //     }
  //   }
  // }

  // This function can be used to reset the timeout whenever there is a new action
  // resetSuggestion() {
  //   if (this.resetTimeout) {
  //     clearTimeout(this.resetTimeout); // Clear the existing timeout
  //   }
  //   this.inlineSuggestion = this.suggestions[0] || ''; // Reset suggestion if needed
  // }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab' && this.inlineSuggestion) {
      this.trackCaretRowAndColumn(); // Track the caret position

      event.preventDefault(); // Prevent default behavior of the Tab key
      const target = event.target as HTMLElement;

      // Sanitize the input text from the content-editable element
      const sanitizedText = this.sanitizeInput(target.innerHTML.trim());
      const lines = sanitizedText.split('\n'); // Split text into lines

      const { row, column } = this.caretPosition; // Get caret position (row and column)

      let lineRow = 0;
      if (row < 0) {
        lineRow = 0; // If row is negative, default to the first line
      } else if (row >= lines.length) {
        lineRow = lines.length - 1; // If row exceeds available lines, use the last line
      } else {
        lineRow = row; // Otherwise, use the row as it is
      }

      // Find the caret position in the string based on the range
      const currentLine = lines[lineRow];
      console.log('current line in keydown :', currentLine);
      const columnIndex = this.getTextColumnIndex(currentLine, column);
      console.log('columnIndex line:', columnIndex);
      const beforeCaret = currentLine.substring(0, column); // Text before the caret
      const afterCaret = currentLine.substring(column); // Text after the caret

      // Adjust column to be based on the string length and caret position
      const textLength = beforeCaret.length; // This will give the actual position in the string
      console.log('Column in terms of string length: ', textLength);

      // Now we can insert the suggestion based on the calculated position
      lines[lineRow] =
        beforeCaret + ' ' + this.inlineSuggestion + ' ' + afterCaret;

      // Process lines to handle any formatting (like bold text)
      let result = lines.map(
        (str) =>
          str
            .replaceAll('replace_as_bold_start', '<b>') // Replace start bold marker with <b>
            .replaceAll('replace_as_bold_end', '</b>') // Replace end bold marker with </b>
      );

      const updatedText = result.join('\n');
      console.log('Updated Text with Suggestion:', updatedText);

      // Create the final HTML for contenteditable
      const formattedHTML = result
        .map((line) =>
          line.trim() === '' ? '<div><br></div>' : `<div>${line}</div>`
        )
        .join('');

      target.innerHTML = formattedHTML; // Update the content of the content-editable element

      // Reset the inline suggestion and suggestions array
      this.inlineSuggestion = { token_str: '', sequence: '' }; // Reset to an empty object
      this.suggestions = [];
    }
  }

  getTextColumnIndex(line: string, caretColumn: number): number {
    console.log('current line in getTextColumnIndex :', line);
    console.log(
      'current line in getTextColumnIndex  caretColumn :',
      caretColumn
    );
    // Create an invisible container to measure text width
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    document.body.appendChild(tempDiv);

    const span = document.createElement('span');
    tempDiv.appendChild(span);

    // Measure the width of each character and accumulate the width
    let totalWidth = 0;
    let columnIndex = 0;

    // Split the line by characters and measure the width of each character
    for (let i = 0; i < line.length; i++) {
      span.textContent = line.substring(0, i + 1); // Add one character at a time
      totalWidth = span.offsetWidth;

      // If the width exceeds the caret position, we found the correct index
      if (totalWidth >= caretColumn) {
        columnIndex = i;
        break;
      }
    }

    document.body.removeChild(tempDiv); // Clean up the temporary container

    console.log('Calculated column index in raw text: ' + columnIndex);

    // Now sanitize the line for output after we've calculated the caret position

    return columnIndex; // Return the index for insertion in raw text
  }
  sanitizeInputNew(input: string): string {
    // Create a temporary container to parse and manipulate the input HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');

    // Handle <b> and <strong> tags by replacing them with their inner text
    const bTags = doc.querySelectorAll('b, strong');
    bTags.forEach((bTag) => {
      const textContent = bTag.textContent || '';
      bTag.replaceWith(textContent);
    });

    // Handle <i> and <em> tags by replacing them with their inner text
    const iTags = doc.querySelectorAll('i, em');
    iTags.forEach((iTag) => {
      const textContent = iTag.textContent || '';
      iTag.replaceWith(textContent);
    });

    // Handle <u> tags by replacing them with their inner text
    const uTags = doc.querySelectorAll('u');
    uTags.forEach((uTag) => {
      const textContent = uTag.textContent || '';
      uTag.replaceWith(textContent);
    });

    // Handle <s> and <strike> tags by replacing them with their inner text
    const sTags = doc.querySelectorAll('s, strike');
    sTags.forEach((sTag) => {
      const textContent = sTag.textContent || '';
      sTag.replaceWith(textContent);
    });

    // Handle <span> tags by replacing them with their inner text
    const spanTags = doc.querySelectorAll('span');
    spanTags.forEach((spanTag) => {
      const textContent = spanTag.textContent || '';
      spanTag.replaceWith(textContent);
    });

    // Replace all &nbsp; (non-breaking space) entities with a regular space
    const docHTML = doc.body.innerHTML;

    // Replace &nbsp; with regular spaces
    const sanitizedHTML = docHTML.replace(/&nbsp;/g, ' ');

    // Replace <br> tags with newline character '\n'
    const finalSanitizedHTML = sanitizedHTML.replace(/<br\s*\/?>/g, '\n');

    // Return the sanitized text as a plain string
    return finalSanitizedHTML.trim();
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
    const computedStyle = window.getComputedStyle(contentEditable);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const borderTopWidth = parseFloat(computedStyle.borderTopWidth);
    const offsetTop = containerRect.top + paddingTop + borderTopWidth;

    // Adjust row calculation to account for padding and extra spacing
    const row = Math.floor((caretRect.top - offsetTop) / lineHeight);

    // Get padding and border values of the content container
    const paddingLeft = parseFloat(computedStyle.paddingLeft);
    const borderLeftWidth = parseFloat(computedStyle.borderLeftWidth);

    // Adjust column calculation to account for padding and borders
    const column =
      caretRect.left - containerRect.left - paddingLeft - borderLeftWidth;
    console.log('column in track is ' + column);
    this.caretPosition = { row, column };
    return { row, column };
  }

  toggleBold(event: Event) {
    console.log('inside bold selection');
    document.execCommand('bold');
    this.updateSuggestionPosition();
    this.trackCaretRowAndColumn();
    this.resetPositionData();
  }
  resetPositionData() {
    this.inlineSuggestion = { token_str: '', sequence: '' }; // Reset to an empty object
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
      this.inlineSuggestion = { token_str: '', sequence: '' }; // Reset to an empty object
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
