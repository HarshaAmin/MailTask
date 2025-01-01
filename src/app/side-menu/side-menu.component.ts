import { Component, EventEmitter, Output } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [],
  templateUrl: './side-menu.component.html'
})
export class SideMenuComponent {
  accessToken = localStorage.getItem('accessToken');
  activeMenuItem: string = 'Inbox';

  @Output() closeMenu = new EventEmitter<boolean>();
  constructor(public commonService: CommonService) { }

  setActiveMenu(item: string): void {
    this.activeMenuItem = item;
    this.commonService.loadEmail.next(item);
    this.closeMenu.emit(false);
  }

  openEmailModal(): void {
    this.commonService.openEmailModal = true;
    this.commonService.type = 'send';
  }
}
