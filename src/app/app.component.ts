import { Component, OnDestroy } from '@angular/core';
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
export class AppComponent implements OnDestroy {
  constructor(private commonService: CommonService) {
    window.addEventListener('resize', this.detectResize.bind(this));
  }

  detectResize(_event: Event) {
    this.commonService.isNative = window.innerWidth <= 870 ? true : false;
  }

  ngOnDestroy(): void { }
}
