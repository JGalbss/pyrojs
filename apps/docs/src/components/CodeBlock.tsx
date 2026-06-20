import { useState } from "react"

interface CodeBlockProps {
  code: string
  title?: string
}

const copyLabel = (copied: boolean): string => {
  if (copied) return "copied!"
  return "copy"
}

export const CodeBlock = ({ code, title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)

  const onCopy = (): void => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
        <span className="text-xs font-medium text-white/40">{title ?? "ts"}</span>
        <button
          onClick={onCopy}
          className="rounded-md px-2 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          {copyLabel(copied)}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-sky-100">
        <code>{code}</code>
      </pre>
    </div>
  )
}
