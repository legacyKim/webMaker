import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Content from "./pages/Content";
import ContentView from "./pages/ContentView";
import Write from "./pages/Write";
import Download from "./pages/Download";
import ContentCorrect from "./pages/ContentCorrect";

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/content" element={<Content />} />
        <Route path="/content/view/:slug" element={<ContentView />} />
        <Route path="/content/write" element={<Write />} />
        <Route path="/content/download" element={<Download />} />
        <Route path="/write" element={<Write />} />
        <Route path="/content/correct" element={<ContentCorrect />} />
      </Routes>
    </div>
  );
}

export default App;
