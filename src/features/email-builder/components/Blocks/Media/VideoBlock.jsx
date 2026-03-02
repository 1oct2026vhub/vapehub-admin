import React from 'react';
import { FiPlayCircle } from 'react-icons/fi';

const videoPlaceholderStyle = {
    width: '100%',
    aspectRatio: '16 / 9',
    minHeight: '200px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const playOverlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const VideoBlock = ({ block, onUpdate }) => {
    const safeBlock = block || {};
    const { styles = {}, link } = safeBlock;
    const [isPlaying, setIsPlaying] = React.useState(false);

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getYoutubeId(link);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

    return (
        <div className="p-4 relative group" style={{ padding: styles.padding || '16px' }}>
            {isPlaying && videoId ? (
                <div style={{ width: '100%', aspectRatio: '16/9', minHeight: '200px', overflow: 'hidden', borderRadius: '4px', position: 'relative' }}>
                    <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            ) : (
                <div
                    style={videoPlaceholderStyle}
                    onClick={() => link && setIsPlaying(true)}
                >
                    {thumbnailUrl ? (
                        <img src={thumbnailUrl} alt="Video Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f3f4f6' }} />
                    )}

                    <div style={playOverlayStyle}>
                        <FiPlayCircle size={64} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))', opacity: 0.9 }} />
                    </div>

                    {!link && (
                        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#6b7280' }}>
                            No Video URL Set
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoBlock;
