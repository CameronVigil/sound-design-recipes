package database

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/camwick/sdr-backend/internal/models"
)

// Service handles database operations via Supabase REST API
type Service struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

// NewService creates a new database service
func NewService(supabaseURL, anonKey string) *Service {
	return &Service{
		baseURL: supabaseURL + "/rest/v1",
		apiKey:  anonKey,
		client:  &http.Client{},
	}
}

// request helper for Supabase REST API
func (s *Service) request(method, endpoint string, body interface{}, result interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonBody)
	}

	req, err := http.NewRequest(method, s.baseURL+endpoint, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(respBody))
	}

	if result != nil && len(respBody) > 0 {
		if err := json.Unmarshal(respBody, result); err != nil {
			return fmt.Errorf("failed to parse response: %w", err)
		}
	}

	return nil
}

// GetOrCreateCreator finds a creator by handle or creates a new one
func (s *Service) GetOrCreateCreator(handle, displayName string) (*models.Creator, error) {
	// Try to find existing creator
	var creators []models.Creator
	endpoint := fmt.Sprintf("/creators?tiktok_handle=eq.%s&select=*", handle)
	
	if err := s.request("GET", endpoint, nil, &creators); err != nil {
		return nil, err
	}

	if len(creators) > 0 {
		return &creators[0], nil
	}

	// Create new creator
	newCreator := map[string]interface{}{
		"tiktok_handle": handle,
		"display_name":  displayName,
		"is_claimed":    false,
		"created_at":    time.Now().UTC(),
	}

	var created []models.Creator
	if err := s.request("POST", "/creators", newCreator, &created); err != nil {
		return nil, fmt.Errorf("failed to create creator: %w", err)
	}

	if len(created) == 0 {
		return nil, fmt.Errorf("no creator returned after insert")
	}

	return &created[0], nil
}

// GetTutorialByVideoID checks if a tutorial already exists
func (s *Service) GetTutorialByVideoID(videoID string) (*models.Tutorial, error) {
	var tutorials []models.Tutorial
	endpoint := fmt.Sprintf("/tutorials?tiktok_video_id=eq.%s&select=*", videoID)
	
	if err := s.request("GET", endpoint, nil, &tutorials); err != nil {
		return nil, err
	}

	if len(tutorials) > 0 {
		return &tutorials[0], nil
	}

	return nil, nil
}

// CreateTutorial saves a new tutorial
func (s *Service) CreateTutorial(tutorial *models.Tutorial) (*models.Tutorial, error) {
	newTutorial := map[string]interface{}{
		"creator_id":        tutorial.CreatorID,
		"tiktok_url":        tutorial.TiktokURL,
		"tiktok_video_id":   tutorial.TiktokVideoID,
		"title":             tutorial.Title,
		"sound_type":        tutorial.SoundType,
		"raw_transcription": tutorial.RawTranscription,
		"status":            "pending",
		"created_at":        time.Now().UTC(),
		"updated_at":        time.Now().UTC(),
	}

	var created []models.Tutorial
	if err := s.request("POST", "/tutorials", newTutorial, &created); err != nil {
		return nil, fmt.Errorf("failed to create tutorial: %w", err)
	}

	if len(created) == 0 {
		return nil, fmt.Errorf("no tutorial returned after insert")
	}

	return &created[0], nil
}

// CreateInstructions saves instructions for a tutorial
func (s *Service) CreateInstructions(tutorialID string, instructions []models.ParsedInstruction) error {
	for _, inst := range instructions {
		newInst := map[string]interface{}{
			"tutorial_id":    tutorialID,
			"step_number":    inst.StepNumber,
			"description":    inst.Description,
			"ableton_device": inst.AbletonDevice,
			"parameters":     inst.Parameters,
			"notes":          inst.Notes,
		}

		if err := s.request("POST", "/instructions", newInst, nil); err != nil {
			return fmt.Errorf("failed to create instruction %d: %w", inst.StepNumber, err)
		}
	}

	return nil
}

// GetTutorialWithInstructions fetches a tutorial with all its instructions
func (s *Service) GetTutorialWithInstructions(tutorialID string) (*models.Tutorial, error) {
	var tutorials []models.Tutorial
	endpoint := fmt.Sprintf("/tutorials?id=eq.%s&select=*,creator:creators(*),instructions(*)", tutorialID)
	
	if err := s.request("GET", endpoint, nil, &tutorials); err != nil {
		return nil, err
	}

	if len(tutorials) == 0 {
		return nil, fmt.Errorf("tutorial not found")
	}

	return &tutorials[0], nil
}
