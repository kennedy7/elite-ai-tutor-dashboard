import type { AppProps } from "next/app";
import React from "react";
import { ThemeProvider } from "next-themes";
import "../app/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      storageKey="lms-theme-choice-v1" 
    >
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
