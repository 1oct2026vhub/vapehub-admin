"use client";

import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";

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
  const uniqueId = useRef(`editor-${Math.random().toString(36).substr(2, 9)}`);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let editorInstance: any = null;
    let changeTimeout: any = null;

    const loadEditor = async () => {
      if (!containerRef.current) {
        console.log("Container ref not available");
        return;
      }

      console.log("Loading CKEditor...");

      // Check if CKEditor script is already loaded
      if (!(window as any).CKEDITOR) {
        console.log("CKEditor not loaded, adding script tag");
        const script = document.createElement("script");
        script.src = "https://cdn.ckeditor.com/4.22.1/full/ckeditor.js";
        script.async = true;
        document.head.appendChild(script);

        // Wait for script to load
        await new Promise<void>((resolve) => {
          script.onload = () => {
            console.log("CKEditor script loaded successfully");
            resolve();
          };
          script.onerror = () => {
            console.error("Failed to load CKEditor script");
            resolve();
          };
        });
      }

      // Check if CKEditor is now available
      if (!(window as any).CKEDITOR) {
        console.error("CKEditor still not available after script load");
        return;
      }

      // Clean up any existing instances to avoid conflicts
      if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
        try {
          (window as any).CKEDITOR.instances[uniqueId.current].destroy(true);
          console.log("Destroyed previous CKEditor instance");
        } catch (e) {
          console.error("Error destroying previous instance:", e);
        }
      }

      // Create editor with a small delay to ensure the DOM is ready
      setTimeout(() => {
        try {
          console.log("Creating CKEditor instance");
          const textarea = document.getElementById(uniqueId.current);
          
          if (!textarea) {
            console.error("Textarea element not found");
            return;
          }
          
          editorInstance = (window as any).CKEDITOR.replace(uniqueId.current, {
            height: 300,
            width: "100%",
            extraPlugins: 'font,justify,colorbutton',
            allowedContent: true,
            font_names: 'Arial/Arial, Helvetica, sans-serif;Times New Roman/Times New Roman, Times, serif;Courier New/Courier New, Courier, monospace',
            font_defaultLabel: 'Arial',
            fontSize_sizes: '8/8px;9/9px;10/10px;11/11px;12/12px;14/14px;16/16px;18/18px;20/20px;22/22px;24/24px;36/36px;48/48px;72/72px',
            fontSize_defaultLabel: '14px',
            disableNativeSpellChecker: false,
            disableObjectResizing: false,
            removePlugins: 'elementspath,notification',
            hideBottomBar: true,
            toolbarGroups: [
              { name: "document", groups: ["mode", "document", "doctools"] },
              { name: "clipboard", groups: ["clipboard", "undo"] },
              { name: "editing", groups: ["find", "selection", "spellchecker", "editing"] },
              { name: "forms", groups: ["forms"] },
              { name: "basicstyles", groups: ["basicstyles", "cleanup"] },
              { name: "paragraph", groups: ["list", "indent", "blocks", "align", "bidi", "paragraph"] },
              { name: "links", groups: ["links"] },
              { name: "insert", groups: ["insert"] },
              { name: "styles", groups: ["styles"] },
              { name: "colors", groups: ["colors"] },
              { name: "tools", groups: ["tools"] },
              { name: "others", groups: ["others"] },
            ],
            removeButtons: '',
            format_tags: 'p;h1;h2;h3;h4;h5;h6;pre;div',
            extraAllowedContent: 'span(*)[*]{*};p(*)[*]{*};div(*)[*]{*};li(*)[*]{*};ul(*)[*]{*}',
            contentsCss: [
              "body { font-family: Arial, sans-serif; font-size: 14px; margin: 12px; line-height: 1.5; }",
              ".cke_editable { background-color: #fff; padding: 10px; }",
              ".cke_editable h1 { font-size: 2em; font-weight: bold; }",
              ".cke_editable h2 { font-size: 1.5em; font-weight: bold; }",
              ".cke_editable h3 { font-size: 1.17em; font-weight: bold; }",
              ".cke_editable p { margin: 0.5em 0; }",
              ".cke_editable span { display: inline; }",
              ".cke_editable span[style] { display: inline !important; }",
              ".cke_editable [style*='text-align: center'] { text-align: center !important; display: block; }",
              ".cke_editable [style*='text-align: right'] { text-align: right !important; display: block; }",
              ".cke_editable [style*='text-align: left'] { text-align: left !important; display: block; }",
              ".cke_editable [style*='text-align: justify'] { text-align: justify !important; display: block; }"
            ],
          });

          // Set initial content if available
          if (defaultValue) {
            editorInstance.setData(defaultValue);
          }

          // Handle content changes
          editorInstance.on("change", function() {
            if (changeTimeout) clearTimeout(changeTimeout);
            
            changeTimeout = setTimeout(() => {
              try {
                const data = editorInstance.getData();
                console.log("CKEditor content changed");
                
                // Pass the data to react-hook-form
                if (editorRef.current && typeof editorRef.current.onChange === "function") {
                  editorRef.current.onChange(data);
                }
              } catch (e) {
                console.error("Error handling editor change:", e);
              }
            }, 300);
          });

          // Handle instance ready for styling
          editorInstance.on("instanceReady", function() {
            console.log("CKEditor instance ready");
            
            // Find and style the editor container
            const editorContainer = document.querySelector(`#cke_${uniqueId.current}`);
            if (editorContainer) {
              editorContainer.classList.add("ckeditor-container");
            }
          });
          
        } catch (e) {
          console.error("Error initializing CKEditor:", e);
        }
      }, 100);
    };

    loadEditor();

    return () => {
      if (changeTimeout) clearTimeout(changeTimeout);
      
      if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
        try {
          (window as any).CKEDITOR.instances[uniqueId.current].destroy(true);
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }
    };
  }, [defaultValue]);

  return (
    <div className="mb-6" ref={containerRef}>
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
          // Store field reference for access in the effect
          editorRef.current = field;
          
          return (
            <div className="ckeditor-wrapper relative w-full">
              <textarea
                id={uniqueId.current}
                defaultValue={field.value || defaultValue}
                style={{
                  visibility: "hidden", 
                  height: "1px",
                  width: "100%"
                }}
              />
              
              {fieldState?.error && (
                <p className="mt-2 text-sm text-red-600">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          );
        }}
      />
      
      <style jsx global>{`
        .ckeditor-container {
          border: 1px solid #2E9970;
          border-radius: 0;
          overflow: hidden;
          width: 100% !important;
        }
        
        .cke_top {
          background: #f9fafb !important;
          border-bottom: 1px solid #2E9970 !important;
        }
        
        .cke_bottom {
          background: #f9fafb !important;
          border-top: 1px solid #2E9970 !important;
          display: none !important;
        }
        
        .cke_chrome {
          border: 1px solid #2E9970 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        
        .cke_editable {
          padding: 10px !important;
        }
        
        /* Font size should be preserved */
        .cke_editable [style*="font-size"] {
          font-size: unset !important;
        }
        
        /* Font weight should be preserved */
        .cke_editable [style*="font-weight"] {
          font-weight: unset !important;
        }
        
        /* Hide notification area and version warnings */
        .cke_notification_warning {
          display: none !important;
        }
        
        /* Hide status bar completely */
        .cke_path {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default FormCKEditor;
