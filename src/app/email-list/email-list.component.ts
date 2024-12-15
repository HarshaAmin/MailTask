import { NgClass } from '@angular/common';
import {
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

interface Email {
  subject: string;
  sender: string;
  receivedDateTime: string;
  bodyPreview: string;
  status: string;
  id: string;
  isRead: string;
  isFlagged: string;
  isPinged: string;
}
@Component({
  selector: 'app-email-list',
  standalone: true,
  imports: [NgClass],
  templateUrl: './email-list.component.html'
})
export class EmailListComponent implements OnInit, OnChanges {
  pages: number = 0;
  emailsToShow: Email[] = [];
  pageIndex: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;
  emailQty: number = 5;
  @Output() selectedEmail = new EventEmitter<Email>();

  @Input() emails: Email[] = [];
  @Input() filteredEmails: Email[] = [];
  @Input() accessToken: string;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    console.log(this.filteredEmails.length);
    this.generateNoOfPages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('fsdsdfdsfdsfdsf');
    if (changes['filteredEmails']) {
      this.generateNoOfPages();
    }
  }

  generateNoOfPages() {
    this.pages = Math.ceil(this.filteredEmails.length / this.emailQty);

    this.startIndex = this.pageIndex * this.emailQty;
    this.endIndex = this.startIndex + this.emailQty;

    this.emailsToShow = this.filteredEmails.slice(
      this.startIndex,
      this.endIndex
    );
    console.log(this.pageIndex, this.pages, this.pageIndex >= this.pages);
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

  changeStatus(email: any): void {
    email.status = email.status === 'unread' ? 'read' : 'unread';
    this.updateEmails(email, email.status);
  }

  updateEmails(email: any, action: string): void {
    const endpoint = `${environment.salesforce.salesforceApiBaseUrl}/OutlookEmailService/updateEmails/`;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    });

    const userId = 'Send.Tech@novigo-solutions.com';

    this.http
      .get(`${endpoint}?messageId=${email.id}&action=${action}`, { headers })
      .subscribe(
        (data: any) => {
          console.log('Emails updated successfully:', data);
        },
        (error) => {
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
    return `${String(dT.getDate()).padStart(2, '0')}-${String(dT.getMonth()).padStart(2, '0')}-${dT.getFullYear()} | ${time}:${String(dT.getMinutes()).padStart(2, '0')} ${dT.getHours() > 12 ? 'PM' : 'AM'}`;
  }

  selectedEmailClick(email: Email) {
    this.selectedEmail.emit(email);
  }
}
