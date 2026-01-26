import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from, switchMap, catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip authentication for certain endpoints if needed
  const skipAuth = req.url.includes('/public/') || req.url.includes('nominatim.openstreetmap.org');
  
  if (skipAuth) {
    return next(req);
  }

  return from(authService.getValidToken()).pipe(
    switchMap(token => {
      if (token) {
        // Clone the request and add the authorization header
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }
      // If no token, proceed without auth header
      return next(req);
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token might be expired, try to refresh
        return from(authService.refreshToken()).pipe(
          switchMap(newToken => {
            if (newToken) {
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });
              return next(clonedReq);
            }
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
