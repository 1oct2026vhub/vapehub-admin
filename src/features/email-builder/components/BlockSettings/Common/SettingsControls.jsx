import React from 'react';
import theme from '../../../theme';

export const pixelOptions = [
    '0px', '1px', '2px', '4px', '5px', '6px', '8px', '10px',
    '12px', '15px', '20px', '50px', '100px', '128px', '200px', '300px', "400px", "500px", "600px", "700px", "800px", "900px", "1000px"
];

export const SettingsLabel = ({ children }) => (
    <label
        className="!text-[10px] !font-bold !uppercase !tracking-[0.025em] !mb-[4px] !block"
        style={{ color: theme.colors.text.secondary }}
    >
        {children}
    </label>
);

export const PixelSelect = ({
    value,
    onChange,
    options = pixelOptions,
    placeholder = "Select value",
    addAuto = false,
    addFull = false,
    className,
    style
}) => {
    let finalOptions = [...options];
    if (addAuto && !finalOptions.includes('auto')) finalOptions = ['auto', ...finalOptions];
    if (addFull && !finalOptions.includes('100%')) finalOptions = ['100%', ...finalOptions];

    // If current value is not in options, add it temporarily so it's visible
    if (value && !finalOptions.includes(value) && !['auto', '100%'].includes(value)) {
        finalOptions = [value, ...finalOptions];
    }

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={className}
            style={style}
        >
            <option value="" disabled>{placeholder}</option>
            {finalOptions.map(opt => (
                <option key={opt} value={opt} style={{ color: theme.colors.text.primary, backgroundColor: theme.colors.background }}>
                    {opt}
                </option>
            ))}
        </select>
    );
};
