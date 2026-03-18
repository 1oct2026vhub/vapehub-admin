import SingleImage from './SingleImage';

const ImageBlock = ({ block, onUpdate }) => {
    const styles = block.styles || {};

    const getAlignmentClass = () => {
        if (styles.textAlign === 'left') return 'items-start';
        if (styles.textAlign === 'right') return 'items-end';
        return 'items-center';
    };

    return (
        <div
            className={`relative w-full flex flex-col transition-all overflow-hidden ${getAlignmentClass()}`}
            style={{
                backgroundColor: styles.backgroundColor || 'transparent',
                padding: styles.padding || '0px'
            }}
        >
            <SingleImage
                src={block.src}
                alt={block.alt}
                link={block.link}
                label={block.label}
                styles={{ width: styles.width, height: "350px" }}
                onUpdate={(updates) => onUpdate(block.id, updates)}
                showEditButton={false}
            />
        </div>
    );
};

export default ImageBlock;
