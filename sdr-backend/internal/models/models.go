package models

import "time"

// Creator represents a TikTok content creator
type Creator struct {
	ID           string    `json:"id"`
	TiktokHandle string    `json:"tiktok_handle"`
	DisplayName  string    `json:"display_name"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	IsClaimed    bool      `json:"is_claimed"`
	CreatedAt    time.Time `json:"created_at"`
}

// Tutorial represents a transcribed TikTok video
type Tutorial struct {
	ID              string        `json:"id"`
	CreatorID       string        `json:"creator_id"`
	TiktokURL       string        `json:"tiktok_url"`
	TiktokVideoID   string        `json:"tiktok_video_id"`
	Title           string        `json:"title"`
	SoundType       string        `json:"sound_type"`
	RawTranscription string       `json:"raw_transcription"`
	Status          string        `json:"status"` // pending, approved, rejected
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
	
	// Populated on fetch
	Creator      *Creator      `json:"creator,omitempty"`
	Instructions []Instruction `json:"instructions,omitempty"`
}

// Instruction represents a single step in a sound design recipe
type Instruction struct {
	ID            string            `json:"id"`
	TutorialID    string            `json:"tutorial_id"`
	StepNumber    int               `json:"step_number"`
	Description   string            `json:"description"`
	AbletonDevice string            `json:"ableton_device,omitempty"`
	Parameters    map[string]string `json:"parameters,omitempty"`
	Notes         string            `json:"notes,omitempty"`
	ScreenshotURL string            `json:"screenshot_url,omitempty"`
}

// TranscribeRequest is the API request to transcribe a TikTok
type TranscribeRequest struct {
	URL string `json:"url"`
}

// TranscribeResponse is the API response after transcription
type TranscribeResponse struct {
	Success  bool      `json:"success"`
	Message  string    `json:"message,omitempty"`
	Tutorial *Tutorial `json:"tutorial,omitempty"`
}

// ParsedRecipe is the structured output from Claude
type ParsedRecipe struct {
	Title        string              `json:"title"`
	SoundType    string              `json:"sound_type"`
	CreatorName  string              `json:"creator_name"`
	Instructions []ParsedInstruction `json:"instructions"`
	IsSoundDesign bool               `json:"is_sound_design"`
}

// ParsedInstruction is a single instruction from Claude parsing
type ParsedInstruction struct {
	StepNumber    int               `json:"step_number"`
	Description   string            `json:"description"`
	AbletonDevice string            `json:"ableton_device,omitempty"`
	Parameters    map[string]string `json:"parameters,omitempty"`
	Notes         string            `json:"notes,omitempty"`
}
