"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";

// Dynamically import CKEditor to avoid SSR issues
const CKEditorComponent = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
);

// CKEditor 5 License Key
const LICENSE_KEY = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY || ""
// Cloud Services Token URL (you may need to set this up)
const CLOUD_SERVICES_TOKEN_URL = process.env.NEXT_PUBLIC_CKEDITOR_CLOUD_SERVICES_TOKEN_URL ||""
// Default hex colors for color pickers
const DEFAULT_HEX_COLORS = [
	{ color: '#000000', label: 'Black' },
	{ color: '#4D4D4D', label: 'Dim grey' },
	{ color: '#999999', label: 'Grey' },
	{ color: '#E6E6E6', label: 'Light grey' },
	{ color: '#FFFFFF', label: 'White', hasBorder: true },
	{ color: '#E65C5C', label: 'Red' },
	{ color: '#E69C5C', label: 'Orange' },
	{ color: '#E6E65C', label: 'Yellow' },
	{ color: '#C2E65C', label: 'Light green' },
	{ color: '#5CE65C', label: 'Green' },
	{ color: '#5CE6A6', label: 'Aquamarine' },
	{ color: '#5CE6E6', label: 'Turquoise' },
	{ color: '#5CA6E6', label: 'Light blue' },
	{ color: '#5C5CE6', label: 'Blue' },
	{ color: '#A65CE6', label: 'Purple' }
];

interface FormCKEditorProps {
  name: string;
  control: any;
  label?: string;
  defaultValue?: string;
  trigger?: any;
  required?: boolean;
}

