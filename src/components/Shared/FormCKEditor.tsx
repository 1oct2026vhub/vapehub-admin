"use client";

import { useEffect, useRef, useState } from "react";
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
  const fieldRef = useRef<any>(null);
  const uniqueId = useRef(`tinymce-${Math.random().toString(36).slice(2, 11)}`);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const editorInstanceRef = useRef<any>(null);

  useEffect(() => {
    if ((window as any).tinymce) {
      setScriptLoaded(true);
        return;
      }
        const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js";
        script.async = true;
    script.referrerPolicy = "origin";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(false);
        document.head.appendChild(script);
  }, []);

  // Initialize TinyMCE
  useEffect(() => {
    if (!scriptLoaded) return;
    const tinymce = (window as any).tinymce;
    if (!tinymce) return;

    const existing = tinymce.get(uniqueId.current);
    existing?.remove();

    tinymce.init({
      selector: `#${uniqueId.current}`,
      menubar: "file edit view insert format tools table help",
      plugins:
        "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount codesample emoticons quickbars nonbreaking visualchars",
      toolbar:
        "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | link image media table | hr codesample removeformat | fullscreen code",
      toolbar_mode: "sliding",
      quickbars_selection_toolbar:
        "bold italic underline | quicklink blockquote | h2 h3 | alignleft aligncenter alignright",
      contextmenu: false,
      branding: false,
      promotion: false,
      statusbar: true,
      height: 500,
      content_style:
        "body{font-family:Arial,sans-serif;font-size:14px} img{max-width:100%;height:auto}",
      automatic_uploads: true,
      images_upload_handler: async (blobInfo: any, progress: (v: number) => void) => {
        progress(20);
        const file = blobInfo.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
        progress(100);
        return base64;
      },
      file_picker_types: "image",
      file_picker_callback: (cb: any) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async () => {
          const file = (input.files && input.files[0]) as File;
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => cb(reader.result as string, { title: file.name });
          reader.readAsDataURL(file);
        };
        input.click();
      },
      setup: (editor: any) => {
        editor.on("init", () => {
          editorInstanceRef.current = editor;
          const initialHtml = fieldRef.current?.value || defaultValue || "";
          if (initialHtml) editor.setContent(initialHtml);
        });
        const propagateChange = () => {
          const html = editor.getContent();
          fieldRef.current?.onChange?.(html);
        };
        editor.on("change keyup undo redo input SetContent", propagateChange);
      },
    });

    return () => {
      try {
        const inst = tinymce.get(uniqueId.current);
        inst?.remove();
      } catch {}
    };
  }, [scriptLoaded, defaultValue]);

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
          fieldRef.current = field;
          
          return (
            <div className="relative w-full">
              <textarea id={uniqueId.current} />
              
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
