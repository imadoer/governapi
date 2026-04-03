import { getAllPosts } from "@/lib/blog"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Security Blog | GovernAPI",
  description:
    "Expert insights on API security, governance, and best practices for enterprise teams.",
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.07] backdrop-blur-xl bg-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent"
          >
            GovernAPI
          </Link>
          <div className="flex gap-6">
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/docs" className="text-slate-300 hover:text-white transition">
              Docs
            </Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
          API Security{" "}
          <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
            Insights
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Expert insights, industry analysis, and practical guidance for enterprise security teams
        </p>
      </div>

      {/* Blog Posts Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-cyan-500/15 text-cyan-400 text-xs rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="text-slate-400 mb-4 line-clamp-3">{post.excerpt}</p>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-white/[0.07]">
                  <span>{post.author}</span>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
