import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { CommonService } from '../../shared/services/common.service';
import { NgIf } from '@angular/common';
import { EmojiService } from '../../shared/services/emoji.service';
import Quill, { Delta } from 'quill';

@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [FormsModule, FileUploadComponent, NgIf],
  templateUrl: './send-mail.component.html'
})
export class SendMailComponent implements OnInit, AfterViewInit, OnChanges {
  email = { to: '', subject: '', body: '' };
  emailRecp = { to: [], cc: [], bcc: [] };
  files: NgxFileDropEntry[] = [];
  currentHighScoreSuggestion: string = '';
  cursorPosition: number = 0;
  suggestionPosition: { top: number; left: number } | null = null;
  caretPosition: any;
  emojiPickerVisible = false;
  selectedEmoji: string = '';
  popupPosition: any = {};
  isSuggestionVisible = false;
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
  quill: Quill;
  isAddingSuggestions = false;
  lastAnalyzedText = '';
  suggestions: { token_str: string; sequence: string }[] = [];
  inlineSuggestion: { token_str: string; sequence: string } = {
    token_str: '',
    sequence: ''
  };
  suggestionTimeout: any;
  resetTimeout: any;
  emailBodyCords: {
    elementIdx: number,
    cursorPos: number
  } = {
      elementIdx: 0,
      cursorPos: 0
    }
  target: string;
  suggestionText = "suggestion1";

  @Output() openEmailModalEmitter = new EventEmitter<boolean>(true);
  @Input() openSendEmailModal: boolean = false;
  @Input() type = 'send';
  @Input() selectedEmail: any;

