import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchBarComponent } from './components/search-bar/search-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SearchBarComponent],
  template: `
    <div class="app-layout">
      <header class="app-header">
        <div class="header-content">
          <a href="/" class="logo">
            <span class="logo-text">SDR</span>
            <span class="logo-tagline">Sound Design Recipes</span>
          </a>
          <app-search-bar />
        </div>
      </header>
      
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .app-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(10, 10, 9, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-subtle);
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-xl);
      max-width: 1600px;
      margin: 0 auto;
      padding: var(--space-md) var(--space-xl);
    }
    
    .logo {
      display: flex;
      align-items: baseline;
      gap: var(--space-sm);
      text-decoration: none;
      flex-shrink: 0;
    }
    
    .logo-text {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    
    .logo-tagline {
      font-size: 0.875rem;
      color: var(--text-muted);
      display: none;
      
      @media (min-width: 640px) {
        display: inline;
      }
    }
    
    .app-main {
      flex: 1;
      padding-top: var(--space-xl);
    }
  `]
})
export class AppComponent {}
