import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import $ from 'jquery';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { CommonService } from '../../shared/services/common.service';
import { NgIf } from '@angular/common';
import { EmojiService } from '../../shared/services/emoji.service';

@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [FormsModule, FileUploadComponent, NgIf],
  templateUrl: './send-mail.component.html'
})
export class SendMailComponent implements OnInit {
  email = { to: '', subject: '', body: '' };
  inlineSuggestion: string | null = null;
  files: NgxFileDropEntry[] = [];
  suggestions: string[] = [];
  currentHighScoreSuggestion: string = '';
  cursorPosition: number = 0;
  suggestionPosition: { top: number; left: number } | null = null;
  caretPosition: any;
  emojiPickerVisible = false;
  selectedEmoji: string = '';
  popupPosition: any = {};

  @Output() openEmailModalEmitter = new EventEmitter<boolean>(true);
  @Input() openSendEmailModal: boolean = false;

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

  sendEmail(): void {
    this.salesforceService
      .sendEmail({
        ...this.email,
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
        top: rect.bottom + window.scrollY, // 5px offset for regular input
        left: rect.left + window.scrollX
      };
      console.log(this.suggestionPosition);
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
}
