"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import debounce from "lodash/debounce";
import FuseLoading from "@fuse/core/FuseLoading";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import FormFileUploadField from "@/components/Shared/FormFileUploadField";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getBlogPosts } from "@/services/apiBlog";
import {
  getCategoryBuyingGuide,
  getBuyingGuideErrorMessage,
  saveCategoryBuyingGuide,
  type BuyingGuideHighlight,
  type BuyingGuideTab,
  type CategoryBuyingGuide,
} from "@/services/apiCategoryBuyingGuide";
import {
  getBrandBuyingGuide,
  saveBrandBuyingGuide,
  type BrandBuyingGuide,
} from "@/services/apiBrandBuyingGuide";

const MAX_HIGHLIGHTS = 3;
const MAX_RELATED_BLOGS = 3;

const highlightSchema = z.object({
  text: z.string(),
});

const tabSchema = z.object({
  tab_title: z.string(),
  section_heading: z.string(),
  section_body: z.string(),
  order: z.number().optional(),
});

const buyingGuideSchema = z
  .object({
    is_enabled: z.boolean(),
    guide_label: z.string().optional(),
    title: z.string().optional(),
    intro_content: z.string().optional(),
    banner_image: z.any().optional().nullable(),
    banner_alt: z.string().optional(),
    highlights: z.array(highlightSchema).max(MAX_HIGHLIGHTS),
    tabs: z.array(tabSchema),
    related_blogs: z
      .array(
        z.object({
          id: z.number(),
          title: z.string(),
        })
      )
      .max(MAX_RELATED_BLOGS),
  })
  .superRefine((data, ctx) => {
    if (!data.is_enabled) return;

    if (!data.guide_label?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Guide label is required",
        path: ["guide_label"],
      });
    }
    if (!data.title?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title is required",
        path: ["title"],
      });
    }
    if (!data.tabs.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one tab is required",
        path: ["tabs"],
      });
    }
    data.tabs.forEach((tab, index) => {
      if (!tab.tab_title?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tab title is required",
          path: ["tabs", index, "tab_title"],
        });
      }
      if (!tab.section_heading?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Section heading is required",
          path: ["tabs", index, "section_heading"],
        });
      }
      if (!tab.section_body?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Section body is required",
          path: ["tabs", index, "section_body"],
        });
      }
    });
  });

type BuyingGuideFormType = z.infer<typeof buyingGuideSchema>;

interface BlogOption {
  id: number;
  title: string;
}

interface BuyingGuideFormProps {
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  entityType?: "category" | "brand";
}

const defaultValues: BuyingGuideFormType = {
  is_enabled: false,
  guide_label: "Buying Guide",
  title: "",
  intro_content: "",
  banner_image: null,
  banner_alt: "",
  highlights: [{ text: "" }, { text: "" }, { text: "" }],
  tabs: [
    {
      tab_title: "",
      section_heading: "",
      section_body: "",
      order: 0,
    },
  ],
  related_blogs: [],
};

const whiteCardSx = {
  p: 3,
  mb: 3,
  bgcolor: "#ffffff",
  borderRadius: 1,
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
} as const;

const sectionTitleSx = {
  mb: 2,
  fontWeight: 600,
  color: "text.primary",
} as const;

const sectionDescSx = {
  mb: 2,
  color: "rgba(0, 0, 0, 0.65)",
} as const;

const inputFieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    bgcolor: "#ffffff",
  },
  "& .MuiOutlinedInput-input": {
    backgroundColor: "#ffffff",
    color: "rgba(0, 0, 0, 0.87)",
  },
} as const;

type BuyingGuide = CategoryBuyingGuide | BrandBuyingGuide;

function resolveRelatedBlogs(guide: BuyingGuide): BlogOption[] {
  if (guide.related_blogs?.length) {
    return guide.related_blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
    }));
  }

  return (guide.related_blog_ids ?? []).map((id) => ({
    id,
    title: `Blog #${id}`,
  }));
}

