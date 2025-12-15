// Recipe model matching backend
export interface Recipe {
  id: string;
  tiktok_url: string;
  tiktok_id: string;
  title: string;
  sound_type: string;
  creator_name: string;
  creator_handle: string;
  raw_transcription: string;
  instructions: Instruction[];
  tags: string[];
  thumbnail_url?: string;
  video_url?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface Instruction {
  step_number: number;
  description: string;
  ableton_device?: string;
  parameters?: Record<string, string>;
  notes?: string;
}

// Grouped by creator for browse view
export interface CreatorRow {
  creator_handle: string;
  creator_name: string;
  recipes: Recipe[];
}

// API response types
export interface TranscribeRequest {
  url: string;
}

export interface TranscribeResponse {
  recipe: Recipe;
  cached: boolean;
}

export interface ApiError {
  error: string;
  details?: string;
}
