import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './core/services/supabase';
import { OnInit } from '../../node_modules/@angular/core/index';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{
  protected readonly title = signal('sound-design-recipes');

  videos: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private supabase: SupabaseService) { }


  async ngOnInit() {
    try {
      this.videos = await this.supabase.getVideos();
      this.loading = false;
      console.log('Videos fetched:', this.videos);



    } catch (err: any){
      this.error = err.message;
      this.loading = false;
      console.error('Error:', err);
    }


  }

  async addTestVideo() {
    try {
      const testVideo = {
        video_id: 'test_' + Date.now(),
        tiktok_url: 'https://tiktok.com/@test/video/123',
        author: 'test_user',
        title: 'Test Video',
        sound_type: 'bass',
        tags: [],
        is_available: true
      };
      const result = await this.supabase.insertVideo(testVideo);
      console.log('Video added:', result);

      this.videos = await this.supabase.getVideos();
    } catch (err) {
      console.error('Error adding video:', err);
    }
  }

}
