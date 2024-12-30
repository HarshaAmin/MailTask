import { Component } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [],
  templateUrl: './side-menu.component.html'
})
export class SideMenuComponent {
  accessToken = localStorage.getItem('accessToken');

  constructor(
    public commonService: CommonService
  ) { }

  openEmailModal() {
    this.commonService.openEmailModal = true;
  }

  loadInbox(): void {
    this.commonService.loadEmail.next('Inbox');
  }

  loadSent(): void {
    this.commonService.loadEmail.next('SentItems');
  }

  loadDraft(): void {
    this.commonService.loadEmail.next('Drafts');
  }

  loadTrash(): void {
    this.commonService.loadEmail.next('DeletedItems');
  }
}
