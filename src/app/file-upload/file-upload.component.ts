import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import {
  NgxFileDropEntry,
  FileSystemFileEntry,
  FileSystemDirectoryEntry,
  NgxFileDropModule
} from 'ngx-file-drop';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [NgxFileDropModule, NgFor],
  templateUrl: './file-upload.component.html'
})
export class FileUploadComponent {
  public files = [];

  constructor() {}

  public dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        const reader = new FileReader();
        fileEntry.file((_file: File) => {
          // reader.readAsDataURL(file);
          // reader.onload = () => {
          //   console.log(reader.result);
          // };
        });
      } else {
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }

  fileOver(event) {
    console.log(event);
  }

  fileLeave(event) {
    console.log(event);
  }

  uploadFile() {
    document.querySelector('#actual-upload-btn')['click']();
  }
}
