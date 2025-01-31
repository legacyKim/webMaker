import type { Metadata } from "next";

import "./css/base.css";
import "./css/style.css";
import "./css/style.scss";

import "./css/fontello/css/animation.css";
import "./css/fontello/css/fontello.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "개발 블로그",
};

import ClientHeader from "./ClientHeader";
import QueryProvider from "./QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>

        <QueryProvider>
          <ClientHeader />
          {children}
        </QueryProvider>

      </body>
    </html>
  );
}
