import { FiMoreHorizontal } from 'react-icons/fi';
import { Typography } from '../shared/Typography';
import theme from '../../theme';



const SettingsBar = ({ subject, setSubject }) => {
    return (
        <div className="flex flex-col border-b border-neutral-100">
            {/* Header Section - Dark */}
            <div className="px-6 py-3 flex justify-between items-start" style={{ backgroundColor: theme.colors.accent }}>
                <div>
                    <Typography variant="h6" className='' />
                    <Typography variant="h6" />
                    <div
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: theme.colors.primary }}
                    >
                        Email Name
                    </div>
                    <div className="text-[16px] text-white font-normal">Promotional Newsletter</div>
                </div>
                <button style={{ backgroundColor: theme.colors.black }} className="text-neutral-200 hover:text-white p-1.5 rounded-full transition-colors">
                    <FiMoreHorizontal size={24} />
                </button>
            </div>
            {/* Inputs Section - White */}
            <div className="bg-white px-6 py-2 pb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* subject */}
                <div>
                    <style>
                        {`
                            #subject-input {
                                height: 36px !important;
                                border-radius: 4px !important;
                                border: 1px solid ${theme.colors.border} !important;
                                background-color: ${theme.colors.background} !important;
                                padding: 0 16px !important;
                                font-size: 14px !important;
                                line-height: 20px !important;
                                width: 100% !important;
                                box-shadow: none !important;
                            }
                            #subject-input:focus {
                                border-color: ${theme.colors.border} !important;
                                outline: none !important;
                                box-shadow: none !important;
                            }
                            #subject-label {
                                color: ${theme.colors.black} !important;
                                font-size: 10px !important;
                                font-weight: 700 !important;
                                text-transform: uppercase !important;
                                letter-spacing: 0.025em !important;
                                margin-bottom: 4px !important;
                                display: block !important;
                            }
                        `}
                    </style>
                    <label id="subject-label" className="">Subject</label>
                    <input
                        id="subject-input"
                        type="text"
                        className="w-full text-neutral-500 placeholder:text-neutral-300"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject"
                    />
                </div>
            </div>
        </div>
    );
};

export default SettingsBar;