const FormCKEditor = ({ 
  name, 
  control, 
  label, 
  defaultValue = "",
  required = false 
}: FormCKEditorProps) => {
  const editorRef = useRef<any>(null);
  const editorWordCountRef = useRef<HTMLDivElement>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Use CKEditor Cloud hook
  const cloud = useCKEditorCloud({ version: '47.2.0', premium: true, ckbox: { version: '2.6.1' } });
  useEffect(() => {
    isMountedRef.current = true;
    setIsLayoutReady(true);
    return () => {
      isMountedRef.current = false;
      setIsLayoutReady(false);
      
      // Cleanup event listeners and observers
      if (editorRef.current) {
        try {
          const editableElement = editorRef.current.ui?.getEditableElement();
          if (editableElement) {
            // Remove event listeners
            if ((editableElement as any).__focusHandler) {
              editableElement.removeEventListener('focus', (editableElement as any).__focusHandler);
            }
            if ((editableElement as any).__blurHandler) {
              editableElement.removeEventListener('blur', (editableElement as any).__blurHandler);
            }
            // Disconnect resize observer
            if ((editableElement as any).__resizeObserver) {
              (editableElement as any).__resizeObserver.disconnect();
            }
            // Remove Enter key handler
            if ((editableElement as any).__enterKeyHandler) {
              editableElement.removeEventListener('keydown', (editableElement as any).__enterKeyHandler, true);
            }
          }
          
          const editorElement = editorRef.current.ui?.element;
          if (editorElement && (editorElement as any).__toolbarResizeObserver) {
            (editorElement as any).__toolbarResizeObserver.disconnect();
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);


  // Memoize editor configuration
  const { ClassicEditor, editorConfig } = useMemo(() => {
    if (cloud.status !== 'success' || !isLayoutReady) {
      return {};
    }

    try {
      const {
        ClassicEditor,
        Alignment,
        AutoImage,
        Autoformat,
        AutoLink,
        Autosave,
        ImageBlock,
        BlockQuote,
        Bold,
        Bookmark,
        CKBox,
        CKBoxImageEdit,
        CloudServices,
        Code,
        CodeBlock,
        Essentials,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        Fullscreen,
        GeneralHtmlSupport,
        Heading,
        Highlight,
        HorizontalLine,
        HtmlEmbed,
        ImageCaption,
        ImageEditing,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        ImageUtils,
        ImageInline,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Markdown,
        MediaEmbed,
        PageBreak,
        Paragraph,
        PasteFromMarkdownExperimental,
        PasteFromOffice,
        PictureEditing,
        PlainTableOutput,
        RemoveFormat,
        SelectAll,
        ShowBlocks,
        SpecialCharacters,
        SpecialCharactersArrows,
        SpecialCharactersCurrency,
        SpecialCharactersEssentials,
        SpecialCharactersLatin,
        SpecialCharactersMathematical,
        SpecialCharactersText,
        Strikethrough,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableLayout,
        TableProperties,
        TableToolbar,
        TextPartLanguage,
        TextTransformation,
        TodoList,
        Underline,
        WordCount
      } = cloud.CKEditor;

      const {
        getEmailInlineStylesTransformations,
        CaseChange,
        // DocumentOutline, // Removed - requires container at initialization
        EmailConfigurationHelper,
        ExportPdf,
        ExportWord,
        ExportInlineStyles,
        FormatPainter,
        ImportWord,
        LineHeight,
        MultiLevelList,
        TableOfContents,
        Template
      } = cloud.CKEditorPremiumFeatures;
      
      // Footnotes might not be available in all versions
      const Footnotes = (cloud.CKEditorPremiumFeatures as any).Footnotes;

      return {
        ClassicEditor,
        editorConfig: {
          licenseKey: LICENSE_KEY,
          toolbar: {
            items: [
              'undo',
              'redo',
              '|',
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              '|',
              'bulletedList',
              'numberedList',
              '|',
              'link',
              'insertImage',
              '|',
              'alignment',
              '|',
              'strikethrough',
              'subscript',
              'superscript',
              'code',
              'removeFormat',
              '|',
              'fontSize',
              'fontFamily',
              'fontColor',
              'fontBackgroundColor',
              '|',
              'specialCharacters',
              'horizontalLine',
              'pageBreak',
              'insertFootnote',
              'bookmark',
              'ckbox',
              'mediaEmbed',
              'insertTable',
              'insertTableLayout',
              'insertTemplate',
              'highlight',
              'blockQuote',
              'codeBlock',
              'htmlEmbed',
              '|',
              'lineHeight',
              '|',
              'multiLevelList',
              'todoList',
              'outdent',
              'indent',
              '|',
              'importWord',
              'exportWord',
              'exportPdf',
              'showBlocks',
              'formatPainter',
              'caseChange',
              'findAndReplace',
              'textPartLanguage',
              'fullscreen'
            ],
            shouldNotGroupWhenFull: true,
            removeItems: []
          },
          plugins: [
            Alignment,
            Autoformat,
            AutoImage,
            AutoLink,
            Autosave,
            BlockQuote,
            Bold,
            Bookmark,
            CaseChange,
            CKBox,
            CKBoxImageEdit,
            CloudServices,
            Code,
            CodeBlock,
            // DocumentOutline requires a container - will be added conditionally
            // DocumentOutline,
            EmailConfigurationHelper,
            Essentials,
            ExportInlineStyles,
            ExportPdf,
            ExportWord,
            FindAndReplace,
            FontBackgroundColor,
            FontColor,
            FontFamily,
            FontSize,
            ...(Footnotes ? [Footnotes] : []),
            FormatPainter,
            Fullscreen,
            GeneralHtmlSupport,
            Heading,
            Highlight,
            HorizontalLine,
            HtmlEmbed,
            ImageBlock,
            ImageCaption,
            ImageEditing,
            ImageInline,
            ImageInsert,
            ImageInsertViaUrl,
            ImageResize,
            ImageStyle,
            ImageTextAlternative,
            ImageToolbar,
            ImageUpload,
            ImageUtils,
            ImportWord,
            Indent,
            IndentBlock,
            Italic,
            LineHeight,
            Link,
            LinkImage,
            List,
            ListProperties,
            // Markdown, // Removed to ensure HTML output
            MediaEmbed,
            MultiLevelList,
            PageBreak,
            Paragraph,
            // PasteFromMarkdownExperimental, // Removed to ensure HTML output
            PasteFromOffice,
            PictureEditing,
            PlainTableOutput,
            RemoveFormat,
            SelectAll,
            ShowBlocks,
            SpecialCharacters,
            SpecialCharactersArrows,
            SpecialCharactersCurrency,
            SpecialCharactersEssentials,
            SpecialCharactersLatin,
            SpecialCharactersMathematical,
            SpecialCharactersText,
            Strikethrough,
            Subscript,
            Superscript,
            Table,
            TableCaption,
            TableCellProperties,
            TableColumnResize,
            TableLayout,
            // TableOfContents, // Requires DocumentOutline plugin
            TableProperties,
            TableToolbar,
            Template,
            TextPartLanguage,
            TextTransformation,
            TodoList,
            Underline,
            WordCount
          ],
          cloudServices: {
            tokenUrl: CLOUD_SERVICES_TOKEN_URL
          },
          // documentOutline container will be set after editor is ready
          // because refs are not available during useMemo
          exportInlineStyles: {
            stylesheets: [
              'https://cdn.ckeditor.com/ckeditor5/47.2.0/ckeditor5.css',
              'https://cdn.ckeditor.com/ckeditor5-premium-features/47.2.0/ckeditor5-premium-features.css'
            ],
            transformations: getEmailInlineStylesTransformations()
          },
          exportPdf: {
            stylesheets: [
              'https://cdn.ckeditor.com/ckeditor5/47.2.0/ckeditor5.css',
              'https://cdn.ckeditor.com/ckeditor5-premium-features/47.2.0/ckeditor5-premium-features.css'
            ],
            fileName: 'export-pdf-demo.pdf',
            converterOptions: {
              format: 'Tabloid',
              margin_top: '20mm',
              margin_bottom: '20mm',
              margin_right: '24mm',
              margin_left: '24mm',
              page_orientation: 'portrait'
            }
          },
          exportWord: {
            stylesheets: [
              'https://cdn.ckeditor.com/ckeditor5/47.2.0/ckeditor5.css',
              'https://cdn.ckeditor.com/ckeditor5-premium-features/47.2.0/ckeditor5-premium-features.css'
            ],
            fileName: 'export-word-demo.docx',
            converterOptions: {
              document: {
                orientation: 'portrait',
                size: 'Tabloid',
                margins: {
                  top: '20mm',
                  bottom: '20mm',
                  right: '24mm',
                  left: '24mm'
                }
              }
            }
          },
          fontBackgroundColor: {
            colorPicker: {
              format: 'hex' as const
            },
            colors: DEFAULT_HEX_COLORS
          },
          fontColor: {
            colorPicker: {
              format: 'hex' as const
            },
            colors: DEFAULT_HEX_COLORS
          },
          fontFamily: {
            supportAllValues: true
          },
          fontSize: {
            options: [10, 12, 14, 'default', 18, 20, 22],
            supportAllValues: true
          },
          fullscreen: {
            onEnterCallback: (container: HTMLElement) =>
              container.classList.add(
                'editor-container',
                'editor-container_classic-editor',
                'editor-container_include-word-count',
                'editor-container_include-fullscreen',
                'main-container'
              )
          },
          heading: {
            options: [
              {
                model: 'paragraph' as const,
                title: 'Paragraph',
                class: 'ck-heading_paragraph'
              },
              {
                model: 'heading1' as const,
                view: 'h1',
                title: 'Heading 1',
                class: 'ck-heading_heading1'
              },
              {
                model: 'heading2' as const,
                view: 'h2',
                title: 'Heading 2',
                class: 'ck-heading_heading2'
              },
              {
                model: 'heading3' as const,
                view: 'h3',
                title: 'Heading 3',
                class: 'ck-heading_heading3'
              },
              {
                model: 'heading4' as const,
                view: 'h4',
                title: 'Heading 4',
                class: 'ck-heading_heading4'
              },
              {
                model: 'heading5' as const,
                view: 'h5',
                title: 'Heading 5',
                class: 'ck-heading_heading5'
              },
              {
                model: 'heading6' as const,
                view: 'h6',
                title: 'Heading 6',
                class: 'ck-heading_heading6'
              }
            ]
          },
          htmlSupport: {
            allow: [
              {
                // Allow ALL HTML elements, attributes, classes, and styles
                // This ensures that the source code is preserved exactly as is
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true
              }
            ]
          } as any,
          image: {
            toolbar: [
              'toggleImageCaption',
              'imageTextAlternative',
              '|',
              'imageStyle:inline',
              'imageStyle:wrapText',
              'imageStyle:breakText',
              '|',
              'resizeImage',
              '|',
              'ckboxImageEdit'
            ],
            upload: {
              types: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'svg']
            },
            insert: {
              integrations: ['upload', 'url', 'ckbox']
            }
          },
          lineHeight: {
            supportAllValues: true
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
              toggleDownloadable: {
                mode: 'manual' as const,
                label: 'Downloadable',
                attributes: {
                  download: 'file'
                }
              }
            }
          },
          list: {
            properties: {
              styles: true,
              startIndex: true,
              reversed: false
            }
          },
          placeholder: 'Type or paste your content here!',
          selectAll: {
            // Enable select all functionality
          },
          // Use proper select all plugin configuration if available, otherwise default behavior works
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
            tableProperties: {
              borderColors: DEFAULT_HEX_COLORS,
              backgroundColors: DEFAULT_HEX_COLORS
            },
            tableCellProperties: {
              borderColors: DEFAULT_HEX_COLORS,
              backgroundColors: DEFAULT_HEX_COLORS
            }
          },
          template: {
            definitions: [
              {
                title: 'Introduction',
                description: 'Simple introduction to an article',
                icon: '<svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="icons/article-image-right"><rect id="icon-bg" width="45" height="45" rx="2" fill="#A5E7EB"/><g id="page" filter="url(#filter0_d_1_507)"><path d="M9 41H36V12L28 5H9V41Z" fill="white"/><path d="M35.25 12.3403V40.25H9.75V5.75H27.7182L35.25 12.3403Z" stroke="#333333" stroke-width="1.5"/></g><g id="image"><path id="Rectangle 22" d="M21.5 23C21.5 22.1716 22.1716 21.5 23 21.5H31C31.8284 21.5 32.5 22.1716 32.5 23V29C32.5 29.8284 31.8284 30.5 31 30.5H23C22.1716 30.5 21.5 29.8284 21.5 29V23Z" fill="#B6E3FC" stroke="#333333"/><path id="Vector 1" d="M24.1184 27.8255C23.9404 27.7499 23.7347 27.7838 23.5904 27.9125L21.6673 29.6268C21.5124 29.7648 21.4589 29.9842 21.5328 30.178C21.6066 30.3719 21.7925 30.5 22 30.5H32C32.2761 30.5 32.5 30.2761 32.5 30V27.7143C32.5 27.5717 32.4391 27.4359 32.3327 27.3411L30.4096 25.6268C30.2125 25.451 29.9127 25.4589 29.7251 25.6448L26.5019 28.8372L24.1184 27.8255Z" fill="#44D500" stroke="#333333" stroke-linejoin="round"/><circle id="Ellipse 1" cx="26" cy="25" r="1.5" fill="#FFD12D" stroke="#333333"/></g><rect id="Rectangle 23" x="13" y="13" width="12" height="2" rx="1" fill="#B4B4B4"/><rect id="Rectangle 24" x="13" y="17" width="19" height="2" rx="1" fill="#B4B4B4"/><rect id="Rectangle 25" x="13" y="21" width="6" height="2" rx="1" fill="#B4B4B4"/><rect id="Rectangle 26" x="13" y="25" width="6" height="2" rx="1" fill="#B4B4B4"/><rect id="Rectangle 27" x="13" y="29" width="6" height="2" rx="1" fill="#B4B4B4"/><rect id="Rectangle 28" x="13" y="33" width="16" height="2" rx="1" fill="#B4B4B4"/></g><defs><filter id="filter0_d_1_507" x="9" y="5" width="28" height="37" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dx="1" dy="1"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.29 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_507"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_507" result="shape"/></filter></defs></svg>',
                data: "<h2>Introduction</h2><p>In today's fast-paced world, keeping up with the latest trends and insights is essential for both personal growth and professional development. This article aims to shed light on a topic that resonates with many, providing valuable information and actionable advice. Whether you're seeking to enhance your knowledge, improve your skills, or simply stay informed, our comprehensive analysis offers a deep dive into the subject matter, designed to empower and inspire our readers.</p>"
              }
            ]
          },
          // Additional configurations to ensure all features work
          htmlEmbed: {
            showPreviews: true
          },
          ckbox: {
            tokenUrl: CLOUD_SERVICES_TOKEN_URL,
            serviceOrigin: 'https://ckbox.cloud',
            allowExternalImagesEditing: [ /^data:/, /^https?:/ ],
            forceDemoLabel: false
          }
        }
      };
    } catch (error) {
      console.error("Error creating editor config:", error);
      setEditorError("Failed to initialize editor configuration");
      return {};
    }
  }, [cloud, isLayoutReady]);

  // Convert image to base64 for upload
  // This adapter enables "Upload image from computer" functionality
  const uploadAdapter = (loader: any) => {
    console.log('📸 Creating upload adapter for loader:', loader);
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          loader.file.then((file: File) => {
            console.log('📁 File selected for upload:', file.name, file.type, file.size);
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              console.log('✅ File read successfully, size:', result.length);
              resolve({
                default: result
              });
            };
            reader.onerror = (error) => {
              console.error('❌ Error reading file:', error);
              reject(error);
            };
            reader.readAsDataURL(file);
          }).catch((error: any) => {
            console.error('❌ Error loading file:', error);
            reject(error);
          });
        });
      },
      abort: () => {
        console.log('⚠️ Upload aborted');
      }
    };
  };

  // Configure editor on ready
  const configureEditor = (editor: any) => {
    if (!isMountedRef.current) return;
    
    editorRef.current = editor;
    
    // Ensure editor outputs HTML format
    // Override getData to guarantee HTML output
    const originalGetData = editor.getData.bind(editor);
    editor.getData = function(options?: any) {
      const data = originalGetData(options);
      
      // Ensure we return a string
      if (typeof data !== 'string') {
        console.warn('⚠️ getData() returned non-string, converting:', typeof data);
        return String(data || '');
      }
      
      // If data is empty, return empty string
      if (!data || data.trim() === '') {
        return '';
      }
      
      // If data doesn't contain HTML tags, it might be plain text
      // In this case, we should still return it as-is (CKEditor should handle HTML)
      // But log a warning if it looks like plain text
      if (!data.includes('<') && data.length > 0) {
        console.warn('⚠️ getData() returned plain text without HTML tags. This should not happen with CKEditor.');
        console.warn('Data sample:', data.substring(0, 100));
      }
      
      return data;
    };
    
    const editableElement = editor.ui.getEditableElement();
    const editorElement = editor.ui.element;
    const toolbarElement = editor.ui.view.toolbar?.element;

    if (editableElement) {
      editableElement.style.width = '100%';
      editableElement.style.maxWidth = '100%';
      editableElement.style.paddingLeft = '0';
      editableElement.style.marginLeft = '0';
      editableElement.style.overflowY = 'visible';
      editableElement.style.height = 'auto';
      editableElement.style.minHeight = 'auto';
      editableElement.style.maxHeight = 'none';
      
      // Ensure Enter key works properly - prevent parent form from intercepting
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          // Allow Enter key to work normally in CKEditor
          // Don't prevent default - let CKEditor handle it
          e.stopPropagation();
        }
      };
      editableElement.addEventListener('keydown', handleKeyDown, true);
      
      // Store handler for cleanup
      (editableElement as any).__enterKeyHandler = handleKeyDown;
    }

    if (editorElement) {
      editorElement.style.width = '100%';
      editorElement.style.maxWidth = '100%';
      editorElement.style.overflow = 'visible';
    }

    if (toolbarElement) {
      toolbarElement.style.width = '100%';
      toolbarElement.style.minWidth = '0';
      toolbarElement.style.maxWidth = 'none';
      toolbarElement.style.overflow = 'visible';

      const toolbarItems = toolbarElement.querySelector('.ck-toolbar__items');
      if (toolbarItems) {
        (toolbarItems as HTMLElement).style.flexWrap = 'wrap';
        (toolbarItems as HTMLElement).style.width = '100%';
      }
    }
    
    // DocumentOutline is not included in plugins to avoid the container error
    // If you need DocumentOutline, ensure editorOutlineRef is available before config creation

    // Enable all toolbar items - ensure they are not disabled
    try {
      const toolbar = editor.ui.view.toolbar;
      if (toolbar) {
        // Force enable all toolbar items
        toolbar.items.forEach((item: any) => {
          if (item && typeof item.set === 'function') {
            try {
              item.set('isEnabled', true);
            } catch (e) {
              // Ignore errors for items that don't support this
            }
          }
        });
      }
    } catch (error) {
      console.warn('Could not configure toolbar items:', error);
    }

    // Custom upload adapter for images - MUST be set up immediately
    // This needs to be done BEFORE the editor is fully initialized
    try {
      // Method 1: Set up via FileRepository plugin
      if (editor.plugins.has('FileRepository')) {
        const fileRepository = editor.plugins.get('FileRepository');
        if (fileRepository) {
          // Override the createUploadAdapter method
          const originalMethod = fileRepository.createUploadAdapter;
          fileRepository.createUploadAdapter = function(loader: any) {
            console.log('📸 Image upload adapter created for loader:', loader);
            const adapter = uploadAdapter(loader);
            console.log('✅ Upload adapter returned:', adapter);
            return adapter;
          };
          console.log('✅ FileRepository upload adapter configured');
        } else {
          console.warn('⚠️ FileRepository plugin instance not found');
        }
      } else {
        console.warn('⚠️ FileRepository plugin not found');
      }

      // Method 2: Also try setting it up via editor config if available
      if (editor.config && editor.config.get) {
        try {
          const fileRepoConfig = editor.config.get('fileRepository');
          if (fileRepoConfig) {
            fileRepoConfig.createUploadAdapter = (loader: any) => {
              console.log('📸 Image upload adapter (via config) created for loader:', loader);
              return uploadAdapter(loader);
            };
            console.log('✅ FileRepository upload adapter configured via config');
          }
        } catch (e) {
          // Config method might not be available, that's okay
        }
      }
    } catch (error) {
      console.error('❌ Error setting up FileRepository:', error);
    }

    // Ensure ImageUpload plugin is enabled
    try {
      if (editor.plugins.has('ImageUpload')) {
        const imageUpload = editor.plugins.get('ImageUpload');
        console.log('✅ ImageUpload plugin is available:', imageUpload);
      } else {
        console.warn('⚠️ ImageUpload plugin not found');
      }
    } catch (error) {
      console.warn('⚠️ Error checking ImageUpload plugin:', error);
    }

    // Force enable the insertImage toolbar button and verify it's working
    try {
      const toolbar = editor.ui.view.toolbar;
      if (toolbar) {
        // Find the insertImage button
        const insertImageButton = toolbar.items.find((item: any) => {
          if (!item) return false;
          // Check multiple possible names/identifiers
          return item.name === 'insertImage' || 
                 item.name === 'imageUpload' ||
                 (item.buttonView && item.buttonView.name === 'insertImage') ||
                 (item.buttonView && item.buttonView.name === 'imageUpload');
        });
        
        if (insertImageButton) {
          // Try to enable it
          if (typeof insertImageButton.set === 'function') {
            insertImageButton.set('isEnabled', true);
            console.log('✅ insertImage button enabled via set()');
          }
          // Also try via buttonView if available
          if (insertImageButton.buttonView && typeof insertImageButton.buttonView.set === 'function') {
            insertImageButton.buttonView.set('isEnabled', true);
            insertImageButton.buttonView.set('isOn', false);
            console.log('✅ insertImage button enabled via buttonView.set()');
          }
          console.log('✅ insertImage button found and enabled:', insertImageButton);
        } else {
          console.warn('⚠️ insertImage button not found in toolbar');
          // Log all toolbar items for debugging
          console.log('Available toolbar items:', toolbar.items.map((item: any) => ({
            name: item?.name,
            buttonViewName: item?.buttonView?.name,
            type: item?.constructor?.name
          })));
        }
      }
    } catch (error) {
      console.warn('⚠️ Error enabling insertImage button:', error);
    }

    // Attach word count to ref
    try {
      const wordCount = editor.plugins.get('WordCount');
      if (wordCount && editorWordCountRef.current) {
        editorWordCountRef.current.appendChild(wordCount.wordCountContainer);
      }
    } catch (error) {
      console.warn('WordCount plugin not available:', error);
    }

    // Log enabled plugins for debugging
    console.log('✅ CKEditor initialized with plugins:', Array.from(editor.plugins).map((p: any) => p.constructor.name));
  };

  return (
    <div className="mb-6 w-full" style={{ paddingLeft: 0, marginLeft: 0, minWidth: 0 }}>
      {label && (
        <label className="block mb-2 text-sm font-medium">
          {label} {required && <span style={{ color: "red" }}>*</span>}
        </label>
      )}
      
      <style jsx global>{`
        /* Ensure CKEditor toolbar overflow works correctly */
        .ck-editor .ck-toolbar {
          min-width: 0 !important;
          width: 100% !important;
        }
        .ck-editor .ck-toolbar__items {
          min-width: 0 !important;
          width: 100% !important;
          flex-wrap: wrap !important;
        }
        .ck-editor .ck-toolbar__overflow {
          display: block !important;
        }
        /* Ensure overflow dropdown is visible and accessible */
        .ck-toolbar__overflow__panel {
          max-height: 400px !important;
          overflow-y: auto !important;
        }
        /* Ensure font-size and font-family work properly in CKEditor */
        /* Inline styles from CKEditor font controls are now preserved */
        /* The problematic CSS overrides have been removed from index.css */
        /* Ensure paragraphs are visible and Enter key creates new lines */
        .ck-content p {
          display: block !important;
          margin-top: 0.5em !important;
          margin-bottom: 0.5em !important;
          min-height: 1em !important;
        }
        .ck-content p:empty {
          min-height: 1em !important;
        }
      `}</style>
      
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{ required: required ? `${label || 'This field'} is required` : false }}
        render={({ field, fieldState }) => {
          // Show loading state
          if (cloud.status === 'loading' || !ClassicEditor || !editorConfig) {
            return (
              <div className="flex flex-col items-center justify-center p-8 text-gray-500" style={{ width: "100%" }}>
                <div className="mb-4">Loading editor...</div>
                {cloud.status === 'error' && (
                  <div className="text-sm text-red-600 mt-2 max-w-md text-center">
                    Error loading CKEditor. Check browser console for details.
                  </div>
                )}
              </div>
            );
          }

          return (
            <div className="relative w-full">
            <div 
              className="editor-container editor-container_classic-editor editor-container_include-word-count w-full"
              style={{ 
                width: "100%", 
                paddingLeft: 0, 
                marginLeft: 0,
                maxWidth: "100%",
                overflow: "visible"
              }}
            >
              <div className="editor-container__editor-wrapper w-full" style={{ paddingLeft: 0, marginLeft: 0, width: "100%", maxWidth: "100%" }}>
                <div className="editor-container__editor w-full" style={{ paddingLeft: 0, marginLeft: 0, width: "100%", maxWidth: "100%" }}>
                  <div ref={editorRef} className="w-full" style={{ paddingLeft: 0, marginLeft: 0, width: "100%", maxWidth: "100%" }}>
                      <CKEditorComponent
                        editor={ClassicEditor}
                        config={editorConfig}
                    data={field.value || defaultValue || ""}
                  onReady={(editor) => {
                    if (!isMountedRef.current) return;
                    
                    try {
                      configureEditor(editor);
                      
                      // Set initial content if provided
                      if (defaultValue && !field.value) {
                        editor.setData(defaultValue);
                        if (isMountedRef.current) {
                          field.onChange(defaultValue);
                        }
                      }
                      
                      // Clear any previous errors
                      if (isMountedRef.current) {
                        setEditorError(null);
                      }
                      
                    } catch (error: any) {
                      console.error('CKEditor error:', error);
                      if (isMountedRef.current) {
                        setEditorError(error?.message || 'Failed to initialize editor');
                      }
                    }
                  }}
                  onError={(error: any, { willEditorRestart }: any) => {
                    const errorMessage = error?.message || '';
                    console.error('CKEditor error:', error);
                    if (!willEditorRestart && isMountedRef.current) {
                      setEditorError(errorMessage || 'Editor error occurred');
                    }
                  }}
                  onChange={(event, editor) => {
                    if (!isMountedRef.current) return;
                    
                    try {
                      // Get HTML data from editor - getData() returns HTML by default
                      let data = editor.getData();
                      
                      // Ensure we have a string
                      if (typeof data !== 'string') {
                        console.error('❌ CKEditor getData() returned non-string:', typeof data, data);
                        data = String(data || '');
                      }
                      
                      // Verify it's HTML (should contain HTML tags)
                      if (!data || data.trim() === '') {
                        // Empty content is fine
                        field.onChange('');
                        return;
                      }
                      
                      // Check if data contains HTML tags
                      if (!data.includes('<')) {
                        // If no HTML tags, wrap in paragraph tag to ensure HTML format
                        console.warn('⚠️ CKEditor returned plain text, wrapping in <p> tag');
                        data = `<p>${data}</p>`;
                      }
                      
                      // Log for debugging (can be removed in production)
                      console.log('✅ CKEditor HTML output:', data.substring(0, 200));
                      
                      // Update form field with HTML data
                      field.onChange(data);
                    } catch (error) {
                      console.error('❌ Error getting CKEditor data:', error);
                      // Fallback: try to get data anyway
                      try {
                        const fallbackData = editor.getData();
                        field.onChange(fallbackData || '');
                      } catch (e) {
                        console.error('❌ Fallback also failed:', e);
                        field.onChange('');
                      }
                    }
                  }}
                  onBlur={(event, editor) => {
                    if (!isMountedRef.current) return;
                    field.onBlur();
                  }}
                  />
                </div>
                    <div className="editor_container__word-count" ref={editorWordCountRef}></div>
                  </div>
                </div>
              </div>
              
              {editorError && (
                <p className="mt-2 text-sm text-yellow-600">
                  Warning: {editorError} (Editor may still function)
                </p>
              )}
              {fieldState?.error && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default FormCKEditor;
