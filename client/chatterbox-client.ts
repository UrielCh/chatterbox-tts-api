/**
 * Chatterbox TTS API Client
 * An fully-typed, dependency-free TypeScript client for Chatterbox TTS API, optimized for Bun.
 */

// --- TYPES & INTERFACES ---

export interface ChatterboxClientOptions {
  /** Base URL of the Chatterbox API. Defaults to http://localhost:4123 */
  baseUrl?: string;
  /** Optional API key if authentication is enabled */
  apiKey?: string;
  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;
}

// Request and Response Types

export interface TTSRequest {
  /** The text to generate audio for (maximum length: 3000 characters) */
  input: string;
  /** Voice name from library or OpenAI voice name (defaults to configured sample) */
  voice?: string | null;
  /** Audio format (always returns WAV). Defaults to "wav" */
  response_format?: string | null;
  /** Speed of speech. Defaults to 1.0 */
  speed?: number | null;
  /** Streaming format: "audio" for raw audio stream, "sse" for Server-Side Events */
  stream_format?: string | null;
  /** Return generated audio with WhisperX word-level start/end timings */
  word_timestamps?: boolean | null;
  /** Emotion intensity (0.25 to 2.0) */
  exaggeration?: number | null;
  /** Pace control (0.0 to 1.0) */
  cfg_weight?: number | null;
  /** Sampling temperature (0.05 to 5.0) */
  temperature?: number | null;
  /** Characters per streaming chunk (50 to 500) */
  streaming_chunk_size?: number | null;
  /** Chunking strategy for streaming (e.g. sentence, paragraph, fixed, word) */
  streaming_strategy?: string | null;
  /** Number of chunks to buffer (1 to 10) */
  streaming_buffer_size?: number | null;
  /** Speed vs quality trade-off (e.g. fast, balanced, high) */
  streaming_quality?: string | null;
}

export interface TTSProgressResponse {
  current_step?: string | null;
  current_chunk?: number | null;
  total_chunks?: number | null;
  progress_percentage?: number | null;
  estimated_completion?: string | null;
}

export interface TTSStatusResponse {
  status: string;
  is_processing: boolean;
  request_id?: string | null;
  start_time?: number | null;
  duration_seconds?: number | null;
  text_length?: number | null;
  text_preview?: string | null;
  voice_source?: string | null;
  parameters?: Record<string, any> | null;
  progress?: TTSProgressResponse | null;
  error_message?: string | null;
  memory_usage?: Record<string, number> | null;
  total_requests?: number;
  message?: string | null;
}

export interface TTSStatisticsResponse {
  total_requests: number;
  completed_requests: number;
  error_requests: number;
  success_rate: number;
  average_duration_seconds: number;
  average_text_length: number;
  is_processing: boolean;
}

export interface LongTextRequest {
  /** The text to generate audio for */
  input: string;
  /** Voice name from library or OpenAI voice name (defaults to configured sample) */
  voice?: string | null;
  /** Language code for the voice (e.g. 'en', 'fr', 'es') */
  language?: string | null;
  /** Speed of speech. Defaults to 1.0 */
  speed?: number | null;
  /** Emotion intensity (0.25 to 2.0) */
  exaggeration?: number | null;
  /** Pace control (0.0 to 1.0) */
  cfg_weight?: number | null;
  /** Sampling temperature (0.05 to 5.0) */
  temperature?: number | null;
  /** Strategy for splitting long text. Defaults to "paragraph" */
  chunk_strategy?: string | null;
  /** Maximum number of characters per chunk. Defaults to 500 */
  chunk_max_chars?: number | null;
  /** Priority of the job. Lower is processed first. Defaults to 10 */
  priority?: number | null;
  /** Optional key-value metadata to store with the job */
  metadata?: Record<string, any> | null;
}

export interface LongTextJobCreateResponse {
  message: string;
  job_id: string;
  status: string;
}

export interface LongTextChunk {
  chunk_index: number;
  text: string;
  status: string;
  audio_path?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
  started_at?: number | null;
  completed_at?: number | null;
}

