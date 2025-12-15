import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { Recipe, CreatorRow, TranscribeRequest, TranscribeResponse } from '../models/recipe.model';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  
  // Local state
  private recipesSubject = new BehaviorSubject<Recipe[]>([]);
  public recipes$ = this.recipesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Get all recipes from the database
   */
  getRecipes(): Observable<Recipe[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.get<Recipe[]>(`${this.apiUrl}/recipes`).pipe(
      tap(recipes => {
        this.recipesSubject.next(recipes);
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get recipes grouped by creator for browse view
   */
  getRecipesByCreator(): Observable<CreatorRow[]> {
    return this.recipes$.pipe(
      map(recipes => {
        const grouped = new Map<string, CreatorRow>();
        
        recipes.forEach(recipe => {
          const handle = recipe.creator_handle || 'unknown';
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
      })
    );
  }

  /**
   * Search recipes by query
   */
  searchRecipes(query: string): Observable<Recipe[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    return this.http.get<Recipe[]>(`${this.apiUrl}/recipes/search`, {
      params: { q: query }
    }).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Submit a TikTok URL for transcription
   */
  transcribe(url: string): Observable<TranscribeResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    const body: TranscribeRequest = { url };
    
    return this.http.post<TranscribeResponse>(`${this.apiUrl}/transcribe`, body).pipe(
      tap(response => {
        // Add new recipe to local state
        const current = this.recipesSubject.value;
        const exists = current.some(r => r.id === response.recipe.id);
        if (!exists) {
          this.recipesSubject.next([response.recipe, ...current]);
        }
        this.loadingSubject.next(false);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get a single recipe by ID
   */
  getRecipeById(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/recipes/${id}`).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    
    let message = 'Something went wrong. Please try again.';
    
    if (error.error?.error) {
      message = error.error.error;
    } else if (error.status === 0) {
      message = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 404) {
      message = 'Recipe not found.';
    } else if (error.status >= 500) {
      message = 'Server error. Please try again later.';
    }
    
    this.errorSubject.next(message);
    return throwError(() => new Error(message));
  }
}
