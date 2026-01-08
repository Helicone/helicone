import { Buffer } from "buffer";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { Writable } from "stream";
import { Body, Controller, Post, Route, Security, Tags } from "tsoa";
import { randomUUID } from "crypto";
// We won't directly use Result in the method signature for TSOA compatibility
// import { Result } from "../../lib/shared/result";

// Helper function to probe using a Promise
const ffprobePromise = (filePath: string): Promise<ffmpeg.FfprobeData> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`ffprobe failed: ${err.message}`));
      } else {
        resolve(metadata);
      }
    });
  });
};

// Simple mapping from ffprobe codec_name to ffmpeg format flag
// Expand as needed for other expected raw formats
const codecToInputFormat: Record<string, string> = {
  pcm_s16le: "s16le",
  pcm_s16be: "s16be",
  pcm_u8: "u8",
  // Add more mappings if other raw PCM types are expected
};

interface ConvertToWavRequestBody {
  audioData: string; // Base64 encoded audio data
}

// Define a specific response interface for TSOA
interface ConvertToWavResponse {
  data: string | null;
  error: string | null;
}

@Route("/v1/audio")
@Tags("Audio")
@Security("api_key")
export class AudioController extends Controller {
  @Post("/convert-to-wav")
  public async convertToWav(
    @Body() body: ConvertToWavRequestBody
  ): Promise<ConvertToWavResponse> {
    const { audioData } = body;

    if (!audioData) {
      return { data: null, error: "Missing audioData in request body" };
    }

    // Declare variable for cleanup outside try
    let pathToClean: string | null = null;

    try {
      const inputBuffer = Buffer.from(audioData, "base64");
      if (inputBuffer.length === 0) {
        return {
          data: null,
          error: "Input audio data is empty after base64 decoding.",
        };
      }

      // Declare and assign tempInputPath inside try block
      const tempDir = os.tmpdir();
      const tempFilename = `helicone-audio-input-${randomUUID()}`;
      const tempInputPath = path.join(tempDir, tempFilename); // Now const string
      pathToClean = tempInputPath; // Assign for cleanup
      await fs.writeFile(tempInputPath, inputBuffer);

      // Probe the file first ---
      let inputMetadata: ffmpeg.FfprobeData | null = null; // Allow null
      let assumedInput = false; // Flag if we assumed format
      try {
        inputMetadata = await ffprobePromise(tempInputPath);
      } catch (probeError: any) {
        console.warn("ffprobe failed:", probeError.message);
        // Check if it's the specific "Invalid data" error
        if (
          probeError.message &&
          (probeError.message.includes(
            "Invalid data found when processing input"
          ) ||
            probeError.message.includes("ffprobe exited with code 1"))
        ) {
          // Log message for new assumed format
          console.warn(
            "Assuming default input format (s16le, 24kHz, mono) due to ffprobe failure."
          );
          assumedInput = true; // Set flag
          // No inputMetadata, parameters will be set below
        } else {
          // Different ffprobe error, report it
          return {
            data: null,
            error: `Failed to probe input audio format: ${probeError.message}`,
          };
        }
      }

      let audioStream: ffmpeg.FfprobeStream | undefined;
      if (inputMetadata) {
        audioStream = inputMetadata.streams.find(
          (s) => s.codec_type === "audio"
        );
      }

      // Use probed values OR fallback defaults if probe failed with invalid data
      const detectedCodec = assumedInput
        ? "pcm_s16le"
        : audioStream?.codec_name;
      const detectedRate = assumedInput ? 24000 : audioStream?.sample_rate;
      const detectedChannels = assumedInput ? 1 : audioStream?.channels;

      // Check if we have enough info (especially if probing was expected but failed partially)
      if (!assumedInput && !audioStream) {
        return {
          data: null,
          error: "No audio stream found or probe failed unexpectedly.",
        };
      }

      console.log(
        `Using input parameters: Codec=${detectedCodec || "N/A"}, Rate=${
          detectedRate || "N/A"
        }, Channels=${detectedChannels || "N/A"} ${
          assumedInput ? "(Assumed)" : "(Detected)"
        }`
      );

      // --- Prepare ffmpeg command with detected or assumed parameters ---
      const outputBufferPromise = new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        const outputStream = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          },
        });

        const command = ffmpeg().input(tempInputPath); // Start with input file

        // Apply detected format/options IF they seem valid
        const inputFormat = detectedCodec
          ? codecToInputFormat[detectedCodec]
          : null;
        if (inputFormat) {
          command.inputFormat(inputFormat);
          console.log(`Applying input format: -f ${inputFormat}`);
        } else if (detectedCodec) {
          // If codec detected but not in our map (e.g., 'mp3', 'aac'),
          // ffmpeg *should* handle it without -f, so don't add format.
          console.log(
            `Codec ${detectedCodec} detected, relying on ffmpeg internal handling.`
          );
        } else {
          // No codec detected by ffprobe? Very unlikely, but log it.
          console.warn("ffprobe did not detect a codec name.");
        }

        const inputOpts: string[] = [];
        if (detectedRate) {
          inputOpts.push("-ar", detectedRate.toString());
        }
        if (detectedChannels) {
          inputOpts.push("-ac", detectedChannels.toString());
        }
        if (inputOpts.length > 0) {
          command.inputOptions(inputOpts);
          console.log(`Applying input options: ${inputOpts.join(" ")}`);
        }

        // Add output options (always applied)
        command
          .outputOptions([
            "-ar",
            "44100", // Target sample rate
            "-af",
            "aresample=resampler=soxr", // High-quality resampler
          ])
          .toFormat("wav")
          .on("error", (err, stdout, stderr) => {
            console.error("FFmpeg Error:", err);
            console.error("FFmpeg stderr:", stderr);
            reject(`FFmpeg conversion failed: ${err.message}`);
          })
          .on("end", () => {
            resolve(Buffer.concat(chunks));
          })
          .pipe(outputStream, { end: true });
      });

      const outputBuffer = await outputBufferPromise;
      const outputBase64 = outputBuffer.toString("base64");

      return { data: outputBase64, error: null };
    } catch (error: any) {
      console.error("Error converting audio to WAV:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { data: null, error: `Conversion failed: ${errorMessage}` };
    } finally {
      // Cleanup using pathToClean
      if (pathToClean) {
        try {
          await fs.unlink(pathToClean);
          console.log(`Cleaned up temporary file: ${pathToClean}`);
        } catch (cleanupError) {
          console.error(
            `Failed to clean up temporary file ${pathToClean}:`,
            cleanupError
          );
        }
      }
    }
  }
}
