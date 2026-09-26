"use client";

import { useEffect } from "react";

const SELECTORS = [
  ".presentation-hero-copy > *",
  ".presentation-stage",
  ".presentation-proof article",
  ".presentation-demo-copy > *",
  ".presentation-demo-player",
  ".presentation-heading > *",
  ".presentation-feature-grid article",
  ".presentation-flow-grid article",
  ".presentation-price-card",
  ".presentation-final > *",
];

export default function ScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elements = [...document.querySelectorAll(SELECTORS.join(","))];

    elements.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 90}ms`);
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
