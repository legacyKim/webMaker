"use client";

import React, { useState, useEffect } from "react";
import GridLayout, { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Link from "next/link";

const ResponsiveGridLayout = WidthProvider(Responsive);

const LAYOUT_KEY = "layout";

const defaultLayouts = {
  lg: [
    { i: "bambueong", x: 0, y: 0, w: 4, h: 2, minW: 1, minH: 1 },
    { i: "demo", x: 0, y: 0, w: 4, h: 2, minW: 1, minH: 1 }
  ],
  md: [
    { i: "bambueong", x: 0, y: 0, w: 4, h: 2, minW: 1, minH: 1 },
    { i: "demo", x: 0, y: 0, w: 4, h: 2, minW: 1, minH: 1 }
  ]
};

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export default function Home() {

  useEffect(() => {
    const loadStorageFunctions = async () => {
      const localStorageModule = await import('./utils/localstorage');
      localStorageModule.saveToLocalStorage('key', 'value');
    };

    loadStorageFunctions();
  }, []);

  const [layouts, setLayouts] = useState<{ lg: Layout[]; md: Layout[] }>(defaultLayouts);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    const loadAndSetLayouts = async () => {
      const localStorageModule = await import('./utils/localstorage');
      const savedLayouts = localStorageModule.getFromLocalStorage(LAYOUT_KEY, defaultLayouts);
      
      setLayouts(savedLayouts);
      setIsFirstRender(false);
    };

    loadAndSetLayouts();
  }, []);


  const handleLayoutChange = async (
    currentLayout: Layout[],
    allLayouts: { lg: Layout[]; md: Layout[] },
  ) => {
    if (isFirstRender) return;
    setLayouts(allLayouts);

    const localStorageModule = await import('./utils/localstorage');
    localStorageModule.saveToLocalStorage(LAYOUT_KEY, allLayouts);

  };

  return (
    <div className="container page_1320">
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1328, md: 400 }}
        cols={{ lg: 13, md: 20 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
      >
        {layouts.lg.map((el) => (
          <div key={el.i} className={`box ${isFirstRender ? "" : "active"}`}>
            <Link href="https://bambueong.net/">
              <h1>{el.i}</h1>
            </Link>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
