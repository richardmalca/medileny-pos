import type { SVGAttributes } from 'react';

export default function Mascot(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 120 130"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Gallo de Pollería Medileny"
            {...props}
        >
            <defs>
                <clipPath id="mascot-body">
                    <ellipse cx="60" cy="72" rx="34" ry="40" />
                </clipPath>
            </defs>

            <ellipse
                cx="60"
                cy="124"
                rx="30"
                ry="4"
                fill="#000"
                opacity=".18"
            />

            <g
                fill="#ffc83a"
                stroke="#3a1410"
                strokeWidth="2.5"
                strokeLinejoin="round"
            >
                <path d="M38 118c-6 0-10 4-10 7h22c0-3-4-7-12-7z" />
                <path d="M82 118c6 0 10 4 10 7H70c0-3 4-7 12-7z" />
            </g>

            <path
                d="M52 22c-2-9 3-16 9-17-1 5 1 8 4 9 1-4 5-6 8-5-3 6-3 10-1 13z"
                fill="#e5311f"
                stroke="#3a1410"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />

            <g stroke="#3a1410" strokeWidth="2.5">
                <ellipse
                    cx="26"
                    cy="78"
                    rx="9"
                    ry="22"
                    fill="#fff"
                    transform="rotate(10 26 78)"
                />
                <ellipse
                    cx="94"
                    cy="78"
                    rx="9"
                    ry="22"
                    fill="#fff"
                    transform="rotate(-10 94 78)"
                />
                <ellipse cx="60" cy="72" rx="34" ry="40" fill="#fff" />
            </g>

            <g clipPath="url(#mascot-body)">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <rect
                        key={i}
                        x={32 + i * 8.6}
                        y="80"
                        width="8.6"
                        height="40"
                        fill={i % 2 === 0 ? '#e5311f' : '#1f9d43'}
                    />
                ))}
            </g>
            <ellipse
                cx="60"
                cy="72"
                rx="34"
                ry="40"
                fill="none"
                stroke="#3a1410"
                strokeWidth="2.5"
            />

            <g fill="#3a1410">
                <ellipse cx="48" cy="52" rx="5" ry="6" />
                <ellipse cx="72" cy="52" rx="5" ry="6" />
            </g>
            <g fill="#fff">
                <circle cx="50" cy="50" r="1.8" />
                <circle cx="74" cy="50" r="1.8" />
            </g>
            <path
                d="M41 43l12 4M79 43l-12 4"
                stroke="#3a1410"
                strokeWidth="2.5"
                strokeLinecap="round"
            />

            <path
                d="M52 58l8 12 8-12z"
                fill="#ff7a1a"
                stroke="#3a1410"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            <path
                d="M56 70c0 8 8 8 8 0z"
                fill="#e5311f"
                stroke="#3a1410"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}
