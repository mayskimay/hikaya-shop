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
          <linearGradient id="hk-wing" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
          </linearGradient>
          <path id="hk-star" d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#fff" />
          <path id="hk-flight" d="M -90 90 C 40 30, 90 340, 200 300" />
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
              <g transform="scale(0.95)">
                <circle r="48" fill="url(#hk-glow)" />
                <g transform="rotate(14)">
                  <g transform="translate(-1 -22)">
                    <g className="wings">
                      <g transform="translate(1 22)" fill="url(#hk-wing)" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.95">
                        <path d="M-1 -22 C-6 -42 -22 -58 -33 -52 C-40 -45 -28 -28 -1 -22 Z" />
                        <path d="M-1 -21 C-14 -26 -34 -24 -36 -13 C-32 -5 -12 -12 -1 -21 Z" />
                        <g fill="none" strokeWidth="0.35" strokeOpacity="0.8">
                          <path d="M-1 -22 C-14 -35 -24 -46 -32 -50" />
                          <path d="M-1 -22 C-12 -31 -24 -38 -36 -42" />
                          <path d="M-1 -21 C-14 -20 -26 -17 -34 -13" />
                        </g>
                      </g>
                    </g>
                  </g>
                  <g fill="#fff">
                    <path d="M-1.6 -25 L1.8 -25 C2.8 -20 2.4 -16 1.4 -12 L-1.4 -12 C-2.4 -16 -2.8 -20 -1.6 -25 Z" />
                    <path d="M-1.5 -13 C-8 -4 -16 6 -24 14 C-20 14 -17 18 -13 16 C-10 21 -6 17 -3 21 C0 17 4 21 7 16 C10 18 12 14 14 12 C8 4 4 -4 1.5 -13 Z" />
                    <path d="M-24 14 C-32 18 -38 16 -44 20 C-36 21 -30 22 -22 19 Z" fillOpacity="0.6" />
                    <path d="M-5 20 C-8 27 -12 31 -16 33 C-10 33 -4 29 0 21 Z" fillOpacity="0.6" />
                    <circle cx="0.5" cy="-29" r="3.9" />
                    <path d="M-3.2 -31 C-2 -35 3 -35.5 4.4 -31.5 C2 -33 -1 -32 -3.2 -31 Z" />
                    <path d="M-3 -30 C-9 -32 -14 -28 -18 -22 C-21 -17 -26 -14 -30 -14 C-24 -11 -17 -12 -13 -17 C-10 -21 -8 -25 -3 -27 Z" />
                    <circle cx="-5" cy="-33" r="1.8" />
                  </g>
                  <g transform="translate(1 -23)">
                    <g className="wand">
                      <g transform="translate(-1 23)" stroke="#fff" strokeLinecap="round" fill="none">
                        <path d="M1 -23 C6 -23 10 -27 13 -33" strokeWidth="1.8" />
                        <path d="M13 -33 L22 -45" strokeWidth="0.9" />
                        <path d="M0 -22 C4 -19 8 -19 10 -22" strokeWidth="1.5" />
                        <g transform="translate(23 -46) scale(0.9)" stroke="none">
                          <use href="#hk-star" className="tw-loop" />
                        </g>
                      </g>
                    </g>
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