export interface LongTextJobResponse {
  job_id: string;
  status: string;
  priority: number;
  created_at: number;
  started_at?: number | null;
  completed_at?: number | null;
  total_characters: number;
  processed_characters: number;
  total_chunks: number;
  processed_chunks: number;
  error_message?: string | null;
  voice?: string | null;
  language?: string | null;
  speed: number;
  chunk_strategy: string;
  metadata?: Record<string, any> | null;
  chunks?: LongTextChunk[] | null;
}

export interface LongTextJobListItem {
  job_id: string;
  status: string;
  priority: number;
  created_at: number;
  started_at?: number | null;
  completed_at?: number | null;
  total_characters: number;
  processed_characters: number;
  total_chunks: number;
  processed_chunks: number;
  error_message?: string | null;
  voice?: string | null;
  language?: string | null;
  speed: number;
  chunk_strategy: string;
  metadata?: Record<string, any> | null;
}

export interface LongTextJobList {
  jobs: LongTextJobListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface LongTextProgress {
  job_id: string;
  status: string;
  progress?: number | null;
  current_chunk?: number | null;
  total_chunks?: number | null;
  message?: string | null;
  error?: string | null;
  [key: string]: any;
}

export interface LongTextJobDetails {
  job_id: string;
  status: string;
  priority: number;
  created_at: number;
  started_at?: number | null;
  completed_at?: number | null;
  total_characters: number;
  processed_characters: number;
  total_chunks: number;
  processed_chunks: number;
  error_message?: string | null;
  voice?: string | null;
  language?: string | null;
  speed: number;
  chunk_strategy: string;
  metadata?: Record<string, any> | null;
  chunks: LongTextChunk[];
}

export interface LongTextJobRetryRequest {
  /** Optional list of chunk indexes to retry. If not specified, retries all failed chunks */
  chunk_indexes?: number[] | null;
}

export interface LongTextJobUpdateRequest {
  /** Optional key-value metadata to merge into existing metadata */
  metadata?: Record<string, any> | null;
  /** Optional priority of the job */
  priority?: number | null;
}

export interface BulkJobAction {
  job_ids: string[];
  action: "cancel" | "delete" | "pause" | "resume" | "retry";
}

export interface BulkJobActionResponse {
  message: string;
  successful: string[];
  failed: Record<string, string>;
}

export interface LongTextHistoryStats {
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  cancelled_jobs: number;
  pending_jobs: number;
  processing_jobs: number;
  paused_jobs: number;
  total_characters_processed: number;
  success_rate: number;
}

export interface SupportedLanguageItem {
  code: string;
  name: string;
}

export interface SupportedLanguagesResponse {
  languages: SupportedLanguageItem[];
  default: string;
}

export interface ModelInfo {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  capabilities: Record<string, any>;
}

export interface ModelsResponse {
  object: string;
  data: ModelInfo[];
}

export interface ConfigResponse {
  version: string;
  device: string;
  is_multilingual: boolean;
  max_total_length: number;
  max_chunk_length: number;
  default_voice: string | null;
  voice_library_count: number;
}

export interface APIInfoResponse {
  api_name: string;
  version: string;
  description: string;
  status: string;
  device: string;
  torch_version: string;
  cuda_available: boolean;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  version: string;
  initialization_status: string;
  background_processor_running: boolean;
}

// SSE Event interface for Server-Side Events
export interface SSEAudioDelta {
  audio: string; // Base64 encoded WAV chunk audio
}

export interface SSEUsageInfo {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface SSEAudioDone {
  usage: SSEUsageInfo;
}

export interface SSEAudioInfo {
  sample_rate: number;
  channels: number;
  bits_per_sample: number;
}

export interface WordTimestamp {
  word: string;
  start?: number | null;
  end?: number | null;
  segment_index: number;
  score?: number | null;
}

export interface WordTimestampsInfo {
  language: string;
  transcript: string;
  words: WordTimestamp[];
  segments: Array<Record<string, any>>;
}

export interface SSEWordTimestamps extends WordTimestampsInfo {
  type: "speech.audio.word_timestamps";
}

export interface TTSWithTimestampsResponse {
  audio: string;
  audio_format: "wav";
  sample_rate: number;
  channels: number;
  bits_per_sample: number;
  duration_seconds: number;
  word_timestamps: WordTimestampsInfo;
}

export interface VoiceNamesListResponse {
  voice_names: string[];
  count: number;
}

// --- CLIENT CLASS ---

export class ChatterboxClient {
  private baseUrl: string;
  private apiKey?: string;
  private customFetch: typeof fetch;

