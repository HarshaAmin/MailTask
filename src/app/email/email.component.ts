import { Component, Input } from '@angular/core';
import { SalesforceService } from '../../shared/services/salesforce.service';

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [],
  templateUrl: './email.component.html'
})
export class EmailComponent {
  uEmail = 'SendTech@novigosolutions.com';
  receipientsList: string = 'sanathshetty986@gmail.com';

  constructor(private salesforceService: SalesforceService) {

  }

  @Input() selectedEmail: any;


  forwardEmail(emailData = this.selectedEmail): void {
    // const token = localStorage.getItem('accessToken');
    // if (token) {
    //   this.accessToken = token;
    // } else {
    //   this.generateAccessToken();
    // }
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
    // this.isComposeMode = false; // Return to email list
  }
}
