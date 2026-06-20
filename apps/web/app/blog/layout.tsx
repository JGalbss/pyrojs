import type { ReactNode } from "react"

const BlogLayout = ({ children }: { children: ReactNode }) => (
  <main className="mx-auto max-w-3xl px-6 py-16">
    <a href="/" className="text-sm text-white/40 hover:text-white/70">
      ← back
    </a>
    <article className="mt-6">{children}</article>
  </main>
)

export default BlogLayout
