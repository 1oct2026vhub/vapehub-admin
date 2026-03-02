import theme from '../../theme';
import { SettingsLabel, PixelSelect } from './Common/SettingsControls';

const StylesTab = ({ styles, onChange, blockType, inputClasses, colorInputClasses, inputStyle, colorInputStyle }) => {
    const isImageBlock = blockType?.includes('image') || blockType?.includes('img');



    return (
        <div className="flex flex-col gap-5 h-full animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Padding */}
            <div>
                <SettingsLabel>Padding</SettingsLabel>
                <PixelSelect
                    value={styles.padding}
                    onChange={(val) => onChange('padding', val)}
                    placeholder="Select padding"
                    className={inputClasses}
                    style={inputStyle}
                />
                <p className="text-[10px] mt-1.5" style={{ color: theme.colors.text.muted }}>Applies to all sides</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Alignment */}
                <div>
                    <SettingsLabel>Alignment</SettingsLabel>
                    <select
                        value={styles.textAlign || 'center'}
                        onChange={(e) => onChange('textAlign', e.target.value)}
                        className={inputClasses}
                        style={inputStyle}
                    >
                        <option value="left" style={{ color: theme.colors.text.primary, backgroundColor: theme.colors.background }}>Left</option>
                        <option value="center" style={{ color: theme.colors.text.primary, backgroundColor: theme.colors.background }}>Center</option>
                        <option value="right" style={{ color: theme.colors.text.primary, backgroundColor: theme.colors.background }}>Right</option>
                    </select>
                </div>

                {/* Background Color */}
                <div>
                    <SettingsLabel>Background</SettingsLabel>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={styles.backgroundColor || '#ffffff'}
                            onChange={(e) => onChange('backgroundColor', e.target.value)}
                            className={colorInputClasses}
                            style={colorInputStyle}
                        />
                        <input
                            type="text"
                            id='settings-input'
                            value={styles.backgroundColor || '#ffffff'}
                            onChange={(e) => onChange('backgroundColor', e.target.value)}
                            className={`!flex-1 ${inputClasses}`}
                            style={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Width / Full Width */}
            <div>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={styles.width === '100%'}
                        onChange={(e) => onChange('width', e.target.checked ? '100%' : 'auto')}
                        className="!w-4 !h-4 !rounded border-gray-300 focus:ring-[var(--primary)] transition-colors cursor-pointer"
                        style={{
                            color: theme.colors.primary,
                            '--primary': theme.colors.primary
                        }}
                    />
                    <span
                        className="min-w-[80%] text-sm font-medium transition-colors"
                        style={{ color: theme.colors.text.secondary }}
                        onMouseEnter={(e) => e.target.style.color = theme.colors.text.primary}
                        onMouseLeave={(e) => e.target.style.color = theme.colors.text.secondary}
                    >
                        Full Width Content
                    </span>
                </label>
            </div>

            {/* Height - For Line */}
            {blockType?.includes('line') && (
                <div>
                    <SettingsLabel>Line Height (Thickness)</SettingsLabel>
                    <PixelSelect
                        value={styles.height}
                        onChange={(val) => onChange('height', val)}
                        placeholder="Select height"
                        className={inputClasses}
                        style={inputStyle}
                    />
                </div>
            )}

            {/* Text Color - For Button */}
            {blockType?.includes('button') && (
                <div>
                    <SettingsLabel>Text Color</SettingsLabel>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={styles.color || '#ffffff'}
                            onChange={(e) => onChange('color', e.target.value)}
                            className={colorInputClasses}
                            style={colorInputStyle}
                        />
                        <input
                            type="text"
                            id='settings-input'
                            value={styles.color || '#ffffff'}
                            onChange={(e) => onChange('color', e.target.value)}
                            className={`!flex-1 ${inputClasses}`}
                            style={inputStyle}
                        />
                    </div>
                </div>
            )}

            {/* Corner Radius - For Button & Image */}
            {(blockType?.includes('button') || blockType?.includes('image') || blockType?.includes('img')) && (
                <div>
                    <SettingsLabel>Corner Radius</SettingsLabel>
                    <PixelSelect
                        value={styles.borderRadius}
                        onChange={(val) => onChange('borderRadius', val)}
                        placeholder="Select radius"
                        className={inputClasses}
                        style={inputStyle}
                    />
                </div>
            )}

            {/* Image Width & Height - Only for Images */}
            {isImageBlock && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                        <SettingsLabel>Width (px)</SettingsLabel>
                        <PixelSelect
                            value={styles.width}
                            onChange={(val) => onChange('width', val)}
                            placeholder="auto"
                            addAuto={true}
                            addFull={true}
                            className={inputClasses}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <SettingsLabel>Height (px)</SettingsLabel>
                        <PixelSelect
                            value={styles.height}
                            onChange={(val) => onChange('height', val)}
                            placeholder="auto"
                            addAuto={true}
                            className={inputClasses}
                            style={inputStyle}
                        />
                    </div>
                    <div className="col-span-2">
                        <p className="text-[10px]" style={{ color: theme.colors.text.muted }}>Select 'auto' to maintain aspect ratio.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StylesTab;
