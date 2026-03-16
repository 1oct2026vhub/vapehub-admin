 'use client';

import { useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import BeefreeEmailEditor from '@/components/Shared/BeefreeEmailEditor';
import { getNewsletterTemplate, saveNewsletterTemplate } from '@/services/apiNewsletterTemplates';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useSearchParams } from 'next/navigation';

const CreateEmailPageClient = () => {
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialDesignJson, setInitialDesignJson] = useState<string | undefined>(undefined);

  // Load existing template when ?templateId= is present
  useEffect(() => {
    const id = searchParams.get('templateId');
    if (!id) return;

    let cancelled = false;

    const loadTemplate = async () => {
      try {
        const res = await getNewsletterTemplate(id);
        if (!res.success) {
          throw new Error(res.message || 'Failed to load template.');
        }
        if (cancelled) return;

        const tpl = res.data;
        setTemplateId(tpl.id);
        setName(tpl.name);
        setSubject(tpl.subject);
        // designJson comes from API as an object – stringify for the editor
        setInitialDesignJson(
          typeof tpl.designJson === 'string'
            ? tpl.designJson
            : JSON.stringify(tpl.designJson),
        );
      } catch (error: any) {
        if (!cancelled) {
          showSnackbar(error?.message || 'Failed to load template.', 'error');
        }
      }
    };

    loadTemplate();
    return () => {
      cancelled = true;
    };
  }, [searchParams, showSnackbar]);

  const handleSaveDesign = async (pageJson: string, pageHtml: string) => {
    if (!name.trim() || !subject.trim()) {
      showSnackbar('Please enter template name and subject before saving.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveNewsletterTemplate({
        id: templateId,
        name: name.trim(),
        subject: subject.trim(),
        designJson: pageJson,
        html: pageHtml,
      });

      if (res.success) {
        setTemplateId(res.data.id);
        showSnackbar('Template saved successfully.', 'success');
      } else {
        showSnackbar(res.message || 'Failed to save template.', 'error');
      }
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to save template.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <PageBreadcrumb />
      <div className="mt-4 bg-white rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
          />
          <TextField
            label="Email Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
            size="small"
          />
        </div>
        <BeefreeEmailEditor
          defaultValue={initialDesignJson}
          onSaveDesign={handleSaveDesign}
        />
        {isSaving && (
          <p className="text-xs text-gray-500">
            Saving template…
          </p>
        )}
      </div>
    </div>
  );
};

export default CreateEmailPageClient;

