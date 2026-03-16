'use client';

import { useEffect, useRef, useState } from 'react';
import { Typography } from '@mui/material';
import { getNewsletterTemplatesAuth } from '@/services/apiNewsletterTemplates';

const BEE_CONTAINER_ID = 'beefree-email-editor-container';

export interface BeefreeEmailEditorProps {
  onSaveHtml?: (html: string) => void;
  onSaveDesign?: (pageJson: string, pageHtml: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
}

export default function BeefreeEmailEditor({
  onSaveHtml,
  onSaveDesign,
  label,
  required = false,
  error,
  defaultValue,
}: BeefreeEmailEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const beeInstanceRef = useRef<any>(null);

  // Always use latest callbacks without re-initializing the editor
  const onSaveHtmlRef = useRef<typeof onSaveHtml | undefined>(onSaveHtml);
  const onSaveDesignRef = useRef<typeof onSaveDesign | undefined>(onSaveDesign);
  onSaveHtmlRef.current = onSaveHtml;
  onSaveDesignRef.current = onSaveDesign;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;
      setStatus('loading');
      setErrorMessage(null);

      try {
        const { default: BeefreeSDK } = await import('@beefree.io/sdk');

        const authResponse = await getNewsletterTemplatesAuth();
        if (!authResponse.success || !authResponse.token) {
          throw new Error(authResponse.message || 'Beefree auth failed');
        }

        // Beefree loginV2 expects an object like { access_token, v2: true }
        const tokenPayload = {
          access_token: authResponse.token,
          v2: authResponse.v2 ?? true,
        } as any;
        if (cancelled) return;

        const beeConfig = {
          container: BEE_CONTAINER_ID,
          language: 'en-US',
          onSave: (
            pageJson: string,
            pageHtml: string,
            _ampHtml: string | null,
            _templateVersion: number,
            _language: string | null
          ) => {
            if (onSaveHtmlRef.current) {
              onSaveHtmlRef.current(pageHtml || '');
            }
            if (onSaveDesignRef.current) {
              onSaveDesignRef.current(pageJson, pageHtml);
            }
          },
          onError: (err: unknown) => {
            console.error('Beefree error:', err);
            setErrorMessage(err instanceof Error ? err.message : 'Editor error');
          },
        };

        const bee = new BeefreeSDK(tokenPayload);
        beeInstanceRef.current = bee;
        bee.start(beeConfig, defaultValue ? JSON.parse(defaultValue) : {});
        if (cancelled) return;
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Failed to load email editor';
        setErrorMessage(msg);
        setStatus('error');
      }
    }

    init();
    return () => {
      cancelled = true;
      if (beeInstanceRef.current && typeof (beeInstanceRef.current as any).destroy === 'function') {
        try {
          (beeInstanceRef.current as any).destroy();
        } catch (_) {}
        beeInstanceRef.current = null;
      }
    };
  }, [defaultValue]);

  return (
    <div className="space-y-1">
      {label && (
        <Typography variant="body2" color="text.secondary" component="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Typography>
      )}
      <div
        id={BEE_CONTAINER_ID}
        ref={containerRef}
        style={{
          height: '75vh',
          minHeight: 560,
          width: '100%',
          border: '1px solid',
          borderColor: error || errorMessage ? 'var(--mui-palette-error-main)' : 'rgba(0,0,0,0.23)',
          borderRadius: 8,
          overflow: 'auto',
        }}
      />
      {status === 'loading' && (
        <Typography variant="caption" color="text.secondary">
          Loading email builder…
        </Typography>
      )}
      {(error || errorMessage) && (
        <Typography variant="caption" color="error">
          {error || errorMessage}
        </Typography>
      )}
      {status === 'ready' && (
        <Typography variant="caption" color="text.secondary">
          Design your email above, then click Save in the editor toolbar to use it for this campaign.
        </Typography>
      )}
    </div>
  );
}
