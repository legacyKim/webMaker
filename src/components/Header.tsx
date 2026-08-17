import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="dark">
      <Link to="/">
        <div className="icon-link"></div>
      </Link>

      <nav>
        <Link to="/download">
          <i className="icon-download"></i>
          <div>Files</div>
        </Link>
      </nav>
    </header>
  );
}
