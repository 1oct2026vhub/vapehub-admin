
export const generateHtml = (subject, blocks) => {
    // Basic email skeleton
    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject || 'Email Template'}</title>
<style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; -webkit-text-size-adjust: none; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .content { padding: 20px; }
    img { max-width: 100%; height: auto; display: block; }
    .button-link { text-decoration: none; display: inline-block; }
</style>
</head>
<body>
<div class="container">
<div class="content">
`;

    blocks.forEach(block => {
        const style = block.styles || block.style || {};
        const styleString = Object.entries(style).map(([k, v]) => {
            // Convert camelCase to kebab-case
            const key = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
            return `${key}:${v}`;
        }).join(';');

        switch (block.type) {
            case 'header':
                html += `<h1 style="margin: 0; padding: 10px 0; ${styleString}">${block.content}</h1>`;
                break;
            case 'text':
                html += `<div style="margin: 0; padding: 10px 0; ${styleString}">${block.content.replace(/\n/g, '<br>')}</div>`;
                break;
            case 'image':
                // Use src prop primarily, fallback to content or placeholder
                const src = block.src || block.content || 'https://via.placeholder.com/600x300';

                // Ensure alignment is handled
                const imgAlign = style.textAlign || 'center';
                const wrapperStyle = `padding: ${style.padding || '10px 0'}; text-align: ${imgAlign}; background-color: ${style.backgroundColor || 'transparent'};`;

                // For images, we often want to strip width from the direct img style if it's 100% to avoid distortion, 
                // but let's keep user intent. If they set specific width, use it.
                html += `<div style="${wrapperStyle}"><img src="${src}" alt="${block.label || 'Image'}" style="${styleString}" /></div>`;
                break;
            case 'button':
                const url = block.url || block.link || '#';
                html += `<div style="text-align: ${style.textAlign || 'center'}; padding: 15px 0;">
                    <a href="${url}" class="button-link" style="${styleString}">${block.text || block.content}</a>
                </div>`;
                break;
            case 'video':
                const videoLink = block.link || '#';
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                const match = videoLink.match(regExp);
                const videoId = (match && match[2].length === 11) ? match[2] : null;
                const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : 'https://via.placeholder.com/600x300?text=Video+Placeholder';

                html += `
                <div style="padding: ${style.padding || '10px 0'}; text-align: center;">
                    <a href="${videoLink}" target="_blank" style="text-decoration: none; display: inline-block; position: relative; width: 100%; max-width: 600px;">
                        <img src="${thumbUrl}" alt="Play Video" style="width: 100%; height: auto; display: block; border-radius: 4px;" />
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 64px; height: 64px; background: rgba(0,0,0,0.6); border-radius: 50%; line-height: 64px;">
                             <span style="color: white; font-size: 30px; line-height: 64px;">&#9658;</span>
                        </div>
                    </a>
                </div>`;
                break;
            case 'spacer':
                html += `<div style="height: ${style.height || 20}px; line-height: ${style.height || 20}px;">&nbsp;</div>`;
                break;
            case 'line':
                html += `<hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />`;
                break;
            case 'social':
                const networks = block.socialData || [];
                const align = style.textAlign || 'center';

                // Simple SVG paths for icons
                const socialIcons = {
                    facebook: '<svg fill="white" width="16" height="16" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>',
                    twitter: '<svg fill="white" width="16" height="16" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>',
                    instagram: '<svg fill="white" width="16" height="16" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>',
                    linkedin: '<svg fill="white" width="16" height="16" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>'
                };

                const iconsHtml = networks.map(net => {
                    const iconSvg = socialIcons[net.id] || '';
                    return `
                        <a href="${net.url}" target="_blank" style="display: inline-block; width: 32px; height: 32px; background-color: ${net.color}; border-radius: 50%; text-align: center; line-height: 32px; margin: 0 5px; text-decoration: none;">
                            <span style="vertical-align: middle; display: inline-block; height: 16px;">${iconSvg}</span>
                        </a>
                    `;
                }).join('');

                html += `<div style="text-align: ${align}; padding: ${style.padding || '10px 0'};">
                    ${iconsHtml}
                </div>`;
                break;
            case 'text_with_media':
                const imgCellWidth = '40%';
                const textCellWidth = '60%';
                // Simple table for side-by-side
                html += `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 10px 0;">
                        <tr>
                            <td width="${imgCellWidth}" valign="top" style="padding-right: 10px;">
                                <img src="${block.src || 'https://via.placeholder.com/300'}" alt="Image" style="width: 100%; height: auto; display: block;" />
                            </td>
                            <td width="${textCellWidth}" valign="top" style="text-align: left; font-size: 14px; line-height: 1.5; color: #333333;">
                                ${block.content || ''}
                            </td>
                        </tr>
                    </table>
                `;
                break;
            case 'columns_2':
                html += `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 10px 0;">
                        <tr>
                            <td width="50%" valign="top" style="padding-right: 10px;">
                                ${(block.columns && block.columns[0] && block.columns[0].content) || ''}
                            </td>
                            <td width="50%" valign="top" style="padding-left: 10px;">
                                ${(block.columns && block.columns[1] && block.columns[1].content) || ''}
                            </td>
                        </tr>
                    </table>
                `;
                break;
            case 'columns_3':
                html += `
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 10px 0;">
                        <tr>
                            <td width="33%" valign="top" style="padding-right: 5px;">
                                ${(block.columns && block.columns[0] && block.columns[0].content) || ''}
                            </td>
                            <td width="33%" valign="top" style="padding: 0 5px;">
                                ${(block.columns && block.columns[1] && block.columns[1].content) || ''}
                            </td>
                            <td width="33%" valign="top" style="padding-left: 5px;">
                                ${(block.columns && block.columns[2] && block.columns[2].content) || ''}
                            </td>
                        </tr>
                    </table>
                `;
                break;
            case 'image_grid':
                const cols = block.columns || [];
                const width = Math.floor(100 / cols.length) + '%';
                let gridHtml = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 10px 0;"><tr>`;
                cols.forEach((col, idx) => {
                    const paddingStyle = idx === 0 ? 'padding-right: 5px;' : idx === cols.length - 1 ? 'padding-left: 5px;' : 'padding: 0 5px;';
                    gridHtml += `
                        <td width="${width}" valign="top" style="${paddingStyle}">
                            <img src="${col.src || 'https://via.placeholder.com/150'}" alt="${col.alt || ''}" style="width: 100%; height: auto; display: block;" />
                        </td>
                    `;
                });
                gridHtml += `</tr></table>`;
                html += gridHtml;
                break;
        }
    });

    html += `
</div>
</div>
</body>
</html>`;

    return html;
};
