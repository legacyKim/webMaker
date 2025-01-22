"use client";

import React, { useState, useEffect, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { saveToLocalStorage, getFromLocalStorage } from "./utils/localstorage";

import Image from 'next/image';
import bambueong_logo from './img/bambueong_logo.png';

const ResponsiveGridLayout = WidthProvider(Responsive);

const LAYOUT_KEY = "layout";

const defaultLayouts = {
  lg: [
    {
      i: "Portfolio", x: 0, y: 0, w: 5, h: 8,
      explain: "김태훈의 포트폴리오입니다. 레이아웃에서 우클릭을 하시면 링크로 연결되는 버튼이 나옵니다.",
      url: `javascript:void(0)`,
      gitUrl: `https://github.com/legacyKim/webMaker`,
      skill: ["HTML5", "NextJs", "Vercel", "Railway"],
    },
    {
      i: "Bambueong", x: 0, y: 0, w: 5, h: 8,
      explain: "평소에 책을 읽고 메모를 하거나 생각을 정리하는 습관이 있습니다. 그런데 메모의 양이 방대해지다 보니 찾는데 시간이 꽤 오래 걸리고 잊어버리는 경우도 허다했습니다. 이를 방지하고자 메모 정리 및 참조점에 쉽게 접근할 수 있는 기능 등을 구현하였습니다.",
      url: `https://bambueong.net/`,
      gitUrl: `https://github.com/legacyKim/Whelper`,
      skill: ["HTML5", "React", "ReactQuery", "Redux", "Zustand", "CSS3", "Python", "Mysql"],
    },
    { i: "demo", x: 0, y: 0, w: 5, h: 8, explain: "준비 중 입니다.", gitUrl: "javascript:void(0)", url: 'javascript:void(0)', skill: [] }
  ],
};

interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  explain: string;
  url: string;
  gitUrl: string;
  skill?: string[];
}

export default function Home() {

  const [layouts, setLayouts] = useState<{ lg: Layout[] }>(defaultLayouts);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    const savedLayouts = getFromLocalStorage(LAYOUT_KEY, defaultLayouts);
    setLayouts(savedLayouts);
    setIsFirstRender(false);
  }, []);

  const handleLayoutChange = (
    currentLayout: Layout[],
    allLayouts: { lg: Layout[] },
  ) => {
    if (isFirstRender) return;
    const updatedLayouts = {
      lg: allLayouts.lg.map((layout) => {
        const foundLayout = layouts.lg.find((item) => item.i === layout.i);
        if (foundLayout) {
          return {
            ...foundLayout,
            ...layout,
          };
        }
        return {
          ...layout,
        };
      }),
    };

    setLayouts(updatedLayouts);
    saveToLocalStorage(LAYOUT_KEY, updatedLayouts);
  };

  const [linkPopup, setLinkPopup] = useState<Layout | false>(false);

  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="container dark" onClick={() => { setLinkPopup(false); }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1328 }}
        cols={{ lg: 13 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
      >
        {layouts.lg.map((el) => (
          <div key={el.i} className={`box ${isFirstRender ? "" : "active"}`}

            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLinkPopup(el);
              setPopupPosition({ x: e.clientX, y: e.clientY });
            }}>

            <div className="box_inner">
              <div className="box_top">
                <h1>{el.i}</h1>
              </div>

              <p className="explain">
                {el.explain}
              </p>

              <div className="box_bot">
                {

                  (el.skill || []).map((s, index) => (
                    <div className="skill_wrap" key={index}>
                      <div className={`skill_icon ${s}`}></div>
                      <span>{s}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      {linkPopup !== false && (
        <LinkPopup linkPopup={linkPopup} popupPosition={popupPosition}></LinkPopup>
      )}

    </div>
  );
}

function LinkPopup({ linkPopup, popupPosition }: {
  linkPopup: Layout; popupPosition: { x: number; y: number } | null;
}) {

  if (!linkPopup) return false;
  if (!popupPosition) return null;

  const style = {
    position: "absolute" as const,
    top: `${popupPosition.y}px`,
    left: `${popupPosition.x}px`,
    zIndex: 1000,
  };

  return (
    <div style={style} className="LinkPopup">
      <a href={linkPopup.gitUrl} target="_blank">
        <i className="icon-github-circled-alt2"></i>
      </a>
      <a href={linkPopup.url} target="_blank">
        <Image src={bambueong_logo} alt="bambueong_logo" />
      </a>
    </div>
  )
}
