import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  isNative: boolean = false;

  constructor() {}
}
