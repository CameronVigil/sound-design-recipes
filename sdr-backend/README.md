# SDR Backend (Sound Design Recipes)

Go backend for transcribing TikTok sound design tutorials and saving them to a database.

## Architecture

```
TikTok URL → yt-dlp (extract audio) → Groq Whisper (transcribe) → Claude (parse) → Supabase (save)
```

## Prerequisites

- Go 1.22+
- yt-dlp installed (`brew install yt-dlp` or `pip install yt-dlp`)
- ffmpeg installed (`brew install ffmpeg`)
- Supabase account (free tier)
- Groq API key (free tier available)
- Claude API key

## Setup

### 1. Clone and install dependencies

```bash
cd sdr-backend
go mod tidy
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Get API keys

- **Groq**: https://console.groq.com/keys
- **Claude**: https://console.anthropic.com/settings/keys

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual keys
```

### 5. Run the server

```bash
go run cmd/api/main.go
```

## API Endpoints

### Health Check
```
GET /health
```

### Transcribe TikTok
```
POST /api/transcribe
Content-Type: application/json

{
  "url": "https://www.tiktok.com/@username/video/1234567890"
}
```

Response:
```json
{
  "success": true,
  "message": "Tutorial transcribed and saved successfully",
  "tutorial": {
    "id": "uuid",
    "title": "Massive Reese Bass",
    "sound_type": "bass",
    "raw_transcription": "...",
    "instructions": [
      {
        "step_number": 1,
        "description": "Start with Serum and load a saw wave",
        "ableton_device": "Serum",
        "parameters": {"osc1": "saw"},
        "notes": ""
      }
    ]
  }
}
```

## Project Structure

```
sdr-backend/
├── cmd/api/main.go           # Entry point
├── internal/
│   ├── config/               # Environment config
│   ├── handlers/             # HTTP handlers
│   ├── models/               # Data models
│   └── services/
│       ├── tiktok/           # yt-dlp wrapper
│       ├── transcription/    # Groq Whisper client
│       ├── parser/           # Claude client
│       └── database/         # Supabase client
├── schema.sql                # Database schema
├── .env.example              # Environment template
└── go.mod
```

## Cost Estimates

Per transcription (60-second video):
- Groq Whisper: ~$0.0003
- Claude parsing: ~$0.01-0.02
- **Total: ~$0.01-0.02 per video**

## Development

```bash
# Run with hot reload (install air first: go install github.com/cosmtrek/air@latest)
air

# Or run directly
go run cmd/api/main.go
```

## Testing

```bash
# Test the transcription endpoint
curl -X POST http://localhost:8080/api/transcribe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.tiktok.com/@someuser/video/1234567890"}'
```
