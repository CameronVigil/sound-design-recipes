import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;


  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }
  async getVideos() {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
    return data;
  }

  async getVideoByAuthor(author: string) {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .eq('author', author)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching videos:', error);
      return [];
    }
    return data;
  }

  async checkVideoExists(videoId: string) {
    const { data, error } = await this.supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking video:', error);
      return null;
    }
    return data;
  }


  async insertVideo(video: any) {
    const { data, error } = await this.supabase
      .from('videos')
      .insert([video])
      .select()
      .single();
    if (error) {
      console.error('Error inserting video:', error);
      throw error;
    }

    return data;
  }




}
