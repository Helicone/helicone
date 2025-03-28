import { Buffer } from "buffer";

/**
 * Checks if the given base64 string appears to be WAV formatted
 * @param base64Data Base64 encoded audio data
 * @returns True if the data appears to be in WAV format
 */
export const isWavFormatted = (base64Data: string): boolean => {
  try {
    // Check if the first 4 bytes spell "RIFF" when decoded
    const decodedStart = atob(base64Data.substring(0, 8));
    return decodedStart.startsWith("RIFF");
  } catch (e) {
    // If decoding fails, it's definitely not a valid WAV format
    return false;
  }
};

/**
 * Convert PCM16 data to WAV format for browser compatibility
 * PCM16 from OpenAI Realtime API is 16-bit, 24kHz, mono, little-endian
 * @param base64PcmData Base64 encoded PCM16 audio data
 * @param sampleRate Sample rate of the audio (default: 24000)
 * @returns Base64 encoded WAV audio data
 */
export const convertPcm16ToWav = (
  base64PcmData: string,
  sampleRate = 24000
): string => {
  try {
    // Use Buffer from 'buffer' package to decode base64 to binary data
    const binaryData = Buffer.from(base64PcmData, "base64");

    // Create WAV header (44 bytes)
    const wavHeader = new Uint8Array(44);
    const headerView = new DataView(wavHeader.buffer);

    // "RIFF" chunk descriptor
    headerView.setUint8(0, 0x52); // 'R'
    headerView.setUint8(1, 0x49); // 'I'
    headerView.setUint8(2, 0x46); // 'F'
    headerView.setUint8(3, 0x46); // 'F'

    // Chunk size (36 + data size)
    const fileSize = 36 + binaryData.length;
    headerView.setUint32(4, fileSize, true);

    // "WAVE" format
    headerView.setUint8(8, 0x57); // 'W'
    headerView.setUint8(9, 0x41); // 'A'
    headerView.setUint8(10, 0x56); // 'V'
    headerView.setUint8(11, 0x45); // 'E'

    // "fmt " sub-chunk
    headerView.setUint8(12, 0x66); // 'f'
    headerView.setUint8(13, 0x6d); // 'm'
    headerView.setUint8(14, 0x74); // 't'
    headerView.setUint8(15, 0x20); // ' '

    // Subchunk1 size (16 for PCM)
    headerView.setUint32(16, 16, true);

    // Audio format (1 for PCM)
    headerView.setUint16(20, 1, true);

    // Number of channels (1 for mono)
    headerView.setUint16(22, 1, true);

    // Sample rate - Use the provided sample rate
    // Both user and assistant audio from OpenAI Realtime API use 24kHz
    headerView.setUint32(24, sampleRate, true);

    // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
    headerView.setUint32(28, sampleRate * 2, true);

    // Block align (NumChannels * BitsPerSample/8)
    headerView.setUint16(32, 2, true);

    // Bits per sample (16)
    headerView.setUint16(34, 16, true);

    // "data" sub-chunk
    headerView.setUint8(36, 0x64); // 'd'
    headerView.setUint8(37, 0x61); // 'a'
    headerView.setUint8(38, 0x74); // 't'
    headerView.setUint8(39, 0x61); // 'a'

    // Subchunk2 size (data size)
    headerView.setUint32(40, binaryData.length, true);

    // Combine header and PCM data
    const wavBytes = new Uint8Array(wavHeader.length + binaryData.length);
    wavBytes.set(wavHeader);
    wavBytes.set(new Uint8Array(binaryData), wavHeader.length);

    // Convert back to base64
    // Use a browser-compatible approach instead of Buffer
    return btoa(
      Array.from(wavBytes)
        .map((byte) => String.fromCharCode(byte))
        .join("")
    );
  } catch (e) {
    console.error("Error converting PCM16 to WAV:", e);
    // Return original data if conversion fails
    return base64PcmData;
  }
};

/**
 * Play audio data using Web Audio API
 * This can be used if the standard HTML Audio element approach fails
 * @param audioData Base64 encoded audio data
 * @param onPlaybackStart Callback when playback starts
 * @param onPlaybackEnd Callback when playback ends
 * @param onError Callback when an error occurs
 */
export const playWithWebAudio = async (
  audioData: string,
  onPlaybackStart: () => void,
  onPlaybackEnd: () => void,
  onError: (message: string) => void
) => {
  if (!audioData) return;

  try {
    // Decode base64 to binary
    const binaryString = atob(audioData);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert to 16-bit PCM (Int16Array)
    const pcm16Data = new Int16Array(bytes.buffer);

    // Create audio context
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    // OpenAI Realtime API uses 24kHz for both user and assistant audio
    const sampleRate = 24000;

    // Create buffer with correct sample rate
    const audioBuffer = audioContext.createBuffer(
      1,
      pcm16Data.length,
      sampleRate
    );
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 to Float32 (Web Audio API format)
    for (let i = 0; i < pcm16Data.length; i++) {
      // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = pcm16Data[i] / 32768.0;
    }

    // Create source and play
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    onPlaybackStart();

    // Handle playback end
    source.onended = () => {
      onPlaybackEnd();
    };
  } catch (error) {
    console.error("Web Audio API playback error:", error);
    onError(
      `Web Audio API error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
