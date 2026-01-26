import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'astroai-ui';
  year = new Date().getFullYear();

  constructor(private authService: AuthService) {
    console.log('🚀 AppComponent initialized, AuthService injected');
  }

  ngOnInit(): void {
    console.log('📱 AppComponent ngOnInit');
    
    // Check auth status after initialization
    setTimeout(() => {
      const session = this.authService.getCurrentSession();
      if (session) {
        console.log('✅ Authentication successful');
        console.log('🔑 Token available:', session.access_token?.substring(0, 30) + '...');
      } else {
        console.log('⚠️ No active session');
      }
    }, 3000);
  }
}
