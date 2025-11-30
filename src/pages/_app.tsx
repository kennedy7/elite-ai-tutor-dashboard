// src/pages/_app.tsx
import type { AppProps } from "next/app";
import React from "react";
import { ThemeProvider } from "next-themes";
import "../app/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      storageKey="lms-theme-choice-v1" // <- important: matches your existing key
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
