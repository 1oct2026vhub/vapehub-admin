"use client";

import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import dynamic from "next/dynamic";

// Dynamically import CKEditor to avoid SSR issues
const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
);

// CKEditor 5 Trial Configuration
// API Endpoint
const CKEDITOR_API_URL = "https://proxy-event.ckeditor.com";

// CKEditor 5 License Key (Trial)
// This is a TRIAL license key with the following configuration:
// - License Type: trial
// - Usage Endpoint: https://proxy-event.ckeditor.com
// - Distribution Channels: cloud, drupal, sh
// - Features: ["*"] (All features available)
// - Expires: 2025-12-16
const CKEDITOR_LICENSE_KEY = process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY || 
  "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjM2ODMxOTksImp0aSI6IjU4ZDA0YThhLTNkZWUtNDMwZS1hZDk3LTc3YjlhYjg5ZThlYyIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6Ijk4MTcxNDQwIn0.iOw2TsiMlv6OsJhu99_2yzhfKJJ3qc-Abkws2ZURMXYa-RkNklf1PkS2SCfZ5OE2-py1qgYzuh4QfQ9gV-oGug";

// Set license key and API URL globally before editor loads
if (typeof window !== "undefined") {
  (window as any).CKEDITOR_LICENSE_KEY = CKEDITOR_LICENSE_KEY;
  (window as any).CKEDITOR_USAGE_ENDPOINT = CKEDITOR_API_URL;
  
  // Log CKEditor configuration
  console.log('🔧 CKEditor Trial Configuration:');
  console.log('📍 API URL:', CKEDITOR_API_URL);
  console.log('🔑 License Type: Trial (Full Features)');
  console.log('🌐 Usage Endpoint:', CKEDITOR_API_URL);
  console.log('✨ All advanced features enabled');
}

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
  const [EditorClass, setEditorClass] = useState<any>(null);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Load ClassicEditor on client side
  useEffect(() => {
    if (typeof window !== "undefined" && !EditorClass) {
      import("@ckeditor/ckeditor5-build-classic")
        .then((mod) => {
          // ClassicEditor is the default export
          setEditorClass(() => mod.default);
        })
        .catch((error) => {
          console.error("Failed to load ClassicEditor:", error);
        });
    }
  }, [EditorClass]);

  // Convert image to base64 for upload
  const uploadAdapter = (loader: any) => {
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          loader.file.then((file: File) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                default: reader.result as string
              });
            };
            reader.onerror = (error) => {
              reject(error);
            };
            reader.readAsDataURL(file);
          });
        });
      },
      abort: () => {}
    };
  };

  // Helper function to create modal for HTML editing
  const createHtmlModal = (editor: any, title: string, initialValue: string, onSave: (value: string) => void) => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:white;padding:20px;border-radius:8px;width:80%;max-width:800px;max-height:80vh;display:flex;flex-direction:column;';
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin:0 0 15px 0;font-size:18px;font-weight:600;';
    
    const textarea = document.createElement('textarea');
    textarea.value = initialValue;
    textarea.style.cssText = 'width:100%;height:400px;padding:10px;font-family:monospace;font-size:13px;border:1px solid #ddd;border-radius:4px;resize:vertical;';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'margin-top:15px;display:flex;gap:10px;justify-content:flex-end;';
    
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = 'padding:8px 16px;background:#0066cc;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;';
    saveBtn.onclick = () => {
      onSave(textarea.value);
      document.body.removeChild(modal);
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:8px 16px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;';
    cancelBtn.onclick = () => {
      document.body.removeChild(modal);
    };
    
    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(saveBtn);
    modalContent.appendChild(titleEl);
    modalContent.appendChild(textarea);
    modalContent.appendChild(buttonsDiv);
    modal.appendChild(modalContent);
    
    modal.onclick = (e: any) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
    
    document.body.appendChild(modal);
    textarea.focus();
  };

  // Custom upload adapter plugin
  const configureEditor = (editor: any) => {
    editorRef.current = editor;
    
    // Set editor height after initialization
    setTimeout(() => {
      const editableElement = editor.ui.getEditableElement();
      if (editableElement) {
        editableElement.style.minHeight = '500px';
      }
      const mainElement = editableElement?.closest('.ck-editor__main');
      if (mainElement) {
        mainElement.style.minHeight = '500px';
      }
    }, 100);
    
    // Log API URL when editor is ready
    console.log('✅ CKEditor Editor Ready');
    console.log('🔧 API URL:', CKEDITOR_API_URL);
    console.log('🔑 License Type: Trial');
    console.log('🌐 Using Endpoint:', CKEDITOR_API_URL);
    console.log('✨ All features available');

    const ButtonView = editor.ui.componentFactory.constructor;
    
    // Source Editing
    try {
      editor.ui.componentFactory.add('sourceEditingCustom', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Source Editing',
          icon: '<svg viewBox="0 0 20 20"><path d="M12.87 12.61a.75.75 0 0 1-.1 1.05l-3.25 2.63a.75.75 0 0 1-1.19-.61v-1.58l-4.37-.02a.75.75 0 0 1-.75-.75V9.5a.75.75 0 0 1 .75-.76l4.37-.02V7.15a.75.75 0 0 1 1.19-.61l3.25 2.62a.75.75 0 0 1 .1 1.06zM16.5 2.49v15.02a.5.5 0 0 1-.5.5h-2.5a.5.5 0 1 1 0-1H15V3H5v2h2.5a.5.5 0 1 1 0 1H4.5a.5.5 0 0 1-.5-.5V2.49a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          createHtmlModal(editor, 'Edit HTML Source', editor.getData(), (value) => {
            editor.setData(value);
          });
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add source editing button:', error);
    }

    // HTML Embed
    try {
      editor.ui.componentFactory.add('htmlEmbedCustom', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'HTML Embed',
          icon: '<svg viewBox="0 0 20 20"><path d="M2 2h16v16H2V2zm1.5 1.5v13h13v-13h-13zM4 4h12v12H4V4zm1 1v10h10V5H5zm1 1h8v8H6V6z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          createHtmlModal(editor, 'Embed HTML', '', (value) => {
            const htmlEmbed = `<div class="html-embed">${value}</div>`;
            editor.model.change((writer: any) => {
              const insertPosition = editor.model.document.selection.getFirstPosition();
              writer.insertText(htmlEmbed, insertPosition);
            });
          });
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add HTML embed button:', error);
    }

    // Export to Word
    try {
      editor.ui.componentFactory.add('exportWord', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Export to Word',
          icon: '<svg viewBox="0 0 20 20"><path d="M16.5 2.5h-11L3 6v11.5A1.5 1.5 0 0 0 4.5 19h11a1.5 1.5 0 0 0 1.5-1.5V4a1.5 1.5 0 0 0-1.5-1.5zM15 17H5V7h10v10z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          const html = editor.getData();
          const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.doc';
          a.click();
          URL.revokeObjectURL(url);
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add export Word button:', error);
    }

    // Export to PDF
    try {
      editor.ui.componentFactory.add('exportPdf', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Export to PDF',
          icon: '<svg viewBox="0 0 20 20"><path d="M16.5 2.5h-11L3 6v11.5A1.5 1.5 0 0 0 4.5 19h11a1.5 1.5 0 0 0 1.5-1.5V4a1.5 1.5 0 0 0-1.5-1.5zM15 17H5V7h10v10z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          window.print();
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add export PDF button:', error);
    }

    // Upload Word
    try {
      editor.ui.componentFactory.add('uploadWord', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Upload Word Document',
          icon: '<svg viewBox="0 0 20 20"><path d="M10 2L3 9h4v8h6V9h4L10 2z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.doc,.docx';
          input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
              alert('Word document upload detected. For full Word import functionality, please use a dedicated Word import library.');
            }
          };
          input.click();
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add upload Word button:', error);
    }

    // Table of Contents
    try {
      editor.ui.componentFactory.add('tableOfContents', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Table of Contents',
          icon: '<svg viewBox="0 0 20 20"><path d="M2 3h16v1.5H2V3zm0 4h16v1.5H2V7zm0 4h16v1.5H2v-1.5zm0 4h12v1.5H2v-1.5z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          const data = editor.getData();
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, 'text/html');
          const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
          let toc = '<div class="table-of-contents"><h2>Table of Contents</h2><ul>';
          headings.forEach((heading, index) => {
            const id = `heading-${index}`;
            heading.id = id;
            toc += `<li><a href="#${id}">${heading.textContent}</a></li>`;
          });
          toc += '</ul></div>';
          editor.setData(toc + data);
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add table of contents button:', error);
    }

    // Full Screen
    try {
      editor.ui.componentFactory.add('fullScreen', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Full Screen',
          icon: '<svg viewBox="0 0 20 20"><path d="M4 4h4V2H2v6h2V4zm10-2v2h4v4h2V2h-6zm4 14h-4v2h6v-6h-2v4zM2 12h2v4h4v2H2v-6z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          const editorElement = editor.ui.getEditableElement()?.closest('.ck-editor');
          if (editorElement) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              editorElement.requestFullscreen();
            }
          }
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add full screen button:', error);
    }

    // Find and Replace
    try {
      editor.ui.componentFactory.add('findAndReplaceCustom', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Find and Replace',
          icon: '<svg viewBox="0 0 20 20"><path d="M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm-7 5.5a7 7 0 1 1 12.38 4.86l3.37 3.38a1 1 0 0 1-1.42 1.42l-3.38-3.37A7 7 0 0 1 1.5 8.5z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          const findText = prompt('Find:');
          if (findText) {
            const replaceText = prompt('Replace with:', '');
            const data = editor.getData();
            const newData = data.replace(new RegExp(findText, 'g'), replaceText || '');
            editor.setData(newData);
          }
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add find and replace button:', error);
    }

    // Select All
    try {
      editor.ui.componentFactory.add('selectAllCustom', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Select All',
          icon: '<svg viewBox="0 0 20 20"><path d="M2 2h16v16H2V2zm1.5 1.5v13h13v-13h-13z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          editor.model.change((writer: any) => {
            const root = editor.model.document.getRoot();
            const range = writer.createRangeIn(root);
            writer.setSelection(range);
          });
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add select all button:', error);
    }

    // Show Blocks
    try {
      editor.ui.componentFactory.add('showBlocksCustom', (locale: any) => {
        const button = new ButtonView(locale);
        let isActive = false;
        button.set({
          label: 'Show Blocks',
          icon: '<svg viewBox="0 0 20 20"><path d="M2 2h16v16H2V2zm1.5 1.5v13h13v-13h-13zM4 4h12v12H4V4zm1 1v10h10V5H5z"/></svg>',
          tooltip: true,
          isToggleable: true
        });
        button.on('execute', () => {
          isActive = !isActive;
          const editable = editor.ui.getEditableElement();
          if (editable) {
            if (isActive) {
              editable.style.outline = '1px dashed #ccc';
            } else {
              editable.style.outline = 'none';
            }
          }
          button.set('isOn', isActive);
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add show blocks button:', error);
    }

    // Todo List
    try {
      editor.ui.componentFactory.add('todoListCustom', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Todo List',
          icon: '<svg viewBox="0 0 20 20"><path d="M3 3h14v1.5H3V3zm0 4h14v1.5H3V7zm0 4h14v1.5H3v-1.5zm0 4h10v1.5H3v-1.5z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          editor.model.change((writer: any) => {
            const insertPosition = editor.model.document.selection.getFirstPosition();
            const todoItem = writer.createElement('paragraph');
            writer.insertText('☐ ', todoItem);
            writer.insert(todoItem, insertPosition);
          });
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add todo list button:', error);
    }

    // Page Break
    try {
      editor.ui.componentFactory.add('pageBreakCustom', (locale: any) => {
        const button = new ButtonView(locale);
        button.set({
          label: 'Page Break',
          icon: '<svg viewBox="0 0 20 20"><path d="M2 2h16v2H2V2zm0 4h16v2H2V6zm0 4h16v2H2v-2zm0 4h16v2H2v-2z"/></svg>',
          tooltip: true
        });
        button.on('execute', () => {
          editor.model.change((writer: any) => {
            const insertPosition = editor.model.document.selection.getFirstPosition();
            const pageBreak = writer.createElement('paragraph');
            writer.insertText('<div style="page-break-after: always;"></div>', pageBreak);
            writer.insert(pageBreak, insertPosition);
          });
        });
        return button;
      });
    } catch (error) {
      console.warn('Could not add page break button:', error);
    }

    // Custom upload adapter for images
    try {
      if (editor.plugins.has('FileRepository')) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return uploadAdapter(loader);
    };
      }
    } catch (error) {
      console.warn('FileRepository plugin not available:', error);
    }
  };

  return (
    <div className="mb-6">
      {label && (
        <label className="block mb-2 text-sm font-medium">
          {label} {required && <span style={{ color: "red" }}>*</span>}
        </label>
      )}
      
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{ required: required ? `${label || 'This field'} is required` : false }}
        render={({ field, fieldState }) => {
          return (
            <div className="relative w-full">
              {!EditorClass ? (
                <div className="flex items-center justify-center p-8 text-gray-500" style={{ minHeight: "500px" }}>
                  Loading editor...
                </div>
              ) : (
                <div style={{ minHeight: "600px" }} className="ckeditor-wrapper">
                  <CKEditor
                    editor={EditorClass}
                    data={field.value || defaultValue || ""}
                  config={{
                    // Trial license key with all features enabled
                    licenseKey: CKEDITOR_LICENSE_KEY,
                    toolbar: {
                      items: [
                        'undo', 'redo', '|',
                        'sourceEditingCustom', 'heading', 'uploadWord', 'exportWord', 'exportPdf', '|',
                        'findAndReplaceCustom', 'selectAllCustom', '|',
                        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
                        'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
                        'alignment', '|',
                        'numberedList', 'bulletedList', 'todoListCustom', '|',
                        'outdent', 'indent', '|',
                        'link', 'insertImage', 'insertTable', 'mediaEmbed', 'blockQuote', 'codeBlock', '|',
                        'horizontalLine', 'pageBreakCustom', 'specialCharacters', 'removeFormat', '|',
                        'showBlocksCustom', 'fullScreen', 'htmlEmbedCustom', 'tableOfContents'
                      ],
                      shouldNotGroupWhenFull: true
                    },
                    fontSize: {
                      options: [
                        'tiny',
                        'small',
                        'default',
                        'big',
                        'huge'
                      ]
                    },
                    fontFamily: {
                      options: [
                        'default',
                        'Arial, Helvetica, sans-serif',
                        'Courier New, Courier, monospace',
                        'Georgia, serif',
                        'Lucida Sans Unicode, Lucida Grande, sans-serif',
                        'Tahoma, Geneva, sans-serif',
                        'Times New Roman, Times, serif',
                        'Trebuchet MS, Helvetica, sans-serif',
                        'Verdana, Geneva, sans-serif'
                      ]
                    },
                    alignment: {
                      options: ['left', 'center', 'right', 'justify']
                    },
                    heading: {
                      options: [
                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
                      ]
                    },
                    link: {
                      decorators: {
                        openInNewTab: {
                          mode: 'manual',
                          label: 'Open in a new tab',
                          attributes: {
                            target: '_blank',
                            rel: 'noopener noreferrer'
                          }
                        }
                      }
                    },
                    image: {
                      toolbar: [
                        'imageStyle:inline',
                        'imageStyle:block',
                        'imageStyle:side',
                        '|',
                        'toggleImageCaption',
                        'imageTextAlternative',
                        '|',
                        'linkImage'
                      ],
                      upload: {
                        types: ['jpeg', 'png', 'gif', 'bmp', 'webp', 'jpg']
                      }
                    },
                    table: {
                      contentToolbar: [
                        'tableColumn',
                        'tableRow',
                        'mergeTableCells',
                        'tableProperties',
                        'tableCellProperties'
                      ]
                    },
                    mediaEmbed: {
                      previewsInData: true
                    }
                  }}
                  onReady={(editor) => {
                    try {
                    configureEditor(editor);
                    
                    // Set initial content if provided
                    if (defaultValue && !field.value) {
                      editor.setData(defaultValue);
                      field.onChange(defaultValue);
                      }
                      
                      // Clear any previous errors
                      setEditorError(null);
                    } catch (error: any) {
                      console.error('CKEditor error:', error);
                      setEditorError(error?.message || 'Failed to initialize editor');
                    }
                  }}
                  onError={(error: any, { willEditorRestart }: any) => {
                    // Handle errors that occur during editor operation
                    const errorMessage = error?.message || '';
                    console.error('CKEditor error:', error);
                    if (!willEditorRestart) {
                      setEditorError(errorMessage || 'Editor error occurred');
                    }
                  }}
                  onChange={(event, editor) => {
                    const data = editor.getData();
                    field.onChange(data);
                  }}
                  onBlur={(event, editor) => {
                    field.onBlur();
                  }}
                  />
                </div>
              )}
              
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
