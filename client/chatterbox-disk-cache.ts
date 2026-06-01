/**
 * Node/Bun disk-cache layer for Chatterbox TTS word-timestamp responses.
 *
 * This wrapper keeps the browser-safe client free of filesystem imports while
 * providing deterministic on-disk caching for generated WAV + metadata pairs.
 */

import { Buffer } from "node:buffer";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import {
  ChatterboxClient,
  type ChatterboxClientOptions,
  type TTSRequest,
  type TTSWithTimestampsResponse,
  type WordTimestampsInfo,
} from "./chatterbox-client";

const CROCKFORD_BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CACHE_SCHEMA_VERSION = 1;

export interface ChatterboxDiskCacheOptions extends ChatterboxClientOptions {
  /** Directory where cached audio and metadata files are stored. */
  cacheDir?: string;
  /** Reuse an existing client instance instead of constructing one. */
  client?: ChatterboxClient;
  /** Extra namespace folded into cache keys. Defaults to the base URL. */
  cacheNamespace?: string;
}

export interface CachedSpeechPaths {
  key: string;
  directory: string;
  audioPath: string;
  metadataPath: string;
}

export interface CachedSpeechMetadata {
  cache_schema_version: number;
  cache_key: string;
  original_text: string;
  generated_at: string;
  request: TTSRequest;
  audio_file: string;
  audio_format: TTSWithTimestampsResponse["audio_format"];
  audio_byte_length: number;
  audio_sha256: string;
  sample_rate: number;
  channels: number;
  bits_per_sample: number;
  duration_seconds: number;
  word_timestamps: WordTimestampsInfo;
}

export interface CachedSpeechResult extends TTSWithTimestampsResponse {
  metadata: CachedSpeechMetadata;
  cache: {
    hit: boolean;
    key: string;
    directory: string;
    audioPath: string;
    metadataPath: string;
    generatedAt: string;
  };
}

export interface GenerateCachedSpeechOptions {
  /** Ignore any existing files and regenerate the result. */
  refresh?: boolean;
}

export class ChatterboxDiskCache {
  private readonly cacheDir: string;
  private readonly client: ChatterboxClient;
  private readonly cacheNamespace: string;

  constructor(options: ChatterboxDiskCacheOptions = {}) {
    this.cacheDir = resolve(options.cacheDir || ".chatterbox-cache");
    this.client = options.client || new ChatterboxClient(options);
    this.cacheNamespace =
      options.cacheNamespace ||
      options.baseUrl ||
      "http://localhost:4123";
  }

  /**
   * Generate speech with WhisperX word timestamps, caching the completed result
   * as two files: a WAV binary and a JSON metadata file.
   */
  async generateSpeechWithWordTimestamps(
    request: TTSRequest,
    options: GenerateCachedSpeechOptions = {}
  ): Promise<CachedSpeechResult> {
    const normalizedRequest = normalizeTimestampRequest(request);
    const paths = this.getCachePaths(normalizedRequest);

    if (!options.refresh) {
      const cached = await this.readCachedResult(paths);
      if (cached) {
        return cached;
      }
    }

    const response = await this.client.generateSpeechWithWordTimestamps(normalizedRequest);
    const generatedAt = new Date().toISOString();
    const audioBytes = Buffer.from(response.audio, "base64");
    const metadata: CachedSpeechMetadata = {
      cache_schema_version: CACHE_SCHEMA_VERSION,
      cache_key: paths.key,
      original_text: normalizedRequest.input,
      generated_at: generatedAt,
      request: normalizedRequest,
      audio_file: `${paths.key}.wav`,
      audio_format: response.audio_format,
      audio_byte_length: audioBytes.byteLength,
      audio_sha256: createHash("sha256").update(audioBytes).digest("hex"),
      sample_rate: response.sample_rate,
      channels: response.channels,
      bits_per_sample: response.bits_per_sample,
      duration_seconds: response.duration_seconds,
      word_timestamps: response.word_timestamps,
    };

    await mkdir(paths.directory, { recursive: true });
    await writeFileAtomic(paths.audioPath, audioBytes);
    await writeFileAtomic(paths.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

    return {
      ...response,
      metadata,
      cache: {
        hit: false,
        key: paths.key,
        directory: paths.directory,
        audioPath: paths.audioPath,
        metadataPath: paths.metadataPath,
        generatedAt,
      },
    };
  }

  /**
   * Return the deterministic cache paths for a request without reading/writing.
   */
  getCachePaths(request: TTSRequest): CachedSpeechPaths {
    const key = createCacheKey({
      cache_schema_version: CACHE_SCHEMA_VERSION,
      namespace: this.cacheNamespace,
      request: normalizeTimestampRequest(request),
    });
    const firstLayer = key[0];
    const secondLayer = key[1];
    const directory = join(this.cacheDir, firstLayer, secondLayer);

    return {
      key,
      directory,
      audioPath: join(directory, `${key}.wav`),
      metadataPath: join(directory, `${key}.json`),
    };
  }

  private async readCachedResult(paths: CachedSpeechPaths): Promise<CachedSpeechResult | null> {
    try {
      const [metadataRaw, audioBytes] = await Promise.all([
        readFile(paths.metadataPath, "utf8"),
        readFile(paths.audioPath),
      ]);
      const metadata = JSON.parse(metadataRaw) as CachedSpeechMetadata;

      if (
        metadata.cache_schema_version !== CACHE_SCHEMA_VERSION ||
        metadata.cache_key !== paths.key ||
        metadata.audio_sha256 !== createHash("sha256").update(audioBytes).digest("hex")
      ) {
        return null;
      }

      return {
        audio: audioBytes.toString("base64"),
        audio_format: metadata.audio_format,
        sample_rate: metadata.sample_rate,
        channels: metadata.channels,
        bits_per_sample: metadata.bits_per_sample,
        duration_seconds: metadata.duration_seconds,
        word_timestamps: metadata.word_timestamps,
        metadata,
        cache: {
          hit: true,
          key: paths.key,
          directory: paths.directory,
          audioPath: paths.audioPath,
          metadataPath: paths.metadataPath,
          generatedAt: metadata.generated_at,
        },
      };
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        return null;
      }
      if (error instanceof SyntaxError) {
        return null;
      }
      throw error;
    }
  }
}

export function normalizeTimestampRequest(request: TTSRequest): TTSRequest {
  return sortObjectKeys({
    ...request,
    stream_format: null,
    word_timestamps: true,
  }) as TTSRequest;
}

export function createCacheKey(value: unknown): string {
  const digest = createHash("sha256").update(stableJsonStringify(value)).digest();
  return encodeCrockfordBase32(digest);
}

export function encodeCrockfordBase32(bytes: Uint8Array): string {
  let output = "";
  let value = 0;
  let bits = 0;

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += CROCKFORD_BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += CROCKFORD_BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function stableJsonStringify(value: unknown): string {
  return JSON.stringify(sortObjectKeys(value));
}

function sortObjectKeys(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Cache keys cannot include non-finite numbers");
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(input).sort()) {
      if (input[key] !== undefined) {
        output[key] = sortObjectKeys(input[key]);
      }
    }

    return output;
  }

  if (value === undefined) {
    return undefined;
  }

  throw new TypeError(`Cache keys cannot include ${typeof value} values`);
}

async function writeFileAtomic(path: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tempPath = `${path}.${randomUUID()}.tmp`;
  await writeFile(tempPath, data);
  await rename(tempPath, path);
}
