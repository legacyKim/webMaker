import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="dark">
      <Link to="/">
        <div className="img_logo"></div>
      </Link>

      <nav>
        <Link to="/content">
          <i className="icon-share"></i>
          <div>Content</div>
        </Link>

        <Link to="/content/download">
          <i className="icon-download"></i>
          <div>Files</div>
        </Link>
      </nav>
    </header>
  );
}
