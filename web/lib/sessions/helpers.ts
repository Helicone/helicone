import {
  FolderNode,
  Session,
  Trace,
  TraceNode,
  TreeNodeData,
} from "./sessionTypes";

export const createTraceNodes = (
  session: Session
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
    const parts = trace.path.split("/");
    if (!parts) {
      return;
    }
    let currentFolder: FolderNode | undefined;

    parts.forEach((part, index) => {
      const currentPath = parts.slice(0, index + 1).join("/");

      if (!folderMap[currentPath]) {
        const newFolder: FolderNode = {
          folderName: part,
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
    (path) => !path.includes("/")
  );

  return rootPaths.map((rootPath) => folderMap[rootPath]);
};

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
    })
  );
};

export const latestFolder = (folder: FolderNode): number => {
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
    })
  );
};

export const tracesToTreeNodeData = (traces: Trace[]): TreeNodeData => {
  if (traces.length === 0) {
    return {
      duration: "0s",
      name: "",
    };
  }
  const folderNodes = tracesToFolderNodes(traces);

  const folderToTreeNode = (folder: FolderNode): TreeNodeData => {
    return {
      name: folder.folderName,
      duration: `${(latestFolder(folder) - earliestFolder(folder)) / 1000}s`,
      children: folder.children.map((child) => {
        if ("folderName" in child) {
          return folderToTreeNode(child);
        } else {
          return {
            trace: child,
            name: "LLM",
            duration: `${
              (child.end_unix_timestamp_ms - child.start_unix_timestamp_ms) /
              1000
            }s`,
            properties: child.properties,
          } as TreeNodeData;
        }
      }),
    };
  };

  return folderToTreeNode(folderNodes[0]);
};
