// place files you want to import through the `$lib` alias in this folder.

import type { Post } from "@prisma/client";

export function getSlug(post: Post) {
  return `${post.title.replace(/\s+/g, '-').toLowerCase()}-${post.id}`;
}