  constructor(options: ChatterboxClientOptions = {}) {
    this.baseUrl = (options.baseUrl || "http://localhost:4123").replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.customFetch = options.fetch || fetch;
  }

  /**
   * Helper to perform HTTP Requests
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers || {});

    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    const response = await this.customFetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail: any = response.statusText;
      try {
        errorDetail = await response.json();
      } catch (_) {
        try {
          errorDetail = await response.text();
        } catch (__) {}
      }
      throw new Error(`Chatterbox API Error: [${response.status}] ${JSON.stringify(errorDetail)}`);
    }

    // Handle audio/blob or application/octet-stream responses
    const contentType = response.headers.get("content-type") || "";
    if (
      contentType.includes("audio/") ||
      contentType.includes("application/octet-stream")
    ) {
      return (await response.blob()) as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  // ==========================================
  // 1. TEXT TO SPEECH (OPENAI COMPATIBLE)
  // ==========================================

  /**
   * Generate speech audio from input text (standard non-streaming WAV).
   */
  async generateSpeech(request: TTSRequest): Promise<Blob> {
    return this.request<Blob>("/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream_format: null }),
    });
  }

  /**
   * Generate speech and return base64 WAV audio plus WhisperX word timestamps.
   */
  async generateSpeechWithWordTimestamps(request: TTSRequest): Promise<TTSWithTimestampsResponse> {
    return this.request<TTSWithTimestampsResponse>("/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, stream_format: null, word_timestamps: true }),
    });
  }

