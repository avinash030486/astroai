import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Allow access anyway but show login suggestion
  // This maintains backward compatibility with existing features
  console.log('⚠️ User not authenticated, but allowing access');
  return true;
};

export const requireAuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login for features that strictly require authentication
  console.log('🔒 Authentication required, redirecting to login');
  router.navigate(['/login']);
  return false;
};
