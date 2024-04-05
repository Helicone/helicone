interface SwaggerTag {
  name: string;
  description?: string;
}

interface OperationObject {
  tags?: string[];
  [key: string]: any;
}

interface PathItemObject {
  [operation: string]: OperationObject;
}

interface PathsObject {
  [path: string]: PathItemObject;
}

interface SwaggerDocument {
  openapi: string;
  info: object;
  paths: PathsObject;
  components?: object;
  tags?: SwaggerTag[];
  servers?: object[];
  [key: string]: any;
}

// Function to filter out unwanted tags and paths
export function filterSwaggerDocument(
  document: SwaggerDocument,
  tagsToHide: string[]
): SwaggerDocument {
  const filteredDocument: SwaggerDocument = { ...document };

  const filteredPaths: PathsObject = Object.entries(
    filteredDocument.paths
  ).reduce((acc, [path, pathDetails]) => {
    const operations = Object.keys(pathDetails).reduce((opsAcc, operation) => {
      const operationObject = pathDetails[operation];
      if (
        operationObject.tags &&
        !operationObject.tags.some((tag) => tagsToHide.includes(tag))
      ) {
        opsAcc[operation] = operationObject;
      }
      return opsAcc;
    }, {} as PathItemObject);

    if (Object.keys(operations).length > 0) {
      acc[path] = operations;
    }
    return acc;
  }, {} as PathsObject);

  filteredDocument.paths = filteredPaths;
  return filteredDocument;
}
