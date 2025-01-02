import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SalesforceService } from '../../shared/services/salesforce.service';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [],
  templateUrl: './email.component.html'
})
export class EmailComponent {
  uEmail = 'SendTech@novigosolutions.com';

  @Input() selectedEmail: any;
  @Output() replyEmit = new EventEmitter<string>();

  constructor(
    private salesforceService: SalesforceService,
    public commonService: CommonService
  ) {}

  forwardEmail(emailData = this.selectedEmail): void {
    this.commonService.openEmailModal = true;
    this.replyEmit.emit('forward');
  }

  reply() {
    this.commonService.openEmailModal = true;
    this.replyEmit.emit('reply');
  }
}
