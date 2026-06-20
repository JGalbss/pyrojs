import type { Metadata } from "next"
import type { ReactNode } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "pyrojs — a fireworks engine for the web",
  description:
    "68 firework types, image/SVG fireworkify, a one-line React overlay, and an Effect-TS choreography DSL. Like react-confetti, but fireworks.",
}

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
)

export default RootLayout
