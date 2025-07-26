
// Decodes base64 string to Uint8Array
export function decodeBase64(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Error decoding base64 string:", e);
    return new Uint8Array(0); // Return empty array on error
  }
}

// Decodes Uint8Array audio data (16-bit PCM, stereo) into an AudioBuffer
export async function decodeLyriaAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 48000, // Lyria standard
  numChannels: number = 2    // Lyria standard
): Promise<AudioBuffer> {
  if (data.length === 0) {
    console.warn("Received empty audio data for decoding.");
    // Create a very short, silent buffer to avoid crashing playback logic
    return ctx.createBuffer(numChannels, 1, sampleRate);
  }

  // Each sample is 2 bytes (Int16), stereo means 2 channels
  const numSamplesPerChannel = data.length / (2 * numChannels);

  if (numSamplesPerChannel <= 0 || !Number.isInteger(numSamplesPerChannel)) {
    console.error(`Invalid audio data length for ${numChannels} channels: ${data.length} bytes. Expected multiple of ${2 * numChannels}.`);
    // Create a short, silent buffer if data length is problematic
    return ctx.createBuffer(numChannels, 1, sampleRate);
  }
  
  const buffer = ctx.createBuffer(
    numChannels,
    numSamplesPerChannel,
    sampleRate,
  );

  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const dataFloat32 = new Float32Array(dataInt16.length);
  for (let i = 0; i < dataInt16.length; i++) {
    dataFloat32[i] = dataInt16[i] / 32768.0; // Normalize to [-1.0, 1.0]
  }

  if (numChannels === 2) {
    const leftChannel = new Float32Array(numSamplesPerChannel);
    const rightChannel = new Float32Array(numSamplesPerChannel);
    for (let i = 0; i < numSamplesPerChannel; i++) {
      leftChannel[i] = dataFloat32[i * 2];
      rightChannel[i] = dataFloat32[i * 2 + 1];
    }
    buffer.copyToChannel(leftChannel, 0);
    buffer.copyToChannel(rightChannel, 1);
  } else { // Mono (or other channel counts, though Lyria is stereo)
    // Basic de-interleaving for other channel counts, assuming samples are interleaved
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = new Float32Array(numSamplesPerChannel);
        for(let i=0; i < numSamplesPerChannel; i++) {
            channelData[i] = dataFloat32[i * numChannels + channel];
        }
        buffer.copyToChannel(channelData, channel);
    }
  }
  return buffer;
}


// Throttle function to limit update frequency
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>): ReturnType<T> | undefined => {
    const now = Date.now();
    const remainingTime = delay - (now - lastCallTime);

    const later = () => {
      lastCallTime = Date.now();
      timeoutId = null;
      func(...args);
    };

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (remainingTime <= 0) {
      lastCallTime = now;
      return func(...args);
    } else {
      timeoutId = setTimeout(later, remainingTime);
    }
  }) as T;
}