function mapGuideToFormValues(
  guide: BuyingGuide,
  entityName?: string
): BuyingGuideFormType {
  const highlights =
    guide.highlights?.length > 0
      ? [...guide.highlights]
      : [...defaultValues.highlights];

  while (highlights.length < MAX_HIGHLIGHTS) {
    highlights.push({ text: "" });
  }

  const tabs =
    guide.tabs?.length > 0
      ? [...guide.tabs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : defaultValues.tabs;

  return {
    is_enabled: guide.is_enabled ?? false,
    guide_label: guide.guide_label || "Buying Guide",
    title: guide.title || entityName || "",
    intro_content: guide.intro_content || "",
    banner_image: guide.banner_image || null,
    banner_alt: guide.banner_alt || "",
    highlights: highlights.slice(0, MAX_HIGHLIGHTS),
    tabs,
    related_blogs: resolveRelatedBlogs(guide),
  };
}

export default function BuyingGuideForm({
  categoryId,
  categoryName,
  brandId,
  brandName,
  entityType = "category",
}: BuyingGuideFormProps) {
  const isBrand = entityType === "brand";
  const entityId = isBrand ? brandId : categoryId;
  const entityName = isBrand ? brandName : categoryName;
  const entityLabel = isBrand ? "brand" : "category";
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerCleared, setBannerCleared] = useState(false);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | undefined>();
  const [blogPosts, setBlogPosts] = useState<BlogOption[]>([]);
  const [blogSearch, setBlogSearch] = useState("");

  const { control, handleSubmit, reset, setValue, watch } =
    useForm<BuyingGuideFormType>({
      resolver: zodResolver(buyingGuideSchema),
      defaultValues: {
        ...defaultValues,
        title: entityName || "",
      },
      mode: "onChange",
    });

  const isEnabled = watch("is_enabled");
  const selectedBlogs = watch("related_blogs") || [];

  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight,
  } = useFieldArray({ control, name: "highlights" });

  const {
    fields: tabFields,
    append: appendTab,
    remove: removeTab,
  } = useFieldArray({ control, name: "tabs" });

  const mergedBlogOptions = useMemo(() => {
    const byId = new Map<number, BlogOption>();
    blogPosts.forEach((post) => byId.set(post.id, post));
    selectedBlogs.forEach((selected) => {
      if (!byId.has(selected.id)) {
        byId.set(selected.id, {
          id: selected.id,
          title: selected.title,
        });
      }
    });
    return Array.from(byId.values());
  }, [blogPosts, selectedBlogs]);

  const fetchBlogPosts = useMemo(
    () =>
      debounce(async (searchTerm: string) => {
        try {
          const response = await getBlogPosts({
            search: searchTerm,
            limit: 50,
            is_active: true,
            status: "published",
          });
          const blogs = (response?.data?.blogs || []).filter(
            (post) => post.status === "published"
          );
          setBlogPosts(
            blogs.map((post) => ({
              id: post.id,
              title: post.title,
            }))
          );
        } catch (error) {
          console.error("Failed to fetch blog posts:", error);
        }
      }, 300),
    []
  );

  useEffect(() => {
    fetchBlogPosts(blogSearch);
  }, [blogSearch, fetchBlogPosts]);

  useEffect(() => {
    fetchBlogPosts("");
  }, [fetchBlogPosts]);

  useEffect(() => {
    const fetchBuyingGuide = async () => {
      if (!entityId) return;

      try {
        setLoading(true);
        const response = isBrand
          ? await getBrandBuyingGuide(entityId)
          : await getCategoryBuyingGuide(entityId);
        const guide = response?.data?.buyingGuide;

        if (guide) {
          reset(mapGuideToFormValues(guide, entityName));
          setBannerImageUrl(guide.banner_image || undefined);
          setBannerCleared(false);
          setBannerFile(null);
        } else if (entityName) {
          setValue("title", entityName);
        }
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch buying guide:", error);
        }
        if (entityName) {
          setValue("title", entityName);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBuyingGuide();
  }, [entityId, entityName, isBrand, reset, setValue]);

  const onSubmit = async (formData: BuyingGuideFormType) => {
    setSaving(true);
    try {
      const filteredHighlights: BuyingGuideHighlight[] = formData.highlights
        .filter((h) => h.text.trim() !== "")
        .map((h) => ({ text: h.text }));

      const tabsWithOrder: BuyingGuideTab[] = formData.tabs.map(
        (tab, index) => ({
          tab_title: tab.tab_title,
          section_heading: tab.section_heading,
          section_body: tab.section_body,
          order: index,
        })
      );

      if (!entityId) {
        throw new Error(`${isBrand ? "Brand" : "Category"} ID is missing`);
      }

      const guideData = {
        is_enabled: formData.is_enabled,
        guide_label: formData.guide_label,
        title: formData.title,
        intro_content: formData.intro_content || "",
        banner_alt: formData.banner_alt || "",
        highlights: filteredHighlights,
        tabs: tabsWithOrder,
        related_blog_ids: formData.related_blogs.map((b) => b.id),
        banner_image:
          !bannerCleared && typeof formData.banner_image === "string"
            ? formData.banner_image
            : undefined,
        banner_image_file: bannerFile,
        clear_banner: bannerCleared && !bannerFile,
      };
      const response = isBrand
        ? await saveBrandBuyingGuide(entityId, {
            ...guideData,
            brand_id: entityId,
          })
        : await saveCategoryBuyingGuide(entityId, {
            ...guideData,
            category_id: entityId,
          });

      const savedGuide = response?.data?.buyingGuide;
      if (savedGuide) {
        reset(mapGuideToFormValues(savedGuide, entityName));
        setBannerImageUrl(savedGuide.banner_image || undefined);
        setBannerCleared(false);
        setBannerFile(null);
      }

      showSnackbar(
        response?.message || "Buying guide saved successfully!",
        "success"
      );
    } catch (error: unknown) {
      showSnackbar(getBuyingGuideErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FuseLoading />;
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 2 }}>
      <Paper sx={whiteCardSx}>
        <FormControlLabel
          control={
            <Controller
              name="is_enabled"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch checked={value} onChange={onChange} color="primary" />
              )}
            />
          }
          label={
            <Typography variant="body1" color="text.primary" fontWeight={500}>
              Enable Buying Guide for this {entityLabel}
            </Typography>
          }
        />
        <Typography variant="body2" sx={sectionDescSx}>
          When enabled, the buying guide section will appear on the {entityLabel}
          product filter page.
        </Typography>
      </Paper>

      <Paper sx={whiteCardSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Header
        </Typography>

        <FormInputField
          name="guide_label"
          control={control}
          label="Guide Label"
          type="text"
          sx={inputFieldSx}
        />
        <FormInputField
          name="title"
          control={control}
          label="Main Title"
          type="text"
          required={isEnabled}
          sx={inputFieldSx}
        />
      </Paper>

      <Paper sx={whiteCardSx}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ ...sectionTitleSx, mb: 0 }}>
            Quick Info Highlights
          </Typography>
          {highlightFields.length < MAX_HIGHLIGHTS && (
            <AppButton
              label="Add Highlight"
              type="button"
              size="small"
              disableGradient
              onClick={() => appendHighlight({ text: "" })}
              startIcon={<AddIcon />}
            />
          )}
        </Box>
        <Typography variant="body2" sx={sectionDescSx}>
          Up to {MAX_HIGHLIGHTS} highlight cards shown in the top row (e.g.
          &quot;50+ Flavours&quot;, &quot;6000 Puffs&quot;).
        </Typography>

        {highlightFields.map((field, index) => (
          <Paper
            key={field.id}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "#ffffff",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Box
              sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
            >
              <Box sx={{ flex: 1 }}>
                <FormInputField
                  name={`highlights.${index}.text`}
                  control={control}
                  label={`Highlight ${index + 1}`}
                  type="text"
                  sx={inputFieldSx}
                />
              </Box>
              {highlightFields.length > 1 && (
                <IconButton
                  onClick={() => removeHighlight(index)}
                  color="error"
                  sx={{ mt: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </Paper>
        ))}
      </Paper>

      <Paper sx={whiteCardSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Introductory Content
        </Typography>
        <FormCKEditor
          name="intro_content"
          control={control}
          label="Main Description"
          defaultValue=""
        />
      </Paper>

      <Paper sx={whiteCardSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Banner Image
        </Typography>
        <FormFileUploadField
          name="banner_image"
          control={control}
          label="Hero Banner Image"
          defaultImage={bannerImageUrl}
          onFileChange={(file) => {
            setBannerFile(file);
            if (file) {
              setBannerCleared(false);
            }
            setValue("banner_image", file, { shouldValidate: true });
          }}
          onDeleteDefaultImage={() => {
            setBannerCleared(true);
            setBannerFile(null);
            setBannerImageUrl(undefined);
            setValue("banner_image", null, { shouldValidate: true });
            setValue("banner_alt", "");
          }}
          helperText="Upload the wide banner image shown below the intro text. Max size: 5MB. Supported formats: PNG, JPG, JPEG, WebP."
        />
        {(bannerFile || bannerImageUrl) && (
          <FormInputField
            name="banner_alt"
            control={control}
            label="Banner Alt Text"
            type="text"
            sx={inputFieldSx}
          />
        )}
      </Paper>

      <Paper sx={whiteCardSx}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ ...sectionTitleSx, mb: 0 }}>
            Tabbed Content
          </Typography>
          <AppButton
            label="Add Tab"
            type="button"
            size="small"
            disableGradient
            onClick={() =>
              appendTab({
                tab_title: "",
                section_heading: "",
                section_body: "",
                order: tabFields.length,
              })
            }
            startIcon={<AddIcon />}
          />
        </Box>
        <Typography variant="body2" sx={sectionDescSx}>
          Each tab has a navigation label, section heading, and rich text body
          (e.g. Flavours, Key Features, Compatibility).
        </Typography>

        {tabFields.map((field, index) => (
          <Paper
            key={field.id}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: "#ffffff",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                Tab {index + 1}
              </Typography>
              {tabFields.length > 1 && (
                <IconButton
                  onClick={() => removeTab(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            <FormInputField
              name={`tabs.${index}.tab_title`}
              control={control}
              label="Tab Title"
              type="text"
              required={isEnabled}
              sx={inputFieldSx}
            />
            <FormInputField
              name={`tabs.${index}.section_heading`}
              control={control}
              label="Section Heading"
              type="text"
              required={isEnabled}
              sx={inputFieldSx}
            />
            <FormCKEditor
              key={`tab-body-${field.id}`}
              name={`tabs.${index}.section_body`}
              control={control}
              label="Section Body"
              defaultValue=""
            />
          </Paper>
        ))}
      </Paper>

      <Paper sx={whiteCardSx}>
        <Typography variant="h6" sx={sectionTitleSx}>
          Related Guides
        </Typography>
        <Typography variant="body2" sx={sectionDescSx}>
          Pick up to {MAX_RELATED_BLOGS} related Geek Zone articles to show at
          the bottom of the buying guide section (title, image, excerpt, author,
          and date on storefront).
        </Typography>

        <Controller
          name="related_blogs"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Autocomplete
              multiple
              options={mergedBlogOptions}
              getOptionLabel={(option) => option.title}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              value={value}
              onChange={(_, newValue) => {
                if (newValue.length > MAX_RELATED_BLOGS) return;
                onChange(newValue);
              }}
              onInputChange={(_, newInputValue) => setBlogSearch(newInputValue)}
              filterSelectedOptions
              limitTags={MAX_RELATED_BLOGS}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Related blog posts (max ${MAX_RELATED_BLOGS})`}
                  variant="outlined"
                  sx={{
                    ...inputFieldSx,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#ffffff",
                      bgcolor: "#ffffff",
                    },
                  }}
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option.title}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
            />
          )}
        />
      </Paper>

      <Paper sx={{ ...whiteCardSx, mb: 0 }}>
        <AppButton
          label="Save Buying Guide"
          type="submit"
          loading={saving}
          fullWidth
          size="large"
        />
      </Paper>
    </Box>
  );
}
