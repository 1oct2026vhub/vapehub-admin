import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Control, Controller } from "react-hook-form";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
  Box,
  Typography,
} from "@mui/material";

// A global cache to persist label mappings between component mounts
const globalLabelCache: Record<string, string> = {};

// Track attribute-term relationships
const attributeTermsMap: Record<string, Record<string, string>> = {};

// Expose the cache to window for access from other components
if (typeof window !== "undefined") {
  (window as any).globalLabelCache = globalLabelCache;
  (window as any).attributeTermsMap = attributeTermsMap;
}

export type FormSelectFieldProps = {
  name: string;
  control: Control<any>;
  label?: string;
  placeholder?: string;
  options: { value: string | number; label: string; attributeId?: number }[];
  required?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  variant?: string;
  multiple?: boolean;
  fullWidth?: boolean;
  renderValue?: (selected: any) => React.ReactNode;
  onChange?: (event: SelectChangeEvent<unknown>) => void;
  onBlur?: () => void;
  style?: React.CSSProperties;
  error?: boolean;
  helperText?: string;
  fullHeight?: boolean;
  id?: string;
  endAdornment?: React.ReactNode;
  noneText?: string;
  creatable?: boolean;
  isCreateOptionLoading?: boolean;
  onCreateOption?: (inputValue: string) => void;
  defaultValue?: any;
  size?: "small" | "medium";
  selectAllText?: string;
  allowSelectAll?: boolean;
  attributeId?: number; // Add attributeId prop for better term lookups
  onTermRemove?: (termId: number) => void; // Add the missing prop
};

