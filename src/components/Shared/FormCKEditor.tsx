"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";
import { getCKEditorToken } from "@/services/apiService";
import { CATEGORY_CARDS_4COL_TEMPLATE, RELATED_COLLECTION_CARDS_CSS } from "@/components/Shared/ckEditorCategoryCardsTemplate";
import { encodeTypeCardImageDataUrl } from "@/components/Shared/typeCardImageEncode";

// Debounce onChange to avoid heavy getData + HTML processing on every keystroke with long content
const ON_CHANGE_DEBOUNCE_MS = 400;
// Skip expensive DOMParser-based heading cleanup for very long content to prevent timeouts/errors
const MAX_HTML_LENGTH_FOR_HEADING_PROCESS = 80000;

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
  onEditorReady?: (editor: unknown) => void;
  /** When true, includes Category Cards (4-col) in Templates — use only for Related Collections. */
  includeCategoryCardsTemplate?: boolean;
}

const FormCKEditor = ({ 
  name, 
  control, 
  label, 
  defaultValue = "",
  required = false,
  onEditorReady,
  trigger,
  includeCategoryCardsTemplate = false,
}: FormCKEditorProps) => {
  const editorRef = useRef<any>(null);
  const editorWordCountRef = useRef<HTMLDivElement>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const onChangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Immediate RHF sync (bypasses debounce) — used after type-card image replace */
  const formChangeRef = useRef<(value: string) => void>(() => {});

  // Use CKEditor Cloud hook
  const cloud = useCKEditorCloud({ version: '47.2.0', premium: true, ckbox: { version: '2.6.1' } });
  useEffect(() => {
    isMountedRef.current = true;
    setIsLayoutReady(true);
    return () => {
      isMountedRef.current = false;
      setIsLayoutReady(false);
      if (onChangeDebounceRef.current) {
        clearTimeout(onChangeDebounceRef.current);
        onChangeDebounceRef.current = null;
      }
      
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
            if ((editableElement as any).__typeCardImgClickHandler) {
              editableElement.removeEventListener(
                'click',
                (editableElement as any).__typeCardImgClickHandler,
                true
              );
            }
            if ((editableElement as any).__typeCardImgKeyHandler) {
              editableElement.removeEventListener(
                'keydown',
                (editableElement as any).__typeCardImgKeyHandler,
                true
              );
            }
            if (
              (editableElement as any).__typeCardImgViewDoc &&
              (editableElement as any).__typeCardImgViewClick
            ) {
              try {
                (editableElement as any).__typeCardImgViewDoc.off(
                  'click',
                  (editableElement as any).__typeCardImgViewClick
                );
              } catch {
                /* ignore */
              }
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
        ButtonView,
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
          // Register balloon "Replace image" early (before image toolbar builds)
          extraPlugins:
            includeCategoryCardsTemplate && ButtonView
              ? [
                  function TypeCardReplaceImagePlugin(editor: {
                    ui: {
                      componentFactory: {
                        add: (name: string, cb: (locale: unknown) => unknown) => void;
                      };
                    };
                    __typeCardReplaceImageHandler?: () => void;
                  }) {
                    editor.ui.componentFactory.add(
                      'typeCardReplaceImage',
                      (locale: unknown) => {
                        const button = new ButtonView(locale as never);
                        // Official CKBox "Edit image" icon (pencil on image)
                        button.set({
                          label: 'Edit image',
                          tooltip: true,
                          withText: false,
                          isEnabled: true,
                          icon:
                            '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M1.201 1C.538 1 0 1.47 0 2.1v14.363c0 .64.534 1.037 1.186 1.037H5.06l5.058-5.078L6.617 9.15a.696.696 0 0 0-.957-.033L1.5 13.6V2.5h15v4.354a3.478 3.478 0 0 1 1.5.049V2.1c0-.63-.547-1.1-1.2-1.1H1.202Zm11.713 2.803a2.147 2.147 0 0 0-2.049 1.992 2.14 2.14 0 0 0 1.28 2.096 2.13 2.13 0 0 0 2.642-3.11 2.129 2.129 0 0 0-1.873-.978ZM8.089 17.635v2.388h2.389l7.046-7.046-2.39-2.39-7.045 7.048Zm11.282-6.507a.637.637 0 0 0 .139-.692.603.603 0 0 0-.139-.205l-1.49-1.488a.63.63 0 0 0-.899 0l-1.166 1.163 2.39 2.39 1.165-1.168Z"/></svg>',
                        });
                        button.on('execute', () => {
                          editor.__typeCardReplaceImageHandler?.();
                        });
                        return button;
                      }
                    );
                  },
                ]
              : [],
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
            tokenUrl: async () => {
              try {
                const response = await getCKEditorToken();
                if (response == null) {
                  return String(CLOUD_SERVICES_TOKEN_URL || '');
                }
                const token = response?.token ?? response?.data?.token ?? response?.data ?? response;
                if (typeof token === 'string' && token.length > 0) {
                  return token;
                }
                console.warn("⚠️ Unexpected token format:", token);
                return String(CLOUD_SERVICES_TOKEN_URL || '');
              } catch (error) {
                console.error("❌ Error fetching CKEditor token:", error);
                return String(CLOUD_SERVICES_TOKEN_URL || '');
              }
            }
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
              // Omit toggleImageCaption for type cards (not needed for card images)
              ...(includeCategoryCardsTemplate
                ? []
                : (['toggleImageCaption'] as const)),
              'imageTextAlternative',
              '|',
              'imageStyle:inline',
              'imageStyle:wrapText',
              'imageStyle:breakText',
              '|',
              'resizeImage',
              '|',
              // CKBox edit fails on S3/data URLs ("Failed to determine category…").
              // Type cards use a custom replace/upload button instead.
              ...(includeCategoryCardsTemplate
                ? (['typeCardReplaceImage'] as const)
                : (['ckboxImageEdit'] as const)),
            ],
            upload: {
              types: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'svg']
            },
            insert: {
              integrations: includeCategoryCardsTemplate
                ? ['upload', 'url']
                : ['upload', 'url', 'ckbox']
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
              },
              ...(includeCategoryCardsTemplate
                ? [CATEGORY_CARDS_4COL_TEMPLATE]
                : []),
            ]
          },
          // Additional configurations to ensure all features work
          htmlEmbed: {
            showPreviews: true
          },
          ckbox: {
            tokenUrl: async () => {
              try {
                const response = await getCKEditorToken();
                if (response == null) {
                  return String(CLOUD_SERVICES_TOKEN_URL || '');
                }
                const token = response?.token ?? response?.data?.token ?? response?.data ?? response;
                if (typeof token === 'string' && token.length > 0) {
                  return token;
                }
                console.warn("⚠️ Unexpected CKBox token format:", token);
                return String(CLOUD_SERVICES_TOKEN_URL || '');
              } catch (error) {
                console.error("❌ Error fetching CKEditor CKBox token:", error);
                return String(CLOUD_SERVICES_TOKEN_URL || '');
              }
            },
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
  }, [cloud, isLayoutReady, includeCategoryCardsTemplate]);

  /**
   * Removes default font-size styling from heading tags (h1-h6) while preserving
   * manually selected font-size on other elements.
   * 
   * CKEditor automatically applies default font-sizes to headings, but we want
   * those to use CSS from tailwind config instead. However, if a user manually
   * selects a font-size (via the font-size dropdown), that should be preserved.
   * 
   * Strategy: Remove font-size from all heading tags, keep it on everything else.
   */
  const removeDefaultHeadingFontSizes = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return html;
    }
    // Skip expensive parsing for very long content to avoid timeouts and "reading 'error'" with large descriptions
    if (html.length > MAX_HTML_LENGTH_FOR_HEADING_PROCESS) {
      return html;
    }

    try {
      // Use DOMParser to safely parse and manipulate HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Find all heading elements (h1-h6)
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      headings.forEach((heading) => {
        if (heading instanceof HTMLElement) {
          // Remove font-size from inline style
          if (heading.style.fontSize) {
            heading.style.removeProperty('font-size');
          }
          
          // Also check for font-size in style attribute and remove it
          const styleAttr = heading.getAttribute('style');
          if (styleAttr) {
            // Remove font-size from style attribute (case-insensitive)
            const updatedStyle = styleAttr
              .split(';')
              .filter(declaration => {
                const trimmed = declaration.trim();
                if (!trimmed) return false;
                // Remove font-size declarations (case-insensitive)
                const lowerTrimmed = trimmed.toLowerCase();
                return !lowerTrimmed.startsWith('font-size') && !lowerTrimmed.startsWith('font-size:');
              })
              .join(';')
              .trim();
            
            if (updatedStyle) {
              heading.setAttribute('style', updatedStyle);
            } else {
              heading.removeAttribute('style');
            }
          }
        }
      });
      
      // Serialize back to HTML string
      // Get the body content (DOMParser wraps in html/body)
      // Use outerHTML for each top-level element to preserve structure
      const body = doc.body;
      if (body.children.length === 0 && body.textContent) {
        // If body only has text content, return it as-is
        return body.innerHTML;
      }
      
      // Return innerHTML which preserves all nested structure
      return body.innerHTML;
    } catch (error) {
      console.warn('⚠️ Error processing HTML to remove heading font-sizes:', error);
      // Return original HTML if processing fails
      return html;
    }
  };

  // Normalize upload error so consumers that read .error (e.g. CKEditor) don't get undefined
  const toUploadError = (error: unknown): { message: string; error: string } => {
    const msg =
      (error as Error)?.message ||
      (typeof (error as { error?: string })?.error === 'string' ? (error as { error: string }).error : null) ||
      'Image upload failed';
    return { message: msg, error: msg };
  };

  // Convert image to base64 for upload
  // This adapter enables "Upload image from computer" functionality
  const uploadAdapter = (loader: any) => {
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          if (!loader?.file) {
            reject(toUploadError(new Error('Upload loader not ready')));
            return;
          }
          loader.file.then((file: File) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              if (result) {
                resolve({ default: result });
              } else {
                reject(toUploadError(new Error('Failed to read file')));
              }
            };
            reader.onerror = (event) => {
              console.error('❌ Error reading file:', event);
              reject(toUploadError(event ?? new Error('File read error')));
            };
            reader.readAsDataURL(file);
          }).catch((error: unknown) => {
            console.error('❌ Error loading file:', error);
            reject(toUploadError(error));
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
      editableElement.style.overflowY = 'auto';
      editableElement.style.overflowX = 'auto';
      editableElement.style.height = '300px';
      editableElement.style.minHeight = '300px';
      editableElement.style.maxHeight = '300px';
      
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
            const adapter = uploadAdapter(loader);
            return adapter;
          };
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
              return uploadAdapter(loader);
            };
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
          }
          // Also try via buttonView if available
          if (insertImageButton.buttonView && typeof insertImageButton.buttonView.set === 'function') {
            insertImageButton.buttonView.set('isEnabled', true);
            insertImageButton.buttonView.set('isOn', false);
          }
        } else {
          console.warn('⚠️ insertImage button not found in toolbar');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error enabling insertImage button:', error);
    }

    // Type cards: toolbar "Edit image" opens file picker (not click-on-image)
    if (includeCategoryCardsTemplate && editableElement) {
      const escapeAttr = (value: string) =>
        value
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

      const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string' && result) resolve(result);
            else reject(new Error('Failed to read image file'));
          };
          reader.onerror = () => reject(reader.error ?? new Error('File read error'));
          reader.readAsDataURL(file);
        });

      const resolveCardAlt = (el: HTMLElement, slot: string) => {
        const article = el.closest('.type-card');
        const title = article?.querySelector('h3')?.textContent?.trim();
        if (title) return title;
        const fromAttr =
          el.getAttribute('aria-label') || el.getAttribute('alt');
        if (fromAttr && fromAttr !== 'Category image') return fromAttr;
        return slot ? `Type card ${slot}` : 'Category image';
      };

      const syncFormFromEditor = () => {
        try {
          let stored = editor.getData();
          if (typeof stored !== 'string') stored = String(stored || '');
          if (stored && !stored.includes('<') && stored.trim()) {
            stored = `<p>${stored}</p>`;
          }
          formChangeRef.current(removeDefaultHeadingFontSizes(stored));
        } catch (err) {
          console.warn('Failed to sync type-card image to form:', err);
        }
      };

      const buildTypeCardImgHtml = (src: string, alt: string, slot: string) =>
        `<img class="type-card__img type-card__img--${escapeAttr(slot)}" src="${src}" alt="${escapeAttr(alt)}" data-type-card-img="${escapeAttr(slot)}" style="display:block!important;position:static!important;float:none!important;width:100%!important;height:150px!important;object-fit:contain!important;margin:0 0 14px 0!important;background:#fff;" title="Use Edit image on the toolbar to replace">`;

      /**
       * Replace exactly one card image by DOM index among type-card images.
       * Slot/alt regex matching is unreliable: CKEditor often strips data-* on <img>,
       * and identical placeholder srcs caused the wrong card (or multiple cards) to update.
       */
      const replaceTypeCardImageSlot = (
        el: HTMLElement,
        slot: string,
        alt: string,
        src: string
      ) => {
        const imgHtml = buildTypeCardImgHtml(src, alt, slot);
        const cardRoot: HTMLElement =
          (editableElement.querySelector('.type-cards') as HTMLElement | null) ??
          (editableElement as HTMLElement);

        let index = -1;
        if (el instanceof HTMLImageElement) {
          const domImgs = Array.from(cardRoot.querySelectorAll('img'));
          index = domImgs.indexOf(el);
        }
        // Legacy div placeholder: map card position → image index
        if (index < 0) {
          const article = el.closest('.type-card');
          if (article) {
            const cards = Array.from(
              cardRoot.querySelectorAll('.type-card')
            ) as HTMLElement[];
            const cardIndex = cards.indexOf(article as HTMLElement);
            if (cardIndex >= 0) {
              const imgsInCards = cards.map(
                (c) => c.querySelector('img') as HTMLImageElement | null
              );
              // If this card has an img, use its global index; else insert at cardIndex among imgs
              const existing = imgsInCards[cardIndex];
              if (existing) {
                index = Array.from(cardRoot.querySelectorAll('img')).indexOf(existing);
              } else {
                index = cardIndex;
              }
            }
          }
        }

        let data = editor.getData();
        if (typeof data !== 'string') data = String(data || '');

        let replaced = false;

        if (index >= 0) {
          let n = -1;
          const next = data.replace(/<img\b[^>]*>/gi, (match: string) => {
            n += 1;
            if (n === index) {
              replaced = true;
              return imgHtml;
            }
            return match;
          });
          if (replaced) data = next;
        }

        // Div placeholder with no <img> yet for that card: swap the div
        if (!replaced) {
          const slotRe = slot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const placeholderDivBySlot = new RegExp(
            `<div[^>]*\\bdata-type-card-img=["']${slotRe}["'][^>]*>[\\s\\S]*?<\\/div>`,
            'i'
          );
          if (placeholderDivBySlot.test(data)) {
            data = data.replace(placeholderDivBySlot, imgHtml);
            replaced = true;
          }
        }

        if (!replaced) {
          console.warn('Type card image slot not found in editor HTML:', { slot, index });
          return false;
        }

        editor.setData(data);
        // Flush RHF immediately so Save cannot submit pre-upload HTML (debounce race)
        syncFormFromEditor();
        return true;
      };

      const resolveSlot = (el: HTMLElement): string => {
        const fromAttr = el.getAttribute('data-type-card-img');
        if (fromAttr) return fromAttr;
        const classMatch = el.className?.match?.(/type-card__img--([a-z0-9_-]+)/i);
        if (classMatch?.[1]) return classMatch[1];
        const article = el.closest('.type-card');
        if (article) {
          const variant = article.className?.match?.(/type-card--([a-z0-9_-]+)/i);
          if (variant?.[1]) return variant[1];
          const root: HTMLElement =
            (editableElement.querySelector('.type-cards') as HTMLElement | null) ??
            (editableElement as HTMLElement);
          const cards = Array.from(root.querySelectorAll('.type-card'));
          const i = cards.indexOf(article);
          if (i >= 0) return `card-${i}`;
        }
        return `slot-${Date.now()}`;
      };

      let pickerOpen = false;

      const openTypeCardImagePicker = (el: HTMLElement) => {
        if (pickerOpen) return;
        pickerOpen = true;
        window.setTimeout(() => {
          pickerOpen = false;
        }, 800);

        const slot = resolveSlot(el);
        el.setAttribute('data-type-card-img', slot);
        const alt = resolveCardAlt(el, slot);

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp';
        input.style.display = 'none';
        document.body.appendChild(input);

        const cleanupInput = () => {
          try {
            input.remove();
          } catch {
            /* ignore */
          }
        };

        input.addEventListener('change', () => {
          const file = input.files?.[0];
          cleanupInput();
          if (!file) return;

          const isPlaceholder =
            el.getAttribute('data-type-card-placeholder') === '1' ||
            el.classList.contains('type-card__img-placeholder');
          if (isPlaceholder && el instanceof HTMLImageElement) {
            el.style.opacity = '0.5';
          }

          // Encode to a unique mime per slot so API S3 keys (inline.{ext}) do not collide
          void encodeTypeCardImageDataUrl(file, slot)
            .catch(async () => {
              // Fallback: raw data URL if canvas encode fails
              return readFileAsDataUrl(file);
            })
            .then((src) => {
              const ok = replaceTypeCardImageSlot(el, slot, alt, src);
              if (!ok && el instanceof HTMLImageElement) {
                el.style.opacity = '1';
              }
            })
            .catch((err) => {
              console.error('Type card image upload failed:', err);
              if (el instanceof HTMLImageElement) {
                el.style.opacity = '1';
              }
            });
        });

        input.addEventListener('cancel', cleanupInput);
        requestAnimationFrame(() => input.click());
      };

      const getSelectedTypeCardImageDom = (): HTMLElement | null => {
        const widgetImg = editableElement.querySelector(
          '.type-card figure.ck-widget_selected img, .type-card .ck-widget_selected img, .type-card img.ck-widget_selected, .type-cards figure.ck-widget_selected img, .type-cards .ck-widget_selected img'
        ) as HTMLElement | null;
        if (widgetImg) return widgetImg;

        try {
          const selected = editor.model.document.selection.getSelectedElement();
          if (
            selected &&
            (selected.name === 'imageBlock' || selected.name === 'imageInline')
          ) {
            const viewEl = editor.editing.mapper.toViewElement(selected);
            if (viewEl) {
              const dom = editor.editing.view.domConverter.mapViewToDom(viewEl);
              if (dom instanceof HTMLElement) {
                const img =
                  dom.tagName === 'IMG'
                    ? dom
                    : (dom.querySelector('img') as HTMLElement | null);
                if (img?.closest('.type-card') || img?.closest('.type-cards')) {
                  return img;
                }
                if (img && includeCategoryCardsTemplate) return img;
              }
            }
          }
        } catch {
          /* ignore */
        }

        if (includeCategoryCardsTemplate) {
          return editableElement.querySelector(
            'figure.ck-widget_selected img, .ck-widget_selected img, img.ck-widget_selected'
          ) as HTMLElement | null;
        }
        return null;
      };

      // Balloon toolbar click can clear selection — remember last selected card image
      let lastTypeCardImg: HTMLElement | null = null;
      const refreshRememberedTypeCardImg = () => {
        const img = getSelectedTypeCardImageDom();
        if (img && editableElement.contains(img)) lastTypeCardImg = img;
      };
      refreshRememberedTypeCardImg();
      try {
        editor.model.document.selection.on('change', refreshRememberedTypeCardImg);
        editor.editing.view.document.on('selectionChange', refreshRememberedTypeCardImg);
      } catch {
        /* ignore */
      }

      // Toolbar "Edit image" only — do not open upload when clicking the card image
      (editor as { __typeCardReplaceImageHandler?: () => void }).__typeCardReplaceImageHandler =
        () => {
          const img =
            (lastTypeCardImg && editableElement.contains(lastTypeCardImg)
              ? lastTypeCardImg
              : null) || getSelectedTypeCardImageDom();
          if (img) {
            openTypeCardImagePicker(img);
            return;
          }
          const focused = editableElement.querySelector(
            '.type-card img:focus, .type-card figure.ck-widget_selected img, .type-card .ck-widget_selected img'
          ) as HTMLElement | null;
          if (focused) openTypeCardImagePicker(focused);
        };

      // Safety: if CKBox edit still fires, redirect to upload for type-card images
      try {
        const ckboxEditCmd = editor.commands.get('ckboxImageEdit');
        if (ckboxEditCmd) {
          ckboxEditCmd.on(
            'execute',
            (evt: { stop: () => void }) => {
              const img =
                (lastTypeCardImg && editableElement.contains(lastTypeCardImg)
                  ? lastTypeCardImg
                  : null) || getSelectedTypeCardImageDom();
              if (!img) return;
              evt.stop();
              openTypeCardImagePicker(img);
            },
            { priority: 'highest' }
          );
        }
      } catch {
        /* ignore */
      }
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
        /* Fixed height for CKEditor content area */
        .ck-editor .ck-editor__editable {
          min-height: ${includeCategoryCardsTemplate ? "520px" : "300px"} !important;
          max-height: ${includeCategoryCardsTemplate ? "720px" : "300px"} !important;
          height: ${includeCategoryCardsTemplate ? "520px" : "300px"} !important;
          overflow-y: auto !important;
        }
        .ck-editor .ck-content {
          min-height: ${includeCategoryCardsTemplate ? "520px" : "300px"} !important;
          max-height: ${includeCategoryCardsTemplate ? "720px" : "300px"} !important;
          height: ${includeCategoryCardsTemplate ? "auto" : "300px"} !important;
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
        /* Type cards must load after generic .ck-content p rules */
        ${includeCategoryCardsTemplate ? RELATED_COLLECTION_CARDS_CSS : ""}
        /* Table styles for proper display */
        .ck-content table {
          display: table !important;
          width: 100% !important;
          max-width: 100% !important;
          border-collapse: collapse !important;
          border-spacing: 0 !important;
          margin: 1em 0 !important;
          table-layout: fixed !important;
        }
        .ck-content table td,
        .ck-content table th {
          display: table-cell !important;
          padding: 8px 12px !important;
          border: 1px solid #ddd !important;
          text-align: left !important;
          vertical-align: top !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          white-space: normal !important;
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
          min-width: 100px !important;
          width: auto !important;
          max-width: none !important;
        }
        /* Prevent vertical text breaking in table cells */
        .ck-content table td *,
        .ck-content table th * {
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
          white-space: normal !important;
          word-break: normal !important;
          display: inline !important;
        }
        .ck-content table th {
          font-weight: 600 !important;
          background-color: #f5f5f5 !important;
        }
        .ck-content table tbody tr {
          display: table-row !important;
        }
        .ck-content table thead {
          display: table-header-group !important;
        }
        .ck-content table tbody {
          display: table-row-group !important;
        }
        .ck-content table tfoot {
          display: table-footer-group !important;
        }
        /* Ensure table wrapper allows horizontal scroll if needed */
        .ck-editor .ck-editor__editable {
          overflow-x: auto !important;
        }
        /* Fix for table column resize */
        .ck-content .table {
          width: 100% !important;
          max-width: 100% !important;
        }
        /* Table wrapper to ensure proper scrolling */
        .ck-editor__editable .table-wrapper {
          width: 100% !important;
          overflow-x: auto !important;
          margin: 1em 0 !important;
        }
        /* Ensure table cells don't break layout */
        .ck-content table tr {
          page-break-inside: avoid !important;
        }
        /* Better table appearance */
        .ck-content table {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        /* Force horizontal text flow in all table elements */
        .ck-content table,
        .ck-content table * {
          writing-mode: horizontal-tb !important;
          direction: ltr !important;
        }
        /* Ensure table cells don't force vertical layout */
        .ck-content table td,
        .ck-content table th {
          unicode-bidi: embed !important;
          direction: ltr !important;
        }
        /* Prevent any vertical text rendering */
        .ck-content table td span,
        .ck-content table th span,
        .ck-content table td p,
        .ck-content table th p,
        .ck-content table td div,
        .ck-content table th div {
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
          display: inline-block !important;
          width: auto !important;
          max-width: 100% !important;
        }
        /* Ensure table columns have adequate width */
        .ck-content table colgroup,
        .ck-content table col {
          width: auto !important;
          min-width: 100px !important;
        }
      `}</style>
      
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{ required: required ? `${label || 'This field'} is required` : false }}
        render={({ field, fieldState }) => {
          formChangeRef.current = (value: string) => {
            if (onChangeDebounceRef.current) {
              clearTimeout(onChangeDebounceRef.current);
              onChangeDebounceRef.current = null;
            }
            field.onChange(value);
          };

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
                      onEditorReady?.(editor);
                      
                      // Set initial content if provided
                      if (defaultValue && !field.value) {
                        // Process initial data to remove heading font-sizes
                        const processedDefaultValue = removeDefaultHeadingFontSizes(defaultValue);
                        editor.setData(processedDefaultValue);
                        if (isMountedRef.current) {
                          field.onChange(processedDefaultValue);
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
                    if (onChangeDebounceRef.current) clearTimeout(onChangeDebounceRef.current);
                    const currentField = field;
                    onChangeDebounceRef.current = setTimeout(() => {
                      onChangeDebounceRef.current = null;
                      if (!isMountedRef.current) return;
                      const currentEditor = editorRef.current;
                      if (!currentEditor) return;
                      try {
                        let data = currentEditor.getData();
                        if (typeof data !== 'string') data = String(data || '');
                        if (!data || data.trim() === '') {
                          currentField.onChange('');
                          return;
                        }
                        if (!data.includes('<')) data = `<p>${data}</p>`;
                        data = removeDefaultHeadingFontSizes(data);
                        currentField.onChange(data);
                        void trigger?.(name);
                      } catch (error) {
                        console.error('❌ Error getting CKEditor data:', error);
                        try {
                          const fallbackData = currentEditor.getData();
                          currentField.onChange(removeDefaultHeadingFontSizes(String(fallbackData || '')) || '');
                        } catch (e) {
                          console.error('❌ Fallback also failed:', e);
                          currentField.onChange('');
                        }
                      }
                    }, ON_CHANGE_DEBOUNCE_MS);
                  }}
                  onBlur={(event, editor) => {
                    if (!isMountedRef.current) return;
                    if (onChangeDebounceRef.current) {
                      clearTimeout(onChangeDebounceRef.current);
                      onChangeDebounceRef.current = null;
                    }
                    const currentEditor = editorRef.current;
                    if (currentEditor) {
                      try {
                        let data = currentEditor.getData();
                        if (typeof data !== 'string') data = String(data || '');
                        if (!data || data.trim() === '') field.onChange('');
                        else {
                          if (!data.includes('<')) data = `<p>${data}</p>`;
                          field.onChange(removeDefaultHeadingFontSizes(data));
                        }
                        void trigger?.(name);
                      } catch (e) {
                        console.error('❌ Error syncing CKEditor on blur:', e);
                      }
                    }
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
