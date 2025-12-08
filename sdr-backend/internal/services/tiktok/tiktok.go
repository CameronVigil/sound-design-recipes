package tiktok

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

// VideoInfo contains metadata extracted from TikTok
type VideoInfo struct {
	VideoID     string
	CreatorName string
	CreatorHandle string
	Title       string
	AudioPath   string
}

// Service handles TikTok video extraction
type Service struct {
	tempDir string
}

// NewService creates a new TikTok service
func NewService() *Service {
	tempDir := filepath.Join(os.TempDir(), "sdr-downloads")
	os.MkdirAll(tempDir, 0755)
	return &Service{tempDir: tempDir}
}

// ValidateURL checks if a URL is a valid TikTok URL
func (s *Service) ValidateURL(url string) bool {
	patterns := []string{
		`^https?://(www\.)?tiktok\.com/@[\w.-]+/video/\d+`,
		`^https?://vm\.tiktok\.com/[\w]+`,
		`^https?://(www\.)?tiktok\.com/t/[\w]+`,
	}
	
	for _, pattern := range patterns {
		matched, _ := regexp.MatchString(pattern, url)
		if matched {
			return true
		}
	}
	return false
}

// ExtractVideoID extracts the video ID from a TikTok URL
func (s *Service) ExtractVideoID(url string) (string, error) {
	// For direct video URLs
	re := regexp.MustCompile(`/video/(\d+)`)
	matches := re.FindStringSubmatch(url)
	if len(matches) > 1 {
		return matches[1], nil
	}
	
	// For shortened URLs, we need to follow the redirect
	// yt-dlp will handle this for us
	return "", fmt.Errorf("could not extract video ID, will resolve during download")
}

// ExtractAudio downloads the TikTok and extracts audio for transcription
func (s *Service) ExtractAudio(url string) (*VideoInfo, error) {
	// Create unique output path
	outputTemplate := filepath.Join(s.tempDir, "%(id)s")
	
	// First, get video info without downloading
	infoCmd := exec.Command("yt-dlp",
		"--dump-json",
		"--no-download",
		url,
	)
	
	infoOutput, err := infoCmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get video info: %w", err)
	}
	
	var info struct {
		ID        string `json:"id"`
		Title     string `json:"title"`
		Uploader  string `json:"uploader"`
		UploaderID string `json:"uploader_id"`
	}
	
	if err := json.Unmarshal(infoOutput, &info); err != nil {
		return nil, fmt.Errorf("failed to parse video info: %w", err)
	}
	
	// Download and extract audio
	audioPath := filepath.Join(s.tempDir, info.ID+".mp3")
	
	downloadCmd := exec.Command("yt-dlp",
		"-x",                    // Extract audio
		"--audio-format", "mp3", // Convert to mp3
		"--audio-quality", "0",  // Best quality
		"-o", outputTemplate+".%(ext)s",
		url,
	)
	
	if err := downloadCmd.Run(); err != nil {
		return nil, fmt.Errorf("failed to download audio: %w", err)
	}
	
	// Clean up creator handle (remove @ if present)
	handle := strings.TrimPrefix(info.UploaderID, "@")
	
	return &VideoInfo{
		VideoID:       info.ID,
		CreatorName:   info.Uploader,
		CreatorHandle: handle,
		Title:         info.Title,
		AudioPath:     audioPath,
	}, nil
}

// Cleanup removes temporary files for a video
func (s *Service) Cleanup(videoID string) {
	pattern := filepath.Join(s.tempDir, videoID+".*")
	files, _ := filepath.Glob(pattern)
	for _, f := range files {
		os.Remove(f)
	}
}
