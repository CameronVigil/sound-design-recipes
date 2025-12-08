package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port            string
	GroqAPIKey      string
	ClaudeAPIKey    string
	SupabaseURL     string
	SupabaseAnonKey string
}

func Load() (*Config, error) {
	// Load .env file if it exists (development)
	godotenv.Load()

	return &Config{
		Port:            getEnv("PORT", "8080"),
		GroqAPIKey:      os.Getenv("GROQ_API_KEY"),
		ClaudeAPIKey:    os.Getenv("CLAUDE_API_KEY"),
		SupabaseURL:     os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey: os.Getenv("SUPABASE_ANON_KEY"),
	}, nil
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
