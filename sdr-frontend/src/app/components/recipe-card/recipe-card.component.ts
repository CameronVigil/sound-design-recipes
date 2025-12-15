import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from '../../models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article 
      class="recipe-card glass"
      [class.hovered]="isHovered()"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
      (click)="onClick()"
      tabindex="0"
      (keydown.enter)="onClick()"
      [attr.aria-label]="recipe.title + ' by ' + recipe.creator_name"
    >
      <!-- Thumbnail / Visual -->
      <div class="card-visual">
        @if (recipe.thumbnail_url) {
          <img 
            [src]="recipe.thumbnail_url" 
            [alt]="recipe.title"
            class="thumbnail"
            loading="lazy"
          />
        } @else {
          <div class="placeholder-visual">
            <div class="waveform">
              @for (bar of waveformBars; track $index) {
                <div 
                  class="bar" 
                  [style.height.%]="bar"
                  [style.animation-delay.ms]="$index * 50"
                ></div>
              }
            </div>
          </div>
        }
        
        <!-- Hover overlay -->
        <div class="card-overlay" [class.visible]="isHovered()">
          <button class="play-btn" aria-label="Preview sound">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          @if (recipe.duration_seconds) {
            <span class="duration">{{ formatDuration(recipe.duration_seconds) }}</span>
          }
        </div>
      </div>
      
      <!-- Card content -->
      <div class="card-content">
        <h3 class="card-title">{{ recipe.title }}</h3>
        <p class="card-creator">&#64;{{ recipe.creator_handle || recipe.creator_name }}</p>
        
        <!-- Tags (visible on hover) -->
        <div class="card-tags" [class.visible]="isHovered()">
          @if (recipe.sound_type) {
            <span class="tag">{{ recipe.sound_type }}</span>
          }
          @for (tag of displayTags(); track tag) {
            <span class="tag">{{ tag }}</span>
          }
        </div>
      </div>
      
      <!-- Step count badge -->
      <div class="step-badge">
        <span>{{ recipe.instructions?.length || 0 }}</span>
        <small>steps</small>
      </div>
    </article>
  `,
  styles: [`
    .recipe-card {
      position: relative;
      width: var(--card-width);
      height: var(--card-height);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      cursor: pointer;
      transition: all var(--transition-base);
      
      &:hover, &.hovered {
        transform: translateY(-4px) scale(1.02);
        border-color: var(--border-hover);
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.4),
          0 0 0 1px rgba(74, 107, 93, 0.2);
      }
      
      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--color-green-sage);
      }
    }
    
    .card-visual {
      position: relative;
      height: 180px;
      background: linear-gradient(135deg, rgba(30, 30, 27, 1) 0%, rgba(20, 20, 18, 1) 100%);
      overflow: hidden;
    }
    
    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-slow);
      
      .recipe-card:hover & {
        transform: scale(1.05);
      }
    }
    
    .placeholder-visual {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-green-dark) 0%, rgba(20, 20, 18, 1) 100%);
    }
    
    .waveform {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 60px;
    }
    
    .bar {
      width: 4px;
      background: var(--color-green-sage);
      border-radius: 2px;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
      
      .recipe-card:hover & {
        animation: pulse 0.6s ease-in-out infinite alternate;
        opacity: 0.8;
      }
    }
    
    @keyframes pulse {
      from { transform: scaleY(0.8); }
      to { transform: scaleY(1.2); }
    }
    
    .card-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity var(--transition-base);
      
      &.visible {
        opacity: 1;
      }
    }
    
    .play-btn {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: var(--color-off-white);
      cursor: pointer;
      transition: all var(--transition-fast);
      
      svg {
        width: 28px;
        height: 28px;
        margin-left: 3px; // Visual centering for play icon
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.1);
      }
    }
    
    .duration {
      position: absolute;
      bottom: 8px;
      right: 8px;
      padding: 2px 8px;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 4px;
      color: var(--text-secondary);
    }
    
    .card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-md);
    }
    
    .card-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text-primary);
      line-height: 1.3;
      margin-bottom: var(--space-xs);
      
      // Truncate long titles
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-creator {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: auto;
    }
    
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-xs);
      margin-top: var(--space-sm);
      opacity: 0;
      transform: translateY(8px);
      transition: all var(--transition-base);
      
      &.visible {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .step-badge {
      position: absolute;
      top: var(--space-sm);
      right: var(--space-sm);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-xs) var(--space-sm);
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      border-radius: 6px;
      
      span {
        font-family: var(--font-display);
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1;
      }
      
      small {
        font-size: 0.625rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  `]
})
export class RecipeCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Output() expand = new EventEmitter<Recipe>();
  
  isHovered = signal(false);
  
  // Generate random waveform heights for placeholder
  waveformBars = Array.from({ length: 20 }, () => Math.random() * 60 + 20);
  
  displayTags = computed(() => {
    return (this.recipe.tags || []).slice(0, 3);
  });
  
  onMouseEnter() {
    this.isHovered.set(true);
  }
  
  onMouseLeave() {
    this.isHovered.set(false);
  }
  
  onClick() {
    this.expand.emit(this.recipe);
  }
  
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
