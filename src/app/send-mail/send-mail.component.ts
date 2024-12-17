import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import $ from 'jquery';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [FormsModule, FileUploadComponent],
  templateUrl: './send-mail.component.html'
})
export class SendMailComponent implements AfterViewInit {
  email = { to: '', subject: '', bodyPreview: '' };
  @Output() openEmailModalEmitter = new EventEmitter<boolean>(true);

  @Input() openSendEmailModal: boolean = false;

  constructor() {
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngAfterViewInit(): void {
    const childNodes = (<HTMLScriptElement[]>(
      (<any>document.querySelector('.mail-body-textArea'))
    ))?.['childNodes'];

    let count = 0;

    const setWidth = setInterval(() => {
      if (childNodes[3]) {
        childNodes[1].setStyle({ width: '100%' });
        childNodes[2].setStyle({ width: '100%' });
        childNodes[2].childNodes[0].setStyle({
          width: '100%',
          outline: 'unset',
          fontSize: '1rem'
        });
        clearInterval(setWidth);
        childNodes[2].childNodes[0].addEventListener(
          'keyup',
          () => (this.email.bodyPreview = childNodes[2].childNodes[0].innerHTML)
        );
      }
      count++;
      if (count > 5) clearInterval(setWidth);
    }, 1000);
  }

  sendEmail(): void {
    const { to, subject, bodyPreview } = this.email;
    console.log('Sending email:', { to, subject, bodyPreview });
    this.closeComposeModal(); // Close modal after sending
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
    this.openEmailModalEmitter.emit(false);
  }

  handleClick() {
    var curPos = $('#to').prop('selectionStart');
    let x = $('#to').val();
    let text_to_insert = 'sanath';
    // console.log(x.slice(0, curPos), x.slice(curPos), curPos, x.val());
    $('#to').val(x.slice(0, curPos) + text_to_insert + x.slice(curPos));
  }
}
