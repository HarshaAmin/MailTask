import { inject, Inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  constructor(public authService: AuthService, public router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const status = this.authService.isAuthenticated();
    if (!status) {
      return this.router.navigate(['/']);
    }
    return true;
  }

  canActivateLogin(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const status = this.authService.isAuthenticated();
    if (status) {
      return this.router.navigate(['/home']);
    }
    return true;
  }
}

export const AuthGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> => {
  return inject(AuthGuardService).canActivate(next, state);
}

export const AuthGuardLogin: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> => {
  return inject(AuthGuardService).canActivateLogin(next, state);
}

