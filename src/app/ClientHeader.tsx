"use client";

import Link from "next/link";

export default function ClientHeader() {
  return (
    <header className="dark">
      <Link href="/">
        <div className="img_logo"></div>
      </Link>

      <nav>
        <Link href="/content">
          <i className="icon-share"></i>
          <div>
            Content
          </div>
        </Link>
        <Link href="/project">
          <i className="icon-clipboard"></i>
          <div>
            Project
          </div>
        </Link>
      </nav>

    </header>
  );
}
