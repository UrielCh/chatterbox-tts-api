import { ChatterboxClient } from "./chatterbox-client";
import { writeFile } from "node:fs/promises";

async function main() {
  console.log("🚀 Initializing Chatterbox TTS Client...");
  
  const client = new ChatterboxClient({
    baseUrl: "http://localhost:4123"
  });

  try {
    // 1. Check Ping & Health
    console.log("\n🔍 Checking system status...");
    const pingRes = await client.ping();
    console.log("✅ Ping Response:", pingRes);

    const healthRes = await client.healthCheck();
    console.log("✅ Health Response:", {
      status: healthRes.status,
      model_loaded: healthRes.model_loaded,
      device: healthRes.device,
      background_processor_running: healthRes.background_processor_running
    });

    const infoRes = await client.getAPIInfo();
    console.log("✅ API Info:", {
      api_name: infoRes.api_name,
      version: infoRes.version,
      torch_version: infoRes.torch_version,
      cuda_available: infoRes.cuda_available
    });

    // 2. Fetch voices
    console.log("\n🗣️ Fetching voice list...");
    const voicesRes = await client.listAllVoiceNames();
    console.log(`✅ Found ${voicesRes.count} voices/aliases:`, voicesRes.voice_names.slice(0, 10));

    // 3. Generate audio (standard mode)
    console.log("\n🔊 Generating speech...");
    const text = "Hello from the new TypeScript client using Bun!";
    console.log(`Sending text: "${text}"`);
    const startTime = Date.now();
    const audioBlob = await client.generateSpeech({
      input: text,
      voice: "alloy"
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Audio generated successfully in ${duration}ms!`);
    console.log(`Blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

    // Save audio
    const outputPath = "./test-output.wav";
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    await writeFile(outputPath, audioBuffer);
    console.log(`💾 Saved test audio file to: ${outputPath}`);

  } catch (error) {
    console.error("❌ Error executing test-client:", error);
  }
}

main();
