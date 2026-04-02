import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | GovernAPI Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="bg-slate-900/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            GovernAPI
          </Link>
          <Link href="/blog" className="text-slate-300 hover:text-white transition">
            ← Back to Blog
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-5xl font-bold text-white mb-6">{post.title}</h1>

        <div className="flex items-center gap-6 text-slate-400 mb-12 pb-8 border-b border-slate-700">
          <span>{post.author}</span>
          <span>•</span>
          <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        <div 
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-ul:text-slate-300 prose-ol:text-slate-300
            prose-li:my-2
            prose-code:text-blue-400 prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-400
            prose-table:text-slate-300
            prose-th:bg-slate-800 prose-th:text-white
            prose-td:border-slate-700"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-16 p-8 bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/30 rounded-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Secure Your APIs?</h3>
          <p className="text-slate-300 mb-6">
            Get AI-powered API security and governance in minutes. No credit card required.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-violet-700 transition"
          >
            Start Free Trial
          </Link>
        </div>
      </article>
    </div>
  );
}
