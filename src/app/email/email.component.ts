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

  replyEmail(emailData = this.selectedEmail): void {
    // Extract the sender's email addresses from selected email data (handling multiple emails separated by a semicolon)
    const senderEmails = emailData.sender
      .split(';')
      .map((email) => email.trim());

    // Prepare the reply email object
    const replyEmail = {
      message: {
        subject: 'Re: ' + emailData.subject, // Prefix with 'Re: ' for reply
        body: {
          contentType: 'html',
          content: 'Your reply message here...' // You can customize this with your actual reply message
        },
        toRecipients: senderEmails.map((email) => ({
          emailAddress: {
            address: email // Add each sender's email to the 'toRecipients' field
          }
        })),
        ccRecipients: [
          {
            emailAddress: {
              address: 'harsha7409@example.com' // Optionally add CC recipients
            }
          }
        ],
        inReplyTo: {
          id: emailData.Id // Use the original email's ID for "In-Reply-To" header
        }
      }
    };

    // Call the service method to send the reply
    this.salesforceService.replyEmail(emailData.Id, replyEmail).subscribe(
      (response) => {
        console.log(
          'Email reply sent successfully! ' + JSON.stringify(response)
        );
      },
      (error) => {
        console.error('Error:', JSON.stringify(error));
      }
    );

    // Optionally, set this.isComposeMode = false to return to the email list
  }
}
