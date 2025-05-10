import { $JAWN_API } from "@/lib/clients/jawn";
import { TagType } from "../../../packages/common/sessions/tags";
import { create } from "zustand";

interface TagStore {
  tagStore: {
    [key in TagType]: {
      [id: string]: string;
    };
  };
  getTag: (id: string, type: TagType) => string | undefined;
  setTag: (id: string, tag: string, type: TagType) => void;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tagStore: {
    [TagType.REQUEST]: {},
    [TagType.SESSION]: {},
  },
  getTag: (id: string, type: TagType) => get().tagStore[type][id],
  setTag: (id: string, tag: string, type: TagType) =>
    set((state) => ({
      tagStore: {
        ...state.tagStore,
        [type]: {
          ...state.tagStore[type],
          [id]: tag,
        },
      },
    })),
}));

export async function fetchTag(id: string, type: TagType) {
  if (type === TagType.SESSION) {
    const response = await $JAWN_API.GET("/v1/session/{sessionId}/tag", {
      params: {
        path: { sessionId: id },
      },
    });

    return response;
  }
}

export async function updateTag(id: string, tag: string, type: TagType) {
  if (type === TagType.SESSION) {
    const response = await $JAWN_API.POST("/v1/session/{sessionId}/tag", {
      params: {
        path: { sessionId: id },
      },
      body: {
        tag: tag,
      },
    });

    return response;
  }
}
