import { FiSettings, FiCopy, FiArrowUp, FiArrowDown, FiAlignLeft, FiMoreHorizontal, FiGrid, FiList } from 'react-icons/fi';
import theme from '../../../theme';

const ActionButtons = ({
    isSpacer,
    onEdit,
    onDuplicate,
    onMove,
    showMoreOptions,
    setShowMoreOptions,
    isImageBlock,
    blockType
}) => {
    return (
        <>
            {blockType === 'property_feature' && (
                <button
                    className="flex items-center gap-2 mr-3 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors pointer-events-none opacity-80"
                    title="Toggle Static Mode"
                >
                    <div className="w-6 h-3 bg-neutral-400 rounded-full relative">
                        <div className="absolute left-0.5 top-0.5 w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-[8px] font-bold uppercase text-white tracking-wider">Static</span>
                </button>
            )}

            {(blockType === 'property_grid' || blockType === 'property_list') && (
                <button
                    className="flex items-center gap-2 mr-3 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors pointer-events-none opacity-100" // Fully opaque active look
                    title="Toggle Dynamic Mode"
                >
                    {/* Active Toggle State (Greenish teal) */}
                    <span className="text-[8px] font-bold uppercase text-white tracking-wider mr-1">Dynamic</span>
                    <div className="w-6 h-3 bg-[#56B6CB] rounded-full relative">
                        <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-white rounded-full shadow-sm"></div>
                    </div>
                </button>
            )}

            {!isSpacer && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 bg-white px-3 py-1 rounded-sm text-[9px] font-bold hover:bg-neutral-100 transition-colors uppercase shadow-sm mr-auto"
                    style={{ color: theme.colors.accent }}
                >
                    <FiSettings size={12} style={{ color: theme.colors.secondary }} />
                    EDIT
                </button>
            )}

            {blockType === 'property_grid' && (
                <button
                    className="w-8 h-full flex items-center justify-center bg-[#2D3541] hover:bg-[#3D4755] transition-colors border-l border-white/10 ml-1"
                    title="Grid View"
                >
                    <FiGrid size={16} color="white" />
                </button>
            )}

            {blockType === 'property_list' && (
                <button
                    className="w-8 h-full flex items-center justify-center bg-[#2D3541] hover:bg-[#3D4755] transition-colors border-l border-white/10 ml-1"
                    title="List View"
                >
                    <FiList size={16} color="white" />
                </button>
            )}

            <div className="flex items-center gap-3 text-white/80">
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="hover:text-white transition-colors" title="Duplicate" onMouseDown={(e) => e.stopPropagation()}><FiCopy size={15} /></button>
                <button onClick={(e) => { e.stopPropagation(); onMove('up'); }} className="hover:text-white transition-colors" title="Move Up" onMouseDown={(e) => e.stopPropagation()}><FiArrowUp size={15} /></button>
                <button onClick={(e) => { e.stopPropagation(); onMove('down'); }} className="hover:text-white transition-colors" title="Move Down" onMouseDown={(e) => e.stopPropagation()}><FiArrowDown size={15} /></button>

                {!isSpacer && <button className="hover:text-white transition-colors" title="Alignment" onMouseDown={(e) => e.stopPropagation()}><FiAlignLeft size={15} /></button>}

                <button
                    className={`hover:text-white transition-colors ${showMoreOptions ? 'text-white' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setShowMoreOptions(!showMoreOptions); }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <FiMoreHorizontal size={16} />
                </button>
            </div>
        </>
    );
};

export default ActionButtons;
