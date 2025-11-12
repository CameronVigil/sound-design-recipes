# Sound Design Library

A web application for cataloging and organizing TikTok sound design tutorials with AI-powered transcription, categorization, and plugin chain extraction.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Design Philosophy](#design-philosophy)
- [Data Organization](#data-organization)
- [Technology Stack](#technology-stack)
- [User Interface Design](#user-interface-design)
- [AI Integration (Phase 7)](#ai-integration-phase-7)
- [Installation](#installation)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)

---

## Overview

Sound Design Library is a specialized tool for music producers and audio engineers to build a searchable, organized collection of TikTok sound design tutorials. The application automatically extracts video content, generates transcripts, captures plugin screenshots, and uses AI to categorize and enhance discoverability.

### Problem It Solves

Music producers often save TikTok tutorials but struggle to:
- Remember what techniques were covered
- Find specific plugin chains they've seen
- Organize tutorials by sound type or creator
- Search through saved content effectively

This app provides a structured library with automatic categorization, searchable transcripts, and visual plugin chain references.

---

## Features

### Core Features (Current)
- **TikTok Video Import** - Import videos via URL
- **Author Organization** - Videos grouped by TikTok creator
- **Sound Type Categorization** - Organized by Guitar, Piano, Sub Bass, Vocals, Drums, Synth, FX
- **Transcript Display** - Full text transcripts of tutorial content
- **Plugin Chain Visualization** - Screenshots of Ableton plugins used
- **Advanced Search** - Filter by author, sound type, or keywords
- **Responsive Design** - Works on desktop, tablet, and mobile

### Planned Features (Phase 2-6)
- **Automatic Video Download** - Direct TikTok video capture
- **AI Transcription** - Speech-to-text using Whisper or AssemblyAI
- **Frame Extraction** - Automatic plugin screenshot capture
- **Tag Generation** - Auto-generated tags from content
- **Batch Import** - Import multiple videos at once
- **Export/Backup** - Export your library as JSON
- **User Accounts** - Personal libraries with authentication

### AI-Powered Features (Phase 7)
- **Semantic Search** - Natural language search across transcripts
- **Auto-Summarization** - AI-generated video summaries
- **Smart Categorization** - Automatic sound type detection
- **Plugin Detection** - OCR and AI to extract plugin settings
- **Recommendation Engine** - Similar tutorial suggestions
- **Quality Scoring** - Rate tutorial quality and usefulness
- **Multi-language Support** - Automatic translation

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Angular App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│ Vercel Serverless│
│   Functions     │
│   (Backend API) │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬─────────────┐
    ▼         ▼              ▼             ▼
┌────────┐ ┌──────┐   ┌──────────┐  ┌──────────┐
│TikTok  │ │Speech│   │  Blob    │  │Snowflake │
│API     │ │-to-  │   │ Storage  │  │Cortex AI │
│        │ │Text  │   │          │  │          │
└────────┘ └──────┘   └──────────┘  └──────────┘
```

### Component Architecture

```
src/app/
├── components/
│   ├── import/                  # Video import form
│   ├── library/                 # Main library view
│   │   ├── author-section/      # Author grouping
│   │   ├── sound-type-section/  # Sound type grouping
│   │   └── video-card/          # Individual video cards
│   ├── video-detail/            # Video modal/detail view
│   ├── search-filter/           # Search and filter controls
│   └── plugin-chain/            # Plugin visualization
│
├── services/
│   ├── video.service.ts         # Video CRUD operations
│   ├── tiktok.service.ts        # TikTok API integration
│   ├── transcription.service.ts # Audio transcription
│   ├── storage.service.ts       # Blob storage management
│   └── snowflake.service.ts     # Snowflake AI integration
│
├── models/
│   ├── video.model.ts           # Video data structure
│   ├── plugin.model.ts          # Plugin data structure
│   └── user.model.ts            # User profile (future)
│
└── guards/
    └── auth.guard.ts            # Route protection (future)
```

### Data Flow

```
1. User Action (Import Video)
   ↓
2. Frontend Validation
   ↓
3. API Call to Vercel Function
   ↓
4. Parallel Processing:
   ├─ Download Video (TikTok API)
   ├─ Extract Audio
   ├─ Generate Transcript (Whisper API)
   ├─ Extract Frames (FFmpeg)
   └─ Detect Plugins (CV/OCR)
   ↓
5. Store Data:
   ├─ Video/Images → Vercel Blob
   └─ Metadata → Database
   ↓
6. (Phase 7) AI Enhancement:
   ├─ Auto-categorize (Snowflake Cortex)
   ├─ Generate Summary
   ├─ Extract Tags
   └─ Create Embeddings
   ↓
7. Return to Frontend
   ↓
8. Update UI (Real-time)
```

---

## Design Philosophy

### 1. **Organization-First**
The app prioritizes clear organization over flat lists. Videos are grouped by:
- **Author** - Who created the tutorial
- **Sound Type** - What instrument/sound is being processed
- **Tags** - Flexible categorization

This hierarchical structure mirrors how producers think: "I want to see all of Mike's vocal tutorials."

### 2. **Visual Learning**
Sound design is visual. The app emphasizes:
- **Plugin Screenshots** - See the exact settings used
- **Visual Hierarchy** - Clear categorization at a glance
- **Thumbnail Previews** - Quick visual scanning

### 3. **Search-Optimized**
Every video includes:
- Full transcript (searchable)
- Auto-generated tags
- Author metadata
- Sound type classification

This enables powerful search: "reverb vocals valhalla"

### 4. **Progressive Enhancement**
The app is designed in phases:
- **Phase 1**: Manual entry (test UX)
- **Phases 2-6**: Automation (video import, transcription)
- **Phase 7**: AI enhancement (semantic search, recommendations)

Each phase adds value without breaking existing functionality.

### 5. **Performance-Conscious**
- Lazy loading for large libraries
- Optimized images (thumbnails, compression)
- Efficient filtering (client-side for small datasets)
- Database indexing (for large datasets)

---

## Data Organization

### Primary Organization: Author → Sound Type → Videos

This two-level hierarchy provides maximum clarity:

```
Producer Mike (Author)
├── Vocals
│   ├── Crazy Reverb Chain for Vocals
│   └── Auto-Tune Processing Tips
├── Guitar
│   ├── Clean Guitar Tone Secrets
│   └── Distortion Layering Technique
└── Drums
    └── Punchy Kick Drum Chain

Beatmaker Sam (Author)
├── Sub Bass
│   ├── 808 Bass Processing Tutorial
│   └── Sub Bass Layer Technique
└── Piano
    └── Emotional Piano Processing
```

### Why This Structure?

1. **Author-First Benefits:**
   - Discover creators you like
   - Follow consistent teaching styles
   - Track favorite producers

2. **Sound Type Benefits:**
   - Find all tutorials for a specific instrument
   - Compare different approaches to the same sound
   - Build expertise in specific areas

3. **Flexible Search:**
   - Filter by author only
   - Filter by sound type only
   - Combine both filters
   - Free-text search across everything

### Alternative Views (Future)

- **Tag Cloud** - Visual tag-based navigation
- **Timeline** - Chronological order
- **Favorites** - Bookmarked tutorials
- **Playlists** - Custom collections

---

## Technology Stack

### Frontend
- **Framework**: Angular 18+ (Standalone Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals (Reactive)
- **HTTP Client**: Angular HttpClient
- **Forms**: Reactive Forms

### Backend (Vercel Serverless)
- **Runtime**: Node.js 18+
- **Functions**: Vercel Serverless Functions
- **Storage**: Vercel Blob Storage
- **Database**: PostgreSQL (Supabase) or Snowflake

### APIs & Services
- **TikTok Download**: TikWM API
- **Transcription**: OpenAI Whisper or AssemblyAI
- **Video Processing**: FFmpeg
- **OCR**: Tesseract.js or Google Vision API

### AI Layer (Phase 7)
- **Platform**: Snowflake Cortex AI
- **LLMs**: Llama 3.1, Mistral Large 2
- **Functions**: 
  - SUMMARIZE (video summaries)
  - SENTIMENT (quality scoring)
  - COMPLETE (categorization, tagging)
  - TRANSLATE (multi-language)
  - Document AI (plugin extraction)
  - Cortex Search (semantic search)

### Deployment
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions (automatic)
- **Domain**: Custom domain via Vercel
- **SSL**: Automatic (Vercel)

---

## User Interface Design

### Design System

**Color Palette:**
- Primary: Purple (#9333ea)
- Secondary: Pink (#ec4899)
- Background: Dark gradient (Gray 900 → Purple 900)
- Text: White / Gray 300
- Accents: Purple 400 (icons, highlights)

**Typography:**
- Headings: Bold, 2xl-3xl
- Body: Regular, base-lg
- Tags: Small, xs-sm

**Components:**
- Cards: Rounded-xl, backdrop blur, border glow
- Buttons: Gradient fill, hover effects
- Inputs: Dark theme, purple focus ring
- Modals: Full-screen overlay, centered content

### Layout Structure

#### Import View
```
┌─────────────────────────────┐
│         Header              │
├─────────────────────────────┤
│                             │
│    ┌─────────────────┐      │
│    │  URL Input      │      │
│    │  [Import Btn]   │      │
│    │                 │      │
│    │  Info Box       │      │
│    │  • Step 1       │      │
│    │  • Step 2       │      │
│    │  • Step 3       │      │
│    └─────────────────┘      │
│                             │
└─────────────────────────────┘
```

#### Library View
```
┌─────────────────────────────────────────┐
│              Header                     │
├─────────────────────────────────────────┤
│  [Search] [Author ▼] [Sound Type ▼]    │
├─────────────────────────────────────────┤
│                                         │
│  👤 @producer_mike (12 videos)          │
│                                         │
│  🎵 Vocals                              │
│  ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Video │ │Video │ │Video │           │
│  │  1   │ │  2   │ │  3   │           │
│  └──────┘ └──────┘ └──────┘           │
│                                         │
│  🎸 Guitar                              │
│  ┌──────┐ ┌──────┐                    │
│  │Video │ │Video │                    │
│  │  4   │ │  5   │                    │
│  └──────┘ └──────┘                    │
│                                         │
│  👤 @beatmaker_sam (8 videos)          │
│  ...                                   │
└─────────────────────────────────────────┘
```

#### Video Detail Modal
```
┌─────────────────────────────────────────┐
│  Title                          [X]     │
│  @author • Sound Type • Duration       │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     Video Player                │   │
│  │         [▶️]                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  #tag1 #tag2 #tag3                     │
│                                         │
│  📄 Transcript                          │
│  Lorem ipsum dolor sit amet...         │
│                                         │
│  🔌 Plugin Chain                        │
│  ┌─────────┐ ┌─────────┐              │
│  │Plugin 1 │ │Plugin 2 │              │
│  │ [Image] │ │ [Image] │              │
│  │  Name   │ │  Name   │              │
│  └─────────┘ └─────────┘              │
│                                         │
└─────────────────────────────────────────┘
```

### Responsive Design

**Desktop (1280px+)**
- 3 columns of video cards
- Full sidebar with filters
- Modal at 80% width

**Tablet (768px - 1279px)**
- 2 columns of video cards
- Collapsible sidebar
- Modal at 90% width

**Mobile (< 768px)**
- 1 column of video cards
- Bottom sheet filters
- Full-screen modal

---

## AI Integration (Phase 7)

### Snowflake Cortex Features

#### 1. Auto-Summarization
```sql
SELECT 
  video_id,
  SNOWFLAKE.CORTEX.SUMMARIZE(transcript) as summary
FROM videos;
```

**Benefits:**
- Quick overview without watching full video
- Easier library browsing
- Better search results

#### 2. Smart Categorization
```sql
SELECT 
  SNOWFLAKE.CORTEX.COMPLETE('mistral-large2',
    'Categorize this tutorial: ' || title || '. 
     Return ONE of: Guitar, Piano, Sub Bass, Vocals, 
     Drums, Synth, FX, Other'
  ) as sound_type
FROM videos;
```

**Benefits:**
- Automatic organization
- Consistent categorization
- Reduced manual work

#### 3. Semantic Search
```sql
SELECT 
  video_id, 
  title,
  CORTEX_SEARCH.SEARCH(video_search, 
    'warm analog reverb for vocals'
  ) as relevance
FROM videos
ORDER BY relevance DESC;
```

**Benefits:**
- Natural language search
- Finds conceptually similar content
- Better than keyword matching

#### 4. Plugin Settings Extraction
```sql
SELECT 
  SNOWFLAKE.CORTEX.PARSE_DOCUMENT(
    plugin_screenshot_url,
    {'mode': 'LAYOUT'}
  ) as extracted_text
FROM plugin_images;
```

**Benefits:**
- Searchable plugin settings
- Compare configurations
- Learn exact parameters

#### 5. Quality Scoring
```sql
SELECT 
  video_id,
  SNOWFLAKE.CORTEX.SENTIMENT(transcript) as quality_score
FROM videos;
```

**Benefits:**
- Surface best tutorials
- Filter low-quality content
- Data-driven curation

### AI Enhancement Workflow

```
1. User imports video
   ↓
2. Basic processing (video, transcript, screenshots)
   ↓
3. Store in Snowflake
   ↓
4. AI Enhancement Pipeline:
   ├─ Generate summary (SUMMARIZE)
   ├─ Detect sound type (COMPLETE)
   ├─ Extract tags (COMPLETE)
   ├─ Score quality (SENTIMENT)
   ├─ Parse plugin settings (PARSE_DOCUMENT)
   └─ Create embeddings (EMBED_TEXT_768)
   ↓
5. Update database with AI data
   ↓
6. Enable advanced features:
   ├─ Semantic search
   ├─ Recommendations
   └─ Natural language queries
```

---

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git
- Vercel CLI (optional)

### Quick Start

```bash
# Clone repository
git clone https://github.com/yourusername/sound-design-library.git
cd sound-design-library

# Install dependencies
npm install

# Start development server
ng serve

# Open browser
# Visit http://localhost:4200
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

### Environment Variables

Create `.env` file:
```bash
# Phase 2-6
VITE_TIKTOK_API_KEY=your_key
VITE_WHISPER_API_KEY=your_key
VITE_BACKEND_URL=your_url

# Phase 7
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_user
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
```

---

## Development Roadmap

### ✅ Phase 1: Core Frontend (Weeks 1-2)
- [x] Angular app setup
- [x] Tailwind CSS styling
- [x] Manual video entry
- [x] Library organization (author/sound type)
- [x] Search and filter
- [x] Video detail modal
- [x] Vercel deployment

### 🚧 Phase 2: TikTok Import (Weeks 3-4)
- [ ] TikTok API integration
- [ ] Video download
- [ ] Metadata extraction
- [ ] Thumbnail generation
- [ ] Vercel Blob storage

### 📅 Phase 3: Transcription (Weeks 5-6)
- [ ] Audio extraction
- [ ] Whisper/AssemblyAI integration
- [ ] Transcript generation
- [ ] Transcript storage

### 📅 Phase 4: Plugin Extraction (Weeks 7-8)
- [ ] Frame extraction (FFmpeg)
- [ ] Plugin detection (CV/OCR)
- [ ] Screenshot storage
- [ ] Plugin chain ordering

### 📅 Phase 5: Database (Weeks 9-10)
- [ ] PostgreSQL/Supabase setup
- [ ] Data migration
- [ ] CRUD APIs
- [ ] Backup/restore

### 📅 Phase 6: Polish (Weeks 11-12)
- [ ] Batch import
- [ ] Export functionality
- [ ] Keyboard shortcuts
- [ ] Loading states
- [ ] Error handling
- [ ] Analytics

### 📅 Phase 7: AI Integration (Weeks 13-16)
- [ ] Snowflake setup
- [ ] Auto-summarization
- [ ] Smart categorization
- [ ] Semantic search
- [ ] Plugin extraction AI
- [ ] Recommendations

---

## Contributing

### Development Guidelines

1. **Code Style**
   - Follow Angular style guide
   - Use TypeScript strict mode
   - 2 spaces for indentation
   - Meaningful variable names

2. **Component Structure**
   - Use standalone components
   - Keep components under 300 lines
   - Extract reusable logic to services
   - Use OnPush change detection

3. **Commit Messages**
   - Format: `type(scope): message`
   - Types: feat, fix, docs, style, refactor, test
   - Example: `feat(import): add batch import support`

4. **Testing**
   - Write unit tests for services
   - Write component tests for complex logic
   - Aim for 80%+ coverage

### Project Structure Rules

- `/components` - UI components only
- `/services` - Business logic and API calls
- `/models` - TypeScript interfaces and types
- `/guards` - Route protection
- `/pipes` - Data transformation
- `/directives` - DOM manipulation

---

## License

MIT License - See LICENSE file for details

---

## Contact

- **GitHub**: [github.com/yourusername/sound-design-library](https://github.com/yourusername/sound-design-library)
- **Issues**: [github.com/yourusername/sound-design-library/issues](https://github.com/yourusername/sound-design-library/issues)
- **Email**: your.email@example.com

---

## Acknowledgments

- TikTok API providers
- OpenAI (Whisper)
- Snowflake (Cortex AI)
- Vercel (Hosting)
- Angular Team
- Tailwind CSS

---

**Built with ❤️ for music producers**





















# SoundDesignRecipes

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
