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
  activeMenuItem: string = 'Inbox'; 
  constructor(public commonService: CommonService) {}

  setActiveMenu(item: string): void {
    this.activeMenuItem = item;
    this.commonService.loadEmail.next(item);
  }

  openEmailModal(): void {
    this.commonService.openEmailModal = true;
  }
}
