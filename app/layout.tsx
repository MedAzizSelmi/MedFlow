// app/layout.tsx
"use client" // Add this - SessionProvider is a client component

import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SessionProvider } from "next-auth/react"
import "./globals.css"

const geist = Geist({
    subsets: ["latin"],
    variable: '--font-geist'
})

const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: '--font-geist-mono'
})

// Note: Can't use metadata export with "use client"
// You'll need to handle metadata differently or move it

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <head>
            <title>MedFlow - Clinic Management</title>
            <meta name="description" content="Professional clinic management system" />
            {/* Add other meta tags manually */}
        </head>
        <body className={`${geist.className} ${geistMono.variable} antialiased`}>
        <SessionProvider>
            {children}
        </SessionProvider>
        <Analytics />
        </body>
        </html>
    )
}