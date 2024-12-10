import { Component } from '@angular/core';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { CommonService } from '../../assets/services/common.service';
import { NgComponentOutlet } from '@angular/common';
import { EmailListComponent } from '../email-list/email-list.component';
import { EmailComponent } from '../email/email.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SideMenuComponent, EmailListComponent, EmailComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  constructor(public commonService: CommonService) {}
}