function FormSelectField(props: FormSelectFieldProps) {
  // Create a persistent mapping of value to label
  const [valueLabelMap, setValueLabelMap] = useState<Record<string, string>>(
    {}
  );

  // Generate a stable ID for this instance
  const componentId = useRef(
    `select-${props.name}-${Math.random().toString(36).substring(2, 9)}`
  );

  // Track render count to force re-renders when needed
  const [renderCount, setRenderCount] = useState(0);

  // Extract attribute ID from field name if not provided directly
  const extractedAttributeId = useMemo(() => {
    // First check if we have an explicit attributeId prop
    if (props.attributeId) return String(props.attributeId);

    // Try to extract from name - format: variants.X.attributes.Y.term_id
    const match = props.name.match(/variants\.\d+\.attributes\.(\d+)\.term_id/);
    if (match && match[1]) return match[1];

    // Try simpler format: attributes.Y.term_id
    const simpleMatch = props.name.match(/attributes\.(\d+)\.term_id/);
    if (simpleMatch && simpleMatch[1]) return simpleMatch[1];

    return null;
  }, [props.name, props.attributeId]);

  // Create a lookup map for quick access to option labels
  const optionMap = useMemo(() => {
    const map: Record<string, string> = {};
    props.options.forEach((option) => {
      const key = String(option.value);
      map[key] = option.label;

      // Also update the global cache
      globalLabelCache[key] = option.label;

      // If we have an attribute ID, store term in attribute-term map
      if (extractedAttributeId) {
        if (!attributeTermsMap[extractedAttributeId]) {
          attributeTermsMap[extractedAttributeId] = {};
        }
        attributeTermsMap[extractedAttributeId][key] = option.label;
      }
    });
    return map;
  }, [props.options, extractedAttributeId]);

  // Initialize labels on mount and when options change
  useEffect(() => {
    const newMap = { ...valueLabelMap };
    let hasChanges = false;

    // Add all current options to the map
    props.options.forEach((option) => {
      const key = String(option.value);
      if (!newMap[key] || newMap[key] !== option.label) {
        newMap[key] = option.label;
        hasChanges = true;
      }
    });

    // Also use labels from global cache
    Object.entries(globalLabelCache).forEach(([key, label]) => {
      if (!newMap[key]) {
        newMap[key] = label;
        hasChanges = true;
      }
    });

    // Check attribute-specific term map if available
    if (extractedAttributeId && attributeTermsMap[extractedAttributeId]) {
      Object.entries(attributeTermsMap[extractedAttributeId]).forEach(
        ([key, label]) => {
          if (!newMap[key] || newMap[key].startsWith("Term ")) {
            newMap[key] = label;
            hasChanges = true;
          }
        }
      );
    }

    if (hasChanges) {
      setValueLabelMap(newMap);
      // Force a re-render to ensure values display properly
      setRenderCount((prev) => prev + 1);
    }
  }, [props.options, extractedAttributeId]);

  // Force immediate update when dropdown is opened to ensure labels are correct
  const onOpenHandler = useCallback(() => {
    console.log(`Select for ${props.name} opened, forcing label update`);

    // Immediately update our label cache with any new options
    const newMap = { ...valueLabelMap };
    let hasChanges = false;

    // Add all current options to the map
    props.options.forEach((option) => {
      const key = String(option.value);
      if (!newMap[key] || newMap[key] !== option.label) {
        newMap[key] = option.label;
        hasChanges = true;
        // Also update global cache
        globalLabelCache[key] = option.label;
      }
    });

    if (hasChanges) {
      setValueLabelMap(newMap);
      // Force a re-render immediately
      setRenderCount((prev) => prev + 1);
    }
  }, [props.name, props.options, valueLabelMap]);

  // Function to safely get a label for a value
  const getLabelForValue = useCallback(
    (value: any): string => {
      if (value === null || value === undefined) return "";

      const stringValue = String(value);

      // Try in this order:
      // 1. Check attribute-specific term map first (most accurate)
      if (
        extractedAttributeId &&
        attributeTermsMap[extractedAttributeId] &&
        attributeTermsMap[extractedAttributeId][stringValue]
      ) {
        return attributeTermsMap[extractedAttributeId][stringValue];
      }

      // 2. Check our local map
      if (valueLabelMap[stringValue]) {
        return valueLabelMap[stringValue];
      }

      // 3. Check global cache using attributeId if available
      if (props.attributeId && globalLabelCache[`${props.attributeId}_${stringValue}`]) {
        // Update local cache for next time
        setTimeout(() => {
          setValueLabelMap((prev) => ({
            ...prev,
            [stringValue]: globalLabelCache[`${props.attributeId}_${stringValue}`],
          }));
        }, 0);
        return globalLabelCache[`${props.attributeId}_${stringValue}`];
      }

      // 4. Try current options (should always find if in dropdown)
      const option = props.options.find((opt) => String(opt.value) === stringValue);
      if (option) {
        // Update caches
        globalLabelCache[stringValue] = option.label;
        
        // Add to attribute-specific map if we have an attribute ID
        if (extractedAttributeId) {
          if (!attributeTermsMap[extractedAttributeId]) {
            attributeTermsMap[extractedAttributeId] = {};
          }
          attributeTermsMap[extractedAttributeId][stringValue] = option.label;
        }

        // Also store with attributeId if available
        if (props.attributeId) {
          globalLabelCache[`${props.attributeId}_${stringValue}`] = option.label;
        }

        setTimeout(() => {
          setValueLabelMap((prev) => ({
            ...prev,
            [stringValue]: option.label,
          }));
          // Force re-render to update display
          setRenderCount((prev) => prev + 1);
        }, 0);

        return option.label;
      }

      // Last resort fallback
      const placeholder = `Term ${stringValue}`;
      globalLabelCache[stringValue] = placeholder;
      setTimeout(() => {
        setValueLabelMap((prev) => ({ ...prev, [stringValue]: placeholder }));
      }, 0);

      return placeholder;
    },
    [props.options, valueLabelMap, extractedAttributeId, props.attributeId]
  );

  // Handle onChange to update lookupMap with newly selected values
  const handleChange = useCallback(
    (event: SelectChangeEvent<unknown>) => {
      const selectedValue = event.target.value;
      
      // Update cache for new selections
      if (Array.isArray(selectedValue)) {
        selectedValue.forEach((value) => {
          const option = props.options.find((opt) => String(opt.value) === String(value));
          if (option && !valueLabelMap[String(value)]) {
            valueLabelMap[String(value)] = option.label;
            
            // Also update global cache with attributeId if available
            if (extractedAttributeId) {
              globalLabelCache[`${extractedAttributeId}_${value}`] = option.label;
            }
            if (props.attributeId) {
              globalLabelCache[`${props.attributeId}_${value}`] = option.label;
            }
          }
        });
      } else {
        const option = props.options.find(
          (opt) => String(opt.value) === String(selectedValue)
        );
        if (option && !valueLabelMap[String(selectedValue)]) {
          valueLabelMap[String(selectedValue)] = option.label;
          
          // Also update global cache with attributeId if available
          if (extractedAttributeId) {
            globalLabelCache[`${extractedAttributeId}_${selectedValue}`] = option.label;
          }
          if (props.attributeId) {
            globalLabelCache[`${props.attributeId}_${selectedValue}`] = option.label;
          }
        }
      }
      
      if (props.onChange) {
        props.onChange(event);
      }
    },
    [props.options, valueLabelMap, extractedAttributeId, props.attributeId, props.onChange]
  );

  return (
    <Controller
      name={props.name}
      control={props.control}
      rules={{ required: props.required ? "This field is required" : false }}
      render={({
        field: { onChange: fieldOnChange, value, ref },
        fieldState: { error },
      }) => {
        // Initialize values when component first renders
        useEffect(() => {
          if (value !== undefined && value !== null) {
            if (props.multiple && Array.isArray(value)) {
              value.forEach((val) => {
                getLabelForValue(val);
              });
            } else {
              getLabelForValue(value);
            }
          }
        }, [value, getLabelForValue]);

        // Log the current value and attribute ID for debugging
        useEffect(() => {
          console.log(`Field ${props.name} - current value:`, value);
          console.log(`- attributeId:`, extractedAttributeId);
          if (extractedAttributeId) {
            console.log(
              `- term cache:`,
              attributeTermsMap[extractedAttributeId] || {}
            );
          }
        }, [props.name, value, extractedAttributeId]);

        return (
          <FormControl
            // Use a stable ID + render count to force re-renders when needed
            key={`${componentId.current}-${renderCount}`}
            fullWidth
            error={!!error}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderImage: "linear-gradient(to right, #2E9970, #005434) 1",
                },
                "&:hover fieldset": {
                  borderImage: "linear-gradient(to right, #247C5C, #003F29) 1",
                },
                "&.Mui-focused fieldset": {
                  borderImage: "linear-gradient(to right, #1E7A56, #004C30) 1",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#2E9970", // Label color before focus
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#2E9970", // Label color on focus
              },
              "& .MuiFormLabel-asterisk": {
                color: "red",
              },
              marginBottom: "20px",
            }}
          >
            <InputLabel>{props.label}{props.required && <span style={{ color: 'red' }}>*</span>}</InputLabel>
            <Select
              inputRef={ref}
              multiple={props.multiple}
              value={props.multiple ? value || [] : value}
              label={props.label}
              onOpen={onOpenHandler}
              onChange={(e: SelectChangeEvent<any>) => {
                // Cache labels for newly selected values
                const newValue = e.target.value;

                if (props.multiple) {
                  if (Array.isArray(newValue)) {
                    newValue.forEach((val) => {
                      getLabelForValue(val);
                    });
                  }
                } else {
                  getLabelForValue(newValue);
                }

                // Handle the change event
                if (props.onChange) {
                  props.onChange(e);
                } else {
                  if (props.multiple) {
                    const values = Array.isArray(e.target.value)
                      ? e.target.value
                      : [e.target.value];
                    fieldOnChange(values);
                  } else {
                    fieldOnChange(e.target.value);
                  }
                }

                // Force an update after selection
                setTimeout(() => {
                  setRenderCount((prev) => prev + 1);
                }, 0);
              }}
              renderValue={(selected) => {
                if (props.multiple) {
                  const selectedValues = Array.isArray(selected)
                    ? selected
                    : [selected];
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedValues.map((value) => {
                        const label = getLabelForValue(value);
                        return (
                          <Chip
                            key={value}
                            label={label}
                            onDelete={() => {
                              if (props.onTermRemove) {
                                props.onTermRemove(Number(value));
                              } else {
                                const newValue = selectedValues.filter(
                                  (v) => v !== value
                                );
                                fieldOnChange(newValue.length ? newValue : []);
                              }
                            }}
                            sx={{ m: "2px" }}
                          />
                        );
                      })}
                    </Box>
                  );
                } else {
                  return getLabelForValue(selected);
                }
              }}
            >
              {props.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {error && (
              <Typography variant="caption" color="error">
                {error.message}
              </Typography>
            )}
          </FormControl>
        );
      }}
    />
  );
}

export default FormSelectField;
