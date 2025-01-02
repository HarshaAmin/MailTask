import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginCred = { username: "", password: "" };

  constructor(private authService: AuthService) { }

  login() {
    console.log(this.loginCred)
    this.authService.login(this.loginCred);
  }
}
