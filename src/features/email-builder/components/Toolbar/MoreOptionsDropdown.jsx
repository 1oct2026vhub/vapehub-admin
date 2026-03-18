import React from 'react';
import { FiCopy, FiTrash2 } from 'react-icons/fi';

const MoreOptionsDropdown = ({ onDelete, onDuplicate, onClose }) => {
    return (
        <div className="absolute right-0 top-10 bg-white border border-neutral-200 shadow-xl rounded-md py-2 w-48 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
            <button
                onClick={(e) => { e.stopPropagation(); onDuplicate(); onClose(); }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 flex items-center gap-3"
            >
                <FiCopy size={14} />
                Duplicate Block
            </button>
            <div className="h-[1px] bg-neutral-100 my-1" />
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 flex items-center gap-3"
            >
                <FiTrash2 size={14} />
                Delete Block
            </button>
        </div>
    );
};

export default MoreOptionsDropdown;
