import { Body, Controller, Post, Route, Security, Tags } from "tsoa";
// We won't directly use Result in the method signature for TSOA compatibility
// import { Result } from "../../lib/shared/result";

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
  /**
   * Dead endpoint. The route stays registered so existing callers keep getting
   * the same response, but the implementation is gone: it shelled out to
   * ffmpeg with input options built from request-derived values, which was an
   * argument-injection sink. Do not reintroduce it -- if WAV conversion is
   * needed again, build it on a library that does not take a command line.
   */
  @Post("/convert-to-wav")
  public async convertToWav(
    @Body() body: ConvertToWavRequestBody
  ): Promise<ConvertToWavResponse> {
    return { data: null, error: "dead endpoint" };
  }
}
