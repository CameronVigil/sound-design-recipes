// Video model

export interface Video {
  id: string;
  video_id: string;
  tiktok_url: string;
  author: string;
  title: string | null;
  sound_type: string | null;
  duration: number | null;
  transcript: string | null;
  instructions: string | null;
  thumbnail_url: string | null;
  embed_code: string | null;
  tags: string[];
  is_available: boolean;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}