  constructor(
    private salesforceService: SalesforceService,
    private commonService: CommonService,
    private emojiService: EmojiService
  ) {
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnInit(): void {

    this.emojiService.isEmojiPickerVisible.subscribe((isVisible) => {
      this.emojiPickerVisible = isVisible;
    });

    // Subscribe to selected emoji changes
    this.emojiService.selectedEmoji$.subscribe((emoji) => {
      this.selectedEmoji = emoji;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] && this.type === 'send') {
      this.email = { to: '', subject: '', body: '' };
      this.emailRecp = { to: [], cc: [], bcc: [] };
    }
  }

  calcCursorPos(event) {
    console.log(event, "fdgdf");
    let isFocusElSet = false;
    if (event.keyCode == 9) return;

    this.email.body = event.target["innerHTML"];
    console.log(event.target["innerHTML"]);

    let el = document.querySelector(".ql-editor");
    let selection = window.getSelection();
    el.childNodes.forEach((node) => {
      node['classList'].remove("elmInFocus");
      node['classList'].add(`emailBodyChild`);
    });
    console.log(el.childNodes, "CHILD NODES");
    console.log(selection.getRangeAt(0), "selection");
    selection.focusNode.parentElement.classList.add("elmInFocus");
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i]['classList'].contains("elmInFocus")) {
        this.emailBodyCords.elementIdx = i;
        this.emailBodyCords.cursorPos = selection.focusOffset;
      }
    }
    console.log(this.emailBodyCords);
    if (!isFocusElSet) {
      if (event.keyCode == 13 || event.keyCode == 40) {
        if (this.emailBodyCords.elementIdx >= el.childNodes.length) {
          this.emailBodyCords.elementIdx = el.childNodes.length - 1;
        } else {
          this.emailBodyCords.elementIdx++;
        }
      }
      if (event.keyCode == 38) {
        if (this.emailBodyCords.elementIdx == 0) {
          this.emailBodyCords.elementIdx = 0;
        } else {
          this.emailBodyCords.elementIdx--;
        }
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.type === "reply") {
      this.emailRecp.to = this.selectedEmail.sender.split(";");
      this.emailRecp.to = this.emailRecp.to.map((recp, ind) => ({ id: ind, recp }));
    }

    this.quill = new Quill("#editor", {
      theme: "snow",
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', { header: '1' }, { header: '2' }, 'link', 'blockquote']
        ]
      }
    });

    document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));
    document.addEventListener('click', this.handleGlobalClick.bind(this));
  }

  handleGlobalClick(event) {
    if (event.target['parentElement'].classList.contains("ql-editor")) {
      this.calcCursorPos(event);
    }
  }

  handleGlobalKeyDown(event) {
    if (event.keyCode == 9 || event.keyCode == 13) {
      event.preventDefault();

      const str = this.suggestionText;

      const target = document.createTextNode("\u0001");
      let setpos = document.createRange();
      let el = document.querySelector(".ql-editor");
      let selection = window.getSelection();
      const offset = selection.focusOffset;
      selection.getRangeAt(0).insertNode(target);
      target.replaceWith(str);
      selection.focusNode['innerHTML'] = selection.focusNode['innerHTML'].replaceAll("\t", "");

      el.childNodes.forEach((node) => {
        node['classList'].remove("elmInFocus");
        node['classList'].add(`emailBodyChild`);
      });

      selection.focusNode['classList'].add("elmInFocus");
      for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i]['classList'].contains("elmInFocus")) {
          this.emailBodyCords.elementIdx = i;
          this.emailBodyCords.cursorPos = offset + str.length - 1;
        }
      }
      setpos.setStart(el.childNodes[this.emailBodyCords.elementIdx].childNodes[0], this.emailBodyCords.cursorPos);
      setpos.collapse(true);
      selection.removeAllRanges();
      selection.addRange(setpos);
    }
  }

  onTextChange(delta: Delta, oldDelta: Delta, source: string) {
    console.log('onTextChange ');
    // Get the raw HTML content
    const htmlContent = this.quill.root.innerHTML;
    console.log('onTextChange htmlContent ' + htmlContent);
    // Use a DOM parser to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // Check if the body is not null before accessing its textContent
    const body = doc.body;
    if (body) {
      // Remove any inline suggestions (or placeholders)
      // Example: Remove all spans with a specific class used for suggestions
      const suggestionElements = body.querySelectorAll('.suggestion-class'); // Change this selector based on your actual class
      suggestionElements.forEach((el) => {
        el.remove(); // Remove the suggestion element
      });

      // Now get the text without suggestions
      const cleanedText = body.textContent?.trim() || ''; // Handle case when textContent is null
      console.log('Cleaned text: ' + cleanedText);

      // Prevent recursion if suggestions are being added
      if (this.isAddingSuggestions || !cleanedText) {
        return;
      }

      // this.analyzeText(cleanedText);
    } else {
      console.error('Error: Body element is null');
    }
  }

  async analyzeText(text: string) {
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
      // this.suggestions = formattedSuggestions;
      // this.addSuggestionsToEditor(formattedSuggestions);

      // Set the suggestion after 3 seconds (as in your original code)
      setTimeout(() => {
        this.inlineSuggestion = this.suggestions[0] || {
          token_str: '',
          sequence: ''
        };; // Set the first suggestion or empty string

        // Reset the suggestion after 27 seconds if no new action occurs
        this.resetTimeout = setTimeout(() => {
          //this.inlineSuggestion = ''; // Set suggestion to empty after 30 seconds
        }, 27000); // 27000ms = 27 seconds after setting the suggestion
      }, 3000); // 3000ms = 3 seconds
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  }

  addSuggestionsToEditor(
    suggestions: { token_str: string; sequence: string }[]
  ) {
    this.isAddingSuggestions = true; // Prevent recursion while adding suggestions

    const { token_str, sequence } = suggestions[0];
    const start = sequence.indexOf(token_str);
    const end = start + token_str.length;

    // Insert the suggestion text as grayed-out (inline-suggestion)
    this.quill.insertText(start, token_str);

    // Move the cursor after the inserted suggestion
    this.quill.setSelection(end, end);

    this.isAddingSuggestions = false; // Re-enable text-change event listener

    // Set timeout to hide the suggestion after 5 seconds
    this.hideSuggestionAfterTimeout();
  }

  hideSuggestionAfterTimeout() {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout); // Clear any previous timeout
    }

    this.suggestionTimeout = setTimeout(() => {
      // Remove the suggestion (or hide it in the editor)
      this.suggestions = []; // Reset suggestions
      this.isSuggestionVisible = false;
    }, 5000); // Hide suggestion after 5 seconds
  }

  sendEmail(): void {
    this.salesforceService
      .sendEmail({
        to: this.emailRecp['to'].map(e => e.recp).join(";"),
        subject: this.email.subject,
        body: this.email.body,
        fileName: this.files?.[0]?.['fileName'] || '',
        fileType: this.files?.[0]?.['fileType'] || '',
        base64Content: this.files?.[0]?.['base64Content'] || ''
      })
      .subscribe(
        (response) => {
          console.log('Email sent successfully! ' + JSON.stringify(response));
          console.log('Email sent successfully! ' + response);
        },
        (error) => {
          console.error('Error:', JSON.stringify(error));
        }
      );
  }

  handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeComposeModal();
    }
  }

  closeComposeModal(): void {
    this.openSendEmailModal = false;
  }

  openComposeModal(): void {
    this.openSendEmailModal = true;
  }

  openEmailModal() {
    this.commonService.openEmailModal = false;
    this.commonService.toggleEmailSection = false;

    this.openEmailModalEmitter.emit(false);
  }

  handleClick(e: Event) {
    this.email.body = e.target['innerHTML'];
  }

  handleKeyPress(e: Event) {
    const textarea = document.getElementById('bodyPreview');
    const cursorPos = textarea['selectionStart'];
    const cursorEnd = textarea['selectionEnd'];
    console.log(cursorPos, cursorEnd);
  }

  setSuggestionPosition() {
    // Placeholder logic for positioning the suggestion, update according to your layout
    this.suggestionPosition = { top: 50, left: 100 };
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

  trackCaretRowAndColumn(e: Event) {
    //this.inlineSuggestion = '';
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null; // No selection
    }

    const range = selection.getRangeAt(0);
    const caretRect = range.getBoundingClientRect();

    const container = document.querySelector('.container');
    const offsetWidth = (window.outerWidth - container.clientWidth) / 2 + 12;
    console.log(offsetWidth);

    // Get the bounding rectangle of the content-editable element
    const contentEditable = document.querySelector('.rich-text-area');
    console.log(contentEditable.clientWidth);
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

  openEmojiPicker() {
    this.emojiPickerVisible = !this.emojiPickerVisible;

    if (this.emojiPickerVisible) {
      const button = document.querySelector('-action') as HTMLElement;
      const buttonRect = button.getBoundingClientRect();

      this.popupPosition = {
        top: buttonRect.bottom + 'px', // Position below the button
        left: buttonRect.left + 'px' // Align with the left edge of the button
      };
    }
  }

  onEmojiSelect(emoji: string) {
    this.selectedEmoji = emoji;
    this.emojiPickerVisible = false; // Close emoji picker after selecting
    this.selectedEmoji = '';
    this.insertEmojiIntoBody(emoji); // Optionally, insert emoji into the text area
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

  handleEmailAddressEntries(e: Event, type = 'to') {
    e.preventDefault();
    console.log(e);
    if (e['keyCode'] == 59) {
      const recp = this.email.to;
      this.emailRecp.to.push({ id: this.emailRecp.to.length, recp: recp.replace(";", "") });
      this.email.to = '';
      console.log(this.emailRecp.to);
    }
  }

  handleEmailStack(event, type = 'to') {
    if (event.target.tagName === "I") {
      this.emailRecp[type] = this.emailRecp[type].filter((email) => email.id !== Number(event.target.id));
      this.emailRecp[type].forEach((_, ind) => {
        this.emailRecp[type].id = ind;
      })
    }
  }

  reply() {
    console.log("reply")
  }
}
