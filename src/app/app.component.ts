import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard-component/dashboard-component.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent], // Add imported components/modules here
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'SendTech'; // Example property
}
