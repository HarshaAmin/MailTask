import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CommonService } from '../shared/services/common.service';
import { NavComponent } from './nav/nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(private commonService: CommonService) {
    window.addEventListener('resize', this.detectResize.bind(this));
  }

  ngOnInit(): void {
    this.detectResize();
  }

  detectResize(_event?: Event) {
    this.commonService.isNative = window.innerWidth <= 650 ? true : false;
    this.commonService.isMobile = window.innerWidth <= 450 ? true : false;
  }

  ngOnDestroy(): void {}
}
