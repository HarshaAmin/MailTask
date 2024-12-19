import { Component } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [],
  templateUrl: './side-menu.component.html'
})
export class SideMenuComponent {
  constructor(public commonService: CommonService) {}

  openEmailModal() {
    this.commonService.openEmailModal = true;
  }
}
