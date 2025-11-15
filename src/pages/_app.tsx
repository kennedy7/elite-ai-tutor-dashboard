// src/pages/_app.tsx
import type { AppProps } from "next/app";
import "../app/globals.css"; // <- path to your globals.css (see note)
import React from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
