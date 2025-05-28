import { $JAWN_API } from "@/lib/clients/jawn";
import { TagType } from "@/packages/common/sessions/tags";
import { create } from "zustand";
import { produce } from "immer";

type TagStoreState = {
  tagStore: {
    [ordId: string]: {
      [key in TagType]: {
        [id: string]: string;
      };
    };
  };
};
type TagStoreAction = {
  getTag: (orgId: string, session: string, type: TagType) => string | undefined;
  setTag: (
    orgId: string,
    sessionId: string,
    tag: string,
    type: TagType
  ) => void;
};

export const useTagStore = create<TagStoreState & TagStoreAction>(
  (set, get) => ({
    tagStore: {},

    getTag: (orgId: string, sessionId: string, type: TagType) =>
      get().tagStore[orgId]?.[type]?.[sessionId],

    setTag: (orgId: string, sessionId: string, tag: string, type: TagType) =>
      set(
        produce((state) => {
          // Initialize with empty objects using nullish coalescing
          state.tagStore[orgId] = state.tagStore[orgId] ?? {};
          state.tagStore[orgId][type] = state.tagStore[orgId][type] ?? {};
          state.tagStore[orgId][type][sessionId] = tag;
        })
      ),
  })
);

export async function fetchTag(
  orgId: string,
  sessionId: string,
  type: TagType,
  setTag: TagStoreAction["setTag"]
) {
  if (type === TagType.SESSION) {
    const response = await $JAWN_API.GET("/v1/session/{sessionId}/tag", {
      params: {
        path: { sessionId: sessionId },
      },
    });

    if (!response.error && response.data?.data) {
      setTag(orgId, sessionId, response.data?.data, TagType.SESSION);
    }

    return response;
  }

  // TODO: Implement fetching tags for other types
  throw new Error(`Fetching tags for ${type} is not implemented`);
}

export async function updateTag(
  orgId: string,
  sessionId: string,
  tag: string,
  type: TagType,
  setTag: TagStoreAction["setTag"]
) {
  if (type === TagType.SESSION) {
    const response = await $JAWN_API.POST("/v1/session/{sessionId}/tag", {
      params: {
        path: { sessionId: sessionId },
      },
      body: {
        tag: tag,
      },
    });

    if (!response.error) {
      setTag(orgId, sessionId, tag, TagType.SESSION);
    }

    return response;
  }

  // TODO: Implement updating tags for other types
  throw new Error(`Updating tags for ${type} is not implemented`);
}
