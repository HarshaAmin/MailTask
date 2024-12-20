import { Component, EventEmitter, Output } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [],
  templateUrl: './side-menu.component.html'
})
export class SideMenuComponent {
  accessToken = localStorage.getItem('accessToken');

  @Output() loadEmailEmit = new EventEmitter<string>();

  constructor(
    public commonService: CommonService,
    private http: HttpClient
  ) {}

  openEmailModal() {
    this.commonService.openEmailModal = true;
  }

  loadInbox(): void {
    this.loadEmailEmit.emit('Inbox');
  }

  loadSent(): void {
    this.loadEmailEmit.emit('SentItems');
  }

  loadDraft(): void {
    this.loadEmailEmit.emit('Drafts');
  }

  loadTrash(): void {
    this.loadEmailEmit.emit('DeletedItems');
  }
}
