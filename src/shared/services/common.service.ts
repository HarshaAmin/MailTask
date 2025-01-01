import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  isNative: boolean = false;
  isMobile: boolean = false;
  openEmailModal: boolean = false;
  toggleEmailSection: boolean = false;
  activeSpinner: boolean = false;
  type: string = 'send';

  loadEmail = new Subject;

  constructor() { }




}
