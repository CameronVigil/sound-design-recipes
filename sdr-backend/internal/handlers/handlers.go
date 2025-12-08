package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/camwick/sdr-backend/internal/models"
	"github.com/camwick/sdr-backend/internal/services/database"
	"github.com/camwick/sdr-backend/internal/services/parser"
	"github.com/camwick/sdr-backend/internal/services/tiktok"
	"github.com/camwick/sdr-backend/internal/services/transcription"
)

// Handler holds all HTTP handlers and their dependencies
type Handler struct {
	tiktok        *tiktok.Service
	transcription *transcription.Service
	parser        *parser.Service
	db            *database.Service
}

// NewHandler creates a new handler with all services
func NewHandler(
	tiktokSvc *tiktok.Service,
	transcriptionSvc *transcription.Service,
	parserSvc *parser.Service,
	dbSvc *database.Service,
) *Handler {
	return &Handler{
		tiktok:        tiktokSvc,
		transcription: transcriptionSvc,
		parser:        parserSvc,
		db:            dbSvc,
	}
}

// HealthCheck returns service status
func (h *Handler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// Transcribe handles the full pipeline: URL -> audio -> transcription -> parsing -> save
func (h *Handler) Transcribe(w http.ResponseWriter, r *http.Request) {
	var req models.TranscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate URL
	if !h.tiktok.ValidateURL(req.URL) {
		respondError(w, http.StatusBadRequest, "Invalid TikTok URL")
		return
	}

	log.Printf("Processing TikTok URL: %s", req.URL)

	// Step 1: Extract audio from TikTok
	log.Println("Step 1: Extracting audio...")
	videoInfo, err := h.tiktok.ExtractAudio(req.URL)
	if err != nil {
		log.Printf("Failed to extract audio: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to extract audio from TikTok")
		return
	}
	defer h.tiktok.Cleanup(videoInfo.VideoID)

	log.Printf("Extracted video: ID=%s, Creator=%s", videoInfo.VideoID, videoInfo.CreatorHandle)

	// Check if already transcribed
	existing, err := h.db.GetTutorialByVideoID(videoInfo.VideoID)
	if err != nil {
		log.Printf("Database error checking existing: %v", err)
	}
	if existing != nil {
		log.Printf("Tutorial already exists: %s", existing.ID)
		respondJSON(w, http.StatusOK, models.TranscribeResponse{
			Success:  true,
			Message:  "Tutorial already exists",
			Tutorial: existing,
		})
		return
	}

	// Step 2: Transcribe audio
	log.Println("Step 2: Transcribing audio...")
	transcriptionResult, err := h.transcription.Transcribe(videoInfo.AudioPath)
	if err != nil {
		log.Printf("Failed to transcribe: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to transcribe audio")
		return
	}

	log.Printf("Transcription complete: %d characters", len(transcriptionResult.Text))

	// Step 3: Parse with Claude
	log.Println("Step 3: Parsing transcription...")
	recipe, err := h.parser.Parse(transcriptionResult.Text, videoInfo.CreatorName)
	if err != nil {
		log.Printf("Failed to parse: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to parse transcription")
		return
	}

	log.Printf("Parsed recipe: Title=%s, SoundType=%s, IsSoundDesign=%v", 
		recipe.Title, recipe.SoundType, recipe.IsSoundDesign)

	// Check if it's actually sound design content
	if !recipe.IsSoundDesign {
		respondError(w, http.StatusBadRequest, "This video doesn't appear to be a sound design tutorial")
		return
	}

	// Step 4: Save to database
	log.Println("Step 4: Saving to database...")
	
	// Get or create creator
	creator, err := h.db.GetOrCreateCreator(videoInfo.CreatorHandle, videoInfo.CreatorName)
	if err != nil {
		log.Printf("Failed to get/create creator: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save creator")
		return
	}

	// Create tutorial
	tutorial := &models.Tutorial{
		CreatorID:        creator.ID,
		TiktokURL:        req.URL,
		TiktokVideoID:    videoInfo.VideoID,
		Title:            recipe.Title,
		SoundType:        recipe.SoundType,
		RawTranscription: transcriptionResult.Text,
		Status:           "pending",
	}

	savedTutorial, err := h.db.CreateTutorial(tutorial)
	if err != nil {
		log.Printf("Failed to create tutorial: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to save tutorial")
		return
	}

	// Save instructions
	if err := h.db.CreateInstructions(savedTutorial.ID, recipe.Instructions); err != nil {
		log.Printf("Failed to create instructions: %v", err)
		// Continue anyway, tutorial is saved
	}

	log.Printf("Tutorial saved successfully: ID=%s", savedTutorial.ID)

	// Fetch complete tutorial with instructions
	completeTutorial, err := h.db.GetTutorialWithInstructions(savedTutorial.ID)
	if err != nil {
		completeTutorial = savedTutorial
	}
	completeTutorial.Creator = creator

	respondJSON(w, http.StatusCreated, models.TranscribeResponse{
		Success:  true,
		Message:  "Tutorial transcribed and saved successfully",
		Tutorial: completeTutorial,
	})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, models.TranscribeResponse{
		Success: false,
		Message: message,
	})
}
