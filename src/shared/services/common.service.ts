import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  isNative: boolean = false;
  isMobile: boolean = false;
  openEmailModal: boolean = false;
  toggleEmailSection: boolean = false;

  constructor() {}
}
