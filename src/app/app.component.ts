import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CommonService } from '../shared/services/common.service';
import { NavComponent } from './nav/nav.component';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(private commonService: CommonService, public authService: AuthService) {
    window.addEventListener('resize', this.detectResize.bind(this));
    window.addEventListener('click', this.handleGlobalClick.bind(this));
    this.handleReload();
  }

  ngOnInit(): void {
    this.detectResize();
  }

  detectResize(_event?: Event) {
    this.commonService.isNative = window.innerWidth <= 650 ? true : false;
    this.commonService.isMobile = window.innerWidth <= 450 ? true : false;
  }

  handleGlobalClick(e: Event) {
    const id = e.target['id'];
    if (id !== "dropdown-selector-id") {
      document.querySelector(".dropdown-selector")?.classList.remove("active");
    }
  }

  handleReload() {
    window.onunload = (event) => {
      window.location.href = `https://${event.target.domain}/`;
      return "";
    };
  }

  ngOnDestroy(): void { }
}
