import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss']
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Wait a moment for auth state to update
    setTimeout(() => {
      if (this.authService.isAuthenticated()) {
        console.log('✅ User authenticated, redirecting to birth chart');
        this.router.navigate(['/birth-chart']);
      } else {
        console.log('⚠️ Authentication failed, redirecting to login');
        this.router.navigate(['/login']);
      }
    }, 2000);
  }
}
