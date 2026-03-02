import { SettingsLabel } from './Common/SettingsControls';
import theme from '../../theme';
const LinkTab = ({ link, onChange, inputClasses, label = "Link URL", placeholder = "https://example.com", inputStyle }) => {
    return (
        <div className="space-y-5 h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <SettingsLabel>{label}</SettingsLabel>
                <input
                    type="text"
                    id='settings-input'
                    value={link}
                    onChange={(e) => onChange(e.target.value)}
                    className={inputClasses}
                    style={inputStyle}
                    placeholder={placeholder}
                />
                <p
                    className="text-[10px] mt-1.5"
                    style={{ color: theme.colors.text.muted }}
                >
                    Users will be directed here when clicking this block.
                </p>
            </div>
        </div>
    );
};

export default LinkTab;
