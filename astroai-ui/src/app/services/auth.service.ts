import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static supabaseInstance: SupabaseClient | null = null;
  private static sessionSubject: BehaviorSubject<Session | null> | null = null;
  private static userSubject: BehaviorSubject<User | null> | null = null;
  private static initializationPromise: Promise<void> | null = null;
  private static isInitialized = false;
  
  private supabase: SupabaseClient;
  public session$: Observable<Session | null>;
  public user$: Observable<User | null>;

  constructor(private router: Router) {
    console.log('🔧 AuthService constructor called');
    
    // Initialize static singleton instance only once
    if (!AuthService.supabaseInstance) {
      console.log('✨ Creating new Supabase client instance');
      
      AuthService.supabaseInstance = createClient(
        environment.supabase.url,
        environment.supabase.anonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true, // Changed to true for OAuth
            storageKey: 'astroai-auth-token',
            storage: window.localStorage
          }
        }
      );
      
      AuthService.sessionSubject = new BehaviorSubject<Session | null>(null);
      AuthService.userSubject = new BehaviorSubject<User | null>(null);
      
      // Set up auth state listener only once
      AuthService.supabaseInstance.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event);
        if (session) {
          console.log('📝 Session active, user:', session.user?.email || 'anonymous');
          AuthService.userSubject?.next(session.user);
        } else {
          AuthService.userSubject?.next(null);
        }
        AuthService.sessionSubject?.next(session);
      });
      
      // Initialize session only once - store the promise
      if (!AuthService.initializationPromise) {
        AuthService.initializationPromise = this.initializeSession();
      }
    } else {
      console.log('♻️ Reusing existing Supabase client instance');
    }
    
    this.supabase = AuthService.supabaseInstance;
    this.session$ = AuthService.sessionSubject!.asObservable();
    this.user$ = AuthService.userSubject!.asObservable();
  }

  private async initializeSession(): Promise<void> {
    if (AuthService.isInitialized) {
      console.log('ℹ️ Session already initialized, skipping');
      return;
    }
    
    try {
      console.log('🔄 Initializing session...');
      AuthService.isInitialized = true;
      
      // Check for existing session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error.message);
      }
      
      if (session) {
        console.log('✅ Existing session found');
        console.log('📝 User:', session.user?.email || 'anonymous');
        AuthService.sessionSubject?.next(session);
        AuthService.userSubject?.next(session.user);
      } else {
        console.log('⚠️ No session exists, signing in anonymously...');
        await this.signInAnonymously();
      }
    } catch (error: any) {
      console.error('❌ Failed to initialize session:', error.message || error);
      AuthService.isInitialized = false; // Reset on error to allow retry
    }
  }

  private async signInAnonymously(): Promise<void> {
    try {
      console.log('🔄 Starting anonymous sign-in...');
      const { data, error } = await this.supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('❌ Anonymous sign-in failed:', error.message);
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Anonymous session created successfully');
        console.log('👤 User ID:', data.session.user?.id);
        console.log('🔑 Access Token (first 50 chars):', data.session.access_token?.substring(0, 50) + '...');
        console.log('⏰ Token expires at:', new Date(data.session.expires_at! * 1000).toLocaleString());
        AuthService.sessionSubject?.next(data.session);
        AuthService.userSubject?.next(data.session.user);
      }
    } catch (error: any) {
      console.error('❌ Error during anonymous sign-in:', error.message || error);
      throw error;
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<void> {
    try {
      console.log('🔄 Starting Google sign-in...');
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth-callback`
        }
      });
      
      if (error) {
        console.error('❌ Google sign-in failed:', error.message);
        throw error;
      }
    } catch (error: any) {
      console.error('❌ Error during Google sign-in:', error.message || error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out...');
      await this.supabase.auth.signOut();
      AuthService.sessionSubject?.next(null);
      AuthService.userSubject?.next(null);
      console.log('✅ Signed out successfully');
      
      // Sign in anonymously after logout to maintain app functionality
      await this.signInAnonymously();
      
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('❌ Sign out error:', error.message || error);
    }
  }

  async getValidToken(): Promise<string | null> {
    try {
      // Wait for initialization to complete
      if (AuthService.initializationPromise) {
        await AuthService.initializationPromise;
      }

      // Check current session from BehaviorSubject (no lock needed)
      const currentSession = AuthService.sessionSubject?.value;
      
      if (currentSession?.access_token) {
        console.log('🎫 Returning cached token');
        return currentSession.access_token;
      }

      // Try to get session from Supabase
      const { data: { session } } = await this.supabase.auth.getSession();
      
      if (session?.access_token) {
        console.log('🎫 Returning token from session');
        AuthService.sessionSubject?.next(session);
        return session.access_token;
      }
      
      // No session exists, try to sign in anonymously
      console.log('⚠️ No session, attempting anonymous sign-in...');
      await this.signInAnonymously();
      
      const newSession = AuthService.sessionSubject?.value;
      return newSession?.access_token || null;
    } catch (error: any) {
      console.error('❌ Error getting valid token:', error.message || error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      console.log('🔄 Refreshing token...');
      const { data: { session }, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Token refresh failed:', error.message);
        return null;
      }
      
      if (session) {
        console.log('✅ Token refreshed successfully');
        console.log('🔑 New token (first 50 chars):', session.access_token?.substring(0, 50) + '...');
        AuthService.sessionSubject?.next(session);
        AuthService.userSubject?.next(session.user);
        return session.access_token;
      }
      
      return null;
    } catch (error: any) {
      console.error('❌ Error refreshing token:', error.message || error);
      return null;
    }
  }

  getCurrentSession(): Session | null {
    return AuthService.sessionSubject?.value || null;
  }

  getCurrentUser(): User | null {
    return AuthService.userSubject?.value || null;
  }

  isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    const user = this.getCurrentUser();
    // Consider authenticated if user is not anonymous
    return !!session && !!user && !user.is_anonymous;
  }

  getUserEmail(): string | null {
    return this.getCurrentUser()?.email || null;
  }

  getUserName(): string | null {
    const user = this.getCurrentUser();
    return user?.user_metadata?.['full_name'] || 
           user?.user_metadata?.['name'] || 
           null;
  }

  getUserAvatar(): string | null {
    const user = this.getCurrentUser();
    return user?.user_metadata?.['avatar_url'] || 
           user?.user_metadata?.['picture'] || 
           null;
  }

  // Helper method to decode and view JWT payload
  decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  // Method to log current token details
  logCurrentTokenDetails(): void {
    const session = this.getCurrentSession();
    if (session?.access_token) {
      console.log('=== Current Token Details ===');
      console.log('Full Token:', session.access_token);
      console.log('Token Payload:', this.decodeToken(session.access_token));
      console.log('Expires At:', new Date(session.expires_at! * 1000).toLocaleString());
      console.log('User ID:', session.user?.id);
      console.log('Is Anonymous:', session.user?.is_anonymous);
    } else {
      console.log('⚠️ No active session');
    }
  }
}
