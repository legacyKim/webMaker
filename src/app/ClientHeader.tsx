"use client";

import Link from "next/link";

export default function ClientHeader() {
  return (
    <header>
      <Link href="/">
        <div className="img_logo"></div>
      </Link>

      <nav>
        <Link href="/content">Content</Link>
        <Link href="/project">Project</Link>
      </nav>
    </header>
  );
}
