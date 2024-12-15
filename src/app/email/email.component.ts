import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-email',
  standalone: true,
  imports: [],
  templateUrl: './email.component.html'
})
export class EmailComponent {
  uEmail = 'SendTech@novigosolutions.com';

  @Input() selectedEmail: any;
}
