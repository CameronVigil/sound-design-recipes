import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { RecipeCardComponent } from '../recipe-card/recipe-card.component';
import { Recipe, CreatorRow } from '../../models/recipe.model';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, RecipeCardComponent],
  template: `
    <div class="browse-container">
      @if (loading()) {
        <div class="loading-state">
          <div class="loader"></div>
          <p>Loading recipes...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button class="btn btn--primary" (click)="loadRecipes()">Try Again</button>
        </div>
      } @else if (creatorRows().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 19V6l12-3v13"/>
              <circle cx="6" cy="19" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h2>No recipes yet</h2>
          <p>Paste a TikTok URL in the search bar to add your first sound design recipe.</p>
        </div>
      } @else {
        <!-- Featured section -->
        @if (featuredRecipe()) {
          <section class="featured-section">
            <div class="featured-card glass" (click)="openRecipe(featuredRecipe()!)">
              <div class="featured-visual">
                @if (featuredRecipe()!.thumbnail_url) {
                  <img [src]="featuredRecipe()!.thumbnail_url" [alt]="featuredRecipe()!.title" />
                }
                <div class="featured-gradient"></div>
              </div>
              <div class="featured-content">
                <span class="featured-label">Featured</span>
                <h2>{{ featuredRecipe()!.title }}</h2>
                <p class="featured-creator">by &#64;{{ featuredRecipe()!.creator_handle }}</p>
                <div class="featured-meta">
                  <span class="tag">{{ featuredRecipe()!.sound_type }}</span>
                  <span>{{ featuredRecipe()!.instructions?.length }} steps</span>
                </div>
              </div>
            </div>
          </section>
        }
        
        <!-- Creator rows -->
        @for (row of creatorRows(); track row.creator_handle) {
          <section class="creator-row">
            <header class="row-header">
              <h2 class="row-title">{{ row.creator_name }}</h2>
              <span class="row-count">{{ row.recipes.length }} recipes</span>
            </header>
            
            <div class="row-scroll hide-scrollbar">
              <div class="row-track">
                @for (recipe of row.recipes; track recipe.id) {
                  <app-recipe-card 
                    [recipe]="recipe"
                    (expand)="openRecipe($event)"
                  />
                }
              </div>
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .browse-container {
      max-width: 1600px;
      margin: 0 auto;
      padding-bottom: var(--space-3xl);
    }
    
    // Loading state
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: var(--space-lg);
      
      p {
        color: var(--text-muted);
      }
    }
    
    .loader {
      width: 48px;
      height: 48px;
      border: 3px solid var(--border-subtle);
      border-top-color: var(--color-green-sage);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    // Error state
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: var(--space-lg);
      
      p {
        color: var(--color-earth-clay);
      }
    }
    
    // Empty state
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
      padding: var(--space-xl);
      
      h2 {
        margin-bottom: var(--space-sm);
      }
      
      p {
        max-width: 400px;
      }
    }
    
    .empty-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 50%;
      margin-bottom: var(--space-lg);
      
      svg {
        width: 40px;
        height: 40px;
        color: var(--text-muted);
      }
    }
    
    // Featured section
    .featured-section {
      padding: 0 var(--space-xl) var(--space-2xl);
    }
    
    .featured-card {
      position: relative;
      height: 320px;
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition-base);
      
      &:hover {
        transform: scale(1.01);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
      }
    }
    
    .featured-visual {
      position: absolute;
      inset: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .featured-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        rgba(10, 10, 9, 0.95) 0%,
        rgba(10, 10, 9, 0.7) 40%,
        rgba(10, 10, 9, 0.3) 70%,
        transparent 100%
      );
    }
    
    .featured-content {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: var(--space-xl);
      max-width: 500px;
      
      h2 {
        font-size: 2.5rem;
        margin-bottom: var(--space-sm);
      }
    }
    
    .featured-label {
      display: inline-block;
      padding: var(--space-xs) var(--space-sm);
      background: var(--color-green-forest);
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-md);
      width: fit-content;
    }
    
    .featured-creator {
      color: var(--text-secondary);
      margin-bottom: var(--space-md);
    }
    
    .featured-meta {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    
    // Creator rows
    .creator-row {
      margin-bottom: var(--space-2xl);
    }
    
    .row-header {
      display: flex;
      align-items: baseline;
      gap: var(--space-md);
      padding: 0 var(--space-xl) var(--space-md);
    }
    
    .row-title {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 500;
    }
    
    .row-count {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    .row-scroll {
      overflow-x: auto;
      padding: var(--space-sm) 0;
    }
    
    .row-track {
      display: flex;
      gap: var(--card-gap);
      padding: 0 var(--space-xl);
      
      // Add some breathing room at the end
      &::after {
        content: '';
        flex-shrink: 0;
        width: var(--space-xl);
      }
    }
  `]
})
export class BrowseComponent implements OnInit {
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  loading = signal(true);
  error = signal<string | null>(null);
  creatorRows = signal<CreatorRow[]>([]);
  featuredRecipe = signal<Recipe | null>(null);
  
  ngOnInit() {
    this.loadRecipes();
  }
  
  loadRecipes() {
    this.loading.set(true);
    this.error.set(null);
    
    this.recipeService.getRecipes().subscribe({
      next: (recipes) => {
        // Group by creator
        const grouped = this.groupByCreator(recipes);
        this.creatorRows.set(grouped);
        
        // Set featured as first recipe with thumbnail, or just first
        const featured = recipes.find(r => r.thumbnail_url) || recipes[0];
        this.featuredRecipe.set(featured || null);
        
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
  
  private groupByCreator(recipes: Recipe[]): CreatorRow[] {
    const grouped = new Map<string, CreatorRow>();
    
    recipes.forEach(recipe => {
      const handle = recipe.creator_handle || recipe.creator_name || 'Unknown';
      if (!grouped.has(handle)) {
        grouped.set(handle, {
          creator_handle: handle,
          creator_name: recipe.creator_name || handle,
          recipes: []
        });
      }
      grouped.get(handle)!.recipes.push(recipe);
    });
    
    return Array.from(grouped.values());
  }
  
  openRecipe(recipe: Recipe) {
    this.router.navigate(['/recipe', recipe.id]);
  }
}