  /**
   * Generate speech audio stream. Returns a Web standard ReadableStream containing raw chunks.
   */
  async generateSpeechStream(request: TTSRequest): Promise<ReadableStream<Uint8Array>> {
    const url = `${this.baseUrl}/audio/speech/stream`;
    const headers = new Headers();
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    headers.set("Content-Type", "application/json");

    const response = await this.customFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Chatterbox Streaming Error: [${response.status}] ${err}`);
    }

    if (!response.body) {
      throw new Error("Chatterbox Streaming Error: Response body is empty");
    }

    return response.body;
  }

  /**
   * OpenAI compatible endpoint that parses Server-Side Events (SSE) for streaming.
   * Yields Base64 audio segments, info parameters, or usage info.
   */
  async *generateSpeechSSE(request: TTSRequest): AsyncGenerator<SSEAudioDelta | SSEAudioInfo | SSEAudioDone | SSEWordTimestamps, void, unknown> {
    const url = `${this.baseUrl}/audio/speech`;
    const headers = new Headers();
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    headers.set("Content-Type", "application/json");

    const response = await this.customFetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...request, stream_format: "sse" }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Chatterbox SSE Error: [${response.status}] ${err}`);
    }

    if (!response.body) {
      throw new Error("Chatterbox SSE Error: Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.slice(5).trim();
            if (dataStr) {
              try {
                yield JSON.parse(dataStr);
              } catch (_) {}
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate speech using an uploaded custom voice file.
   */
  async generateSpeechWithUpload(
    request: Omit<TTSRequest, "input"> & { input: string; voice_file: File | Blob; filename?: string }
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append("input", request.input);
    formData.append("voice_file", request.voice_file, request.filename || "voice.wav");

    const optionalKeys: Array<keyof typeof request> = [
      "voice",
      "response_format",
      "speed",
      "exaggeration",
      "cfg_weight",
      "temperature",
      "streaming_chunk_size",
      "streaming_strategy",
      "streaming_quality",
      "word_timestamps",
    ];

    for (const key of optionalKeys) {
      const val = request[key];
      if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    }

    return this.request<Blob>("/audio/speech/upload", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Stream speech using an uploaded custom voice file.
   */
  async generateSpeechStreamWithUpload(
    request: Omit<TTSRequest, "input"> & { input: string; voice_file: File | Blob; filename?: string }
  ): Promise<ReadableStream<Uint8Array>> {
    const formData = new FormData();
    formData.append("input", request.input);
    formData.append("voice_file", request.voice_file, request.filename || "voice.wav");

    const optionalKeys: Array<keyof typeof request> = [
      "voice",
      "response_format",
      "speed",
      "exaggeration",
      "cfg_weight",
      "temperature",
      "streaming_chunk_size",
      "streaming_strategy",
      "streaming_quality",
    ];

    for (const key of optionalKeys) {
      const val = request[key];
      if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    }

    const url = `${this.baseUrl}/audio/speech/stream/upload`;
    const headers = new Headers();
    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }

    const response = await this.customFetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Chatterbox Stream Upload Error: [${response.status}] ${err}`);
    }

    if (!response.body) {
      throw new Error("Chatterbox Stream Upload Error: Response body is empty");
    }

    return response.body;
  }

  // ==========================================
  // 2. LONG TEXT TTS JOBS (BACKGROUND)
  // ==========================================

  /**
   * Submit a new background text-to-speech job for long text.
   */
  async createLongTextJob(request: LongTextRequest): Promise<LongTextJobCreateResponse> {
    return this.request<LongTextJobCreateResponse>("/audio/speech/long", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  }

  /**
   * List background long-text TTS jobs with optional filtering.
   */
  async listLongTextJobs(params?: {
    status?: string;
    voice?: string;
    limit?: number;
    offset?: number;
  }): Promise<LongTextJobList> {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<LongTextJobList>(`/audio/speech/long${query}`);
  }

  /**
   * Get the current status of a long-text TTS job.
   */
  async getLongTextJobStatus(jobId: string): Promise<LongTextJobResponse> {
    return this.request<LongTextJobResponse>(`/audio/speech/long/${jobId}`);
  }

  /**
   * Get exhaustive execution details (including all chunks) of a long-text job.
   */
  async getLongTextJobDetails(jobId: string): Promise<LongTextJobDetails> {
    return this.request<LongTextJobDetails>(`/audio/speech/long/${jobId}/details`);
  }

  /**
   * Cancel a pending or running long-text TTS job.
   */
  async cancelLongTextJob(jobId: string): Promise<{ message: string; job_id: string }> {
    return this.request<{ message: string; job_id: string }>(`/audio/speech/long/${jobId}`, {
      method: "DELETE",
    });
  }

  /**
   * Update metadata or priority of an existing job.
   */
  async updateLongTextJobMetadata(
    jobId: string,
    request: LongTextJobUpdateRequest
  ): Promise<LongTextJobResponse> {
    return this.request<LongTextJobResponse>(`/audio/speech/long/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  }

  /**
   * Pause a currently running or pending long-text job.
   */
  async pauseLongTextJob(jobId: string): Promise<{ message: string; job_id: string }> {
    return this.request<{ message: string; job_id: string }>(`/audio/speech/long/${jobId}/pause`, {
      method: "PUT",
    });
  }

  /**
   * Resume a paused long-text job.
   */
  async resumeLongTextJob(jobId: string): Promise<{ message: string; job_id: string }> {
    return this.request<{ message: string; job_id: string }>(`/audio/speech/long/${jobId}/resume`, {
      method: "PUT",
    });
  }

  /**
   * Retry a failed long-text job, optionally specifying exactly which chunk indexes to retry.
   */
  async retryLongTextJob(
    jobId: string,
    request?: LongTextJobRetryRequest
  ): Promise<{ message: string; job_id: string }> {
    return this.request<{ message: string; job_id: string }>(`/audio/speech/long/${jobId}/retry`, {
      method: "POST",
      headers: request ? { "Content-Type": "application/json" } : undefined,
      body: request ? JSON.stringify(request) : undefined,
    });
  }

  /**
   * Download the complete compiled audio file for a finished long-text job.
   */
  async downloadLongTextJobAudio(jobId: string): Promise<Blob> {
    return this.request<Blob>(`/audio/speech/long/${jobId}/download`);
  }

  /**
   * Subscribe to Server-Sent Events (SSE) to receive real-time progress updates for a job.
   */
  async subscribeJobSSE(jobId: string, callback: (data: LongTextProgress) => void): Promise<() => void> {
    const url = `${this.baseUrl}/audio/speech/long/${jobId}/sse`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        callback(parsed);
      } catch (_) {}
    };

    return () => eventSource.close();
  }

  /**
   * List history of jobs in the background queue.
   */
  async listLongTextHistory(params?: {
    status?: string;
    sort_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<LongTextJobResponse[]> {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<LongTextJobResponse[]>(`/audio/speech/long-history${query}`);
  }

  /**
   * Get stats about job history.
   */
  async getLongTextHistoryStats(): Promise<LongTextHistoryStats> {
    return this.request<LongTextHistoryStats>("/audio/speech/long-history/stats");
  }

  /**
   * Clear the completed/failed long-text job history.
   */
  async clearLongTextHistory(): Promise<{ message: string; deleted_count: number }> {
    return this.request<{ message: string; deleted_count: number }>("/audio/speech/long/history", {
      method: "DELETE",
    });
  }

  /**
   * Perform bulk actions on multiple long text jobs at once.
   */
  async bulkLongTextAction(action: BulkJobAction): Promise<BulkJobActionResponse> {
    return this.request<BulkJobActionResponse>("/audio/speech/long/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
  }

  // ==========================================
  // 3. VOICE LIBRARY ENDPOINTS
  // ==========================================

  /**
   * List available voices in the library with language and search filters.
   */
  async listVoices(params?: { language?: string; search?: string }): Promise<any[]> {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return this.request<any[]>(`/voices${query}`);
  }

  /**
   * Upload a voice sample to the library for cloning.
   */
  async uploadVoice(name: string, file: File | Blob, language: string = "en"): Promise<any> {
    const formData = new FormData();
    formData.append("voice_name", name);
    formData.append("voice_file", file);
    formData.append("language", language);

    return this.request<any>("/voices", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get the active system default voice.
   */
  async getDefaultVoice(): Promise<any> {
    return this.request<any>("/voices/default");
  }

  /**
   * Set a voice as the system default voice.
   */
  async setDefaultVoice(name: string): Promise<any> {
    const formData = new FormData();
    formData.append("voice_name", name);
    return this.request<any>("/voices/default", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Reset system default voice back to original setting.
   */
  async resetDefaultVoice(): Promise<any> {
    return this.request<any>("/voices/default", {
      method: "DELETE",
    });
  }

  /**
   * Get detailed information about a single voice.
   */
  async getVoiceInfo(name: string): Promise<any> {
    return this.request<any>(`/voices/${encodeURIComponent(name)}`);
  }

  /**
   * Rename an existing voice in the library.
   */
  async renameVoice(name: string, newName: string): Promise<any> {
    const formData = new FormData();
    formData.append("new_name", newName);
    return this.request<any>(`/voices/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: formData,
    });
  }

  /**
   * Delete a voice and all its aliases from the library.
   */
  async deleteVoice(name: string): Promise<any> {
    return this.request<any>(`/voices/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  }

  /**
   * Download the original voice audio sample file.
   */
  async downloadVoice(name: string): Promise<Blob> {
    return this.request<Blob>(`/voices/${encodeURIComponent(name)}/download`);
  }

  /**
   * Add a new alias name for a voice.
   */
  async addVoiceAlias(name: string, alias: string): Promise<any> {
    const formData = new FormData();
    formData.append("alias", alias);
    return this.request<any>(`/voices/${encodeURIComponent(name)}/aliases`, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * List all aliases assigned to a voice.
   */
  async listVoiceAliases(name: string): Promise<any> {
    return this.request<any>(`/voices/${encodeURIComponent(name)}/aliases`);
  }

  /**
   * Remove a specific alias from a voice.
   */
  async removeVoiceAlias(name: string, alias: string): Promise<any> {
    return this.request<any>(`/voices/${encodeURIComponent(name)}/aliases/${encodeURIComponent(alias)}`, {
      method: "DELETE",
    });
  }

  /**
   * Quick endpoint listing every single voice and alias name.
   */
  async listAllVoiceNames(): Promise<VoiceNamesListResponse> {
    return this.request<VoiceNamesListResponse>("/voices/all-names");
  }

  /**
   * Clean up unused or temporary voice files from the server.
   */
  async cleanupVoices(): Promise<any> {
    return this.request<any>("/voices/cleanup", {
      method: "POST",
    });
  }

  // ==========================================
  // 4. CONFIG, HEALTH & SYSTEM METRICS
  // ==========================================

  /**
   * Get supported TTS languages by the active model.
   */
  async getLanguages(): Promise<SupportedLanguagesResponse> {
    return this.request<SupportedLanguagesResponse>("/languages");
  }

  /**
   * Get list of virtual models available (OpenAI compatibility).
   */
  async getModels(): Promise<ModelsResponse> {
    return this.request<ModelsResponse>("/models");
  }

  /**
   * Get currently active server configurations.
   */
  async getConfig(): Promise<ConfigResponse> {
    return this.request<ConfigResponse>("/config");
  }

  /**
   * Get absolute details of all configured API endpoints.
   */
  async getEndpoints(): Promise<any> {
    return this.request<any>("/endpoints");
  }

  /**
   * Get health metrics for the server and active models.
   */
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  /**
   * Standard ping endpoint.
   */
  async ping(): Promise<{ ping: string }> {
    return this.request<{ ping: string }>("/ping");
  }

  /**
   * Get the API system-info page content.
   */
  async getAPIInfo(): Promise<APIInfoResponse> {
    return this.request<APIInfoResponse>("/info");
  }

  // Memory endpoints

  /**
   * Get current CPU and GPU memory tracking info.
   */
  async getMemoryStatus(): Promise<any> {
    return this.request<any>("/memory");
  }

  /**
   * Manually trigger full memory garbage collection and cache resets.
   */
  async resetMemoryTracking(): Promise<any> {
    return this.request<any>("/memory/reset", {
      method: "POST",
    });
  }

  /**
   * Get active memory thresholds and alert settings.
   */
  async getMemoryConfig(): Promise<any> {
    return this.request<any>("/memory/config");
  }

  /**
   * Update memory warning/cleanup thresholds.
   */
  async updateMemoryConfig(config: any): Promise<any> {
    return this.request<any>("/memory/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  }

  /**
   * Get system suggestions to improve memory utilization.
   */
  async getMemoryRecommendations(): Promise<any> {
    return this.request<any>("/memory/recommendations");
  }

  // Processing status & history

  /**
   * Get status of current actively running single-chunk requests.
   */
  async getProcessingStatus(): Promise<TTSStatusResponse> {
    return this.request<TTSStatusResponse>("/status");
  }

  /**
   * Get the current detailed step-by-step progress of the active TTS request.
   */
  async getTTSProgress(): Promise<TTSProgressResponse> {
    return this.request<TTSProgressResponse>("/status/progress");
  }

  /**
   * Get list of historical single-chunk TTS requests.
   */
  async getRequestHistory(): Promise<any[]> {
    return this.request<any[]>("/status/history");
  }

  /**
   * Get overall performance statistics (average latency, text lengths, success rates).
   */
  async getProcessingStatistics(): Promise<TTSStatisticsResponse> {
    return this.request<TTSStatisticsResponse>("/status/statistics");
  }

  /**
   * Clear the memory-based request history.
   */
  async clearRequestHistory(): Promise<any> {
    return this.request<any>("/status/history/clear", {
      method: "POST",
    });
  }
}
