'use client';

import { useEffect, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import BeefreeEmailEditor from '@/components/Shared/BeefreeEmailEditor';
import { getNewsletterTemplate, saveNewsletterTemplate } from '@/services/apiNewsletterTemplates';
import { sendPromotionalEmail, PromotionalEmailData } from '@/services/apiMailSubscriptionSettings';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useSearchParams } from 'next/navigation';
import SelectUsersModal from '../promotional/_components/SelectUsersModal';

const CreateEmailPageClient = () => {
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [initialDesignJson, setInitialDesignJson] = useState<string | undefined>(undefined);
  const [selectUsersOpen, setSelectUsersOpen] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendMode, setSendMode] = useState(false);

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

  const handleUsersConfirm = (emails: string[], shouldSendToAll: boolean, groupId?: string | null) => {
    setSelectedEmails(emails);
    setSendToAll(shouldSendToAll);
    setSelectedGroupId(groupId ?? null);
    setSelectUsersOpen(false);

    // If we are just selecting users (not sending), stop here
    if (!sendMode || !templateId) {
      setSendMode(false);
      return;
    }

    // Send flow: reuse promotional email API with templateId + recipients / group
    const doSend = async () => {
      setIsSending(true);
      try {
        const isSendToAll = shouldSendToAll;
        const payload: PromotionalEmailData = {
          templateId,
          sendToAll: isSendToAll,
          ...(!isSendToAll && groupId ? { groupId } : !isSendToAll ? { selectedEmails: emails } : {}),
        };

        const res = await sendPromotionalEmail(payload);
        if (res.success) {
          showSnackbar('Promotional email sent successfully.', 'success');
        } else {
          showSnackbar(res.message || 'Failed to send promotional email.', 'error');
        }
      } catch (error: any) {
        showSnackbar(error?.message || 'Failed to send promotional email.', 'error');
      } finally {
        setIsSending(false);
        setSendMode(false);
      }
    };

    void doSend();
  };

  return (
    <div className="p-6">
      <PageBreadcrumb customLastLabel={templateId ? 'Edit Email' : undefined} />
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
        {templateId && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              disabled={isSending}
              startIcon={<SendIcon />}
              onClick={() => {
                setSendMode(true);
                setSelectUsersOpen(true);
              }}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        )}
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
      {templateId && (
        <SelectUsersModal
          open={selectUsersOpen}
          onClose={() => setSelectUsersOpen(false)}
          onConfirm={handleUsersConfirm}
          initialSelectedEmails={selectedEmails}
          initialSendToAll={sendToAll}
        />
      )}
    </div>
  );
};

export default CreateEmailPageClient;

