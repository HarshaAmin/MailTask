import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [],
  templateUrl: './email.component.html'
})
export class EmailComponent implements OnInit {
  uEmail = 'SendTech@novigosolutions.com';
  summarizedText: string = '';
  showSummarizedModal: boolean = false;
  linkedEmail = null;
  showLinkedEmail = false;

  @Input() mailType: string = "Inbox";
  @Input() emails: any;
  @Input() selectedEmail: any;
  @Input() hideActions: boolean = false;
  @Output() replyEmit = new EventEmitter<string>();

  constructor(
    private salesforceService: SalesforceService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    if (this.mailType === 'SentItems') {
      // this.selectedEmail.conversationId;
    }
  }

  forwardEmail(emailData = this.selectedEmail): void {
    this.commonService.openEmailModal = true;
    this.replyEmit.emit('forward');
  }

  reply() {
    this.commonService.openEmailModal = true;
    this.replyEmit.emit('reply');
  }

  replyAll() {
    this.commonService.openEmailModal = true;
    this.replyEmit.emit('replyAll');
  }

  summarize(): void {
    const body = this.selectedEmail.body;
    const sanitizedText = this.sanitizeInput(body.trim());

    if (sanitizedText.length > 0) {
      this.salesforceService
        .summarizetGrammar(sanitizedText.length > 600 ? sanitizedText.substring(0, 600) : sanitizedText)
        .subscribe({
          next: (response) => {
            this.summarizedText = JSON.stringify(response);
            this.showSummarizedModal = true;
          },
          error: (err) => {
            console.error('Error during grammar correction:', err);
          }
        });
    }
  }

  sanitizeInput(input: string): string {
    console.log('sanitized input ' + input);

    const cleanedInput = input
      .replace(/\s*<\s*/g, '<')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s+/g, ' ');

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

  buildString(node) {
    return (this.selectedEmail[node] || []).join(";");
  }
}
