import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
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
        <Route path="/" element={<Content />} />
        <Route path="/view/:slug" element={<ContentView />} />
        <Route path="/write" element={<Write />} />
        <Route path="/download" element={<Download />} />
        <Route path="/correct" element={<ContentCorrect />} />
      </Routes>
    </div>
  );
}

export default App;
