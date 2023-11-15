import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import {
  IDatabaseService,
  RosettaMapper,
  RosettaMapperStatus,
} from "@helicone/project-rosetta";

export class RosettaStore implements IDatabaseService {
  private supabaseClient: SupabaseClient<Database>;
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabaseClient = supabaseClient;
  }

  public async getMappersByStatus(
    statuses: RosettaMapperStatus[]
  ): Promise<RosettaMapper[]> {
    const { data, error } = await this.supabaseClient
      .from("rosetta_mappers")
      .select("*")
      .in("status", statuses);

    if (error || !data) {
      console.error("Failed to retrieve rosetta mappers", error);
      return [];
    }

    return data.map((mapper) => this.ToRosettaMapper(mapper));
  }

  public async getMappers(mapperKey: string): Promise<RosettaMapper[]> {
    const { data, error } = await this.supabaseClient
      .from("rosetta_mappers")
      .select("*")
      .eq("key", mapperKey);

    if (error || !data) {
      console.error("Failed to retrieve rosetta mappers", error);
      return [];
    }

    return data.map((mapper) => this.ToRosettaMapper(mapper));
  }

  public async updateMapper(rosettaMapper: RosettaMapper): Promise<void> {
    const newMapper = this.ToDbMapper(rosettaMapper);
    const { error } = await this.supabaseClient
      .from("rosetta_mappers")
      .update(newMapper)
      .eq("id", rosettaMapper.id);

    if (error) {
      console.error("Failed to update rosetta mapper", error);
    }
  }

  public async insertMapper(mapper: RosettaMapper): Promise<void> {
    const newMapper = this.ToDbMapper(mapper);
    const { error } = await this.supabaseClient
      .from("rosetta_mappers")
      .insert(newMapper);

    if (error) {
      console.error("Failed to add rosetta mapper", error);
    }
  }

  private ToDbMapper(
    rosettaMapper: RosettaMapper
  ): Database["public"]["Tables"]["rosetta_mappers"]["Insert"] {
    return {
      id: rosettaMapper.id,
      code: rosettaMapper.code,
      key: rosettaMapper.key,
      output_schema: rosettaMapper.outputSchema ?? {},
      output_schema_hash: rosettaMapper.outputSchemaHash,
      input_json: rosettaMapper.inputJson ?? {},
      status: rosettaMapper.status,
      version: rosettaMapper.version,
      mapped_fields: rosettaMapper.mappedFields,
      ignored_fields: rosettaMapper.ignoredFields,
      created_at: new Date(rosettaMapper.createdAt).toISOString(),
      updated_at: new Date(rosettaMapper.updatedAt).toISOString(),
    };
  }

  private ToRosettaMapper(
    dbMapper: Database["public"]["Tables"]["rosetta_mappers"]["Row"]
  ): RosettaMapper {
    return {
      id: dbMapper.id,
      key: dbMapper.key,
      outputSchemaHash: dbMapper.output_schema_hash,
      outputSchema: dbMapper.output_schema ?? {},
      inputJson: dbMapper.input_json ?? {},
      code: dbMapper.code,
      mappedFields: dbMapper.mapped_fields ?? [],
      ignoredFields: dbMapper.ignored_fields ?? [],
      status: RosettaMapperStatus[dbMapper.status],
      version: dbMapper.version,
      createdAt: new Date(dbMapper.created_at),
      updatedAt: new Date(dbMapper.updated_at),
    };
  }
}
