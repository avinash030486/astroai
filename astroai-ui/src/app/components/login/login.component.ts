import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    // If already authenticated, redirect to daily prediction
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/daily-prediction']);
    }
  }

  async signInWithGoogle(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      this.error = error.message || 'Failed to sign in with Google';
      this.loading = false;
    }
  }
}
