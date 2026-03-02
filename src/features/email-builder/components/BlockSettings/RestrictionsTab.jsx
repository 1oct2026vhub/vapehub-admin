import { FiLock } from 'react-icons/fi';
import theme from '../../theme';

const RestrictionsTab = () => {
    return (
        <div
            className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60 pb-10 animate-in fade-in zoom-in duration-300"
            style={{ color: theme.colors.text.muted }}
        >
            <div
                className="p-4 rounded-full shadow-inner"
                style={{ backgroundColor: theme.colors.neutral[100] }}
            >
                <FiLock size={24} />
            </div>
            <p className="text-sm font-medium">No restrictions available for this block.</p>
        </div>
    );
};

export default RestrictionsTab;
