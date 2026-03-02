import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiCheck, FiLayout, FiLink, FiLock } from 'react-icons/fi';
import StylesTab from './StylesTab';
import LinkTab from './LinkTab';
import SocialSettingsTab from './SocialSettingsTab';
import RestrictionsTab from './RestrictionsTab';
import theme from '../../theme';
import { inputClasses, inputStyle, colorInputClasses, colorInputStyle } from './Common/styles';
import TabButton from './Common/TabButton';

const BlockSettingsModal = ({ isOpen, onClose, block, onUpdateBlock }) => {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('styles');
    const [localStyles, setLocalStyles] = useState(block?.styles || {});
    const [localLink, setLocalLink] = useState(block?.link || '');
    const [localSocialData, setLocalSocialData] = useState(block?.socialData || []);

    const handleStyleChange = (key, value) => {
        setLocalStyles(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        const updates = { styles: localStyles };
        // Only update link if it was relevant (e.g. for images/buttons) or if user edited it
        if (localLink !== undefined) {
            updates.link = localLink;
        }
        if (localSocialData && localSocialData.length > 0) {
            updates.socialData = localSocialData;
        }
        onUpdateBlock(updates);
        onClose();
    };

    // Determine config based on block type
    const config = useMemo(() => {
        const type = block?.type || '';

        let title = 'Block Settings';
        let tabs = [
            { id: 'styles', icon: FiLayout, label: 'Styles' },
            { id: 'restrictions', icon: FiLock, label: 'Restrictions' }
        ];

        if (type.includes('image') || type.includes('img') || type.includes('button')) {
            if (type.includes('image')) title = 'Image Settings';
            else title = 'Button Settings';

            // Add Link tab for images and buttons
            tabs.splice(1, 0, { id: 'link', icon: FiLink, label: 'Link' });
        } else if (type.includes('video')) {
            title = 'Video Settings';
            tabs.splice(1, 0, { id: 'link', icon: FiLink, label: 'Video URL' });
        } else if (type.includes('social')) {
            title = 'Social Settings';
            tabs.splice(1, 0, { id: 'networks', icon: FiLink, label: 'Networks' });
        } else if (type.includes('text')) {
            title = 'Text Settings';
        } else if (type.includes('line')) {
            title = 'Line Settings';
        }

        return { title, tabs };
    }, [block?.type]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            {/* Fixed Height Modal Container */}
            <div className="bg-white rounded-lg shadow-2xl w-[600px] h-[550px] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div
                    className="px-5 py-4 flex items-center justify-between shrink-0 shadow-sm z-10 text-white"
                    style={{ backgroundColor: theme.colors.accent }}
                >
                    <span className="font-semibold tracking-wide text-base">{config.title}</span>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-opacity"><FiX size={20} /></button>
                </div>

                {/* Body - Flex container fitting remaining height */}
                <div className="flex flex-1 overflow-hidden h-full">
                    {/* Sidebar */}
                    <div
                        className="w-1/3 border-r flex flex-col py-4 gap-1 shrink-0 h-full"
                        style={{
                            backgroundColor: theme.colors.neutral[100],
                            borderColor: theme.colors.neutral[200]
                        }}
                    >
                        {config.tabs.map(tab => (
                            <TabButton
                                key={tab.id}
                                {...tab}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        ))}
                    </div>

                    {/* Content Area - Fixed height content */}
                    <div className="w-2/3 p-6 bg-white h-full overflow-hidden">

                        {activeTab === 'styles' && (
                            <StylesTab
                                styles={localStyles}
                                onChange={handleStyleChange}
                                blockType={block?.type}
                                inputClasses={inputClasses}
                                colorInputClasses={colorInputClasses}
                                // Pass style objects to children
                                inputStyle={inputStyle}
                                colorInputStyle={colorInputStyle}
                            />
                        )}

                        {activeTab === 'link' && (
                            <LinkTab
                                link={localLink}
                                onChange={setLocalLink}
                                inputClasses={inputClasses}
                                inputStyle={inputStyle}
                                label={config.title === 'Video Settings' ? 'YouTube / Video URL' : 'Link URL'}
                                placeholder={config.title === 'Video Settings' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com'}
                            />
                        )}

                        {activeTab === 'networks' && (
                            <SocialSettingsTab
                                socialData={localSocialData}
                                onChange={setLocalSocialData}
                                inputClasses={inputClasses}
                                inputStyle={inputStyle}
                                colorInputClasses={colorInputClasses}
                                colorInputStyle={colorInputStyle}
                            />
                        )}

                        {activeTab === 'restrictions' && (
                            <RestrictionsTab />
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div
                    className="border-t px-6 py-4 flex justify-end gap-3 shrink-0"
                    style={{
                        backgroundColor: theme.colors.neutral[100],
                        borderColor: theme.colors.neutral[200]
                    }}
                >
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
                        style={{ color: theme.colors.text.secondary }}
                        onMouseEnter={(e) => e.target.style.color = theme.colors.text.primary}
                        onMouseLeave={(e) => e.target.style.color = theme.colors.text.secondary}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 text-xs font-bold uppercase rounded shadow-sm flex items-center gap-2 tracking-wide transition-all transform active:scale-95"
                        style={{ backgroundColor: theme.colors.primary }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.primaryHover}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.colors.primary}
                    >
                        <FiCheck size={14} />
                        Continue
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BlockSettingsModal;
