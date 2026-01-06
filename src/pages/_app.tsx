import type { AppProps } from "next/app";
import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider }  from "@/context/AuthProvider";
import "../app/globals.css";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="lms-theme-choice-v1"
    >
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}
