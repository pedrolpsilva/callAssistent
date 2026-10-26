export interface SystemStatus {
  is_recording: boolean;
  is_paused: boolean;
  duration: number;
  output_dir: string;
  has_api_key: boolean;
  model: string;
  default_user_name: string;
  platform?: string;
}

export interface TranscriptSegment {
  speaker: string;
  text: string;
}

export interface StopResult {
  success: boolean;
  duration: number;
  transcript_raw: string;
  segments: TranscriptSegment[];
  speakers: string[];
  document_markdown: string;
  file_path: string;
  file_name: string;
  window_events?: any[];
}

export interface AppConfig {
  gemini_api_key: string;
  gemini_model: string;
  output_dir: string;
  port: number;
  default_user_name: string;
}
