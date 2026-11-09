'use client';

import { useEffect, useState } from 'react';

// Eröffnungsanimation: Eine kleine Fee fliegt herein, zaubert das Logo herbei
// und fliegt wieder davon. Läuft nur einmal pro Besuch und lässt sich wegklicken.
// Bei "weniger Bewegung" in den Geräte-Einstellungen wird sie nicht gezeigt.

const KEY = 'hikaya-intro';
const HOLD_MS = 5800; // so lange bleibt die Animation, bevor sie ausblendet
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
          <path id="hk-flight" d="M -90 90 C 40 30, 110 330, 250 270" />
        </defs>

        {/* Logo, Schriftzug, Slogan */}
        <image href="/logo-white.svg" x="300" y="60" width="200" height="200" className="intro-logo" />
        <text x="400" y="325" textAnchor="middle" className="intro-word">
          Hikaya
        </text>
        <text x="400" y="368" textAnchor="middle" className="intro-tag">
          {tagline}
        </text>

        {/* Lichtblitz und Funkeln, wenn das Logo herbeigezaubert wird */}
        <circle cx="400" cy="160" r="12" fill="#fff" className="flash" />
        {[
          [318, 92, 2.5],
          [488, 66, 2.6],
          [510, 232, 2.7],
          [292, 214, 2.8],
          [540, 140, 2.9],
          [400, 40, 2.6],
          [270, 150, 2.75],
          [350, 262, 3.0],
        ].map(([x, y, delay]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
            <use href="#hk-star" className="tw" style={{ animationDelay: `${delay}s` }} />
          </g>
        ))}

        {/* Funkenspur beim Hereinfliegen */}
        {[0.12, 0.26, 0.4, 0.54, 0.68].map((d, i) => (
          <g key={d} opacity="0">
            <use href="#hk-star" transform={`scale(${0.9 - i * 0.12})`} />
            <animateMotion dur="2.2s" begin={`${d}s`} fill="freeze">
              <mpath href="#hk-flight" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0;0.9;0.9;0"
              keyTimes="0;0.1;0.7;1"
              dur="2.2s"
              begin={`${d}s`}
              fill="freeze"
            />
          </g>
        ))}

        {/* Die Fee: fliegt herein, schwebt, zaubert, fliegt wieder davon */}
        <g>
          <animateMotion dur="2.2s" begin="0s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1">
            <mpath href="#hk-flight" />
          </animateMotion>
          <g>
            <animateMotion
              dur="1.6s"
              begin="3.2s"
              fill="freeze"
              calcMode="spline"
              keyTimes="0;1"
              keySplines="0.5 0 0.9 0.6"
              path="M0 0 C 170 110, 450 -10, 700 -230"
            />
            <g className="bob">
              <g transform="scale(1.15)">
                <circle r="44" fill="url(#hk-glow)" />
                <g transform="translate(0 -9)">
                  <g className="wings" fill="#fff" fillOpacity="0.55" stroke="#fff" strokeOpacity="0.95" strokeWidth="0.7">
                    <path d="M0 9 C-4 -7 -14 -21 -26 -21 C-34 -19 -28 -3 0 9 Z" />
                    <path d="M0 11 C-12 5 -30 3 -34 13 C-34 21 -14 19 0 11 Z" />
                    <path d="M0 12 C-8 17 -18 27 -14 33 C-8 35 -2 23 0 12 Z" />
                  </g>
                </g>
                <g fill="#fff">
                  <circle cx="-2" cy="-24" r="3.4" />
                  <circle cx="3" cy="-19" r="5" />
                  <path d="M-1 -15 L7 -15 C8 -8 7 -3 6 0 L-1 0 C-2 -4 -2 -10 -1 -15 Z" />
                  <path d="M-1 -1 C-12 6 -16 16 -19 22 C-15 25 -12 21 -9 24 C-6 26 -3 22 0 25 C3 23 6 25 8 22 C9 14 9 6 7 -1 Z" />
                  <path d="M-2 24 C-6 30 -10 34 -16 36 L-15 38 C-8 37 -3 33 1 25 Z" />
                  <path d="M4 24 C5 31 4 37 1 42 L4 43 C8 38 9 31 8 24 Z" />
                </g>
                <g className="wand">
                  <path d="M5 -12 C12 -8 20 -9 25 -16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <path d="M25 -16 L39 -30" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
                  <g transform="translate(40 -31) scale(0.9)">
                    <use href="#hk-star" className="tw-loop" />
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>

      <button type="button" className="intro-skip" onClick={() => setPhase('hide')}>
        {skipLabel}
      </button>
    </div>
  );
}
