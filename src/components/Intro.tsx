'use client';

import { useEffect, useState } from 'react';

// Eröffnungsanimation: Eine kleine Fee fliegt über den Bildschirm, danach
// erscheint das Logo. Läuft nur einmal pro Besuch und lässt sich wegklicken.
// Bei "weniger Bewegung" in den Geräte-Einstellungen wird sie nicht gezeigt.

const KEY = 'hikaya-intro';
const HOLD_MS = 4400; // so lange bleibt die Animation, bevor sie ausblendet
const FADE_MS = 900;

export default function Intro({ tagline, skipLabel }: { tagline: string; skipLabel: string }) {
  const [phase, setPhase] = useState<'show' | 'hide' | 'gone'>('show');

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === '1';
    } catch {}
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce) {
      setPhase('gone');
      return;
    }
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => setPhase('hide'), HOLD_MS);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (phase === 'hide') {
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {}
      const t = setTimeout(() => setPhase('gone'), FADE_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'gone') document.body.style.overflow = '';
  }, [phase]);

  useEffect(() => {
    if (phase !== 'show') return;
    const skip = () => setPhase('hide');
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className={phase === 'hide' ? 'intro intro-hide' : 'intro'}
      onClick={() => setPhase('hide')}
    >
      <svg className="intro-stage" viewBox="0 0 800 500" aria-hidden="true">
        <defs>
          <radialGradient id="hk-glow">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <path id="hk-star" d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#fff" />
          <path
            id="hk-flight"
            d="M -60 440 C 150 470, 180 230, 300 250 C 420 270, 470 380, 560 300 C 640 230, 600 120, 520 100"
          />
        </defs>

        {/* Logo, Schriftzug, Slogan */}
        <image href="/logo-white.svg" x="300" y="60" width="200" height="200" className="intro-logo" />
        <text x="400" y="325" textAnchor="middle" className="intro-word">
          Hikaya
        </text>
        <text x="400" y="368" textAnchor="middle" className="intro-tag">
          {tagline}
        </text>

        {/* Funkeln um das Logo, wenn die Fee ankommt */}
        {[
          [318, 92, 2.7],
          [488, 66, 2.9],
          [510, 232, 3.1],
          [292, 214, 3.3],
          [540, 140, 3.5],
        ].map(([x, y, delay]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <use href="#hk-star" className="tw" style={{ animationDelay: `${delay}s` }} />
          </g>
        ))}

        {/* Funkenspur hinter der Fee */}
        {[0.12, 0.24, 0.36, 0.48, 0.6, 0.72].map((d, i) => (
          <g key={d} opacity="0">
            <use href="#hk-star" transform={`scale(${0.9 - i * 0.11})`} />
            <animateMotion dur="3s" begin={`${d}s`} fill="freeze">
              <mpath href="#hk-flight" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;0.9;0.9;0"
              keyTimes="0;0.1;0.8;1"
              dur="3s"
              begin={`${d}s`}
              fill="freeze"
            />
          </g>
        ))}

        {/* Die Fee */}
        <g>
          <animateMotion dur="3s" begin="0s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1">
            <mpath href="#hk-flight" />
          </animateMotion>
          <circle r="34" fill="url(#hk-glow)" />
          <g className="wings" fill="#fff" fillOpacity="0.7" stroke="#fff" strokeOpacity="0.9" strokeWidth="0.8">
            <path d="M0 -4 C-16 -22 -26 -14 -18 0 C-14 8 -4 6 0 0 Z" />
            <path d="M0 -4 C16 -22 26 -14 18 0 C14 8 4 6 0 0 Z" />
            <path d="M0 1 C-10 4 -16 16 -10 20 C-4 22 0 10 0 1 Z" />
            <path d="M0 1 C10 4 16 16 10 20 C4 22 0 10 0 1 Z" />
          </g>
          <path d="M0 -6 C-3 0 -6 10 -8 16 L8 16 C6 10 3 0 0 -6 Z" fill="#fff" />
          <circle cx="0" cy="-10" r="4" fill="#fff" />
          <g transform="translate(13 5) scale(0.7)">
            <use href="#hk-star" className="tw-loop" />
          </g>
        </g>
      </svg>

      <button type="button" className="intro-skip" onClick={() => setPhase('hide')}>
        {skipLabel}
      </button>
    </div>
  );
}
