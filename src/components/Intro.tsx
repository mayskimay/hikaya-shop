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
          <path id="hk-flight" d="M -90 90 C 40 30, 90 330, 210 285" />
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
              <g transform="scale(0.85)">
                <circle r="50" fill="url(#hk-glow)" />
                <g transform="rotate(12) translate(0 8)">
                  <g transform="translate(-1 -29)">
                    <g className="wings">
                      <g transform="translate(1 29)">
                        <g fill="url(#hk-wing)" stroke="#fff" strokeWidth="0.6" strokeOpacity="0.95">
                          <path d="M-1 -29 C-4 -48 -20 -62 -32 -57 C-38 -50 -26 -34 -1 -29 Z" />
                          <path d="M-1 -28 C-14 -33 -34 -31 -36 -20 C-32 -12 -12 -19 -1 -28 Z" />
                        </g>
                        <g stroke="#fff" fill="none" strokeWidth="0.35" strokeOpacity="0.8">
                          <path d="M-1 -29 C-13 -42 -23 -52 -31 -56" />
                          <path d="M-1 -29 C-12 -38 -24 -44 -35 -48" />
                          <path d="M-1 -28 C-14 -27 -26 -24 -34 -20" />
                        </g>
                      </g>
                    </g>
                  </g>
                  <g fill="#fff">
                    <path d="M-3 -4 C-8 2 -14 6 -20 6 L-20.5 8.2 C-12 9 -5 6 1 -2 Z" />
                    <path d="M-20.5 8 C-22 7 -24 8 -24.5 10 C-23 10.5 -21.5 10 -20.5 8 Z" />
                    <path d="M-1 -3 C2 3 4 9 4.5 14 L7 14 C7 8 5 1 3 -4 Z" />
                    <path d="M4.3 13.5 C6 13.2 9 14.5 10.5 17 C8.5 17.5 5.5 17 4.3 15.5 Z" />
                    <path d="M-2 -17 C-9 -12 -17 -6 -27 -1 C-23 -1 -21 3 -17 1 C-14 5 -10 1 -7 3 C-4 1 0 4 2 0 C6 1 8 -1 8 -4 C6 -9 4 -13 2.5 -17 Z" />
                    <path d="M-2.4 -31 L1.6 -31.5 C3.4 -27 3.4 -22 2.6 -17 L-2.4 -17 C-3.2 -22 -3.4 -27 -2.4 -31 Z" />
                    <path d="M-1 -34 L1.6 -34 L1.4 -31 L-1 -31 Z" />
                    <circle cx="0" cy="-37" r="4.3" />
                    <path d="M4 -37.6 L6.4 -35.8 L4.2 -34.8 Z" />
                    <path d="M-3 -40.5 C-1 -43 4 -42.5 4.4 -38.5 C2.5 -40.5 -0.5 -40.5 -2.5 -38.5 C-8 -39 -13 -33 -16 -27 C-18 -22 -22 -19 -27 -18 C-21 -15 -16 -17 -13 -22 C-11 -26 -9 -30 -4 -34 Z" />
                    <path d="M-6 -36 C-12 -37 -18 -33 -22 -34 C-17 -31 -11 -31 -6 -33 Z" />
                  </g>
                  <g transform="translate(1 -29)">
                    <g className="wand">
                      <g transform="translate(-1 29)" stroke="#fff" strokeLinecap="round" fill="none">
                        <path d="M1 -29 C6 -29 11 -33 14 -39" strokeWidth="1.7" />
                        <path d="M14 -39 L23 -51" strokeWidth="0.9" />
                        <path d="M0 -28 C3 -23 8 -21 11 -23" strokeWidth="1.6" />
                        <g transform="translate(24 -52) scale(0.9)" stroke="none">
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
