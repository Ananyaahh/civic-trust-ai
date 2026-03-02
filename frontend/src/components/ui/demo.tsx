"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemo() {
  return (
    <div className="hero-scroll-demo flex flex-col overflow-hidden pb-[500px] pt-[1000px]">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="hero-title text-4xl font-semibold text-black dark:text-white">
              Bharat Civic Intelligence <br />
              <span className="hero-highlight text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                Region Ward Slide
              </span>
            </h1>
          </>
        }
      >
        <div className="hero-map-card">
          <div className="hero-map-head">
            <span>Mumbai Municipal Risk Map</span>
            <span>Live Ward Overlay</span>
          </div>
          <div className="hero-map-stage">
            <div className="hero-map-region north">North Ridge</div>
            <div className="hero-map-region central">Central Basin</div>
            <div className="hero-map-region east">Coastal East</div>
            <div className="hero-map-region south">South Transfer</div>
            <button className="hero-map-dot high" style={{ left: "27%", top: "34%" }}>Ward 12</button>
            <button className="hero-map-dot mid" style={{ left: "58%", top: "47%" }}>Ward 07</button>
            <button className="hero-map-dot low" style={{ left: "75%", top: "24%" }}>Ward 03</button>
            <button className="hero-map-dot high" style={{ left: "43%", top: "68%" }}>Ward 19</button>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}
