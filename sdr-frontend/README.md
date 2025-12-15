# SDR Frontend - Sound Design Recipes

Angular 18 frontend for the Sound Design Recipes platform. Browse TikTok sound design tutorials with step-by-step Ableton instructions.

## Design

- **Colors**: Black, off-white, dark green, earth tones
- **Typography**: Serif fonts (Fraunces display, Source Serif body)
- **Cards**: Glassmorphism with hover states
- **Layout**: Netflix-style horizontal scrolling rows

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend running at `https://sdr-backend.fly.dev` (or update `environment.ts`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

### Build for Production

```bash
npm run build
```

Output will be in `dist/sdr-frontend/`.

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── browse/           # Main feed with creator rows
│   │   ├── recipe-card/      # Glassmorphism card with hover states
│   │   ├── recipe-expanded/  # Full recipe view (video + instructions)
│   │   └── search-bar/       # Search + URL submission
│   ├── models/
│   │   └── recipe.model.ts   # TypeScript interfaces
│   ├── services/
│   │   └── recipe.service.ts # API communication
│   ├── app.component.ts      # Root component with header
│   └── app.routes.ts         # Route configuration
├── environments/
│   └── environment.ts        # API URL config
├── styles.scss               # Global design system
└── index.html               # Entry HTML with fonts
```

## Features

### MVP (Current)

- [x] Browse recipes in horizontal-scroll rows (grouped by creator)
- [x] Glassmorphism recipe cards with 3 states (rest, hover, expanded)
- [x] Featured recipe hero section
- [x] Expanded recipe view with video + step-by-step instructions
- [x] Search bar that accepts TikTok URLs for transcription
- [x] Responsive design
- [x] Loading, error, and empty states

### Upcoming

- [ ] Audio preview on card hover
- [ ] Search/filter by sound type, creator, tags
- [ ] User accounts (Supabase Auth)
- [ ] Comments on recipes
- [ ] Sound-to-recipe reverse engineering

## Connecting to Backend

The frontend expects these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/recipes` | GET | Get all recipes |
| `/api/recipes/:id` | GET | Get single recipe |
| `/api/recipes/search?q=` | GET | Search recipes |
| `/api/transcribe` | POST | Submit TikTok URL |

Update `src/environments/environment.ts` if your backend URL differs:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-backend.fly.dev/api'
};
```

## Design Tokens

All design values are in CSS custom properties in `styles.scss`:

```scss
// Colors
--color-black: #0a0a09;
--color-off-white: #f5f3ef;
--color-green-dark: #1a2f23;
--color-green-forest: #2d4a3e;
--color-green-sage: #4a6b5d;
--color-earth-warm: #8b7355;
--color-earth-clay: #a67c52;

// Spacing
--space-xs through --space-3xl

// Card dimensions
--card-width: 280px;
--card-height: 340px;
```

## License

Private - Cam's project
