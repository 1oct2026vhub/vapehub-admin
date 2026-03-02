import React from 'react';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiGlobe } from 'react-icons/fi';

const SocialBlock = ({ block, onUpdate }) => {
    const { styles, socialData } = block;
    const alignMap = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end'
    };
    const justification = alignMap[styles?.textAlign] || 'justify-center';

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'FiFacebook': return <FiFacebook />;
            case 'FiTwitter': return <FiTwitter />;
            case 'FiInstagram': return <FiInstagram />;
            case 'FiLinkedin': return <FiLinkedin />;
            default: return <FiGlobe />;
        }
    };

    // Fallback if socialData is missing (old blocks)
    const networks = socialData || [
        { id: 'facebook', icon: 'FiFacebook', color: '#3b5998', url: '#' },
        { id: 'twitter', icon: 'FiTwitter', color: '#1da1f2', url: '#' },
        { id: 'instagram', icon: 'FiInstagram', color: '#e1306c', url: '#' },
    ];

    return (
        <div className="p-4" style={{ padding: styles?.padding }}>
            <div className={`flex ${justification} gap-4`}>
                {networks.map((network, index) => (
                    <a
                        key={index}
                        href={network.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                        style={{ backgroundColor: network.color }}
                        onClick={(e) => e.preventDefault()} // Prevent navigation in editor
                    >
                        {getIcon(network.icon)}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default SocialBlock;
