import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { Recipe, Instruction } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-expanded',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recipe-page">
      <!-- Back button -->
      <button class="back-btn" (click)="goBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back to browse
      </button>
      
      @if (loading()) {
        <div class="loading-state">
          <div class="loader"></div>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <p>{{ error() }}</p>
          <button class="btn btn--primary" (click)="loadRecipe()">Try Again</button>
        </div>
      } @else if (recipe()) {
        <div class="recipe-content">
          <!-- Left: Video -->
          <div class="video-section">
            <div class="video-container glass">
              @if (recipe()!.video_url) {
                <video 
                  #videoPlayer
                  [src]="recipe()!.video_url"
                  controls
                  playsinline
                  class="video-player"
                ></video>
              } @else {
                <!-- TikTok embed fallback -->
                <div class="video-placeholder">
                  <a 
                    [href]="recipe()!.tiktok_url" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="tiktok-link"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span>Watch on TikTok</span>
                  </a>
                </div>
              }
            </div>
            
            <!-- Recipe meta -->
            <div class="recipe-meta">
              <h1>{{ recipe()!.title }}</h1>
              <p class="creator">
                by <a [href]="'https://tiktok.com/@' + recipe()!.creator_handle" target="_blank">
                  &#64;{{ recipe()!.creator_handle }}
                </a>
              </p>
              <div class="tags">
                @if (recipe()!.sound_type) {
                  <span class="tag tag--primary">{{ recipe()!.sound_type }}</span>
                }
                @for (tag of recipe()!.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
          </div>
          
          <!-- Right: Instructions -->
          <div class="instructions-section">
            <header class="instructions-header">
              <h2>Instructions</h2>
              <span class="step-count">{{ recipe()!.instructions?.length || 0 }} steps</span>
            </header>
            
            <ol class="instructions-list">
              @for (step of recipe()!.instructions; track step.step_number) {
                <li class="instruction-item glass">
                  <div class="step-number">{{ step.step_number }}</div>
                  <div class="step-content">
                    <p class="step-description">{{ step.description }}</p>
                    
                    @if (step.ableton_device) {
                      <div class="device-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="2" y="3" width="20" height="14" rx="2"/>
                          <path d="M8 21h8M12 17v4"/>
                        </svg>
                        {{ step.ableton_device }}
                      </div>
                    }
                    
                    @if (step.parameters && hasParameters(step.parameters)) {
                      <div class="parameters">
                        <h4>Parameters</h4>
                        <ul class="param-list">
                          @for (param of getParameters(step.parameters); track param.key) {
                            <li>
                              <span class="param-name">{{ param.key }}</span>
                              <span class="param-value">{{ param.value }}</span>
                            </li>
                          }
                        </ul>
                      </div>
                    }
                    
                    @if (step.notes) {
                      <div class="step-notes">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                        {{ step.notes }}
                      </div>
                    }
                  </div>
                </li>
              }
            </ol>
            
            <!-- Raw transcription toggle -->
            <details class="transcription-toggle">
              <summary>View raw transcription</summary>
              <pre class="raw-transcription">{{ recipe()!.raw_transcription }}</pre>
            </details>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .recipe-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 var(--space-xl) var(--space-3xl);
    }
    
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) 0;
      background: none;
      border: none;
      color: var(--text-muted);
      font-family: var(--font-body);
      font-size: 0.9375rem;
      cursor: pointer;
      transition: color var(--transition-fast);
      margin-bottom: var(--space-xl);
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        color: var(--text-primary);
      }
    }
    
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: var(--space-lg);
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
    
    .recipe-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-2xl);
      
      @media (min-width: 1024px) {
        grid-template-columns: 400px 1fr;
      }
    }
    
    // Video section
    .video-section {
      position: sticky;
      top: 100px;
      height: fit-content;
    }
    
    .video-container {
      aspect-ratio: 9/16;
      max-height: 500px;
      overflow: hidden;
      margin-bottom: var(--space-lg);
    }
    
    .video-player {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }
    
    .video-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-green-dark) 0%, var(--bg-primary) 100%);
    }
    
    .tiktok-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-xl);
      color: var(--text-primary);
      text-decoration: none;
      transition: transform var(--transition-base);
      
      svg {
        width: 48px;
        height: 48px;
      }
      
      &:hover {
        transform: scale(1.05);
      }
    }
    
    .recipe-meta {
      h1 {
        font-size: 1.75rem;
        margin-bottom: var(--space-sm);
      }
    }
    
    .creator {
      color: var(--text-secondary);
      margin-bottom: var(--space-md);
      
      a {
        color: var(--color-green-sage);
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
    }
    
    .tag--primary {
      background: var(--color-green-forest);
      color: var(--text-primary);
    }
    
    // Instructions section
    .instructions-section {
      min-width: 0;
    }
    
    .instructions-header {
      display: flex;
      align-items: baseline;
      gap: var(--space-md);
      margin-bottom: var(--space-xl);
      padding-bottom: var(--space-md);
      border-bottom: 1px solid var(--border-subtle);
      
      h2 {
        font-size: 1.5rem;
      }
    }
    
    .step-count {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    .instructions-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }
    
    .instruction-item {
      display: flex;
      gap: var(--space-lg);
      padding: var(--space-lg);
    }
    
    .step-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-green-forest);
      border-radius: 50%;
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 600;
    }
    
    .step-content {
      flex: 1;
      min-width: 0;
    }
    
    .step-description {
      font-size: 1.0625rem;
      line-height: 1.6;
      color: var(--text-primary);
      margin-bottom: var(--space-md);
    }
    
    .device-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-xs) var(--space-sm);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      font-size: 0.875rem;
      color: var(--color-earth-clay);
      margin-bottom: var(--space-md);
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
    
    .parameters {
      margin-bottom: var(--space-md);
      
      h4 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        margin-bottom: var(--space-sm);
      }
    }
    
    .param-list {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-sm);
      
      li {
        display: flex;
        gap: var(--space-xs);
        padding: var(--space-xs) var(--space-sm);
        background: rgba(255, 255, 255, 0.03);
        border-radius: 4px;
        font-size: 0.875rem;
      }
    }
    
    .param-name {
      color: var(--text-muted);
      
      &::after {
        content: ':';
      }
    }
    
    .param-value {
      color: var(--color-green-sage);
      font-weight: 500;
    }
    
    .step-notes {
      display: flex;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      background: rgba(166, 124, 82, 0.1);
      border-left: 3px solid var(--color-earth-clay);
      border-radius: 0 6px 6px 0;
      font-size: 0.9375rem;
      color: var(--text-secondary);
      
      svg {
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        color: var(--color-earth-clay);
        margin-top: 2px;
      }
    }
    
    // Transcription toggle
    .transcription-toggle {
      margin-top: var(--space-2xl);
      
      summary {
        cursor: pointer;
        color: var(--text-muted);
        font-size: 0.875rem;
        padding: var(--space-sm) 0;
        
        &:hover {
          color: var(--text-secondary);
        }
      }
    }
    
    .raw-transcription {
      margin-top: var(--space-md);
      padding: var(--space-lg);
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
      overflow-x: auto;
    }
  `]
})
export class RecipeExpandedComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipeService = inject(RecipeService);
  
  loading = signal(true);
  error = signal<string | null>(null);
  recipe = signal<Recipe | null>(null);
  
  ngOnInit() {
    this.loadRecipe();
  }
  
  loadRecipe() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Recipe not found');
      this.loading.set(false);
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    this.recipeService.getRecipeById(id).subscribe({
      next: (recipe) => {
        this.recipe.set(recipe);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
  
  goBack() {
    this.router.navigate(['/']);
  }
  
  hasParameters(params: Record<string, string>): boolean {
    return Object.keys(params).length > 0;
  }
  
  getParameters(params: Record<string, string>): { key: string; value: string }[] {
    return Object.entries(params).map(([key, value]) => ({ key, value }));
  }
}
