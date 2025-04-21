export const ckEditorStyles = `
  /* Ensure content renders properly */
  .ck-content {
    font-family: Arial, sans-serif;
    line-height: 1.5;
    color: #333;
  }
  
  /* Reset all styles to avoid interference */
  .ck-content div, 
  .ck-content p, 
  .ck-content h1, 
  .ck-content h2, 
  .ck-content h3, 
  .ck-content h4, 
  .ck-content h5, 
  .ck-content h6 {
    display: block;
    margin: 0.5em 0;
    width: 100%;
  }
  
  /* Heading styles */
  .ck-content h1 { font-size: 2em; font-weight: bold; }
  .ck-content h2 { font-size: 1.5em; font-weight: bold; }
  .ck-content h3 { font-size: 1.17em; font-weight: bold; }
  .ck-content h4 { font-size: 1em; font-weight: bold; }
  .ck-content h5 { font-size: 0.83em; font-weight: bold; }
  .ck-content h6 { font-size: 0.67em; font-weight: bold; }
  
  /* Lists - Enhanced bullet point styling */
  .ck-content ul {
    display: block;
    list-style-type: disc;
    margin: 1em 0;
    padding-left: 40px;
    width: calc(100% - 40px);
  }
  
  .ck-content ol {
    display: block;
    list-style-type: decimal;
    margin: 1em 0;
    padding-left: 40px;
    width: calc(100% - 40px);
  }
  
  .ck-content li {
    display: list-item;
    margin: 0.5em 0;
    list-style-position: outside;
    padding-left: 8px;
  }
  
  /* Make sure bullets actually appear with proper spacing */
  .ck-content ul > li::marker {
    content: "•";
    font-size: 1.5em;
    color: #333;
  }
  
  /* Make sure bullets and text have proper spacing */
  .ck-content ul > li {
    text-indent: 0;
    padding-left: 8px;
  }
  
  /* Text formatting */
  .ck-content strong, .ck-content b { font-weight: bold; }
  .ck-content em, .ck-content i { font-style: italic; }
  .ck-content u { text-decoration: underline; }
  
  /* Images */
  .ck-content img {
    max-width: 100%;
    height: auto;
  }
  
  /* This is the key to preserve inline styles */
  .ck-content span[style],
  .ck-content span[style*="font-size"],
  .ck-content span[style*="font-family"],
  .ck-content span[style*="color"] {
    display: inline !important;
  }
  
  /* Fix for text alignment */
  .ck-content [style*="text-align: center"] { text-align: center !important; display: block; }
  .ck-content [style*="text-align: right"] { text-align: right !important; display: block; }
  .ck-content [style*="text-align: left"] { text-align: left !important; display: block; }
  .ck-content [style*="text-align: justify"] { text-align: justify !important; display: block; }
  
  /* Important: Allow font sizes to work directly */
  .cke_fontSize_8px, .ck-content span[style*="font-size:8px"] { font-size: 8px !important; }
  .cke_fontSize_9px, .ck-content span[style*="font-size:9px"] { font-size: 9px !important; }
  .cke_fontSize_10px, .ck-content span[style*="font-size:10px"] { font-size: 10px !important; }
  .cke_fontSize_11px, .ck-content span[style*="font-size:11px"] { font-size: 11px !important; }
  .cke_fontSize_12px, .ck-content span[style*="font-size:12px"] { font-size: 12px !important; }
  .cke_fontSize_14px, .ck-content span[style*="font-size:14px"] { font-size: 14px !important; }
  .cke_fontSize_16px, .ck-content span[style*="font-size:16px"] { font-size: 16px !important; }
  .cke_fontSize_18px, .ck-content span[style*="font-size:18px"] { font-size: 18px !important; }
  .cke_fontSize_20px, .ck-content span[style*="font-size:20px"] { font-size: 20px !important; }
  .cke_fontSize_22px, .ck-content span[style*="font-size:22px"] { font-size: 22px !important; }
  .cke_fontSize_24px, .ck-content span[style*="font-size:24px"] { font-size: 24px !important; }
  .cke_fontSize_36px, .ck-content span[style*="font-size:36px"] { font-size: 36px !important; }
  .cke_fontSize_48px, .ck-content span[style*="font-size:48px"] { font-size: 48px !important; }
  .cke_fontSize_72px, .ck-content span[style*="font-size:72px"] { font-size: 72px !important; }
`;

export const ckEditorBoxStyles = {
  my: 2,
  '& .ck-content': {
    width: '100%',
    '& ul': {
      listStyleType: 'disc !important',
      paddingLeft: '40px !important',
      marginBottom: '1em !important'
    },
    '& ol': {
      listStyleType: 'decimal !important',
      paddingLeft: '40px !important',
      marginBottom: '1em !important'
    },
    '& li': {
      display: 'list-item !important',
      listStylePosition: 'outside !important',
      paddingLeft: '8px !important',
      marginBottom: '0.75em !important'
    },
    '& li::marker': {
      color: '#333 !important',
      fontSize: '1.5em !important'
    }
  }
}; 