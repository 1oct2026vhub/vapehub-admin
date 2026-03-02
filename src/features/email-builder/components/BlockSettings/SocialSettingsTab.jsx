import React from 'react';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiGlobe } from 'react-icons/fi';
import theme from '../../theme';

const SocialSettingsTab = ({ socialData, onChange, inputClasses, colorInputClasses, inputStyle, colorInputStyle }) => {

    // Helper to map icon names to components for display in settings
    const getIcon = (iconName) => {
        switch (iconName) {
            case 'FiFacebook': return <FiFacebook />;
            case 'FiTwitter': return <FiTwitter />;
            case 'FiInstagram': return <FiInstagram />;
            case 'FiLinkedin': return <FiLinkedin />;
            default: return <FiGlobe />;
        }
    };

    const handleNetworkChange = (id, field, value) => {
        const updatedData = socialData.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        onChange(updatedData);
    };

    return (
        <div className="flex flex-col gap-4 h-full animate-in fade-in slide-in-from-right-4 duration-300 overflow-y-auto pr-2">
            <p className="text-[10px] text-gray-400 font-medium">Configure social links and colors.</p>

            {socialData.map((network) => (
                <div
                    key={network.id}
                    className="p-3 rounded border flex flex-col gap-3"
                    style={{
                        backgroundColor: theme.colors.neutral[100],
                        borderColor: theme.colors.border
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div style={{ color: theme.colors.text.secondary }}>
                                {getIcon(network.icon)}
                            </div>
                            <span
                                className="text-xs font-bold uppercase"
                                style={{ color: theme.colors.text.primary }}
                            >
                                {network.network}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={network.color}
                                onChange={(e) => handleNetworkChange(network.id, 'color', e.target.value)}
                                className={colorInputClasses}
                                style={colorInputStyle}
                                title="Change Color"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            id='settings-input'
                            value={network.url}
                            onChange={(e) => handleNetworkChange(network.id, 'url', e.target.value)}
                            className={inputClasses}
                            style={{
                                ...inputStyle,
                                backgroundColor: theme.colors.white // Force white bg for ease of reading url? Or inherited? 
                                // Let's respect the parent style actually, or default to white if needed. 
                                // But BlockSettings index passes white/light bg usually.
                            }}
                            placeholder={`https://${network.id}.com/yourprofile`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SocialSettingsTab;
