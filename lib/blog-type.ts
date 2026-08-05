export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

export interface BlogPostInput {
  title: string;
  subtitle: string;
  content: string;
  imageUrl: string;
  published: boolean;
}

export function normalizeBlogPost(
  id: string,
  data: Partial<BlogPost> | Record<string, unknown>
): BlogPost {
  return {
    id,
    title: String(data.title ?? ''),
    subtitle: String(data.subtitle ?? ''),
    content: String(data.content ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
    published: Boolean(data.published),
  };
}
