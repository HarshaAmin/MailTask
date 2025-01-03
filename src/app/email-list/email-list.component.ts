import { NgClass } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { CommonService } from '../../shared/services/common.service';

interface Email {
  subject: string;
  sender: string;
  receivedDateTime: string;
  bodyPreview: string;
  status: string;
  Id: string;
  isRead: string;
  isFlagged: string;
  isPinged: string;
  emailType: string;
}
@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [NgClass],
  templateUrl: './email-list.component.html'
})
export class EmailListComponent implements OnInit, OnChanges {
  pages: number = 0;
  emailsToShow: Email[] = null;
  pageIndex: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;
  emailQty: number = 5;


  @Input() emails: Email[] = [];
  @Input() filteredEmails: Email[] = [];
  @Input() accessToken: string;
  @Input() currentTypeSelection: string;

  @Output() generateToken = new EventEmitter<any>();
  @Output() selectedEmail = new EventEmitter<Email>();
  @Output() updateEmailList = new EventEmitter<void>();

  constructor(
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    public salesforceService: SalesforceService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.generateNoOfPages();
  }

  //   // Function to call Hugging Face API and classify the email content
  // async function categorizeEmail(text) {
  //   try {
  //     const response = await fetch('https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${accessToken}`
  //       },
  //       body: JSON.stringify({ text })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to fetch sentiment analysis');
  //     }

  //     const sentimentData = await response.json();
  //     return sentimentData; // Return the classification result
  //   } catch (error) {
  //     console.error('Error fetching analysis:', error.message);
  //   }
  // }

  // Function to classify based on content using simple heuristics

  // Function to process all emails and categorize them

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filteredEmails']) {
      this.generateNoOfPages();
    }
  }

  generateNoOfPages() {
    this.pageIndex = 0;
    this.pages = Math.ceil(this.filteredEmails.length / this.emailQty);

    this.startIndex = this.pageIndex * this.emailQty;
    this.endIndex = this.startIndex + this.emailQty;

    this.emailsToShow = this.filteredEmails.slice(
      this.startIndex,
      this.endIndex
    );
  }

  renderEmails(action: string) {
    if (action === 'next') {
      if (this.pageIndex === this.pages - 1) return;
      this.pageIndex += 1;

      this.startIndex = this.pageIndex * this.emailQty;
      this.endIndex = this.startIndex + this.emailQty;
      this.endIndex = this.filteredEmails[this.endIndex]
        ? this.endIndex
        : this.filteredEmails.length;
      this.emailsToShow = this.filteredEmails.slice(
        this.startIndex,
        this.endIndex + 1
      );
    }
    if (action === 'previous') {
      if (this.pageIndex === 0) return;
      this.pageIndex -= 1;

      this.startIndex = this.pageIndex * this.emailQty;
      this.endIndex = this.startIndex + this.emailQty;

      this.emailsToShow = this.filteredEmails.slice(
        this.startIndex,
        this.endIndex
      );
    }
  }

  changeStatus(email: any, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    email.status = email.status === 'unread' ? 'read' : 'unread';
    this.updateEmail(email.Id, email.status);
  }

  toggleFlag(email: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    email.flagStatus === 'flagged' ? 'notFlagged' : 'flagged';
    email.isFlagged = email.flagStatus === 'flagged' ? true : false;
    console.log(email);
    // navigator.clipboard.readText().then((clipText) => {
    //   document.querySelector('#bodyPreview')['value'] += 'xcvcvxcvxcvxcv';
    // });

    // const textarea = document.getElementById('bodyPreview');
    // const cursorPos = textarea['selectionStart'];
    // const cursorEnd = textarea['selectionEnd'];
    // console.log(cursorPos, cursorEnd);
    this.updateEmail(email.Id, email.flagStatus);
  }

  togglePin(email: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    email.flagStatus === 'flagged' ? 'notFlagged' : 'flagged';
    email.isFlagged = email.flagStatus === 'flagged' ? true : false;
    console.log(email);
    // navigator.clipboard.readText().then((clipText) => {
    //   document.querySelector('#bodyPreview')['value'] += 'xcvcvxcvxcvxcv';
    // });

    // const textarea = document.getElementById('bodyPreview');
    // const cursorPos = textarea['selectionStart'];
    // const cursorEnd = textarea['selectionEnd'];
    // console.log(cursorPos, cursorEnd);
    this.updateEmail(email.Id, email.flagStatus);
  }

  updateEmail(emailId: any, action: string): void {
    const endpoint = `${environment.salesforce.salesforceApiBaseUrl}/OutlookEmailService/*`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

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

  showDateTime(dateTime: any) {
    const dT = new Date(dateTime);
    const time =
      dT.getHours() > 12
        ? String(Math.abs(dT.getHours() - 12)).padStart(2, '0')
        : String(Math.abs(dT.getHours())).padStart(2, '0');
    return `${String(dT.getDate()).padStart(2, '0')}-${String(dT.getMonth() + 1).padStart(2, '0')}-${dT.getFullYear()} | ${time}:${String(dT.getMinutes()).padStart(2, '0')} ${dT.getHours() > 12 ? 'PM' : 'AM'}`;
  }

  selectedEmailClick(email: Email) {
    if (email.status === 'unread') {
      this.updateEmail(email.Id, "read");
      email.status = 'read';
    }
    this.selectedEmail.emit(email);
  }

  deleteEmail(emailData: any, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      this.accessToken = token;
    } else {
      this.generateToken.emit();
    }
    const url = `https://novigosolutionspvtltd2-dev-ed.develop.my.salesforce-sites.com/services/apexrest/OutlookEmailService/deleteEmail/${emailData.Id}`;

    this.salesforceService.deleteEmail({ emailId: emailData.Id }).subscribe(
      (response) => {
        this.updateEmailList.emit();
      },
      (error) => {
        console.error('Error:', JSON.stringify(error));
      }
    );
  }
}
