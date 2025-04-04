"use client";

import { useEffect, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";

interface FormCKEditorProps {
  name: string;
  control: any;
  label?: string;
  defaultValue?: string;
  trigger?: any;
}

const FormCKEditor = ({
  name,
  control,
  label,
  defaultValue = "",
}: FormCKEditorProps) => {
  const editorRef = useRef<any>(null);
  const uniqueId = useRef(`editor-${Math.random().toString(36).substr(2, 9)}`);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let editorInstance: any = null;
    let changeTimeout: any = null;

    const loadEditor = async () => {
      if (!containerRef.current) return;

      // Check if CKEditor script is already loaded
      if (!(window as any).CKEDITOR) {
        const script = document.createElement("script");
        script.src = "https://cdn.ckeditor.com/4.22.1/standard/ckeditor.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // Wait for CKEDITOR to be available
      if (!(window as any).CKEDITOR) {
        console.error("CKEditor failed to load properly");
        return;
      }

      // Destroy existing instance if it exists
      if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
        (window as any).CKEDITOR.instances[uniqueId.current].destroy();
      }

      // Create the editor instance
      try {
        editorInstance = (window as any).CKEDITOR.replace(uniqueId.current, {
          height: 300,
          width: "100%",
          versionCheck: false,
          toolbarGroups: [
            { name: "document", groups: ["mode", "document", "doctools"] },
            { name: "clipboard", groups: ["clipboard", "undo"] },
            {
              name: "editing",
              groups: ["find", "selection", "spellchecker", "editing"],
            },
            { name: "forms", groups: ["forms"] },
            "/",
            { name: "basicstyles", groups: ["basicstyles", "cleanup"] },
            {
              name: "paragraph",
              groups: [
                "list",
                "indent",
                "blocks",
                "align",
                "bidi",
                "paragraph",
              ],
            },
            { name: "links", groups: ["links"] },
            { name: "insert", groups: ["insert"] },
            "/",
            { name: "styles", groups: ["styles"] },
            { name: "colors", groups: ["colors"] },
            { name: "tools", groups: ["tools"] },
            { name: "others", groups: ["others"] },
            { name: "about", groups: ["about"] },
          ],
          removePlugins: "elementspath",
          resize_enabled: false,
          contentsCss: [
            "body { font-family: Arial, sans-serif; font-size: 14px; margin: 12px; }",
            ".cke_editable { background-color: #fff; border: 1px solid #ccc; }",
          ],
        });

        // Set initial content if available
        const initialValue = defaultValue || "";
        if (initialValue) {
          editorInstance.setData(initialValue);
        }

        // Handle content changes with debounce
        editorInstance.on("change", function () {
          // Clear previous timeout if exists
          if (changeTimeout) clearTimeout(changeTimeout);

          // Set new timeout to update form after delay
          changeTimeout = setTimeout(() => {
            const data = editorInstance.getData();
            console.log("CKEditor content changed:", data);

            // Setup listener to capture form submissions during the update
            const formElement = containerRef.current?.closest("form");
            if (formElement) {
              const onSubmitHandler = (e: Event) => {
                e.preventDefault();
                formElement.removeEventListener("submit", onSubmitHandler);
              };
              formElement.addEventListener("submit", onSubmitHandler);
            }

            // Update form with the editor content
            if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
              if (field && typeof field.onChange === "function") {
                field.onChange(data);
              }
            }
          }, 300);
        });

        // Enable drag and drop functionality
        editorInstance.on("instanceReady", function (evt: any) {
          // console.log('CKEditor is ready:', evt.editor.name);

          // Apply additional styling to the container
          const editorContainer = document.querySelector(
            `#cke_${uniqueId.current}`
          );
          if (editorContainer) {
            editorContainer.classList.add("ckeditor-container");

            // Direct styling to remove borders
            const iframeHolder = editorContainer.querySelector(
              '[id$="_iframeholder"]'
            );
            if (iframeHolder) {
              (iframeHolder as HTMLElement).style.border = "none";
              (iframeHolder as HTMLElement).style.padding = "0";
              (iframeHolder as HTMLElement).style.margin = "0";
            }

            const contents = editorContainer.querySelector('[id$="_contents"]');
            if (contents) {
              (contents as HTMLElement).style.border = "none";
              (contents as HTMLElement).style.padding = "0";
              (contents as HTMLElement).style.margin = "0";
            }

            // Find and style the iframe
            const iframe = editorContainer.querySelector("iframe");
            if (iframe) {
              iframe.style.border = "none";
              iframe.style.outline = "none";
              iframe.style.boxShadow = "none";
              iframe.style.borderRadius = "0";

              // Access and style the document inside the iframe
              try {
                const iframeDocument = (iframe as HTMLIFrameElement)
                  .contentDocument;
                if (iframeDocument) {
                  const styleElement = iframeDocument.createElement("style");
                  styleElement.textContent = `
                    body { 
                      border: none !important; 
                      outline: none !important;
                      box-shadow: none !important;
                      padding: 10px !important;
                      margin: 0 !important;
                      background-color: transparent !important;
                    }
                    html, body {
                      background-color: transparent !important;
                    }
                    p {
                      margin: 0 !important;
                      padding: 0 !important;
                      border: none !important;
                    }
                    textarea, input, div, span {
                      border: none !important;
                      outline: none !important;
                      box-shadow: none !important;
                    }
                  `;
                  iframeDocument.head.appendChild(styleElement);
                }
              } catch (e) {
                console.error("Could not access iframe document:", e);
              }
            }
          }

          // Prevent form submission on Enter key press inside editor
          const editorDoc = evt.editor.document;
          editorDoc.on("keydown", function (keyEvent: any) {
            if (keyEvent.data.getKeystroke() === 13) {
              // 13 is Enter key
              // Prevent the Enter key from submitting the form
              keyEvent.stop();
              keyEvent.cancel();
              keyEvent.data.preventDefault();
              keyEvent.data.stopPropagation();
            }
          });
        });
      } catch (error) {
        // console.error("Error initializing CKEditor:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timerId = setTimeout(() => {
      loadEditor();
    }, 300);

    return () => {
      clearTimeout(timerId);
      if (changeTimeout) clearTimeout(changeTimeout);
      // Clean up the editor instance
      if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
        (window as any).CKEDITOR.instances[uniqueId.current].destroy();
      }
    };
  }, [name, defaultValue]);

  // Get field from Controller
  let field: any;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue}
      render={({ field: f, fieldState }) => {
        // Store field reference for use in useEffect
        field = f;

        // Setup CKEditor change handler when the editor is ready
        if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
          const editor = (window as any).CKEDITOR.instances[uniqueId.current];

          // Remove existing change handlers to avoid duplicates
          editor.removeListener("change");
          editor.removeListener("blur");

          // Add new change handler
          editor.on("change", function () {
            const data = editor.getData();
            console.log("CKEditor content updated:", data);
            field.onChange(data);
          });

          // Handle blur event
          editor.on("blur", function () {
            const data = editor.getData();
            console.log("CKEditor blur event:", data);
            field.onChange(data);
            field.onBlur();
          });
        }

        return (
          <div className="mb-6" ref={containerRef}>
            {label && (
              <label className="block mb-2 text-sm font-medium">{label}</label>
            )}
            <div className="ckeditor-wrapper relative w-full">
              <textarea
                id={uniqueId.current}
                ref={editorRef}
                defaultValue={field.value || defaultValue}
                style={{
                  visibility: "hidden",
                  height: "1px",
                  width: "100%",
                }}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
              />
            </div>
            <style jsx global>{`
              /* Target the outer container */
              .ckeditor-container,
              .cke_chrome {
                border: 1px solid #d1d5db !important;
                border-radius: 0.375rem !important;
                overflow: hidden !important;
                width: 100% !important;
                box-shadow: none !important;
              }

              /* Keep only toolbar borders */
              .cke_top {
                background: #f9fafb !important;
                border-bottom: 1px solid #e5e7eb !important;
              }
              .cke_bottom {
                background: #f9fafb !important;
                border-top: 1px solid #e5e7eb !important;
              }

              /* Aggressively remove ALL other borders */
              // .cke_inner,
              // .cke_contents,
              // .cke_wysiwyg_frame,
              // .cke_wysiwyg_div,
              // .cke_editable,
              // .cke_reset,
              // .cke_reset_all,
              // .cke_panel_container,
              // .cke_panel,
              // .cke_dialog_body,
              // iframe.cke_wysiwyg_frame,
              // div[id^="cke_"][id$="_contents"],
              // div[id^="cke_"][id$="_iframeholder"],
              // iframe[title="Rich Text Editor"],
              // body.cke_editable {
              //   border: none !important;
              //   // outline: none !important;
              //   box-shadow: none !important;
              // }

              /* Additional targeted selectors for the iframe container */
              // div[class*="cke_"][class*="contents"],
              // td.cke_contents,
              // iframe.cke_wysiwyg_frame,
              // iframe[title="Rich Text Editor, editor"] {
              //   border-width: 0 !important;
              //   border-color: transparent !important;
              //   border-style: none !important;
              // }

              /* Ensure content has padding */
              .cke_editable,
              .cke_wysiwyg_div {
                padding: 10px !important;
              }

              /* Force remove borders for specific elements */
              // .cke_reset_all *,
              // .cke_inner * {
              //   border: none !important;
              //   outline: none !important;
              // }

              /* Override the main content area */
              // div[id^="cke_"][id$="_contents"] {
              //   border-left: 0 !important;
              //   border-right: 0 !important;
              //   border-bottom: 0 !important;
              //   margin: 0 !important;
              //   padding: 0 !important;
              // }

              /* Important - this targets the actual text area frame */
              // .cke_wysiwyg_frame {
              //   background-color: white !important;
              //   border-radius: 0 !important;
              // }
            `}</style>
            {fieldState?.error && (
              <p className="mt-1 text-sm text-red-500">
                {fieldState.error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};

export default FormCKEditor;
