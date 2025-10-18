import {
  FolderNode,
  HeliconeRequestType,
  Session,
  Trace,
  TraceNode,
  TreeNodeData,
} from "./sessionTypes";

export const createTraceNodes = (
  session: Session,
): Record<string, TraceNode> => {
  const nodes: Record<string, TraceNode> = {};

  // Create a node for each trace
  session.traces.forEach((trace) => {
    nodes[trace.path] = {
      trace,
      children: [],
      parents: [],
    };
  });

  // Establish parent-child relationships
  session.traces.forEach((trace) => {
    const parts = trace.path.split("/");
    parts.pop(); // Remove the last part to get the parent path
    const parentPath = parts.join("/");

    if (parentPath && nodes[parentPath]) {
      nodes[trace.path].parents.push(nodes[parentPath]);
      nodes[parentPath].children.push(nodes[trace.path]);
    }
  });

  return nodes;
};

export const findParents = (trace: Trace, allTraces: Trace[]) => {
  const parentTracePath = trace.path.split("/").slice(0, -1).join("/");

  return allTraces.filter((trace) => trace.path === parentTracePath);
};

export const tracesToFolderNodes = (traces: Trace[]): FolderNode[] => {
  if (traces.length === 0) {
    return [];
  }
  const folderMap: Record<string, FolderNode> = {};

  traces.forEach((trace) => {
    if (!trace.path) {
      return;
    }
    const normalizedPath = trace.path.startsWith("/")
      ? trace.path
      : `/${trace.path}`;
    const parts = normalizedPath.split("/");
    if (!parts) {
      return;
    }
    let currentFolder: FolderNode | undefined;

    parts.forEach((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");

      if (!folderMap[currentPath]) {
        const newFolder: FolderNode = {
          folderName: part,
          currentPath: currentPath,
          children: [],
        };
        folderMap[currentPath] = newFolder;

        if (index === 0) {
          folderMap[currentPath] = newFolder;
        } else if (currentFolder) {
          currentFolder.children.push(newFolder);
        }
      }

      currentFolder = folderMap[currentPath];
    });

    if (currentFolder) {
      currentFolder.children.push(trace);
    }
  });

  const rootPaths = Object.keys(folderMap).filter(
    (path) => !path.includes("/"),
  );

  return rootPaths.map((rootPath) => folderMap[rootPath]);
};

export const totalLatency = (folder: FolderNode): number => {
  const earliestFolder = (folder: FolderNode): number => {
    if (folder.children.length === 0) {
      return 0;
    }

    return Math.min(
      ...folder.children.map((child) => {
        if ("folderName" in child) {
          return earliestFolder(child);
        } else {
          return child.start_unix_timestamp_ms;
        }
      }),
    );
  };
  const latestFolder = (folder: FolderNode): number => {
    if (folder.children.length === 0) {
      return 0;
    }

    return Math.max(
      ...folder.children.map((child) => {
        if ("folderName" in child) {
          return latestFolder(child);
        } else {
          return child.end_unix_timestamp_ms;
        }
      }),
    );
  };
  return Math.round(latestFolder(folder) - earliestFolder(folder));
};

export const tracesToTreeNodeData = (traces: Trace[]): TreeNodeData => {
  if (traces.length === 0) {
    return {
      latency: 0,
      subPathName: "",
      currentPath: "",
    };
  }
  const folderNodes = tracesToFolderNodes(traces);
  const folderToTreeNode = (folder: FolderNode): TreeNodeData => {
    return {
      subPathName: folder.folderName,
      latency: totalLatency(folder),
      currentPath: folder.currentPath,
      children: folder.children.map((child) => {
        if ("folderName" in child) {
          return folderToTreeNode(child);
        } else {
          return {
            trace: child,
            currentPath: child.path,
            latency:
              child?.end_unix_timestamp_ms && child?.start_unix_timestamp_ms
                ? child.end_unix_timestamp_ms - child.start_unix_timestamp_ms
                : 0,
            properties: child.properties,
            heliconeRequestType: getHeliconeRequestType(child),
          };
        }
      }),
    };
  };

  return folderToTreeNode(folderNodes[0]);
};

function getHeliconeRequestType(trace: Trace): HeliconeRequestType {
  // base type on conversation trace
  const responseMessage = trace.request.schema.response;
  const containsToolCall = responseMessage?.messages?.some((message) => message.tool_calls?.length ?? 0 > 0);
  if (containsToolCall) {
    return "Tool";
  }

  // for custom logged events
  return trace.request.model.startsWith("tool:")
    ? "Tool"
    : trace.request.model.startsWith("vector_db")
      ? "VectorDB"
      : trace.request.model.startsWith("data:")
        ? "Data"
        : "LLM";
}
