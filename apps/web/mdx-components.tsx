import type { MDXComponents } from "mdx/types"

// Required by @next/mdx for the App Router. Styles the prose elements so the
// technical blog reads well on the dark theme.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="mt-2 text-4xl font-black tracking-tight" {...props} />,
    h2: (props) => <h2 className="mt-12 text-2xl font-bold text-white" {...props} />,
    h3: (props) => <h3 className="mt-8 text-xl font-semibold text-white/90" {...props} />,
    p: (props) => <p className="mt-4 leading-relaxed text-white/70" {...props} />,
    ul: (props) => <ul className="mt-4 list-disc space-y-1 pl-6 text-white/70" {...props} />,
    ol: (props) => <ol className="mt-4 list-decimal space-y-1 pl-6 text-white/70" {...props} />,
    li: (props) => <li className="leading-relaxed" {...props} />,
    a: (props) => <a className="text-sky-400 underline hover:text-sky-300" {...props} />,
    code: (props) => (
      <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-100" {...props} />
    ),
    pre: (props) => (
      <pre
        className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/50 p-4 text-[13px] leading-relaxed text-sky-100"
        {...props}
      />
    ),
    strong: (props) => <strong className="font-semibold text-white" {...props} />,
    ...components,
  }
}
