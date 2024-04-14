import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database, Json } from "../../../supabase/database.types";
import { clickhousePriceCalc } from "../../packages/cost";
import { DBQueryTimer } from "../util/loggers/DBQueryTimer";
import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { deepCompare } from "../util/helpers";
function tryModel(x: any) {
  try {
    return x.model || x.body.model || "unknown";
  } catch (e) {
    return "unknown";
  }
}
export class PromptStore {
  constructor(
    private database: SupabaseClient<Database>,
    private queryTimer: DBQueryTimer
  ) {}

  async upsertPromptV2(
    heliconeTemplate: TemplateWithInputs,
    promptId: string,
    orgId: string
  ): Promise<
    Result<
      {
        version: number;
        template: Json;
      },
      string
    >
  > {
    let existingPrompt = await this.queryTimer.withTiming(
      this.database
        .from("prompt_v2")
        .select("*")
        .eq("organization", orgId)
        .eq("user_defined_id", promptId)
        .limit(1),
      {
        queryName: "select_prompt_by_id",
      }
    );

    if (existingPrompt.error) {
      return err(existingPrompt.error.message);
    }

    if (existingPrompt.data.length === 0) {
      const insertResult = await this.queryTimer.withTiming(
        this.database
          .from("prompt_v2")
          .insert([
            {
              user_defined_id: promptId,
              organization: orgId,
            },
          ])
          .select("*"),
        {
          queryName: "insert_initial_prompt",
        }
      );
      if (insertResult.error) {
        return err(insertResult.error.message);
      }
      existingPrompt = insertResult;
    }

    const existingPromptVersion = await this.queryTimer.withTiming(
      this.database
        .from("prompts_versions")
        .select("*")
        .eq("organization", orgId)
        .eq("prompt_v2", existingPrompt.data[0].id)
        .order("major_version", { ascending: false })
        .limit(1),
      {
        queryName: "select_prompt_by_id",
      }
    );

    if (existingPromptVersion.error) {
      return err(existingPromptVersion.error.message);
    }

    let version = existingPromptVersion.data[0]?.major_version ?? 0;
    if (
      existingPromptVersion.data.length > 0 &&
      !deepCompare(
        existingPromptVersion.data?.[0].helicone_template,
        heliconeTemplate.template
      )
    ) {
      version += 1;
    }
    if (
      existingPrompt.data.length === 0 ||
      version !== existingPromptVersion.data[0]?.major_version
    ) {
      const insertResult = await this.queryTimer.withTiming(
        this.database.from("prompts_versions").insert([
          {
            helicone_template: heliconeTemplate.template as Json,
            major_version: version,
            minor_version: 0,
            organization: orgId,
            prompt_v2: existingPrompt.data[0].id,
            model: tryModel(heliconeTemplate.template),
          },
        ]),
        {
          queryName: "insert_prompt_version",
        }
      );
      if (insertResult.error) {
        return err(insertResult.error.message);
      }
    }

    return ok({
      version,
      template: heliconeTemplate.template as Json,
    });
  }
}
