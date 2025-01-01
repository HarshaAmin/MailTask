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
  receipientsList: string = 'sanathshetty986@gmail.com';

  @Input() selectedEmail: any;
  @Output() replyEmit = new EventEmitter<string>();

  constructor(private salesforceService: SalesforceService, public commonService: CommonService) {

  }

  forwardEmail(emailData = this.selectedEmail): void {
    this.salesforceService
      .forwardEmail(emailData.Id, this.receipientsList)
      .subscribe(
        (response) => {
          console.log(
            'Email forward successfully! ' + JSON.stringify(response)
          );
          console.log('Email forward successfully! ' + response);
        },
        (error) => {
          console.error('Error:', JSON.stringify(error));
        }
      );
  }

  reply() {
    this.commonService.openEmailModal = true;
    this.replyEmit.emit('reply');
  }
}
