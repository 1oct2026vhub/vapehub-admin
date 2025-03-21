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

const FormCKEditor = ({ name, control, label, defaultValue = "" }: FormCKEditorProps) => {
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
          width: '100%',
          toolbarGroups: [
            { name: 'document', groups: [ 'mode', 'document', 'doctools' ] },
            { name: 'clipboard', groups: [ 'clipboard', 'undo' ] },
            { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] },
            { name: 'forms', groups: [ 'forms' ] },
            '/',
            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi', 'paragraph' ] },
            { name: 'links', groups: [ 'links' ] },
            { name: 'insert', groups: [ 'insert' ] },
            '/',
            { name: 'styles', groups: [ 'styles' ] },
            { name: 'colors', groups: [ 'colors' ] },
            { name: 'tools', groups: [ 'tools' ] },
            { name: 'others', groups: [ 'others' ] },
            { name: 'about', groups: [ 'about' ] }
          ],
          removePlugins: 'elementspath',
          resize_enabled: false,
          contentsCss: [
            'body { font-family: Arial, sans-serif; font-size: 14px; margin: 12px; }',
            '.cke_editable { background-color: #fff; border: 1px solid #ccc; }'
          ]
        });

        // Set initial content if available
        const initialValue = defaultValue || "";
        if (initialValue) {
          editorInstance.setData(initialValue);
        }

        // Handle content changes with debounce
        editorInstance.on('change', function() {
          // Clear previous timeout if exists
          if (changeTimeout) clearTimeout(changeTimeout);
          
          // Set new timeout to update form after delay
          changeTimeout = setTimeout(() => {
            const data = editorInstance.getData();
            console.log('CKEditor content changed:', data);
            
            // Setup listener to capture form submissions during the update
            const formElement = containerRef.current?.closest('form');
            if (formElement) {
              const onSubmitHandler = (e: Event) => {
                e.preventDefault();
                formElement.removeEventListener('submit', onSubmitHandler);
              };
              formElement.addEventListener('submit', onSubmitHandler);
            }
            
            // Update form with the editor content
            if ((window as any).CKEDITOR?.instances[uniqueId.current]) {
              if (field && typeof field.onChange === 'function') {
                field.onChange(data);
              }
            }
          }, 300);
        });

        // Prevent Enter key from submitting the form
        editorInstance.on('instanceReady', function(evt: any) {
          console.log('CKEditor is ready:', evt.editor.name);
          
          // Apply additional styling to the container
          const editorContainer = document.querySelector(`#cke_${uniqueId.current}`);
          if (editorContainer) {
            editorContainer.classList.add('ckeditor-container');
          }
          
          // Prevent form submission on Enter key press inside editor
          const editorDoc = evt.editor.document;
          editorDoc.on('keydown', function(keyEvent: any) {
            if (keyEvent.data.getKeystroke() === 13) { // 13 is Enter key
              // Prevent the Enter key from submitting the form
              keyEvent.stop();
              keyEvent.cancel();
              keyEvent.data.preventDefault();
              keyEvent.data.stopPropagation();
            }
          });
        });
      } catch (error) {
        console.error("Error initializing CKEditor:", error);
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
          editor.removeListener('change');
          editor.removeListener('blur');
          
          // Add new change handler
          editor.on('change', function() {
            const data = editor.getData();
            console.log('CKEditor content updated:', data);
            field.onChange(data);
          });
          
          // Handle blur event
          editor.on('blur', function() {
              const data = editor.getData();
            console.log('CKEditor blur event:', data);
              field.onChange(data);
            field.onBlur();
          });
        }
        
        return (
          <div className="mb-6" ref={containerRef}>
            {label && (
              <label className="block mb-2 text-sm font-medium">
                {label}
              </label>
            )}
            <div className="ckeditor-wrapper relative w-full">
              <textarea
                id={uniqueId.current}
                ref={editorRef}
                defaultValue={field.value || defaultValue}
                style={{ visibility: 'hidden', height: '1px', width: '100%' }}
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }}
              />
            </div>
            <style jsx global>{`
              .ckeditor-container {
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                overflow: hidden;
                width: 100% !important;
              }
              .cke_top {
                background: #f9fafb !important;
                border-bottom: 1px solid #e5e7eb !important;
              }
              .cke_bottom {
                background: #f9fafb !important;
                border-top: 1px solid #e5e7eb !important;
              }
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
