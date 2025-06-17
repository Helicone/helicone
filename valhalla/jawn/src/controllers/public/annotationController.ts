import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../packages/common/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { AnnotationManager, CreateABAnnotationParams } from "../../managers/annotation/AnnotationManager";
import { Annotations } from "../../lib/db/ClickhouseWrapper";

interface ABAnnotationRequest {
  datasetId: string;
  datasetRowId: string;
  requestId: string;
  prompt: string;
  responseA: string;
  responseB: string;
  choice: "a" | "b";
}

interface UpdateABAnnotationRequest {
  prompt?: string;
  responseA?: string;
  responseB?: string;
  choice?: "a" | "b";
}

@Route("v1/annotation")
@Tags("Annotation")
@Security("api_key")
export class AnnotationController extends Controller {
  @Post("/ab")
  public async createABAnnotation(
    @Body() body: ABAnnotationRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const annotationManager = new AnnotationManager(request.authParams);
    return annotationManager.createABAnnotation({
      datasetId: body.datasetId,
      datasetRowId: body.datasetRowId,
      requestId: body.requestId,
      prompt: body.prompt,
      responseA: body.responseA,
      responseB: body.responseB,
      choice: body.choice,
    });
  }

  @Get("/")
  public async getAnnotations(
    @Query() datasetId?: string,
    @Query() requestId?: string,
    @Query() annotationType?: "A/B" | "Labeling" | "RL" | "SFT",
    @Query() annotatorId?: string,
    @Query() limit?: number,
    @Query() offset?: number,
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<Annotations[], string>> {
    const annotationManager = new AnnotationManager(request!.authParams);
    return annotationManager.getAnnotations({
      datasetId,
      requestId,
      annotationType,
      annotatorId,
      limit: limit ?? 100,
      offset: offset ?? 0,
    });
  }

  @Get("/{id}")
  public async getAnnotationById(
    @Path() id: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Annotations, string>> {
    const annotationManager = new AnnotationManager(request.authParams);
    return annotationManager.getAnnotationById(id);
  }

  @Put("/ab/{id}")
  public async updateABAnnotation(
    @Path() id: string,
    @Body() body: UpdateABAnnotationRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const annotationManager = new AnnotationManager(request.authParams);
    return annotationManager.updateABAnnotation(id, {
      prompt: body.prompt,
      responseA: body.responseA,
      responseB: body.responseB,
      choice: body.choice,
    });
  }

  @Get("/dataset/{datasetId}")
  public async getDatasetAnnotations(
    @Path() datasetId: string,
    @Query() limit?: number,
    @Query() offset?: number,
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<Annotations[], string>> {
    const annotationManager = new AnnotationManager(request!.authParams);
    return annotationManager.getDatasetAnnotations(
      datasetId,
      limit ?? 100,
      offset ?? 0
    );
  }

  @Get("/dataset/{datasetId}/ab/stats")
  public async getABAnnotationStats(
    @Path() datasetId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        total: number;
        choice_a_count: number;
        choice_b_count: number;
        annotators_count: number;
      },
      string
    >
  > {
    const annotationManager = new AnnotationManager(request.authParams);
    return annotationManager.getABAnnotationStats(datasetId);
  }

  @Get("/request/{requestId}")
  public async getRequestAnnotations(
    @Path() requestId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Annotations[], string>> {
    const annotationManager = new AnnotationManager(request.authParams);
    return annotationManager.getRequestAnnotations(requestId);
  }

  @Get("/annotator/{annotatorId}")
  public async getAnnotationsByAnnotator(
    @Path() annotatorId: string,
    @Query() datasetId?: string,
    @Query() annotationType?: "A/B" | "Labeling" | "RL" | "SFT",
    @Query() limit?: number,
    @Query() offset?: number,
    @Request() request?: JawnAuthenticatedRequest
  ): Promise<Result<Annotations[], string>> {
    const annotationManager = new AnnotationManager(request!.authParams);
    return annotationManager.getAnnotationsByAnnotator(annotatorId, {
      datasetId,
      annotationType,
      limit: limit ?? 100,
      offset: offset ?? 0,
    });
  }
} 