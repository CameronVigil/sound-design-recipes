package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/camwick/sdr-backend/internal/config"
	"github.com/camwick/sdr-backend/internal/handlers"
	"github.com/camwick/sdr-backend/internal/services/database"
	"github.com/camwick/sdr-backend/internal/services/parser"
	"github.com/camwick/sdr-backend/internal/services/tiktok"
	"github.com/camwick/sdr-backend/internal/services/transcription"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Validate required config
	if cfg.GroqAPIKey == "" {
		log.Fatal("GROQ_API_KEY is required")
	}
	if cfg.ClaudeAPIKey == "" {
		log.Fatal("CLAUDE_API_KEY is required")
	}
	if cfg.SupabaseURL == "" || cfg.SupabaseAnonKey == "" {
		log.Fatal("SUPABASE_URL and SUPABASE_ANON_KEY are required")
	}

	// Initialize services
	tiktokSvc := tiktok.NewService()
	transcriptionSvc := transcription.NewService(cfg.GroqAPIKey)
	parserSvc := parser.NewService(cfg.ClaudeAPIKey)
	dbSvc := database.NewService(cfg.SupabaseURL, cfg.SupabaseAnonKey)

	// Initialize handlers
	h := handlers.NewHandler(tiktokSvc, transcriptionSvc, parserSvc, dbSvc)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:4200", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Get("/health", h.HealthCheck)
	r.Post("/api/transcribe", h.Transcribe)

	// Start server
	log.Printf("SDR Backend starting on port %s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
