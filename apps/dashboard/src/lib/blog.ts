import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'src/content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string;
  tags: string[];
  image: string;
  content: string;
  excerpt: string;
}

export function getAllPosts(): BlogPost[] {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      const excerpt = content.substring(0, 200).replace(/#/g, '').trim() + '...';

      return {
        slug,
        title: data.title,
        description: data.description,
        author: data.author,
        date: data.date,
        tags: data.tags || [],
        image: data.image || '/blog/default.jpg',
        content,
        excerpt: data.description || excerpt,
      };
    });

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const processedContent = await remark().use(html).process(content);
    const contentHtml = processedContent.toString();

    return {
      slug,
      title: data.title,
      description: data.description,
      author: data.author,
      date: data.date,
      tags: data.tags || [],
      image: data.image || '/blog/default.jpg',
      content: contentHtml,
      excerpt: data.description,
    };
  } catch {
    return null;
  }
}
