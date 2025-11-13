# Sound Design Library - System Design Document

**Version:** 1.0  
**Last Updated:** November 13, 2025  
**Status:** System Design Phase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Concept](#core-concept)
3. [Architecture Decisions](#architecture-decisions)
4. [Feature Prioritization](#feature-prioritization)
5. [Technology Stack](#technology-stack)
6. [Data Model](#data-model)
7. [System Architecture](#system-architecture)
8. [User Interface Design](#user-interface-design)
9. [API Design](#api-design)
10. [Implementation Phases](#implementation-phases)
11. [Open Questions](#open-questions)
12. [Cost Analysis](#cost-analysis)
13. [Next Steps](#next-steps)

---

## Project Overview

### Vision
Create a web application that transcribes TikTok sound design tutorials into a structured, searchable library with step-by-step instructions, organized by creator and sound type.

### Problem Statement
Music producers save countless TikTok tutorials but struggle to:
- Recall specific techniques from videos they've watched
- Find tutorials about specific sounds (bass, vocals, etc.)
- Follow along with fast-paced video content
- Organize content by creator

### Solution
A single-page Angular application that:
1. Accepts TikTok video URLs
2. Checks for existing transcriptions (deduplication)
3. Transcribes audio and generates step-by-step instructions
4. Organizes content by author and sound type
5. Presents videos in a carousel format with synchronized transcription

---

## Core Concept

### User Flow
```
1. User pastes TikTok URL
   ↓
2. System checks if video already transcribed
   ├─ YES → Retrieve from database, display immediately
   └─ NO → Continue to transcription
   ↓
3. Process video:
   ├─ Extract metadata (author, title, duration)
   ├─ Transcribe audio → text
   ├─ Generate step-by-step instructions (AI)
   └─ Categorize sound type (AI)
   ↓
4. Store in database
   ↓
5. Display in UI:
   ├─ Left: TikTok embedded player
   └─ Right: Transcription + instructions
```

### UI Concept
- **Single Page Application**
- **Carousel Navigation** - Horizontal scroll through videos by same author
- **Two-Column Layout:**
  - Left: Embedded TikTok video player
  - Right: Author name, metadata, transcription, AI-generated instructions
- **Filtering:**
  - By author (all videos by @producer_mike)
  - By sound type (bass, keys, vocals, drums, etc.)

---

## Architecture Decisions

### 1. Video Storage Strategy
**Decision:** DO NOT store video files

**Rationale:**
- Minimizes storage costs
- Avoids copyright concerns
- Focuses value on transcription and instructions
- TikTok URLs remain accessible in most cases

**Handling Deleted Videos:**
- Display "Video unavailable" message
- Consider saving thumbnail screenshot as fallback
- Transcription and instructions remain accessible

**Video Display:**
- Embed TikTok video using iframe/embed (minimal branding)
- Treat as MP4 where possible to reduce TikTok branding
- Keep TikTok URL in database for embedding

### 2. Database Choice
**Decision:** Supabase (PostgreSQL)

**Rationale:**
- Free tier with generous limits
- Built-in storage for images (thumbnails, plugin screenshots)
- Real-time capabilities for future features
- Better Angular integration than FileMaker
- Industry-standard PostgreSQL
- Built-in auth system for future user accounts

**FileMaker Consideration:**
- While you wanted experience with FileMaker, it's designed for internal business apps with GUI-based workflows
- Not well-suited for web applications
- Limited API/SDK support for modern web frameworks
- Can explore FileMaker in a separate project

### 3. Backend Technology
**Decision:** Hybrid Approach - TypeScript/Node.js (primary), Go (where feasible)

**Rationale:**
- **TypeScript for main API:**
  - Shares types with Angular frontend
  - Better AI SDK support (OpenAI, Anthropic)
  - Native Vercel support
  - Faster initial development
  
- **Go for specific services (optional):**
  - Can implement heavy processing tasks in Go
  - Video processing worker (if needed)
  - Deploy Go services to Fly.io (free tier)
  - Gives you Go experience without blocking progress

**Hosting Strategy:**
- Vercel for Angular + TypeScript serverless functions (free tier)
- Optional: Fly.io for Go microservices (free tier, 3 small VMs)

### 4. Transcription Strategy
**Decision:** Multi-tier approach based on budget

**Phase 1 (MVP):**
- OpenAI Whisper API ($0.006/minute)
- Basic transcript only
- Manual corrections allowed (future feature)

**Future Enhancement:**
- Claude Vision API for caption extraction
- Improved accuracy for audio jargon
- Context-aware corrections

**Claude Vision Availability:**
- Yes, Claude has vision capabilities (Sonnet 4.5, Opus 4)
- Can extract text from video frames
- Can identify plugins and configurations visually
- Cost: ~$3 per 1000 images analyzed
- **Marked as future feature** until budget confirmed

### 5. Duplicate Detection
**Decision:** Extract unique video ID from URL

**Implementation:**
```
TikTok URL formats:
1. https://www.tiktok.com/@username/video/7234567890123456789
2. https://vm.tiktok.com/ZMhRxYzKP/
3. https://www.tiktok.com/t/ZTRxYzKP/

Extract video ID:
- Format 1: Extract numeric ID (7234567890123456789)
- Format 2 & 3: Resolve shortened URL → Extract ID

Function: extractVideoId(url) → video_id
Check database: SELECT * FROM videos WHERE video_id = ?
```

**Database Index:**
- Unique constraint on `video_id` column
- Prevents duplicate processing
- Fast lookup for existing videos

### 6. AI Instruction Generation
**Decision:** Two-step AI process

**Step 1: Transcription**
- Whisper API converts audio → text
- Raw transcript stored in database

**Step 2: Instruction Generation**
- GPT-4 or Claude analyzes transcript
- Generates numbered step-by-step instructions
- Identifies plugin names, settings, techniques
- Formats as structured walkthrough

**Prompt Example:**
```
Given this sound design tutorial transcript, create a step-by-step 
walkthrough that music producers can follow:

[TRANSCRIPT]

Format as:
1. [Action] - [Plugin/Tool] - [Settings]
2. [Action] - [Plugin/Tool] - [Settings]
...

Focus on specific, actionable steps with exact settings mentioned.
```

### 7. Sound Type Categorization
**Decision:** AI auto-categorization with manual override

**Categories (Generic):**
- Bass
- Keys/Piano
- Vocals
- Drums/Percussion
- Synth
- Guitar
- FX/Effects
- Mixing/Mastering
- Other

**AI Categorization:**
- GPT-4/Claude analyzes title + transcript
- Returns single category
- Stored in `sound_type` column

**Manual Override:**
- Edit button on video page (future feature)
- Dropdown to change category
- Updates database immediately

**Note:** Intentionally broad categories to avoid fragmentation

---

## Feature Prioritization

### Phase 1 Features (MVP - Core Functionality)
✅ **Must Have:**
- Angular single-page application
- TikTok URL input
- Duplicate detection (check if video already transcribed)
- Basic audio transcription (Whisper API)
- AI-generated instructions (GPT-4/Claude)
- AI auto-categorization by sound type
- Two-column layout (video left, transcript right)
- Carousel navigation within author's videos
- Filter by author
- Filter by sound type
- Embed TikTok video (minimal branding)
- Store metadata in Supabase
- Deploy to Vercel

### Future Features (Post-MVP)
📅 **Phase 2:**
- Editable transcriptions (version control)
- Manual sound type correction
- Save thumbnail screenshot when video unavailable
- Improved mobile responsive design

📅 **Phase 3:**
- Claude Vision for caption extraction
- Plugin detection in video frames
- Screenshot extraction at specific timestamps
- Link screenshots to instruction steps
- Batch URL import

📅 **Phase 4:**
- User authentication (TikTok OAuth)
- Personal libraries (multi-user support)
- Favorites/bookmarks
- Share individual transcriptions

📅 **Phase 5:**
- Advanced search (full-text across transcripts)
- Plugin database (searchable plugin chains)
- Recommendation engine
- Export library as JSON

📅 **Phase 6:**
- Transcript versioning and history
- Collaborative editing
- Community contributions
- API for third-party integrations

---

## Technology Stack

### Frontend
- **Framework:** Angular 18+ (Standalone Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State Management:** Angular Signals (Reactive)
- **HTTP Client:** Angular HttpClient
- **Forms:** Reactive Forms
- **Routing:** Angular Router

### Backend (Primary)
- **Language:** TypeScript/Node.js 18+
- **Runtime:** Vercel Serverless Functions
- **AI APIs:**
  - OpenAI Whisper (transcription)
  - OpenAI GPT-4 or Anthropic Claude (instructions)
- **Video Processing:** 
  - TikTok Downloader API (tikwm.com or similar)
  - URL resolvers for shortened links

### Backend (Optional - Go Services)
- **Language:** Go 1.21+
- **Use Cases:**
  - Heavy video processing tasks
  - Background workers
  - Performance-critical operations
- **Hosting:** Fly.io (free tier: 3 VMs, 256MB each)

### Database & Storage
- **Database:** Supabase (PostgreSQL 15)
- **Storage:** Supabase Storage (thumbnails, screenshots)
- **Auth:** Supabase Auth (future feature)

### External APIs
- **TikTok Download:** TikWM API (free tier)
- **Transcription:** OpenAI Whisper API ($0.006/min)
- **AI Instructions:** 
  - Option A: OpenAI GPT-4 (~$0.01/1K tokens)
  - Option B: Anthropic Claude (Sonnet 4.5 via existing subscription)
- **Vision (Future):** Claude Vision API (~$3/1K images)

### Deployment
- **Frontend + API:** Vercel (free tier)
- **Optional Go Services:** Fly.io (free tier)
- **Database:** Supabase (free tier: 500MB storage, 2GB bandwidth)
- **Domain:** Custom domain via Vercel (free SSL)

---

## Data Model

### Database Schema

#### Table: `videos`
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Video identifiers
  tiktok_url TEXT NOT NULL,
  video_id TEXT UNIQUE NOT NULL,  -- Extracted from URL for deduplication
  
  -- Metadata
  author TEXT NOT NULL,           -- @username
  title TEXT,
  sound_type TEXT,                -- bass, keys, vocals, etc.
  duration INTEGER,               -- seconds
  
  -- Content
  transcript TEXT,                -- Raw Whisper output
  instructions TEXT,              -- AI-generated walkthrough
  
  -- Media
  thumbnail_url TEXT,             -- Supabase Storage URL
  embed_code TEXT,                -- TikTok embed iframe
  
  -- Tags & categorization
  tags TEXT[],                    -- Array of tags
  
  -- Metadata
  is_available BOOLEAN DEFAULT true,  -- Video still accessible?
  processed_at TIMESTAMPTZ,       -- When transcription completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_video_id UNIQUE(video_id)
);

-- Indexes for performance
CREATE INDEX idx_videos_author ON videos(author);
CREATE INDEX idx_videos_sound_type ON videos(sound_type);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_video_id ON videos(video_id);

-- Full-text search index (future)
CREATE INDEX idx_videos_transcript_search ON videos 
  USING GIN(to_tsvector('english', transcript));
```

#### Table: `video_screenshots` (Future Feature)
```sql
CREATE TABLE video_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Screenshot data
  image_url TEXT NOT NULL,        -- Supabase Storage URL
  timestamp_seconds REAL,         -- Where in video (e.g., 12.5 seconds)
  
  -- AI analysis
  description TEXT,               -- Claude Vision description
  detected_plugin TEXT,           -- Plugin name if detected
  instruction_step INTEGER,       -- Links to step # in instructions
  
  -- Metadata
  order_index INTEGER,            -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_screenshots_video ON video_screenshots(video_id);
CREATE INDEX idx_screenshots_timestamp ON video_screenshots(timestamp_seconds);
```

#### Table: `transcript_versions` (Future Feature)
```sql
CREATE TABLE transcript_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Version data
  version INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  instructions TEXT NOT NULL,
  
  -- Tracking
  edited_by TEXT,                 -- User who made changes
  edit_notes TEXT,                -- What was changed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_video_version UNIQUE(video_id, version)
);
```

### Data Relationships

```
videos (1) ──────── (many) video_screenshots
  │
  └──────────────── (many) transcript_versions
```

### Storage Structure (Supabase Storage)

```
sound-design-library/
├── thumbnails/
│   └── {video_id}.jpg
├── screenshots/
│   └── {video_id}/
│       ├── frame_001.jpg
│       ├── frame_002.jpg
│       └── ...
└── fallback/
    └── {video_id}_unavailable.jpg
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────┐
│         User Browser (Angular SPA)          │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────┐
│         Vercel Edge Network                 │
│  ┌─────────────────────────────────────┐   │
│  │   Angular Static Files (SSR)        │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │   Serverless Functions (Node.js)    │   │
│  │   ├─ POST /api/check-video          │   │
│  │   ├─ POST /api/process-video        │   │
│  │   ├─ GET  /api/videos                │   │
│  │   └─ GET  /api/videos/:id           │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        ▼                     ▼              ▼
┌───────────────┐    ┌─────────────┐   ┌─────────────┐
│   Supabase    │    │  OpenAI API │   │  TikTok     │
│   PostgreSQL  │    │  - Whisper  │   │  Embed      │
│   Storage     │    │  - GPT-4    │   │             │
└───────────────┘    └─────────────┘   └─────────────┘

Optional (Future):
        ▼
┌───────────────┐
│   Fly.io      │
│   Go Services │
│   - Video     │
│     Worker    │
└───────────────┘
```

### Component Architecture

```
Angular App
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── video.service.ts         # Main video CRUD
│   │   │   ├── tiktok.service.ts        # TikTok API wrapper
│   │   │   ├── supabase.service.ts      # Database client
│   │   │   └── cache.service.ts         # Local caching
│   │   ├── models/
│   │   │   ├── video.model.ts
│   │   │   └── screenshot.model.ts
│   │   └── guards/
│   │       └── auth.guard.ts            # Future: route protection
│   │
│   ├── features/
│   │   ├── import/
│   │   │   ├── import.component.ts      # URL input form
│   │   │   └── import.component.html
│   │   │
│   │   ├── library/
│   │   │   ├── library.component.ts     # Main view
│   │   │   ├── author-list/
│   │   │   │   └── author-list.component.ts
│   │   │   ├── video-carousel/
│   │   │   │   └── carousel.component.ts
│   │   │   └── filter-bar/
│   │   │       └── filter-bar.component.ts
│   │   │
│   │   └── video-detail/
│   │       ├── video-detail.component.ts
│   │       ├── video-player/
│   │       │   └── player.component.ts  # TikTok embed
│   │       └── transcript-panel/
│   │           └── transcript.component.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── loading-spinner/
│   │   │   ├── error-message/
│   │   │   └── confirmation-dialog/
│   │   └── pipes/
│   │       └── duration.pipe.ts         # Format seconds → mm:ss
│   │
│   └── app.component.ts                 # Root component
```

### Request Flow: Adding a New Video

```
1. User pastes TikTok URL in Angular form
   ↓
2. Angular calls VideoService.checkVideo(url)
   ↓
3. API: GET /api/check-video?url={url}
   ├─ Extract video_id from URL
   ├─ Query: SELECT * FROM videos WHERE video_id = ?
   └─ Return: { exists: boolean, data?: Video }
   ↓
4. If exists: Display video immediately (skip processing)
   If not exists: Continue...
   ↓
5. Angular calls VideoService.processVideo(url)
   ↓
6. API: POST /api/process-video { url }
   ├─ Step 1: Resolve TikTok URL (if shortened)
   ├─ Step 2: Fetch metadata (author, title, duration)
   ├─ Step 3: Download audio stream
   ├─ Step 4: Transcribe with Whisper
   ├─ Step 5: Generate instructions with GPT-4
   ├─ Step 6: Categorize sound type with AI
   ├─ Step 7: Extract thumbnail (optional)
   └─ Step 8: Insert into database
   ↓
7. Return processed video data to Angular
   ↓
8. Angular updates UI with new video
   ↓
9. User sees video in library, organized by author/sound
```

---

## User Interface Design

### Layout Structure

#### Main View (Library)
```
┌────────────────────────────────────────────────────────┐
│                    Header                              │
│  Sound Design Library              [@Author ▼] [Type ▼]│
└────────────────────────────────────────────────────────┘
│                                                        │
│  Author: @producer_mike (15 videos)                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ [Bass (5)] [Vocals (7)] [Keys (3)]               │ │ Sound Type Filter
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ◀ ═══════════════════════════════════════════════ ▶  │ Carousel
│     ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐      │
│     │Video 1│  │Video 2│  │Video 3│  │Video 4│      │
│     │[Thumb]│  │[Thumb]│  │[Thumb]│  │[Thumb]│      │
│     │Title  │  │Title  │  │Title  │  │Title  │      │
│     └───────┘  └───────┘  └───────┘  └───────┘      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Video Detail View (Two-Column)
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Library            @producer_mike / Bass         │
└─────────────────────────────────────────────────────────────┘
│                              │                               │
│  ┌─────────────────────┐    │  Title: Crazy 808 Bass Chain │
│  │                     │    │  Duration: 1:23               │
│  │   TikTok Embed      │    │  Category: Bass               │
│  │     (Video)         │    │                               │
│  │                     │    │  ───────────────────────────  │
│  │      [▶️ Play]      │    │                               │
│  │                     │    │  Transcript:                  │
│  │                     │    │  "Yo check out this bass...   │
│  │                     │    │   I'm using Serum with two    │
│  │                     │    │   oscillators..."             │
│  └─────────────────────┘    │                               │
│                              │  ───────────────────────────  │
│  Next: [Video 2 →]          │                               │
│  Prev: [← Video 1]          │  Instructions:                │
│                              │  1. Open Serum synth          │
│                              │  2. Set OSC A to sine wave    │
│                              │  3. Add OSC B one octave up   │
│                              │  4. Apply Saturn saturation   │
│                              │  5. ...                       │
│                              │                               │
└─────────────────────────────────────────────────────────────┘
    Video (Left 40%)                Transcript (Right 60%)
```

### Mobile Layout (Stacked)
```
┌──────────────────────┐
│    Header            │
│  [≡] Sound Design    │
└──────────────────────┘
│                      │
│  @producer_mike      │
│  Bass (5 videos)     │
│                      │
│  ◀ ════════════════ ▶│
│    ┌──────────┐     │
│    │  Video   │     │
│    │ [Thumb]  │     │
│    │  Title   │     │
│    └──────────┘     │
│                      │
│  Tap to view →       │
│                      │
└──────────────────────┘

Video Detail (Stacked):
┌──────────────────────┐
│  ← Back              │
└──────────────────────┘
│  ┌────────────────┐  │
│  │   Video        │  │
│  │   Embed        │  │
│  └────────────────┘  │
│                      │
│  Title               │
│  @author / Bass      │
│                      │
│  Transcript:         │
│  [Full text here...] │
│                      │
│  Instructions:       │
│  1. Step one...      │
│  2. Step two...      │
│                      │
└──────────────────────┘
```

### Color Scheme & Design System

**Color Palette:**
- Primary: Purple (#9333ea)
- Secondary: Pink (#ec4899)
- Background: Dark gradient (Gray 900 → Purple 900)
- Surface: Gray 800 with opacity + backdrop blur
- Text: White / Gray 300
- Accent: Purple 400 (interactive elements)
- Success: Green 500
- Error: Red 500

**Typography:**
- Font: System fonts (San Francisco, Segoe UI, Roboto)
- Headings: 2xl-3xl, font-bold
- Body: base-lg, font-normal
- Code/Plugins: font-mono, text-sm

**Components:**
- Cards: rounded-xl, border, backdrop-blur
- Buttons: Gradient fill, shadow-lg, hover:scale-105
- Inputs: Dark theme, purple focus ring
- Carousel: Smooth horizontal scroll, snap-to-card

---

## API Design

### Endpoints

#### 1. Check if Video Exists
```
GET /api/check-video?url={tiktok_url}

Response (exists):
{
  "exists": true,
  "data": {
    "id": "uuid",
    "video_id": "7234567890",
    "author": "producer_mike",
    "title": "Crazy Bass Tutorial",
    "sound_type": "bass",
    "transcript": "...",
    "instructions": "...",
    "thumbnail_url": "...",
    "is_available": true,
    "created_at": "2024-11-13T..."
  }
}

Response (doesn't exist):
{
  "exists": false
}
```

#### 2. Process New Video
```
POST /api/process-video
Body: { "url": "https://tiktok.com/@user/video/123" }

Response (success):
{
  "success": true,
  "video": {
    "id": "uuid",
    "video_id": "7234567890",
    "author": "producer_mike",
    "title": "Crazy Bass Tutorial",
    "sound_type": "bass",
    "duration": 83,
    "transcript": "Yo check out this bass...",
    "instructions": "1. Open Serum\n2. Set OSC A...",
    "thumbnail_url": "https://...",
    "tiktok_url": "https://...",
    "embed_code": "<iframe...>",
    "created_at": "2024-11-13T..."
  }
}

Response (error):
{
  "success": false,
  "error": "Failed to download video",
  "message": "TikTok URL is invalid or video is private"
}
```

#### 3. Get Videos by Author
```
GET /api/videos?author={username}

Response:
{
  "videos": [
    { /* video object */ },
    { /* video object */ }
  ],
  "total": 15
}
```

#### 4. Get Videos by Sound Type
```
GET /api/videos?sound_type={type}

Response:
{
  "videos": [
    { /* video object */ }
  ],
  "total": 8
}
```

#### 5. Get Single Video
```
GET /api/videos/{id}

Response:
{
  "video": { /* complete video object */ }
}
```

#### 6. Get All Authors
```
GET /api/authors

Response:
{
  "authors": [
    {
      "username": "producer_mike",
      "video_count": 15,
      "sound_types": ["bass", "vocals", "keys"]
    },
    {
      "username": "beatmaker_sam",
      "video_count": 8,
      "sound_types": ["drums", "bass"]
    }
  ]
}
```

### Error Handling

**Standard Error Response:**
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": { /* optional additional context */ }
}
```

**Error Codes:**
- `INVALID_URL` - TikTok URL format incorrect
- `VIDEO_NOT_FOUND` - TikTok video doesn't exist or is private
- `TRANSCRIPTION_FAILED` - Audio transcription error
- `AI_PROCESSING_ERROR` - GPT-4/Claude API failure
- `DATABASE_ERROR` - Supabase query failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Implementation Phases

### Phase 0: Foundation Setup (Week 1)
**Goal:** Get development environment ready

**Tasks:**
1. Set up OpenAI API
   - Get API key
   - Install SDK: `npm install openai`
   - Configure environment variables

2. Set up Anthropic Claude API (optional)
   - Use existing subscription
   - Install SDK: `npm install @anthropic-ai/sdk`

3. Implement transcription service
   ```typescript
   // api/services/transcription.service.ts
   async function transcribeAudio(audioUrl: string): Promise<string>
   ```

4. Implement instruction generation
   ```typescript
   // api/services/instruction.service.ts
   async function generateInstructions(transcript: string): Promise<string>
   ```

5. Implement sound type categorization
   ```typescript
   // api/services/categorization.service.ts
   async function categorizeSoundType(title: string, transcript: string): Promise<string>
   ```

6. Update `POST /api/process-video` to:
   - Extract audio from TikTok video
   - Call Whisper for transcription
   - Call GPT-4/Claude for instructions
   - Call GPT-4/Claude for categorization
   - Store all data in database

7. Add loading states in Angular UI
   - Progress indicator during processing
   - Estimated time remaining
   - Status messages ("Transcribing...", "Generating instructions...")

8. Test full pipeline with real TikTok URLs

**Deliverable:** End-to-end working system - paste URL, get transcription + instructions

---

### Phase 4: Polish & Features (Week 5)
**Goal:** Enhance UX and add finishing touches

**Tasks:**
1. Improve carousel navigation
   - Keyboard shortcuts (← → arrows)
   - Touch gestures (swipe on mobile)
   - Auto-scroll to active video

2. Add search functionality
   - Search bar in header
   - Search across titles, transcripts, authors
   - Highlight search terms

3. Better error handling
   - User-friendly error messages
   - Retry logic for failed API calls
   - Graceful degradation

4. Performance optimization
   - Lazy load videos (virtual scrolling)
   - Image optimization (thumbnails)
   - Cache API responses

5. Add helpful features:
   - Copy transcript to clipboard
   - Copy instructions to clipboard
   - Share video link
   - "Video unavailable" fallback UI

6. Testing
   - Test with various TikTok URLs
   - Test edge cases (deleted videos, private videos)
   - Test on different browsers

7. Documentation
   - User guide (how to use the app)
   - FAQ section
   - About page

**Deliverable:** Production-ready MVP

---

### Phase 5: Go Microservices (Week 6-7) 🚀
**Goal:** Build Go services for video processing & real-time features

**Week 6 - Video Processing Service:**

1. Set up Go project structure
   ```bash
   mkdir video-processor
   cd video-processor
   go mod init github.com/yourusername/video-processor
   ```

2. Install dependencies
   ```bash
   go get github.com/gin-gonic/gin
   go get github.com/u2takey/ffmpeg-go
   ```

3. Implement video processor endpoints:
   ```
   POST /api/extract-audio
   - Input: video_url
   - Output: audio_url (temporary)
   - Use FFmpeg to extract audio stream
   - Return presigned URL
   
   POST /api/generate-thumbnails
   - Input: video_url, sizes[]
   - Output: thumbnail_urls[]
   - Extract frame at 2 seconds
   - Resize to multiple dimensions
   - Upload to Supabase Storage
   
   POST /api/extract-frames
   - Input: video_url, interval_seconds
   - Output: frame_urls[]
   - Extract frames at intervals
   - Detect plugin UIs (future: ML model)
   - Upload to Supabase Storage
   ```

4. Deploy to Fly.io
   ```bash
   fly launch --name sound-design-processor
   fly deploy
   ```

5. Update TypeScript API to call Go service
   ```typescript
   // api/process-video.ts
   const audioUrl = await fetch('https://sound-design-processor.fly.dev/api/extract-audio', {
     method: 'POST',
     body: JSON.stringify({ video_url: tiktokUrl })
   });
   ```

**Week 7 - Background Job Queue & WebSocket:**

1. Implement job queue in Go
   ```go
   type Job struct {
     ID        string
     VideoID   string
     Status    string  // pending, processing, complete, failed
     Progress  int     // 0-100
     CreatedAt time.Time
   }
   
   // POST /jobs - Add to queue
   // GET /jobs/:id - Check status
   // Worker goroutines process jobs concurrently
   ```

2. Build WebSocket server
   ```go
   // Real-time progress updates
   // ws://your-service.fly.dev/ws
   
   func handleWebSocket(c *gin.Context) {
     ws, _ := upgrader.Upgrade(c.Writer, c.Request, nil)
     
     // Send progress updates
     for progress := range progressChannel {
       ws.WriteJSON(progress)
     }
   }
   ```

3. Connect Angular to WebSocket
   ```typescript
   const ws = new WebSocket('ws://your-service.fly.dev/ws');
   ws.onmessage = (event) => {
     const progress = JSON.parse(event.data);
     this.processingProgress = progress.percentage;
   };
   ```

4. Test complete async flow:
   ```
   User submits URL
   → TypeScript API creates job in Go queue
   → Angular connects to WebSocket
   → Go worker processes video
   → WebSocket sends real-time updates
   → TypeScript API receives completion webhook
   → Angular displays completed video
   ```

**Deliverable:** 
- Functional Go microservices
- Real-time processing updates
- Async job processing
- Real production Go experience!

---

### Phase 6: Future Enhancements (Post-Launch)
**Features marked for later:**

1. **Editable Transcriptions**
   - Edit button on transcript
   - Save changes to database
   - Version control (keep original + edited versions)

2. **Manual Sound Type Correction**
   - Dropdown to change category
   - Update database immediately
   - Track manual overrides

3. **Thumbnail Fallback**
   - Save thumbnail when video is first processed
   - Display thumbnail if video becomes unavailable
   - "Video unavailable" overlay on thumbnail

4. **Claude Vision Integration**
   - Extract captions from video frames
   - Detect plugins visually
   - Enhance transcription accuracy with on-screen text

5. **Plugin Screenshot Extraction**
   - Detect frames showing plugin UIs
   - Save screenshots to Supabase Storage
   - Link screenshots to instruction steps
   - OCR to extract plugin settings

6. **Batch Import**
   - Paste multiple URLs at once
   - Process in background queue
   - Progress dashboard

7. **User Authentication**
   - TikTok OAuth login
   - Personal video libraries
   - Private vs public videos

8. **Advanced Search**
   - Full-text search with ranking
   - Filter by multiple criteria
   - Save search queries

9. **Go Backend Services**
   - Heavy video processing in Go
   - Background job queue
   - Deploy to Fly.io

10. **Community Features**
    - User comments on videos
    - Ratings and favorites
    - Share collections
    - Collaborative editing

11. **Monetization**
    - Google AdSense integration
    - Ad placement between carousel items
    - Non-intrusive banner ads
    - Revenue tracking dashboard

---

## Open Questions

### Questions Requiring Decisions:

1. **API Budget**
   - What's your monthly budget for OpenAI/Claude API calls?
   - At $0.006/min transcription, how many videos/month do you expect?
   - Example: 100 videos × 1 min avg = $0.60/month
   - Claude subscription: Already covered for instructions?

2. **Video Embedding Strategy**
   - TikTok embed with iframe (easiest, has branding)
   - Download + re-host as MP4 (no branding, but storage + copyright)
   - Hybrid: Try embed, fallback to error message if unavailable
   - **Recommendation:** Start with iframe embedding

3. **TikTok API Access**
   - Official TikTok API requires approval (slow process)
   - Third-party APIs (tikwm.com) - free but less reliable
   - **Recommendation:** Use tikwm.com for MVP, migrate to official if needed

4. **Shortened URL Resolution**
   - TikTok uses vm.tiktok.com and tiktok.com/t/ for short URLs
   - Need to resolve these to full URLs before extracting video_id
   - Add URL resolution step in backend

5. **Audio Extraction Method**
   - Download full video, extract audio (requires storage)
   - Stream audio directly (if API supports)
   - **Recommendation:** Download temporarily, extract audio, delete video

6. **Categorization Accuracy**
   - What if AI categorizes incorrectly (e.g., "Bass" when it's actually "Vocals")?
   - Add confidence score from AI?
   - Allow manual correction immediately vs later phase?
   - **Recommendation:** Accept AI categorization for MVP, add manual override in Phase 5

7. **Transcript Formatting**
   - Raw transcript (no punctuation, no formatting)
   - Formatted with paragraphs and punctuation
   - Timestamped (each line has timestamp)
   - **Recommendation:** Formatted with punctuation for readability

8. **Instructions Format**
   - Numbered list (1. 2. 3.)
   - Grouped by section (Introduction, Processing, Final Mix)
   - Markdown formatting (bold, italic, code blocks)
   - **Recommendation:** Simple numbered list for MVP

9. **Handling Long Videos**
   - TikTok max length is 10 minutes
   - Whisper API has limits
   - Split long audio into chunks?
   - **Recommendation:** Most music tutorials are <3 min, handle edge case later

10. **Storage vs Embedding Trade-off**
    - Current decision: Embed only (no video storage)
    - What if TikTok blocks embedding?
    - Backup plan: Switch to downloading + storing
    - **Recommendation:** Monitor embed success rate, pivot if needed

---

## Cost Analysis

### Development Phase Costs (MVP)

**Free Tier Services:**
- Vercel: Free (hobby tier)
  - 100GB bandwidth/month
  - 100 GB-hours compute
  - Serverless functions
  
- Supabase: Free tier
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth/month
  - 50,000 monthly active users
  
- Angular/TypeScript: Free (open source)

**Paid Services (Usage-based):**
- OpenAI Whisper API: $0.006/minute
  - 100 videos × 1 min avg = $0.60
  - 500 videos = $3.00
  - 1,000 videos = $6.00

- OpenAI GPT-4 API: ~$0.03/1K tokens
  - Estimate 500 tokens per video (instructions + categorization)
  - 100 videos = $1.50
  - 500 videos = $7.50
  - 1,000 videos = $15.00

- Anthropic Claude (Alternative):
  - You have existing subscription
  - May have usage limits
  - Check API quota

**Total MVP Cost (100 videos):**
- Transcription: $0.60
- Instructions: $1.50
- Total: ~$2.10 for 100 videos
- **Very affordable for initial testing**

**Total MVP Cost (1,000 videos):**
- Transcription: $6.00
- Instructions: $15.00
- Total: ~$21.00
- **Still reasonable for a growing library**

### Future Feature Costs

**Claude Vision (Phase 5):**
- ~$3 per 1,000 images
- 10 screenshots per video × 100 videos = 1,000 images = $3
- Only enable when budget allows

**Video Storage (If needed):**
- Supabase: $0.021/GB/month
- 1 min video ≈ 5-10MB
- 1,000 videos ≈ 5-10GB = $0.10-0.21/month
- **Very cheap even for large library**

**Scaling Costs (Beyond Free Tier):**
- Vercel Pro: $20/month (if traffic exceeds free tier)
- Supabase Pro: $25/month (if database exceeds 500MB)
- **Unlikely to hit these limits in MVP phase**

### Cost-Saving Strategies

1. **Batch Processing**
   - Process multiple videos in single API call when possible
   - Reduces overhead

2. **Cache Responses**
   - Cache AI-generated content
   - Don't regenerate if video already processed

3. **Rate Limiting**
   - Limit number of videos processed per day
   - Prevents accidental cost spikes

4. **Use Claude Subscription**
   - If you have unlimited Claude access via subscription
   - Use Claude for instructions instead of GPT-4
   - Saves ~$15 per 1,000 videos

5. **Optimize Prompts**
   - Shorter prompts = fewer tokens = lower cost
   - Test and refine prompts for efficiency

---

## Technical Considerations

### URL Resolution for Shortened Links

**Problem:**
TikTok creates multiple URL formats:
- `vm.tiktok.com/abc123` (short)
- `tiktok.com/t/abc123` (short)
- `tiktok.com/@user/video/7234567890` (full)

**Solution:**
```typescript
async function resolveShortUrl(url: string): Promise<string> {
  if (url.includes('vm.tiktok.com') || url.includes('/t/')) {
    // Follow redirect to get full URL
    const response = await fetch(url, { 
      redirect: 'follow',
      method: 'HEAD' 
    });
    return response.url; // Full URL after redirects
  }
  return url; // Already full URL
}

function extractVideoId(fullUrl: string): string {
  const match = fullUrl.match(/video\/(\d+)/);
  if (!match) throw new Error('Invalid TikTok URL');
  return match[1];
}
```

### Audio Extraction Strategy

**Approach:**
1. Download video temporarily to `/tmp`
2. Extract audio using TikTok API response (audio URL)
3. Send audio to Whisper API
4. Delete temporary files
5. Store only metadata + transcript

**Alternative (If TikTok API provides audio URL):**
- Skip download, use audio URL directly
- Faster, no temporary storage needed

### Duplicate Detection Flow

```
User submits URL: https://vm.tiktok.com/abc123
  ↓
1. Resolve shortened URL → https://tiktok.com/@user/video/7234567890
  ↓
2. Extract video_id → "7234567890"
  ↓
3. Check database: SELECT * FROM videos WHERE video_id = '7234567890'
  ↓
4. If found → Return existing video (instant)
   If not found → Process video (2-3 minutes)
```

### Error Recovery

**Scenario 1: Transcription Fails**
- Retry up to 3 times with exponential backoff
- If still fails, store video with `transcript: null`
- Mark for manual review
- User sees "Transcription unavailable" message

**Scenario 2: Video Becomes Unavailable**
- Store `is_available: false` in database
- Display "Video unavailable" message
- Keep transcript and instructions accessible
- Show thumbnail if saved

**Scenario 3: Rate Limit Hit**
- Queue video for processing later
- Show "Processing delayed" message
- Process in background overnight

### Performance Optimizations

**1. Lazy Loading**
```typescript
// Only load videos in viewport
<cdk-virtual-scroll-viewport itemSize="200">
  <div *cdkVirtualFor="let video of videos">
    <!-- Video card -->
  </div>
</cdk-virtual-scroll-viewport>
```

**2. Image Optimization**
- Generate thumbnails at multiple sizes (150x150, 300x300, 600x600)
- Use WebP format for smaller file sizes
- Lazy load images below fold

**3. API Response Caching**
```typescript
// Cache frequently accessed data
@Injectable()
export class CacheService {
  private cache = new Map<string, any>();
  
  get(key: string) { return this.cache.get(key); }
  set(key: string, value: any) { this.cache.set(key, value); }
}
```

**4. Database Indexing**
- Already covered in schema (indexes on author, sound_type, video_id)
- Speeds up filter queries significantly

---

## Security Considerations

### API Security

**1. Rate Limiting**
```typescript
// Prevent abuse - limit API calls per IP
const rateLimiter = {
  maxRequests: 10,
  windowMs: 60000 // 1 minute
};
```

**2. Input Validation**
```typescript
// Validate TikTok URL format
function isValidTikTokUrl(url: string): boolean {
  return /tiktok\.com/.test(url) || /vm\.tiktok\.com/.test(url);
}
```

**3. CORS Configuration**
```typescript
// Only allow requests from your domain
const corsOptions = {
  origin: 'https://yourdomain.com',
  methods: ['GET', 'POST']
};
```

**4. API Key Protection**
- Store in environment variables
- Never commit to Git
- Use Vercel environment variables

**5. SQL Injection Prevention**
- Use Supabase parameterized queries (built-in protection)
- Never concatenate user input into queries

### Future: Authentication

**Phase 5 - User Accounts:**
- Use Supabase Auth (email/password or OAuth)
- Row-level security in PostgreSQL
- Only owners can edit their transcriptions
- Public/private video settings

---

## Monitoring & Analytics

### Key Metrics to Track

**Usage Metrics:**
- Videos processed per day
- Total videos in database
- Unique authors
- Videos per sound type

**Performance Metrics:**
- Average processing time per video
- Transcription accuracy (manual spot checks)
- API error rates
- Page load times

**Cost Metrics:**
- OpenAI API spend per day
- Supabase storage usage
- Bandwidth consumption

### Monitoring Tools

**Vercel Analytics (Built-in):**
- Page views
- Load times
- Core Web Vitals

**Supabase Dashboard:**
- Database size
- Query performance
- Storage usage

**Custom Logging:**
```typescript
// Log processing events
await supabase.from('processing_logs').insert({
  video_id,
  step: 'transcription',
  duration_ms: 2300,
  success: true
});
```

---

## Next Steps

### Immediate Actions (This Week)

1. **Decision Time:**
   - ✅ Confirm: Supabase for database
   - ✅ Confirm: TypeScript/Node.js for backend
   - ✅ Confirm: Vercel for hosting
   - ❓ Decide: OpenAI vs Claude for AI tasks
   - ❓ Confirm: Monthly budget for API calls

2. **Setup Tasks:**
   ```bash
   # Create Angular project
   ng new sound-design-library --standalone --routing --style=css
   cd sound-design-library
   
   # Install dependencies
   npm install @supabase/supabase-js
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init
   
   # Initialize Git
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Supabase Setup:**
   - Go to supabase.com
   - Create new project: "sound-design-library"
   - Save credentials (URL, anon key, service_role key)
   - Run SQL to create tables (from Data Model section)

4. **Vercel Setup:**
   - Push to GitHub
   - Import project in Vercel
   - Connect repository
   - Deploy (will auto-deploy on every push)

5. **Get API Keys:**
   - OpenAI: platform.openai.com/api-keys
   - Anthropic: console.anthropic.com (if using Claude)
   - Add to Vercel environment variables

### Week 1 Goals

- ✅ Angular app running locally
- ✅ Tailwind CSS configured
- ✅ Basic component structure created
- ✅ Supabase connected and tables created
- ✅ Deployed to Vercel (even if just blank page)

### Week 2 Goals

- ✅ UI built with mock data
- ✅ Carousel navigation working
- ✅ Filters working (author, sound type)
- ✅ Video detail view layout complete
- ✅ Responsive design tested

### Week 3 Goals

- ✅ Backend API endpoints created
- ✅ TikTok video ID extraction working
- ✅ Database read/write operations working
- ✅ `/api/check-video` endpoint functional

### Week 4 Goals

- ✅ Whisper transcription integrated
- ✅ GPT-4/Claude instruction generation working
- ✅ Sound type categorization working
- ✅ Full pipeline tested with real videos

### Week 5 Goals

- ✅ UI polish and refinements
- ✅ Error handling improved
- ✅ Performance optimized
- ✅ Documentation completed
- ✅ Ready for production use

---

## Success Criteria

### MVP Success = All of These Work:

1. ✅ User can paste any TikTok URL
2. ✅ System detects if already processed (no duplicates)
3. ✅ New videos are transcribed automatically
4. ✅ AI generates readable step-by-step instructions
5. ✅ Videos are categorized by sound type (bass, vocals, etc.)
6. ✅ Videos are organized by author
7. ✅ Carousel navigation is smooth and intuitive
8. ✅ Filters work (author, sound type)
9. ✅ Two-column layout displays properly
10. ✅ Works on desktop and mobile
11. ✅ Deployed and accessible via public URL
12. ✅ Processing time < 3 minutes per video

### Quality Metrics:

- **Transcription Accuracy:** >85% (spot check 10 videos)
- **Categorization Accuracy:** >90% correct sound type
- **Processing Speed:** Average 2 minutes per 1-minute video
- **Uptime:** >99% (Vercel + Supabase)
- **User Experience:** Can add and view video in <3 clicks

---

## Risk Mitigation

### Risk 1: TikTok API Changes
**Mitigation:** Use multiple API providers, have fallback options

### Risk 2: High API Costs
**Mitigation:** Set monthly spending limits, implement rate limiting

### Risk 3: Poor Transcription Quality
**Mitigation:** Add manual edit feature (Phase 5), use Claude Vision to enhance

### Risk 4: Videos Getting Deleted
**Mitigation:** Accept data loss, focus on transcription value, add thumbnail fallback

### Risk 5: User Abuse (Spam)
**Mitigation:** Rate limiting, captcha (future), user auth (Phase 5)

---

## Glossary

**Terms Used in This Document:**

- **Video ID:** Unique numeric identifier from TikTok URL (e.g., 7234567890)
- **Transcript:** Raw text output from speech-to-text (Whisper)
- **Instructions:** AI-generated step-by-step walkthrough
- **Sound Type:** Category (bass, vocals, keys, drums, etc.)
- **Carousel:** Horizontal scrolling list of videos
- **Embed:** Display TikTok video using iframe (no download)
- **Deduplication:** Preventing same video from being processed twice
- **MVP:** Minimum Viable Product (core features only)
- **Supabase:** Backend-as-a-Service (database + storage + auth)
- **Serverless Functions:** Backend code that runs on-demand (Vercel)

---

## Appendix: Example Data

### Example Video Object (Database)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "video_id": "7234567890123456789",
  "tiktok_url": "https://www.tiktok.com/@producer_mike/video/7234567890123456789",
  "author": "producer_mike",
  "title": "Insane 808 Bass Tutorial",
  "sound_type": "bass",
  "duration": 83,
  "transcript": "Yo what's up guys, today I'm gonna show you how to make this crazy 808 bass that hits super hard in the mix. First thing, open up Serum. Set oscillator A to a sine wave at the root note. Now add oscillator B, also sine wave, but tune it up one octave. This gives us that thicc layered sound...",
  "instructions": "1. Open Xfer Serum synthesizer\n2. Set Oscillator A to sine wave at root note\n3. Add Oscillator B as sine wave, tune +12 semitones (one octave)\n4. Apply light saturation using Saturn 2 plugin\n5. Add compression with ratio 4:1, medium attack\n6. Use high-pass filter at 30Hz to clean up sub frequencies\n7. Add slight distortion for harmonics\n8. Final output: -6dB headroom for mastering",
  "thumbnail_url": "https://supabase.co/storage/v1/object/public/thumbnails/7234567890.jpg",
  "embed_code": "<iframe src=\"https://www.tiktok.com/embed/7234567890123456789\"></iframe>",
  "tags": ["808", "bass", "serum", "saturation", "compression"],
  "is_available": true,
  "processed_at": "2024-11-13T14:23:45Z",
  "created_at": "2024-11-13T14:20:12Z",
  "updated_at": "2024-11-13T14:23:45Z"
}
```

### Example API Response
```json
{
  "success": true,
  "video": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "author": "producer_mike",
    "title": "Insane 808 Bass Tutorial",
    "sound_type": "bass",
    "duration": 83,
    "transcript": "Yo what's up guys...",
    "instructions": "1. Open Xfer Serum...",
    "thumbnail_url": "https://...",
    "tiktok_url": "https://...",
    "created_at": "2024-11-13T14:20:12Z"
  },
  "processing_time_ms": 142000,
  "costs": {
    "transcription": 0.0084,
    "ai_processing": 0.0150
  }
}
```

---

## Document Control

**Version History:**
- v1.0 (Nov 13, 2024): Initial system design document

**Authors:**
- System Design: AI Assistant + User
- Technical Architecture: AI Assistant
- Requirements: User

**Review Status:**
- ✅ Core concept defined
- ✅ Architecture decisions made
- ✅ Feature prioritization complete
- ⏳ Awaiting final decisions on AI provider
- ⏳ Ready to begin implementation

**Next Review:** After Phase 1 completion (Week 2)

---

**END OF SYSTEM DESIGN DOCUMENT**

---

## APPENDIX A: Go Learning Path & Implementation Guide

### Why Go is Perfect for These Services

**Video Processing:**
- FFmpeg operations are CPU-bound → Go's goroutines excel here
- Process multiple videos concurrently without blocking
- Lower memory usage than Node.js for long-running processes

**Background Jobs:**
- Go's channel-based concurrency is ideal for job queues
- Worker pool pattern is native to Go
- Superior error handling with explicit error returns

**WebSocket Server:**
- Go's net/http handles thousands of concurrent connections
- Lightweight goroutine per connection
- Built-in WebSocket support (gorilla/websocket)

**Analytics:**
- Time-series data processing benefits from Go's speed
- Concurrent metric calculations
- Efficient memory management for large datasets

### Go Skills You'll Learn

**Phase 5 Implementation = Real Go Experience:**

1. **Goroutines & Concurrency**
   ```go
   // Process multiple videos in parallel
   func processVideos(videoIDs []string) {
       var wg sync.WaitGroup
       
       for _, id := range videoIDs {
           wg.Add(1)
           go func(videoID string) {
               defer wg.Done()
               processVideo(videoID)
           }(id)
       }
       
       wg.Wait() // Wait for all to complete
   }
   ```

2. **Channels for Communication**
   ```go
   // Progress updates via channels
   progressChan := make(chan Progress, 100)
   
   go func() {
       for progress := range progressChan {
           // Send to WebSocket clients
           broadcast(progress)
       }
   }()
   ```

3. **HTTP Servers with Gin**
   ```go
   router := gin.Default()
   router.POST("/api/extract-audio", extractAudioHandler)
   router.Run(":8080")
   ```

4. **Working with FFmpeg**
   ```go
   import "github.com/u2takey/ffmpeg-go"
   
   err := ffmpeg.Input(videoPath).
       Audio().
       Output(audioPath).
       Run()
   ```

5. **Error Handling Patterns**
   ```go
   func processVideo(id string) error {
       if err := downloadVideo(id); err != nil {
           return fmt.Errorf("download failed: %w", err)
       }
       
       if err := extractAudio(id); err != nil {
           return fmt.Errorf("audio extraction failed: %w", err)
       }
       
       return nil
   }
   ```

6. **Worker Pool Pattern**
   ```go
   func startWorkers(numWorkers int, jobs <-chan Job) {
       for i := 0; i < numWorkers; i++ {
           go worker(i, jobs)
       }
   }
   
   func worker(id int, jobs <-chan Job) {
       for job := range jobs {
           processJob(job)
       }
   }
   ```

7. **WebSocket Handling**
   ```go
   import "github.com/gorilla/websocket"
   
   var upgrader = websocket.Upgrader{
       CheckOrigin: func(r *http.Request) bool {
           return true // Configure properly in production
       },
   }
   
   func wsHandler(c *gin.Context) {
       conn, _ := upgrader.Upgrade(c.Writer, c.Request, nil)
       defer conn.Close()
       
       for {
           conn.WriteJSON(Progress{Status: "processing", Percent: 50})
       }
   }
   ```

8. **Interfacing with PostgreSQL**
   ```go
   import "github.com/lib/pq"
   
   db, err := sql.Open("postgres", connectionString)
   
   row := db.QueryRow("SELECT * FROM videos WHERE id = $1", videoID)
   ```

9. **Testing in Go**
   ```go
   func TestExtractAudio(t *testing.T) {
       result, err := extractAudio("test_video.mp4")
       
       if err != nil {
           t.Fatalf("expected no error, got %v", err)
       }
       
       if result == "" {
           t.Error("expected audio file path")
       }
   }
   ```

10. **Deployment to Fly.io**
    ```dockerfile
    # Dockerfile
    FROM golang:1.21-alpine AS builder
    WORKDIR /app
    COPY go.* ./
    RUN go mod download
    COPY . .
    RUN go build -o main .
    
    FROM alpine:latest
    RUN apk --no-cache add ffmpeg
    COPY --from=builder /app/main .
    EXPOSE 8080
    CMD ["./main"]
    ```

### Recommended Go Project Structure

```
video-processor/
├── cmd/
│   └── server/
│       └── main.go              # Entry point
├── internal/
│   ├── handlers/
│   │   ├── audio.go             # Audio extraction handlers
│   │   ├── thumbnails.go        # Thumbnail generation
│   │   └── frames.go            # Frame extraction
│   ├── services/
│   │   ├── ffmpeg.go            # FFmpeg wrapper
│   │   ├── storage.go           # Supabase storage client
│   │   └── queue.go             # Job queue logic
│   ├── models/
│   │   └── video.go             # Data structures
│   └── workers/
│       └── processor.go         # Background workers
├── pkg/
│   └── utils/
│       └── helpers.go           # Shared utilities
├── go.mod
├── go.sum
├── Dockerfile
└── fly.toml                     # Fly.io config
```

### Go Resources for Learning

**Official Documentation:**
- [A Tour of Go](https://go.dev/tour/) - Interactive tutorial
- [Effective Go](https://go.dev/doc/effective_go) - Best practices
- [Go by Example](https://gobyexample.com/) - Practical examples

**Concurrency:**
- [Go Concurrency Patterns](https://go.dev/blog/pipelines) - Pipelines & channels
- [Advanced Go Concurrency](https://go.dev/blog/context) - Context package

**Video/Image Processing:**
- [ffmpeg-go](https://github.com/u2takey/ffmpeg-go) - FFmpeg bindings
- [imaging](https://github.com/disintegration/imaging) - Image processing

**Web Development:**
- [Gin Web Framework](https://gin-gonic.com/docs/) - Fast HTTP router
- [gorilla/websocket](https://github.com/gorilla/websocket) - WebSocket library

### Timeline to Go Proficiency

**Week 6 (Video Processor):**
- Learn Go basics (syntax, types, functions)
- Understand goroutines and channels
- Build first HTTP server
- Work with FFmpeg
- Deploy to Fly.io

**Week 7 (Job Queue & WebSocket):**
- Master worker pools
- Implement job queue
- Build WebSocket server
- Connect services together
- Test concurrent operations

**By End of Week 7:**
- ✅ Production Go services running
- ✅ Concurrent video processing
- ✅ Real-time WebSocket updates
- ✅ Background job queue
- ✅ Deployed and scaled on Fly.io
- ✅ Real Go experience on your resume!

### Why This Approach Works

1. **Practical Learning:** You're building real features, not tutorials
2. **Gradual Complexity:** Start simple (HTTP server), add concurrency gradually
3. **Production Experience:** Deployed services handling real traffic
4. **Portfolio Piece:** Can showcase on resume/GitHub
5. **Natural Progression:** TypeScript API first (familiar), then Go (new challenge)

### Alternative: Start Go Earlier

If you want Go experience ASAP:

**Modified Timeline:**
- **Week 1-2:** Angular + TypeScript API (basic CRUD)
- **Week 3:** Build simple Go video processor (just audio extraction)
- **Week 4:** Add AI (Claude) to TypeScript API
- **Week 5:** Expand Go service (thumbnails, frames)
- **Week 6:** Add job queue + WebSocket in Go
- **Week 7:** Polish everything

This gets you into Go by Week 3, still functional MVP by Week 4.

**Your Choice:** 
- Original plan: MVP first (Week 4), Go later (Week 6-7)
- Modified plan: Go earlier (Week 3), slower MVP (Week 5)

Which timeline do you prefer?
1. Create Angular project
   ```bash
   ng new sound-design-library --standalone --routing --style=css
   ```

2. Set up Supabase account
   - Create project
   - Note credentials (URL, anon key)

3. Install dependencies
   ```bash
   npm install @supabase/supabase-js
   npm install -D tailwindcss postcss autoprefixer
   ```

4. Configure Tailwind CSS

5. Create basic project structure (folders, components)

6. Set up Vercel project (link repo)

**Deliverable:** Empty Angular app deployed to Vercel

---

### Phase 1: Database & Mock UI (Week 2)
**Goal:** Database schema + UI with mock data

**Tasks:**
1. Create database tables in Supabase
   - `videos` table with all columns
   - Indexes for performance
   
2. Build Angular components:
   - Main layout (header, navigation)
   - Import form (URL input)
   - Library view (author list, video cards)
   - Video detail view (two-column layout)
   - Carousel component (horizontal scroll)
   
3. Add mock data (5-10 fake videos)

4. Implement filters:
   - Author dropdown
   - Sound type dropdown
   - Filter logic (client-side)
   
5. Style with Tailwind (match design system)

6. Test responsive design (desktop, tablet, mobile)

**Deliverable:** Functional UI with fake data, looks complete

---

### Phase 2: Backend API (Week 3)
**Goal:** Core API endpoints without AI

**Tasks:**
1. Create `/api` folder structure

2. Implement video ID extraction
   ```typescript
   // api/utils/extract-video-id.ts
   function extractVideoId(url: string): string
   ```

3. Implement TikTok metadata fetching
   ```typescript
   // api/tiktok/fetch-metadata.ts
   async function fetchTikTokMetadata(url: string)
   ```

4. Create API endpoints:
   - `GET /api/check-video`
   - `POST /api/process-video` (stub - no AI yet)
   - `GET /api/videos`
   - `GET /api/authors`

5. Connect Supabase to API
   - Read/write operations
   - Error handling

6. Test API endpoints (Postman/Insomnia)

**Deliverable:** Working API that stores video metadata (no transcription yet)

---

### Phase 3: AI Integration (Week 4)
**Goal:** Add transcription and instruction generation

**Tasks:**
