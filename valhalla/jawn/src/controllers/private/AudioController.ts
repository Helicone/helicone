import { Body, Controller, Post, Route, Security, Tags } from "tsoa";

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
    return { data: null, error: "dead endpoint" };
  }
}
