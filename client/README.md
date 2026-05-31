# Chatterbox TTS TypeScript Client

A fully-typed, zero-dependency TypeScript client for the Chatterbox TTS API, optimized for Bun.

## Features

- **Zero External Dependencies**: Uses native standard `fetch`, `ReadableStream`, and standard web platform APIs.
- **Fully Typed**: Exhaustive TypeScript type definitions for all requests, responses, jobs, and SSE streams.
- **Background Job Management**: Methods for managing long text queue processing, including status checking, bulk pausing/resuming, and downloading output audio.
- **OpenAI-Compatible Streaming**: Full support for real-time text-to-speech streams via Server-Side Events (SSE).
- **Voice Library Controls**: Manage voices, default voice configurations, and voice aliases seamlessly.

## Quick Start

### 1. Installation

Since the client has no dependencies, you can copy `chatterbox-client.ts` directly into your project:

```bash
cp chatterbox-client.ts /path/to/your/project/src/
```

Or run directly with Bun:
```bash
bun install
```

### 2. Basic Usage

```typescript
import { ChatterboxClient } from "./chatterbox-client";

// Initialize client
const client = new ChatterboxClient({
  baseUrl: "http://localhost:4123", // Defaults to http://localhost:4123
});

// 1. Generate speech audio (Returns a WAV Blob)
const audioBlob = await client.generateSpeech({
  input: "Hello, this is a voice generated using the Chatterbox client!",
  voice: "alloy"
});

// Save to disk in Bun
await Bun.write("output.wav", audioBlob);
```

### 3. Real-Time SSE Streaming

```typescript
// Uses OpenAI-compatible Server-Side Events to stream raw PCM/Base64 audio chunks
for await (const chunk of client.generateSpeechSSE({
  input: "Streaming audio in real-time!",
  voice: "alloy"
})) {
  if ("audio" in chunk) {
    console.log(`Received ${chunk.audio.length} bytes of Base64 encoded audio`);
    // Decode base64 or stream to audio player
  }
}
```

### 4. Background Long-Text Jobs

For processing long articles or documents asynchronously in the background:

```typescript
// Start a background compilation job
const { job_id } = await client.createLongTextJob({
  input: "Extremely long text content...",
  voice: "alloy",
  chunk_strategy: "paragraph"
});

// Check status
const status = await client.getLongTextJobStatus(job_id);
console.log(`Job state: ${status.status} (${status.processed_chunks}/${status.total_chunks} chunks completed)`);

// Download output when ready
if (status.status === "completed") {
  const audioBlob = await client.downloadLongTextJobAudio(job_id);
  await Bun.write("long-audio.wav", audioBlob);
}
```

## API Reference

The `ChatterboxClient` exposes the following method categories:

1. **Speech Operations**:
   - `generateSpeech(request)`: Returns standard non-streaming WAV Blob.
   - `generateSpeechStream(request)`: Returns a Web Standard `ReadableStream` of raw chunk bytes.
   - `generateSpeechSSE(request)`: Async generator yielding SSE stream events (`SSEAudioInfo`, `SSEAudioDelta`, `SSEAudioDone`).
   - `generateSpeechWithUpload(request)`: Custom voice cloning via uploading a sound file.
   - `generateSpeechStreamWithUpload(request)`: Real-time streaming voice cloning via uploading a sound file.

2. **Long Text Background Jobs**:
   - `createLongTextJob(request)`: Submits long text job to background queue.
   - `listLongTextJobs(params)`: List background job queue.
   - `getLongTextJobStatus(jobId)`: Gets current job state.
   - `getLongTextJobDetails(jobId)`: Gets detail including individual chunks.
   - `cancelLongTextJob(jobId)`: Cancels pending/running job.
   - `updateLongTextJobMetadata(jobId, request)`: Update metadata/priority.
   - `pauseLongTextJob(jobId)` / `resumeLongTextJob(jobId)`: Control queue execution.
   - `retryLongTextJob(jobId, request)`: Retries failed chunks.
   - `downloadLongTextJobAudio(jobId)`: Download finalized compiled audio file.
   - `subscribeJobSSE(jobId, callback)`: Listen to real-time compilation progress events.
   - `listLongTextHistory(params)` / `getLongTextHistoryStats()` / `clearLongTextHistory()`: Manage queue history logs.
   - `bulkLongTextAction(action)`: Cancel, pause, resume, retry, or delete multiple jobs at once.

3. **Voice Library Management**:
   - `listVoices(params)` / `listAllVoiceNames()`: List available voices.
   - `uploadVoice(name, file, language)`: Upload audio file for voice cloning.
   - `getDefaultVoice()` / `setDefaultVoice(name)` / `resetDefaultVoice()`: Manage system defaults.
   - `getVoiceInfo(name)` / `renameVoice(name, newName)` / `deleteVoice(name)`: General voice library actions.
   - `addVoiceAlias(name, alias)` / `listVoiceAliases(name)` / `removeVoiceAlias(name, alias)`: Set alternative names.
   - `cleanupVoices()`: Prune missing files from database.

4. **System Metrics & Config**:
   - `getLanguages()`: Supported multilingual model languages.
   - `getModels()`: Returns OpenAI-compatible virtual models list.
   - `getConfig()`: Get current server parameters.
   - `healthCheck()` / `ping()` / `getAPIInfo()`: System checking endpoints.
   - `getMemoryStatus()` / `resetMemoryTracking()` / `getMemoryConfig()` / `updateMemoryConfig(config)` / `getMemoryRecommendations()`: Memory-leak debugging and resource checks.
   - `getProcessingStatus()` / `getTTSProgress()` / `getRequestHistory()` / `getProcessingStatistics()` / `clearRequestHistory()`: Live usage performance telemetry.
