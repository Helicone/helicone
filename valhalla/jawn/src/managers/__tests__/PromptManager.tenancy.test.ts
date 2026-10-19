import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
  dbQueryClickhouse: jest.fn(),
}));
jest.mock("../../lib/shared/db/pgpClient", () => ({
  HELICONE_DB: { tx: jest.fn() },
}));
jest.mock("../../lib/resetPromptCache", () => ({
  resetPromptCache: jest.fn(),
}));

import { dbExecute } from "../../lib/shared/db/dbExecute";
import {
  Prompt2025Manager,
  PromptManager,
} from "../prompt/PromptManager";

const ORG = "11111111-1111-1111-1111-111111111111";
const OTHER_ORG = "22222222-2222-2222-2222-222222222222";
const OWN_VERSION = "aaaaaaaa-0000-0000-0000-000000000001";
const OWN_VERSION_2 = "aaaaaaaa-0000-0000-0000-000000000002";
const OWN_PROMPT = "bbbbbbbb-0000-0000-0000-000000000001";
const OTHER_PROMPT = "bbbbbbbb-0000-0000-0000-000000000002";
const OWN_EXPERIMENT = "cccccccc-0000-0000-0000-000000000001";
const FOREIGN_EXPERIMENT = "cccccccc-0000-0000-0000-000000000002";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const norm = (sql: string) => sql.replace(/\s+/g, " ").trim();

function queries(): string[] {
  return mockDbExecute.mock.calls.map(([sql]) => norm(sql as string));
}

/**
 * Minimal model of prompts_versions / experiment_v3 ownership. Rows belong to
 * ORG unless listed as foreign.
 */
function installDb(opts: {
  ownVersions?: Record<string, string>; // versionId -> prompt_v2
  ownExperiments?: string[];
} = {}) {
  const ownVersions = opts.ownVersions ?? {
    [OWN_VERSION]: OWN_PROMPT,
    [OWN_VERSION_2]: OWN_PROMPT,
  };
  const ownExperiments = opts.ownExperiments ?? [OWN_EXPERIMENT];

  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    const q = norm(sql);
    if (
      q.startsWith(
        "SELECT prompts_versions.id, prompts_versions.prompt_v2 FROM prompts_versions JOIN prompt_v2"
      )
    ) {
      const [id, org] = params;
      const promptId = org === ORG ? ownVersions[id] : undefined;
      return {
        data: promptId ? [{ id, prompt_v2: promptId }] : [],
        error: null,
      };
    }
    if (q.startsWith("SELECT id FROM prompts_versions WHERE id = $1")) {
      const [id, org, promptId] = params;
      const ok = org === ORG && ownVersions[id] === promptId;
      return { data: ok ? [{ id }] : [], error: null };
    }
    if (q.startsWith("SELECT id FROM experiment_v3")) {
      const [id, org] = params;
      const ok = org === ORG && ownExperiments.includes(id);
      return { data: ok ? [{ id }] : [], error: null };
    }
    if (q.startsWith("WITH parent_prompt_version AS")) {
      return {
        data: [{ id: "new-version", major_version: 1, minor_version: 1 }],
        error: null,
      };
    }
    if (q.startsWith("UPDATE prompts_versions SET helicone_template")) {
      const [, id, org] = params;
      const ok = org === ORG && id in ownVersions;
      return { data: ok ? [{ id }] : [], error: null };
    }
    if (q.startsWith("SELECT input_keys FROM experiment_v3")) {
      const [id, org] = params;
      const ok = org === ORG && ownExperiments.includes(id);
      return { data: ok ? [{ input_keys: ["a"] }] : [], error: null };
    }
    if (q.startsWith("UPDATE experiment_v3 SET input_keys")) {
      const [, org, id] = params;
      const ok = org === ORG && ownExperiments.includes(id);
      return { data: ok ? [{ id }] : [], error: null };
    }
    if (q.startsWith("INSERT INTO prompt_input_keys")) {
      return { data: [], error: null };
    }
    if (q.startsWith("SELECT major_version, minor_version, prompt_id FROM prompts_2025_versions")) {
      return {
        data: [{ major_version: 1, minor_version: 0, prompt_id: OWN_PROMPT }],
        error: null,
      };
    }
    if (q.startsWith("SELECT prompts_versions.id, minor_version")) {
      return { data: [], error: null };
    }
    if (q.startsWith("SELECT prompt_v2.id, prompt_v2.user_defined_id")) {
      return { data: [], error: null };
    }
    throw new Error(`Unexpected query: ${q}`);
  }) as any);
}

const manager = () => new PromptManager({ organizationId: ORG });

beforeEach(() => {
  mockDbExecute.mockReset();
});

