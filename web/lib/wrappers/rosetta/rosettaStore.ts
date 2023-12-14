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

  /**
   * Retrieves Rosetta mappers based on their status.
   * @param statuses - An array of RosettaMapperStatus values.
   * @returns A promise that resolves to an array of RosettaMapper objects.
   */
  public async getMappersByStatus(
    statuses: RosettaMapperStatus[]
  ): Promise<RosettaMapper[]> {
    const { data, error } = await this.supabaseClient
      .from("rosetta_mappers")
      .select("*")
      .in("status", statuses);

    if (error) {
      console.error("Failed to retrieve rosetta mappers", error);
      return [];
    }

    return data?.map((mapper) => this.ToRosettaMapper(mapper)) ?? [];
  }

  /**
   * Retrieves an array of Rosetta mappers based on the provided mapper key.
   * @param mapperKey The key used to filter the Rosetta mappers.
   * @returns A promise that resolves to an array of RosettaMapper objects.
   */
  public async getMappers(mapperKey: string): Promise<RosettaMapper[]> {
    const { data, error } = await this.supabaseClient
      .from("rosetta_mappers")
      .select("*")
      .eq("key", mapperKey);

    if (error) {
      console.error("Failed to retrieve rosetta mappers", error);
      return [];
    }

    return data?.map((mapper) => this.ToRosettaMapper(mapper)) ?? [];
  }

  /**
   * Updates the rosetta mapper in the database.
   *
   * @param rosettaMapper - The rosetta mapper object to update.
   * @returns A promise that resolves when the update is complete.
   */
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

  /**
   * Inserts a RosettaMapper into the database.
   *
   * @param mapper - The RosettaMapper to be inserted.
   * @returns A Promise that resolves to void.
   */
  public async insertMapper(mapper: RosettaMapper): Promise<void> {
    const newMapper = this.ToDbMapper(mapper);
    const { error } = await this.supabaseClient
      .from("rosetta_mappers")
      .upsert(newMapper, {
        onConflict: "key,version",
        ignoreDuplicates: true,
      });

    if (error) {
      console.error("Failed to add rosetta mapper", error);
    }
  }

  /**
   * Maps a RosettaMapper object to the corresponding database insert object.
   *
   * @param rosettaMapper - The RosettaMapper object to be mapped.
   * @returns The mapped database insert object.
   */
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
      created_at: rosettaMapper.createdAt.toISOString(),
      updated_at: rosettaMapper.updatedAt.toISOString(),
    };
  }

  /**
   * Maps a database mapper object to a RosettaMapper object.
   *
   * @param dbMapper - The database mapper object to be mapped.
   * @returns The mapped RosettaMapper object.
   */
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
