import { ChatterboxDiskCache } from "./chatterbox-disk-cache";

async function main() {
  console.log("🚀 Initializing Chatterbox Disk Cache...");
  const cachedClient = new ChatterboxDiskCache({
    baseUrl: "http://localhost:4123",
    cacheDir: "./tts-cache"
  });

  const text = "Testing the disk caching layer with word timestamps.";
  
  try {
    // 1. First run - should generate and cache
    console.log(`\n🔊 Request 1: Generating speech for "${text}"...`);
    const t0 = Date.now();
    const result1 = await cachedClient.generateSpeechWithWordTimestamps({
      input: text,
      voice: "alloy"
    });
    const d1 = Date.now() - t0;
    console.log(`✅ Request 1 finished in ${d1}ms.`);
    console.log(`- Cache Hit: ${result1.cache.hit}`);
    console.log(`- Audio File: ${result1.cache.audioPath}`);
    console.log(`- Metadata File: ${result1.cache.metadataPath}`);
    console.log(`- Duration: ${result1.duration_seconds}s`);
    
    // 2. Second run - should hit the cache instantly
    console.log(`\n🔊 Request 2: Requesting same text...`);
    const t1 = Date.now();
    const result2 = await cachedClient.generateSpeechWithWordTimestamps({
      input: text,
      voice: "alloy"
    });
    const d2 = Date.now() - t1;
    console.log(`✅ Request 2 finished in ${d2}ms.`);
    console.log(`- Cache Hit: ${result2.cache.hit}`);
    console.log(`- Audio File: ${result2.cache.audioPath}`);
    console.log(`- Metadata File: ${result2.cache.metadataPath}`);
    console.log(`- Duration: ${result2.duration_seconds}s`);

  } catch (error) {
    console.error("❌ Cache test failed:", error);
  }
}

main();
