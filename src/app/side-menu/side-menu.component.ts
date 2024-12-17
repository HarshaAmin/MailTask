import { Component, EventEmitter, Output } from '@angular/core';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [FileUploadComponent],
  templateUrl: './side-menu.component.html'
})
export class SideMenuComponent {
  @Output() openEmailModalEmitter = new EventEmitter<boolean>(false);

  constructor() {}

  openEmailModal() {
    this.openEmailModalEmitter.emit(true);
  }
}
