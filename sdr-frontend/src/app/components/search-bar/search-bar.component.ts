import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container" [class.focused]="isFocused()">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        
        <input
          type="text"
          class="search-input"
          [placeholder]="placeholder()"
          [(ngModel)]="query"
          (focus)="isFocused.set(true)"
          (blur)="isFocused.set(false)"
          (keydown.enter)="onSubmit()"
        />
        
        @if (query) {
          <button class="clear-btn" (click)="clearQuery()" aria-label="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        }
      </div>
      
      @if (isLoading()) {
        <div class="loading-indicator">
          <div class="spinner"></div>
        </div>
      }
      
      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      flex: 1;
      max-width: 600px;
    }
    
    .search-input-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      transition: all var(--transition-base);
    }
    
    .search-container.focused .search-input-wrapper {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-hover);
      box-shadow: 0 0 0 3px rgba(74, 107, 93, 0.15);
    }
    
    .search-icon {
      width: 18px;
      height: 18px;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    
    .search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-family: var(--font-body);
      font-size: 0.9375rem;
      color: var(--text-primary);
      
      &::placeholder {
        color: var(--text-muted);
      }
    }
    
    .clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-muted);
      transition: all var(--transition-fast);
      
      svg {
        width: 14px;
        height: 14px;
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: var(--text-primary);
      }
    }
    
    .loading-indicator {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--color-green-sage);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-message {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      padding: var(--space-sm) var(--space-md);
      background: rgba(180, 60, 60, 0.9);
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--color-off-white);
    }
  `]
})
export class SearchBarComponent {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  
  query = '';
  isFocused = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  placeholder = signal('Search sounds or paste TikTok URL...');
  
  onSubmit() {
    const trimmed = this.query.trim();
    if (!trimmed) return;
    
    this.error.set(null);
    
    // Check if it's a TikTok URL
    if (this.isTikTokUrl(trimmed)) {
      this.submitUrl(trimmed);
    } else {
      this.search(trimmed);
    }
  }
  
  private isTikTokUrl(text: string): boolean {
    return text.includes('tiktok.com') || text.includes('vm.tiktok.com');
  }
  
  private submitUrl(url: string) {
    this.isLoading.set(true);
    
    this.recipeService.transcribe(url).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.clearQuery();
        // Navigate to the new recipe
        this.router.navigate(['/recipe', response.recipe.id]);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message);
      }
    });
  }
  
  private search(query: string) {
    // For MVP, just filter locally or navigate with query param
    this.router.navigate(['/'], { queryParams: { q: query } });
  }
  
  clearQuery() {
    this.query = '';
    this.error.set(null);
  }
}
