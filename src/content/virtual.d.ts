declare module "virtual:hyperscale/content" {
  import type { ContentIndex } from "@/content/schema";
  const index: ContentIndex;
  export default index;
}

declare module "*.mdx" {
  export const frontmatter: Record<string, unknown>;
}
