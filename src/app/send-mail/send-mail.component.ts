import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import $ from 'jquery';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [FormsModule, FileUploadComponent],
  templateUrl: './send-mail.component.html'
})
export class SendMailComponent {
  email = { to: '', subject: '', body: '' };
  inlineSuggestion: string | null = null;
  files: NgxFileDropEntry[] = [];
  suggestions: string[] = [];
  currentHighScoreSuggestion: string = '';
  cursorPosition: number = 0;
  suggestionPosition: { top: number; left: number } | null = null;

  @Output() openEmailModalEmitter = new EventEmitter<boolean>(true);
  @Input() openSendEmailModal: boolean = false;

  constructor(
    private salesforceService: SalesforceService,
    private commonService: CommonService
  ) {
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
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
}
