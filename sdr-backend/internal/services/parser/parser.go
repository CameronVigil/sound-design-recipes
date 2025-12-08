package parser

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/camwick/sdr-backend/internal/models"
)

const claudeAPIURL = "https://api.anthropic.com/v1/messages"

// Service handles parsing transcriptions into structured recipes
type Service struct {
	apiKey string
	client *http.Client
}

// NewService creates a new parser service
func NewService(apiKey string) *Service {
	return &Service{
		apiKey: apiKey,
		client: &http.Client{},
	}
}

type claudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []claudeMessage `json:"messages"`
}

type claudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type claudeResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
}

// Parse takes a raw transcription and extracts structured sound design instructions
func (s *Service) Parse(transcription string, creatorName string) (*models.ParsedRecipe, error) {
	prompt := buildPrompt(transcription, creatorName)

	reqBody := claudeRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 2048,
		Messages: []claudeMessage{
			{Role: "user", Content: prompt},
		},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", claudeAPIURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("claude API error (status %d): %s", resp.StatusCode, string(body))
	}

	var claudeResp claudeResponse
	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return nil, fmt.Errorf("failed to parse claude response: %w", err)
	}

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from claude")
	}

	// Extract JSON from response
	responseText := claudeResp.Content[0].Text
	
	var recipe models.ParsedRecipe
	if err := json.Unmarshal([]byte(responseText), &recipe); err != nil {
		return nil, fmt.Errorf("failed to parse recipe JSON: %w (response: %s)", err, responseText)
	}

	return &recipe, nil
}

func buildPrompt(transcription string, creatorName string) string {
	return fmt.Sprintf(`You are an expert at analyzing sound design tutorials for Ableton Live. 

Analyze the following transcription from a TikTok video by %s and extract structured sound design instructions.

TRANSCRIPTION:
%s

Respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "Short descriptive title for this sound (e.g., 'Massive Reese Bass', 'Plucky Arp')",
  "sound_type": "Category of sound (e.g., 'bass', 'lead', 'pad', 'arp', 'kick', 'snare', 'fx', 'chord')",
  "creator_name": "The creator's display name",
  "is_sound_design": true or false (false if this isn't actually a sound design tutorial),
  "instructions": [
    {
      "step_number": 1,
      "description": "Clear instruction of what to do",
      "ableton_device": "Name of Ableton device if mentioned (e.g., 'Wavetable', 'Operator', 'Serum', 'Saturator')",
      "parameters": {"param_name": "value"},
      "notes": "Any additional tips or context"
    }
  ]
}

Rules:
- If this isn't a sound design tutorial, set is_sound_design to false and return empty instructions
- Extract specific parameter values when mentioned (frequencies, percentages, knob positions)
- Identify the Ableton device or VST being used for each step
- Keep descriptions clear and actionable
- Include any tips or warnings mentioned by the creator`, creatorName, transcription)
}
