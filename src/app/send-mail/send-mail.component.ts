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
  email = { to: '', subject: '', body: '', cc: '', bcc: '' };
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
  suggestionText: string = '';
  correctedText: any = {};
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
    elementIdx: number;
    cursorPos: number;
  } = {
      elementIdx: 0,
      cursorPos: 0
    };
  target: string;
  ccBcc = { cc: false, bcc: false };
  handler;

  @Output() openEmailModalEmitter = new EventEmitter<boolean>(true);
  @Output() triggerSubmitRes = new EventEmitter<string>();
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
      this.email = { to: '', subject: '', body: '', cc: '', bcc: '' };
      this.emailRecp = { to: [], cc: [], bcc: [] };
    }
  }

  reply() {
    const senderEmails = this.selectedEmail.sender
      .split(';')
      .map((email) => email.trim());
    const reSubject = 'Re: ' + this.selectedEmail.subject;
    const contentType = 'html';
    const content = this.email.body;

    const toRecipients = this.selectedEmail.sender
      .split(';')
      .map((email) => email.trim());
    const emailId = this.selectedEmail.Id;
    this.salesforceService
      .replyEmail({
        to: this.emailRecp['to'].map((e) => e.recp).join(';'),
        cc: this.emailRecp['cc'].map((e) => e.recp).join(';'),
        bcc: this.emailRecp['bcc'].map((e) => e.recp).join(';'),
        subject: 'Re: ' + this.selectedEmail.subject,
        body: this.email.body,
        reSubject: reSubject || '',
        contentType: contentType || '',
        content: content || '',
        selectedEmailId: emailId || '',
        conversationId: this.selectedEmail.conversationId
      })
      .subscribe(
        (response) => {
          this.triggerSubmitRes.emit(this.type);
        },
        (error) => {
          console.error('Error:', JSON.stringify(error));
        }
      );
  }

  replyAll() {
    const senderEmails = this.selectedEmail.sender
      .split(';')
      .map((email) => email.trim());
    const reSubject = 'Re: ' + this.selectedEmail.subject;
    const contentType = 'html';
    const content = this.email.body;

    const toRecipients = this.selectedEmail.sender
      .split(';')
      .map((email) => email.trim());
    const emailId = this.selectedEmail.Id;
    this.salesforceService
      .replyEmail({
        to: [...this.emailRecp['to'], ...this.emailRecp['cc'], ...this.emailRecp['bcc']].map((e) => e.recp).join(';'),
        cc: this.emailRecp['cc'].map((e) => e.recp).join(';'),
        bcc: this.emailRecp['bcc'].map((e) => e.recp).join(';'),
        subject: 'Re: ' + this.selectedEmail.subject,
        body: this.email.body,
        reSubject: reSubject || '',
        contentType: contentType || '',
        content: content || '',
        selectedEmailId: emailId || '',
        conversationId: this.selectedEmail.conversationId
      })
      .subscribe(
        (response) => {
          this.triggerSubmitRes.emit(this.type);
        },
        (error) => {
          console.error('Error:', JSON.stringify(error));
        }
      );
  }

  analyzeText(text: string) {
    clearTimeout(this.handler);
    this.handler = setTimeout(async () => {
      try {
        this.suggestionText = '';
        // return;
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
        // Use setTimeout to delay the update of suggestionText
        this.suggestionText =
          formattedSuggestions.length > 0
            ? ' ' + formattedSuggestions[0].token_str + ' '
            : '';
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error fetching analysis:', error.message); // Safely accessing `message`
          //this.errorMessage = `Analysis failed: ${error.message}`;
        } else {
          console.error('Unknown error:', error); // In case it's not an instance of Error
          //this.errorMessage = `Analysis failed: An unknown error occurred.`;
        }
      }
    }, 2000);

  }
  sanitizeInput(input: string): string {
    console.log('sanitized input ' + input);
    // Clean up the input string by removing unnecessary spaces around tags
    const cleanedInput = input
      .replace(/\s*<\s*/g, '<')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s+/g, ' ');

    // Now pass the cleaned input to the DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedInput, 'text/html');

    const traverseNode = (node: ChildNode): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;

        if (element.tagName === 'BR') {
          return '\n';
        } else if (element.tagName === 'DIV') {
          const content = traverseChildren(element);
          return content.trim() ? `${content}\n` : '\n';
        } else if (element.tagName === 'B' || element.tagName === 'STRONG') {
          return ` <b>${traverseChildren(element)}</b> `;
        } else if (element.tagName === 'I' || element.tagName === 'EM') {
          return ` <i>${traverseChildren(element)}</i> `;
        } else if (element.tagName === 'U') {
          return ` <u>${traverseChildren(element)}</u> `;
        } else if (element.tagName === 'S' || element.tagName === 'STRIKE') {
          return ` <s>${traverseChildren(element)}</s> `;
        } else if (element.tagName === 'SPAN') {
          return ` <span>${traverseChildren(element)}</span> `;
        } else {
          return traverseChildren(element);
        }
      }
      return '';
    };

    const traverseChildren = (node: HTMLElement): string => {
      return Array.from(node.childNodes).map(traverseNode).join('');
    };

    let sanitizedText = traverseChildren(doc.body).trim();
    return sanitizedText;
  }

  getFormattedInput(input: string): string {
    const tempText = input;
    console.log('tempText ' + tempText);
    const formattedHTML = tempText
      .split(',') // Split the input by line breaks
      .map((line, index, arr) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
          return '<p class="emailBodyChild"><br></p>'; // If the line is empty, return a <br>
        }
        // Apply "elmInFocus" class to the last line
        const isLastLine = index === arr.length - 1;
        return `<p class="emailBodyChild${isLastLine ? ' elmInFocus' : ''}">${trimmedLine}</p>`;
      })
      .join(''); // Join all parts into one string
    console.log('formattedHTML tempText ' + formattedHTML);
    console.log(formattedHTML);
    return formattedHTML;
  }
  correctGrammar(event): void {
    this.email.body = event.target['innerHTML'];
    console.log(event.target['innerHTML']);
    const el = document.querySelector('.ql-editor ').innerHTML;
    const sanitizedText = this.sanitizeInput(el.trim());
    // const sanitizedText = 'i wan to tst these grmmr funtion';
    if (sanitizedText.length > 0) {
      this.salesforceService.correctGrammar(sanitizedText).subscribe({
        next: (response) => {
          this.correctedText = response;
          const tempText = this.correctedText;
          console.log('this.correctedText ' + this.correctedText);
          // const formattedHTML = tempText
          //   .map((line) => (line.trim() === '' ? '<br>' : `<p>${line}</p>`))
          //   .join('');
          //console.log('formattedHTML ' + this.getFormattedInput());
          //target.innerHTML = formattedHTML;
          document.querySelector('.ql-editor ').innerHTML =
            this.getFormattedInput(this.correctedText);
          //this.errorMessage = '';
        },
        error: (err) => {
          console.error('Error during grammar correction:', err);
          //this.errorMessage = 'Failed to correct grammar. Please try again.';
        }
      });
    }
  }

  calcCursorPos(event) {
    console.log(event, 'fdgdf');
    let isFocusElSet = false;
    if (event.keyCode == 9) return;

    this.email.body = event.target['innerHTML'];
    console.log(event.target['innerHTML']);
    const sanitizedText = this.sanitizeInput(event.target['innerHTML'].trim());
    if (sanitizedText.length > 0) {
      this.analyzeText(sanitizedText);
    }
    //this.analyzeText(event.target['innerHTML'].trim());
    let el = document.querySelector('.ql-editor');
    let selection = window.getSelection();
    el.childNodes.forEach((node) => {
      node['classList'].remove('elmInFocus');
      node['classList'].add(`emailBodyChild`);
    });
    console.log(el.childNodes, 'CHILD NODES');
    console.log(selection.getRangeAt(0), 'selection');
    selection.focusNode.parentElement.classList.add('elmInFocus');
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i]['classList'].contains('elmInFocus')) {
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
    if (this.type !== 'forward') {
      this.quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [
              'bold',
              'italic',
              'underline',
              { header: '1' },
              { header: '2' },
              'link',
              'blockquote'
            ]
          ]
        }
      });
    }

    document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));
    document.addEventListener('click', this.handleGlobalClick.bind(this));

    if (this.type === 'reply') {
      this.emailRecp.to = (this.selectedEmail.sender.split(';') || []).map((recp, ind) => ({
        id: ind,
        recp
      }));
    }

    if (this.type === 'replyAll') {
      console.log(this.selectedEmail)
      this.emailRecp.to = [
        ...(this.selectedEmail.sender.split(';') || []),
        ...(this.selectedEmail?.ccRecipientsEmails?.split(';') || []),
        ...(this.selectedEmail?.bccRecipientsEmails?.split(';') || [])
      ].map((recp, ind) => ({
        id: ind,
        recp
      }));
    }

    if (this.type === 'forward') {
      console.log(this.selectedEmail);
      this.email.body = this.selectedEmail.body;
      this.email.subject = `Fw: ${this.selectedEmail.subject}`;
    }

    if (this.type === 'send') {

    }
  }

  handleGlobalClick(event) {
    if (event.target['parentElement']?.classList.contains('ql-editor')) {
      this.calcCursorPos(event);
    }
  }

  handleGlobalKeyDown(event) {
    if (
      event.keyCode == 9 ||
      (event.keyCode == 13 && this.commonService.isNative)
    ) {
      event.preventDefault();
      const str = this.suggestionText;

      const target = document.createTextNode('\u0001');
      let setpos = document.createRange();
      let el = document.querySelector('.ql-editor');
      let selection = window.getSelection();
      if (selection.focusNode.parentNode['offsetParent'].id !== 'editor')
        return;
      const offset = selection.focusOffset;
      selection.getRangeAt(0).insertNode(target);
      target.replaceWith(str);
      selection.focusNode['innerHTML'] = selection.focusNode[
        'innerHTML'
      ].replaceAll('\t', '');

      el.childNodes.forEach((node) => {
        node['classList'].remove('elmInFocus');
        node['classList'].add(`emailBodyChild`);
      });

      selection.focusNode['classList'].add('elmInFocus');
      for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i]['classList'].contains('elmInFocus')) {
          this.emailBodyCords.elementIdx = i;
          this.emailBodyCords.cursorPos = offset + str.length - 1;
        }
      }
      setpos.setStart(
        el.childNodes[this.emailBodyCords.elementIdx].childNodes[0],
        this.emailBodyCords.cursorPos
      );
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
  sendEmail(): void {
    this.salesforceService
      .sendEmail({
        to: this.emailRecp['to'].map((e) => e.recp).join(';'),
        cc: this.emailRecp['cc'].map((e) => e.recp).join(';'),
        bcc: this.emailRecp['bcc'].map((e) => e.recp).join(';'),
        subject: this.email.subject,
        body: this.email.body,
        fileName: this.files?.[0]?.['fileName'] || '',
        fileType: this.files?.[0]?.['fileType'] || '',
        base64Content: this.files?.[0]?.['base64Content'] || ''
      })
      .subscribe(
        (response) => {
          if (response.status === 'Accepted') {
            this.clearFields();
          }
          this.triggerSubmitRes.emit(this.type);
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
    if (
      e.target['value'].includes(';') &&
      this.validateEmail(this.email[type].replace(';', ''))
    ) {
      const recp = this.email[type];
      this.emailRecp[type].push({
        id: this.emailRecp[type].length,
        recp: recp.replace(';', '')
      });
      this.email[type] = '';
      console.log(this.emailRecp[type]);
    } else {
      this.email[type] = this.email[type].replaceAll(';', '');
    }
  }

  handleEmailStack(event, type = 'to') {
    if (event.target.tagName === 'I') {
      this.emailRecp[type] = this.emailRecp[type].filter(
        (email) => email.id !== Number(event.target.id)
      );
      this.emailRecp[type].forEach((_, ind) => {
        this.emailRecp[type].id = ind;
      });
    }
  }

  forward() {
    this.salesforceService
      .forwardEmail({
        emailId: this.selectedEmail.Id,
        toRecipients: this.emailRecp['to'].map((e) => e.recp).join(';'),
        cc: this.emailRecp['cc'].map((e) => e.recp).join(';'),
        bcc: this.emailRecp['bcc'].map((e) => e.recp).join(';'),
        emailSubject: this.email.subject,
        conversationId: this.selectedEmail.conversationId
      })
      .subscribe(
        (response) => {
          this.triggerSubmitRes.emit(this.type);
        },
        (error) => {
          console.error('Error:', JSON.stringify(error));
        }
      );
  }

  handleSubmit() {
    if (this.type === 'send') {
      this.sendEmail();
    } else if (this.type === 'reply') {
      this.reply();
    } else if (this.type === 'replyAll') {
      this.replyAll();
    } else if (this.type === 'forward') {
      this.forward();
    }
  }

  validateEmail(email: string) {
    const filter = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return filter.test(email.trim());
  }

  handleCcBccClick(e: Event) {
    console.log(e, "sdsds")
    if (e.target['attributes'].action.value === 'cc') {
      this.ccBcc.cc = true;
    }
    if (e.target['attributes'].action.value === 'bcc') {
      this.ccBcc.bcc = true;
    }
  }

  clearFields() {
    this.email = { to: '', subject: '', body: '', cc: '', bcc: '' };
    this.emailRecp = { to: [], cc: [], bcc: [] };
    document.querySelector(".ql-editor").innerHTML = "";
  }
}
