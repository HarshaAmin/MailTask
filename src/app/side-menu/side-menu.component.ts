import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [],
  templateUrl: './side-menu.component.html'
})
export class SideMenuComponent {
  @Output() openEmailModalEmitter = new EventEmitter<boolean>(false);

  constructor() {}

  openEmailModal() {
    this.openEmailModalEmitter.emit(true);
  }
}
