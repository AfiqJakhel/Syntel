import React from "react";

interface IconProps {
    className?: string;
}

// Instagram Post Icon - Square with rounded corners and circle
export const InstagramPostIcon: React.FC<IconProps> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
        </svg>
    );
};

// Instagram Story Icon - Circle with gradient border effect
export const InstagramStoryIcon: React.FC<IconProps> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="7" strokeDasharray="4 4" />
            <path d="M12 8v8M8 12h8" strokeWidth="1.5" />
        </svg>
    );
};

// Instagram Reels Icon - Clapperboard/Film style
export const InstagramReelsIcon: React.FC<IconProps> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Main rounded rectangle */}
            <rect x="3" y="6" width="18" height="14" rx="3" ry="3" />
            {/* Top clapperboard stripes */}
            <line x1="3" y1="6" x2="8" y2="2" />
            <line x1="10" y1="6" x2="15" y2="2" />
            <line x1="17" y1="6" x2="21" y2="3" />
            {/* Play button in center */}
            <polygon points="10,10 10,16 16,13" fill="currentColor" />
        </svg>
    );
};
