import { Component } from '@angular/core';
import { CommonService } from '../../shared/services/common.service';
import { NgClass } from '@angular/common';
import { SideMenuComponent } from '../side-menu/side-menu.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [NgClass, SideMenuComponent],
  templateUrl: './nav.component.html'
})
export class NavComponent {
  showDropdown = false;
  openEmailModal: boolean = false;

  constructor(public commonService: CommonService) { }
}
