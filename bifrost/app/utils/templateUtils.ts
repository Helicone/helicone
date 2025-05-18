// Utilities for fetching and processing template data from the GitHub repository

// The GitHub repository information
const REPO_OWNER = "Helicone";
const REPO_NAME = "helicone-templates";
const TEMPLATES_PATH = "templates";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;

export interface TemplateMetadata {
  title: string;
  description: string;
  author?: string;
  tags?: string[];
  logo?: string;
  lastUpdated?: string;
  difficulty?: string;
  slug: string; // Template directory name
}

export interface TemplateData extends TemplateMetadata {
  mdxContent: string; // Raw MDX content for rendering
}

// Fetch the list of all template directories from GitHub
export async function getAllTemplateDirectories(): Promise<string[]> {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/contents/${TEMPLATES_PATH}`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 3600 }, // Revalidate once per hour
      }
    );

    if (!response.ok) {
      console.error(
        "Failed to fetch template directories:",
        await response.text()
      );
      return [];
    }

    const data = await response.json();
    return data
      .filter((item: any) => item.type === "dir")
      .map((item: any) => item.name);
  } catch (error) {
    console.error("Error fetching template directories:", error);
    return [];
  }
}

// Fetch metadata for a specific template
export async function getTemplateMetadata(
  slug: string
): Promise<TemplateMetadata | null> {
  try {
    const response = await fetch(
      `${GITHUB_RAW_URL}/${TEMPLATES_PATH}/${slug}/metadata.json`,
      {
        next: { revalidate: 3600 }, // Revalidate once per hour
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch metadata for ${slug}:`,
        await response.text()
      );
      return null;
    }

    const metadata = await response.json();
    return { ...metadata, slug };
  } catch (error) {
    console.error(`Error fetching metadata for ${slug}:`, error);
    return null;
  }
}

// Fetch all templates with their metadata (for the listing page)
export async function getAllTemplatesWithMetadata(): Promise<
  TemplateMetadata[]
> {
  const slugs = await getAllTemplateDirectories();
  const metadataPromises = slugs.map((slug) => getTemplateMetadata(slug));
  const metadataResults = await Promise.all(metadataPromises);

  return metadataResults.filter(
    (metadata): metadata is TemplateMetadata => metadata !== null
  );
}

// Fetch the contents of a template directory to find MDX files
async function getTemplateContents(slug: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${GITHUB_API_URL}/contents/${TEMPLATES_PATH}/${slug}`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to fetch contents of ${slug}:`,
        await response.text()
      );
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching contents of ${slug}:`, error);
    return [];
  }
}

// Try to fetch an MDX file from a specific path
async function tryFetchMdxFile(path: string): Promise<string | null> {
  try {
    const response = await fetch(`${GITHUB_RAW_URL}/${path}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    return null;
  }
}

// Fetch the MDX content for a specific template
export async function getTemplateMdxContent(
  slug: string
): Promise<string | null> {
  // List of possible MDX file names and locations to try
  const possiblePaths = [
    `${TEMPLATES_PATH}/${slug}/cookbook.mdx`,
    `${TEMPLATES_PATH}/${slug}/README.md`,
    `${TEMPLATES_PATH}/${slug}/README.mdx`,
    `${TEMPLATES_PATH}/${slug}/index.mdx`,
    `${TEMPLATES_PATH}/${slug}/docs/cookbook.mdx`,
    `${TEMPLATES_PATH}/${slug}/docs/README.md`,
  ];

  // Try each possible path
  for (const path of possiblePaths) {
    const content = await tryFetchMdxFile(path);
    if (content !== null) {
      console.log(`Found MDX content at: ${path}`);
      return content;
    }
  }

  // If no predefined path works, try to find MDX files in the directory
  const contents = await getTemplateContents(slug);
  const mdxFiles = contents.filter(
    (item: any) =>
      item.type === "file" &&
      (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
  );

  // If we found any MDX files, try to fetch the first one
  if (mdxFiles.length > 0) {
    const content = await tryFetchMdxFile(
      `${TEMPLATES_PATH}/${slug}/${mdxFiles[0].name}`
    );
    if (content !== null) {
      console.log(`Found MDX content in file: ${mdxFiles[0].name}`);
      return content;
    }
  }

  // If we still haven't found content, check if there's a docs directory
  const docsDir = contents.find(
    (item: any) => item.type === "dir" && item.name === "docs"
  );

  if (docsDir) {
    try {
      const docsContents = await fetch(docsDir.url, {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 3600 },
      }).then((res) => res.json());

      const docsMdxFiles = docsContents.filter(
        (item: any) =>
          item.type === "file" &&
          (item.name.endsWith(".md") || item.name.endsWith(".mdx"))
      );

      if (docsMdxFiles.length > 0) {
        const content = await tryFetchMdxFile(
          `${TEMPLATES_PATH}/${slug}/docs/${docsMdxFiles[0].name}`
        );
        if (content !== null) {
          console.log(
            `Found MDX content in docs directory: ${docsMdxFiles[0].name}`
          );
          return content;
        }
      }
    } catch (error) {
      console.error(`Error fetching docs directory contents:`, error);
    }
  }

  // If we couldn't find any MDX content, generate a placeholder
  console.error(
    `No MDX content found for ${slug} after checking multiple locations`
  );
  return `# ${slug}\n\nNo documentation is currently available for this template. You can view the source code on [GitHub](https://github.com/Helicone/helicone-templates/tree/main/templates/${slug}).`;
}

// Get complete data for a template, including metadata and MDX content
export async function getTemplateData(
  slug: string
): Promise<TemplateData | null> {
  const metadata = await getTemplateMetadata(slug);
  if (!metadata) return null;

  const mdxContent = await getTemplateMdxContent(slug);
  if (!mdxContent) return null;

  return { ...metadata, mdxContent };
}