describe("legacy createNewPromptVersion tenancy", () => {
  test("rejects a parent version from another org without inserting", async () => {
    installDb({ ownVersions: {} });
    const result = await manager().createNewPromptVersion(OWN_VERSION, {
      newHeliconeTemplate: { model: "gpt-4o" },
    } as any);
    expect(result.error).toBe("Parent prompt version not found");
    expect(queries().some((q) => q.startsWith("WITH parent_prompt_version"))).toBe(false);
  });

  test("rejects a bump version that belongs to another prompt/org", async () => {
    installDb({ ownVersions: { [OWN_VERSION]: OWN_PROMPT, [OWN_VERSION_2]: OTHER_PROMPT } });
    const result = await manager().createNewPromptVersion(OWN_VERSION, {
      newHeliconeTemplate: { model: "gpt-4o" },
      bumpForMajorPromptVersionId: OWN_VERSION_2,
    } as any);
    expect(result.error).toBe("Bump prompt version not found");
    expect(queries().some((q) => q.startsWith("WITH parent_prompt_version"))).toBe(false);
  });

  test("rejects an experiment from another org", async () => {
    installDb();
    const result = await manager().createNewPromptVersion(OWN_VERSION, {
      newHeliconeTemplate: { model: "gpt-4o" },
      experimentId: FOREIGN_EXPERIMENT,
    } as any);
    expect(result.error).toBe("Experiment not found");
    expect(queries().some((q) => q.startsWith("WITH parent_prompt_version"))).toBe(false);
  });

  test("inserts for an owned parent and scopes the CTE lookups by org", async () => {
    installDb();
    const result = await manager().createNewPromptVersion(OWN_VERSION, {
      newHeliconeTemplate: { model: "gpt-4o" },
      bumpForMajorPromptVersionId: OWN_VERSION_2,
      experimentId: OWN_EXPERIMENT,
    } as any);
    expect(result.error).toBeNull();
    const insert = queries().find((q) => q.startsWith("WITH parent_prompt_version"))!;
    expect(insert).toContain(
      "SELECT * FROM prompts_versions WHERE id = $1 AND organization = $4 AND soft_delete = false"
    );
    expect(insert).toContain(
      "FROM prompts_versions WHERE id = $8 AND organization = $4 AND soft_delete = false"
    );
    const insertCall = mockDbExecute.mock.calls.find(([sql]) =>
      norm(sql as string).startsWith("WITH parent_prompt_version")
    )!;
    expect((insertCall[1] as any[])[3]).toBe(ORG);
  });
});

describe("legacy editPromptVersionTemplate tenancy", () => {
  test("does not insert prompt_input_keys for a foreign experiment", async () => {
    installDb();
    const result = await manager().editPromptVersionTemplate(OWN_VERSION, {
      heliconeTemplate: '<helicone-prompt-input key=\\"x\\" />',
      experimentId: FOREIGN_EXPERIMENT,
    } as any);
    expect(result.error).toBe("Experiment not found");
    expect(queries().some((q) => q.startsWith("INSERT INTO prompt_input_keys"))).toBe(false);
    expect(queries().some((q) => q.startsWith("UPDATE experiment_v3"))).toBe(false);
  });

  test("does not touch experiments when the version is not owned", async () => {
    installDb({ ownVersions: {} });
    const result = await manager().editPromptVersionTemplate(OWN_VERSION, {
      heliconeTemplate: "{}",
      experimentId: OWN_EXPERIMENT,
    } as any);
    expect(result.error).toBe("Prompt version not found");
    expect(queries().some((q) => q.includes("experiment_v3"))).toBe(false);
  });

  test("inserts keys only after the scoped experiment update succeeds", async () => {
    installDb();
    const result = await manager().editPromptVersionTemplate(OWN_VERSION, {
      heliconeTemplate: '<helicone-prompt-input key=\\"x\\" />',
      experimentId: OWN_EXPERIMENT,
    } as any);
    expect(result.error).toBeNull();
    const q = queries();
    const updateIdx = q.findIndex((s) => s.startsWith("UPDATE experiment_v3"));
    const insertIdx = q.findIndex((s) => s.startsWith("INSERT INTO prompt_input_keys"));
    expect(updateIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(updateIdx);
    expect(q.find((s) => s.startsWith("SELECT input_keys"))).toContain("AND organization = $2");
  });
});

describe("legacy prompt read queries are org-scoped", () => {
  test("getPromptVersions filters prompts_versions.organization", async () => {
    installDb();
    await manager().getPromptVersions("all");
    expect(queries()[0]).toContain("AND prompts_versions.organization = $1");
  });

  test("getCompiledPromptVersions filters and orders deterministically", async () => {
    installDb();
    await manager().getCompiledPromptVersions("all", {});
    const q = queries()[0];
    expect(q).toContain("AND prompts_versions.organization = $1");
    expect(q).toContain(
      "ORDER BY prompts_versions.major_version, prompts_versions.minor_version, prompts_versions.created_at"
    );
  });

  test("getPormptVersionsTemplates filters and orders deterministically", async () => {
    installDb();
    await manager().getPormptVersionsTemplates("all", {});
    const q = queries()[0];
    expect(q).toContain("AND prompts_versions.organization = $1");
    expect(q).toContain(
      "ORDER BY prompts_versions.major_version, prompts_versions.minor_version, prompts_versions.created_at"
    );
  });

  test("getPrompt filters prompts_versions.organization", async () => {
    installDb();
    await manager().getPrompt({} as any, OWN_PROMPT);
    expect(queries()[0]).toContain("AND prompts_versions.organization = $1");
  });
});

describe("Prompt2025 newPromptVersion", () => {
  test("rejects a base version that belongs to a different prompt", async () => {
    installDb();
    const m = new Prompt2025Manager({ organizationId: ORG });
    const result = await m.newPromptVersion({
      promptId: OTHER_PROMPT,
      promptVersionId: OWN_VERSION,
      newMajorVersion: false,
      commitMessage: "x",
      promptBody: { model: "gpt-4o", messages: [] } as any,
    });
    expect(result.error).toBe(
      "Prompt version does not belong to the specified prompt"
    );
    expect(queries().some((q) => q.startsWith("INSERT INTO prompts_2025_versions"))).toBe(false);
  });
});

void OTHER_ORG;
