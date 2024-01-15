// Remove the import statement for "fs"
import { OpenAI } from "openai";
import { Result, ok } from "../shared/result";
import { FileObject } from "openai/resources";
import { FineTuningJob } from "openai/resources/fine-tuning/jobs";
import fs from "fs";

export class OpenAIClient {
  private openai: OpenAI;
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      organization: "org-GNGkfLr8bEzt1R1MLfWdhBSb",
    });
  }

  async createFineTuneJob(
    fileId: string,
    model: string
  ): Promise<Result<FineTuningJob, string>> {
    const fineTune = await this.openai.fineTuning.jobs.create({
      training_file: fileId,
      model: model,
    });

    return ok(fineTune);
  }

  // TODO: Limit to 1 gb
  async uploadFineTuneFile(
    trainingFilePath: string
  ): Promise<Result<FileObject, string>> {
    const file = await this.openai.files.create({
      file: fs.createReadStream(trainingFilePath),
      purpose: "fine-tune",
    });

    return ok(file);
  }
}
