import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CommonService } from '../assets/services/common.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  constructor(private commonService: CommonService) {
    window.addEventListener('resize', this.detectResize.bind(this));
  }

  detectResize(_event: Event) {
    this.commonService.isNative = window.innerWidth <= 870 ? true : false;
  }

  ngOnDestroy(): void {}
}
