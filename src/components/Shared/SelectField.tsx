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
if (typeof window !== 'undefined') {
  (window as any).globalLabelCache = globalLabelCache;
  (window as any).attributeTermsMap = attributeTermsMap;
}

// Function to initialize attribute-term map for a specific attribute
function initializeAttributeTermMap(attributeId: string, options: { value: string | number; label: string }[]) {
  if (!attributeId) return;
  
  // Initialize the attribute mapping if needed
  if (!attributeTermsMap[attributeId]) {
    attributeTermsMap[attributeId] = {};
  }
  
  // Populate with current options
  options.forEach(option => {
    const key = String(option.value);
    attributeTermsMap[attributeId][key] = option.label;
  });
  
  console.log(`Initialized attributeTermsMap for attribute ${attributeId}:`, 
    attributeTermsMap[attributeId]);
}

interface FormSelectFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  options: { value: string | number; label: string; attributeId?: number }[];
  required?: boolean;
  isMulti?: boolean;
  onChange?: (event: SelectChangeEvent<any>) => void;
  onTermRemove?: (termId: number) => void;
  attributeId?: number;
  currentValue?: { value: string | number; label: string }; // Add currentValue prop
}

function FormSelectField({
  name,
  control,
  label,
  options,
  required,
  isMulti,
  onChange,
  onTermRemove,
  attributeId,
  currentValue,
}: FormSelectFieldProps) {
  // Create a persistent mapping of value to label
  const [valueLabelMap, setValueLabelMap] = useState<Record<string, string>>({});
  
  // Generate a stable ID for this instance
  const componentId = useRef(`select-${name}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Track render count to force re-renders when needed
  const [renderCount, setRenderCount] = useState(0);
  
  // Track if this is the first mount of the component
  const isFirstMount = useRef(true);
  
  // Check if we need to refresh the page (only on first mount)
  useEffect(() => {
    if (isFirstMount.current && typeof window !== 'undefined') {
      isFirstMount.current = false;
      
      // Check if we should refresh the page from attributes tab
      const refreshFunction = (window as any).refreshFromAttributes;
      if (typeof refreshFunction === 'function') {
        try {
          refreshFunction();
        } catch (err) {
          console.error('Error calling refreshFromAttributes:', err);
        }
      }
    }
  }, []);
  
  // CRITICAL FIX: Always pre-check term maps at render time
  useEffect(() => {
    if (typeof window !== 'undefined' && attributeId) {
      try {
        const attrId = String(attributeId);
        // Force immediate refresh of term maps
        console.log(`🔥 Critical precheck for attributeId=${attrId} (${label}) at render time`);
        
        // Log the current maps
        const directMap = typeof (window as any).directTermLabelMap === 'object' ? 
          ((window as any).directTermLabelMap?.[attrId] || {}) : {};
        
        const attrMap = typeof attributeTermsMap === 'object' ? 
          (attributeTermsMap[attrId] || {}) : {};
        
        console.log(`${label} - Direct map:`, directMap);
        console.log(`${label} - Attribute map:`, attrMap);
        
        // Trigger re-render to ensure labels display properly
        setRenderCount(c => c + 1);
      } catch (err) {
        console.error('Error in term maps precheck:', err);
      }
    }
  }, [attributeId, label]);
  
  // Extract attribute ID from field name if not provided directly
  const extractedAttributeId = useMemo(() => {
    // First check if we have an explicit attributeId prop
    if (attributeId) return String(attributeId);
    
    // Try to extract from name - format: variants.X.attributes.Y.term_id
    const match = name.match(/variants\.\d+\.attributes\.(\d+)\.term_id/);
    if (match && match[1]) return match[1];
    
    // Try simpler format: attributes.Y.term_id
    const simpleMatch = name.match(/attributes\.(\d+)\.term_id/);
    if (simpleMatch && simpleMatch[1]) return simpleMatch[1];
    
    return null;
  }, [name, attributeId]);
  
  // Create a lookup map for quick access to option labels
  const optionMap = useMemo(() => {
    const map: Record<string, string> = {};
    options.forEach(option => {
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
        console.log(`Cached term for attribute ${extractedAttributeId}: ${key} -> ${option.label}`);
      }
    });
    return map;
  }, [options, extractedAttributeId]);
  
  // Initialize labels on mount and when options change
  useEffect(() => {
    const newMap = {...valueLabelMap};
    let hasChanges = false;
    
    // Add all current options to the map
    options.forEach(option => {
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
      Object.entries(attributeTermsMap[extractedAttributeId]).forEach(([key, label]) => {
        if (!newMap[key] || newMap[key].startsWith('Term ')) {
          newMap[key] = label;
          hasChanges = true;
        }
      });
    }
    
    if (hasChanges) {
      setValueLabelMap(newMap);
      // Force a re-render to ensure values display properly
      setRenderCount(prev => prev + 1);
    }
  }, [options, extractedAttributeId]);
  
  // Force immediate update when dropdown is opened to ensure labels are correct
  const onOpenHandler = useCallback(() => {
    console.log(`Select for ${name} opened, forcing label update`);
    
    // Immediately update our label cache with any new options
    const newMap = {...valueLabelMap};
    let hasChanges = false;
    
    // Add all current options to the map
    options.forEach(option => {
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
      setRenderCount(prev => prev + 1);
    }
  }, [name, options, valueLabelMap]);

  // Enhance the getLabelForValue function to better handle term lookups
  const getLabelForValue = useCallback(
    (value: any) => {
      if (value === null || value === undefined || value === '') {
        return '';
      }

      try {
        const customWindow = window as any;

        // DIRECT API LOOKUP - This should be the most accurate source of truth
        // If we have an extractedAttributeId and the direct lookup function exists, use it
        if (extractedAttributeId && customWindow.getDirectTermLabel) {
          const directLabel = customWindow.getDirectTermLabel(extractedAttributeId, value);
          if (directLabel && !directLabel.startsWith('Term ')) {
            console.log(`✅ DIRECT TERM LOOKUP SUCCESS for attr=${extractedAttributeId}, value=${value}: "${directLabel}"`);
            return directLabel;
          }
          console.log(`⚠️ DIRECT TERM LOOKUP FAILED for attr=${extractedAttributeId}, value=${value}, falling back...`);
        }

        // Now try to look up the label with attribute-specific term mappings
        // Check if attributeTermsMap is defined and has the attribute
        if (extractedAttributeId && 
            customWindow.attributeTermsMap && 
            typeof customWindow.attributeTermsMap === 'object' &&
            customWindow.attributeTermsMap[extractedAttributeId]) {
          
          // Check if the term exists for this attribute
          const attrTerms = customWindow.attributeTermsMap[extractedAttributeId];
          if (attrTerms && typeof attrTerms === 'object' && attrTerms[value]) {
            const termLabel = attrTerms[value];
            console.log(`✅ ATTRIBUTE-SPECIFIC MAP HIT for attr=${extractedAttributeId}, value=${value}: "${termLabel}"`);
            
            // Update the cache for next time
            if (options) {
              const foundOption = options.find(
                (option) => option.value === value
              );
              if (foundOption && (!foundOption.label || foundOption.label.startsWith('Term '))) {
                foundOption.label = termLabel;
                console.log(`Updated option label in component for value ${value} to "${termLabel}"`);
              }
            }
            return termLabel;
          }
        }

        // Next check if the options array has this value and its label
        if (options) {
          const foundOption = options.find(
            (option) => option.value === value
          );
          if (foundOption?.label) {
            // If we have a proper label (not starting with 'Term '), use it
            if (!foundOption.label.startsWith('Term ')) {
              return foundOption.label;
            }
            
            // Try to find a better label from API or cache
            console.log(`⚠️ Found placeholder label "${foundOption.label}" for value ${value}, trying to find better label...`);
            
            // If we have an attributeId, look through all terms for this attribute in the API data
            if (customWindow.termApi && 
                typeof customWindow.termApi === 'object' && 
                customWindow.termApi.getTermById && 
                extractedAttributeId) {
              const betterLabel = customWindow.termApi.getTermById(extractedAttributeId, value);
              if (betterLabel && !betterLabel.startsWith('Term ')) {
                console.log(`✅ API LOOKUP SUCCESS for attr=${extractedAttributeId}, value=${value}: "${betterLabel}"`);
                
                // Update the option label for future reference
                foundOption.label = betterLabel;
                
                // Update the attribute-specific map
                if (customWindow.attributeTermsMap && extractedAttributeId) {
                  if (!customWindow.attributeTermsMap[extractedAttributeId]) {
                    customWindow.attributeTermsMap[extractedAttributeId] = {};
                  }
                  customWindow.attributeTermsMap[extractedAttributeId][value] = betterLabel;
                  console.log(`Updated attributeTermsMap for attr=${extractedAttributeId}, value=${value}`);
                }
                
                return betterLabel;
              }
            }
          }
        }

        // Finally try the global mapping
        if (customWindow.termLabelMap && 
            typeof customWindow.termLabelMap === 'object' && 
            customWindow.termLabelMap[value]) {
          return customWindow.termLabelMap[value] || String(value);
        }

        // If all else fails, just return the value as a string
        return String(value);
      } catch (error) {
        console.error('Error in getLabelForValue:', error);
        return String(value);
      }
    },
    [options, extractedAttributeId]
  );

  // Initialize attribute-specific term map when component mounts
  useEffect(() => {
    if (extractedAttributeId) {
      // Always clear the previous mapping for this attribute to prevent cross-contamination
      attributeTermsMap[extractedAttributeId] = {};
      
      // Use the centralized function to initialize the attribute-term map
      console.log(`Initializing attribute ${extractedAttributeId} with options:`, options);
      
      // Populate with current options
      options.forEach(option => {
        const key = String(option.value);
        
        // Create the attribute map if needed
        if (!attributeTermsMap[extractedAttributeId]) {
          attributeTermsMap[extractedAttributeId] = {};
        }
        
        // Set the label explicitly
        attributeTermsMap[extractedAttributeId][key] = option.label;
        console.log(`Set term for attribute ${extractedAttributeId}: ${key} = ${option.label}`);
      });
      
      console.log(`Completed mapping for attribute ${extractedAttributeId}:`, attributeTermsMap[extractedAttributeId]);
      
      // Force a re-render with the new mapping
      setRenderCount(prev => prev + 1);
    }
  }, [extractedAttributeId, options]);

  // Force initialization when input changes
  useEffect(() => {
    if (extractedAttributeId && options.length > 0) {
      // Re-initialize the map when options change
      initializeAttributeTermMap(extractedAttributeId, options);
    }
  }, [options, extractedAttributeId]);

  // Force initialization when component mounts
  useEffect(() => {
    // First-time initialization
    if (isFirstMount.current && extractedAttributeId) {
      isFirstMount.current = false;
      initializeAttributeTermMap(extractedAttributeId, options);
      console.log(`First-time initialization of attribute ${extractedAttributeId} complete`);
    }
  }, []);

  // Immediately update when the component renders with a new value
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, [options, extractedAttributeId]);

  // Create a special version of renderValue that prioritizes the current options
  const renderMenuItems = useCallback(() => {
    return options.map((option) => {
      try {
        // For debugging, add attribute info
        let optionLabel = option.label || `Term ${option.value}`;
        
        // Try direct term lookup first if we have an attribute ID
        if (extractedAttributeId && 
            typeof window !== 'undefined' && 
            (window as any).getDirectTermLabel &&
            typeof (window as any).getDirectTermLabel === 'function') {
          const directLabel = (window as any).getDirectTermLabel(extractedAttributeId, option.value);
          if (directLabel && !directLabel.startsWith('Term ')) {
            optionLabel = directLabel;
          }
        }
        
        const debugInfo = extractedAttributeId 
          ? `[attr=${extractedAttributeId}, term=${option.value}]` 
          : '';
        
        // Also ensure the term label is properly set
        if (extractedAttributeId && 
            typeof window !== 'undefined' && 
            (window as any).ensureTermLabel &&
            typeof (window as any).ensureTermLabel === 'function') {
          (window as any).ensureTermLabel(extractedAttributeId, option.value, optionLabel);
        }
        
        return (
          <MenuItem 
            key={option.value} 
            value={option.value}
            title={`${optionLabel} ${debugInfo}`}
          >
            {optionLabel}
          </MenuItem>
        );
      } catch (err) {
        console.error('Error rendering menu item:', err);
        return (
          <MenuItem key={option.value} value={option.value}>
            {option.label || `Term ${option.value}`}
          </MenuItem>
        );
      }
    });
  }, [options, extractedAttributeId]);

  // THIS IS CRITICAL: Log all inputs affecting the display at render time
  console.log(`🧐 RENDERING SELECT for ${name} with:`, {
    attributeId,
    extractedAttributeId: extractedAttributeId || 'none',
    currentValue: currentValue || 'none',
    options
  });

  return (
    <Controller
      key={`controller-${componentId.current}-attr${extractedAttributeId || ''}-${renderCount}-${options.length}`}
      name={name}
      control={control}
      rules={{ required: required ? "This field is required" : false }}
      render={({
        field: { onChange: fieldOnChange, value, ref },
        fieldState: { error },
      }) => {
        // Initialize values when component first renders
        useEffect(() => {
          if (value !== undefined && value !== null) {
            try {
              if (isMulti && Array.isArray(value)) {
                value.forEach(val => {
                  getLabelForValue(val);
                });
              } else {
                getLabelForValue(value);
              }
            } catch (err) {
              console.error("Error initializing value labels:", err);
            }
          }
        }, [value]);
        
        // Log the current value and attribute ID for debugging
        useEffect(() => {
          console.log(`Field ${name} - current value:`, value);
          console.log(`- attributeId:`, extractedAttributeId);
          if (extractedAttributeId) {
            console.log(`- term cache:`, attributeTermsMap[extractedAttributeId] || {});
          }
        }, [name, value, extractedAttributeId]);
        
        // Take direct control of the renderValue function with currentValue
        const renderValue = useCallback((selected: any) => {
          try {
            // ALWAYS prioritize currentValue if it's provided - this is critical
            if (!isMulti && currentValue && selected !== null && String(selected) === String(currentValue.value)) {
              console.log(`🎯 Using direct currentValue for field ${name}: "${currentValue.label}"`);
              return currentValue.label;
            }
            
            if (selected === null || selected === undefined) {
              return '';
            }
            
            if (isMulti) {
              const selectedValues = Array.isArray(selected) ? selected : [];
              return (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selectedValues.map((value: any) => {
                    // Always try direct lookup first with attribute ID
                    let label = "";
                    if (extractedAttributeId) {
                      console.log(`Using direct lookup for attr=${extractedAttributeId}, term=${value}`);
                      if (typeof window !== 'undefined' && 
                          (window as any).directTermLabelMap && 
                          typeof (window as any).directTermLabelMap === 'object' &&
                          (window as any).directTermLabelMap[extractedAttributeId] && 
                          (window as any).directTermLabelMap[extractedAttributeId][value]) {
                        label = (window as any).directTermLabelMap[extractedAttributeId][value];
                      } else if (attributeTermsMap[extractedAttributeId] && attributeTermsMap[extractedAttributeId][value]) {
                        label = attributeTermsMap[extractedAttributeId][value];
                      } else {
                        // Look through options
                        const option = options.find(opt => String(opt.value) === String(value));
                        if (option) {
                          label = option.label;
                          // Store for future use
                          if (extractedAttributeId) {
                            if (!attributeTermsMap[extractedAttributeId]) {
                              attributeTermsMap[extractedAttributeId] = {};
                            }
                            attributeTermsMap[extractedAttributeId][value] = option.label;
                            
                            // Also ensure in direct map
                            if (typeof window !== 'undefined' && 
                                (window as any).ensureTermLabel && 
                                typeof (window as any).ensureTermLabel === 'function') {
                              (window as any).ensureTermLabel(extractedAttributeId, value, option.label);
                            }
                          }
                        } else {
                          label = getLabelForValue(value);
                        }
                      }
                    } else {
                      label = getLabelForValue(value);
                    }
                    
                    return (
                      <Chip
                        key={value}
                        label={label}
                        onDelete={() => {
                          if (onTermRemove) {
                            onTermRemove(Number(value));
                          } else {
                            const newValue = selectedValues.filter(
                              (v) => v !== value,
                            );
                            fieldOnChange(newValue);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                      />
                    );
                  })}
                </Box>
              );
            } else {
              // Single select - use direct attribute term mapping first
              if (extractedAttributeId) {
                console.log(`Rendering single value for attr=${extractedAttributeId}, term=${selected}`);
                
                // Look directly in maps first
                if (typeof window !== 'undefined' && 
                    (window as any).directTermLabelMap && 
                    typeof (window as any).directTermLabelMap === 'object' &&
                    (window as any).directTermLabelMap[extractedAttributeId] && 
                    (window as any).directTermLabelMap[extractedAttributeId][selected]) {
                  return (window as any).directTermLabelMap[extractedAttributeId][selected];
                }
                
                if (attributeTermsMap[extractedAttributeId] && attributeTermsMap[extractedAttributeId][selected]) {
                  return attributeTermsMap[extractedAttributeId][selected];
                }
                
                // Try to find in current options
                const option = options.find(opt => String(opt.value) === String(selected));
                if (option) {
                  // Store for future use
                  if (!attributeTermsMap[extractedAttributeId]) {
                    attributeTermsMap[extractedAttributeId] = {};
                  }
                  attributeTermsMap[extractedAttributeId][selected] = option.label;
                  
                  // Also ensure in direct map
                  if (typeof window !== 'undefined' && 
                      (window as any).ensureTermLabel &&
                      typeof (window as any).ensureTermLabel === 'function') {
                    (window as any).ensureTermLabel(extractedAttributeId, selected, option.label);
                  }
                  
                  return option.label;
                }
              }
              
              // Fallback to regular lookup
              return getLabelForValue(selected);
            }
          } catch (error) {
            console.error("Error rendering select value:", error);
            return String(selected);
          }
        }, [isMulti, fieldOnChange, getLabelForValue, onTermRemove, extractedAttributeId, options, currentValue, name]);

        return (
          <FormControl
            // Use a stable ID + attributeId + render count to force re-renders when attribute changes
            key={`${componentId.current}-attr${extractedAttributeId || ''}-${renderCount}`}
            fullWidth
            error={!!error}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
                },
                '&:hover fieldset': {
                  borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
                },
                '&.Mui-focused fieldset': {
                  borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#2E9970', // Label color before focus
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#2E9970', // Label color on focus
              },
              '& .MuiFormLabel-asterisk': {
                color: 'red',
              },
              marginBottom: '20px'
            }}
          >
            <InputLabel>{label}</InputLabel>
            <Select
              inputRef={ref}
              multiple={isMulti}
              value={isMulti ? (value || []) : (value === null ? '' : value)}
              label={label}
              onOpen={onOpenHandler}
              onChange={(e: SelectChangeEvent<any>) => {
                // Log the actual change event
                console.log(`📥 SELECT CHANGE in ${name}:`, {
                  newValue: e.target.value,
                  attributeId,
                  currentValue
                });
                
                try {
                  // Cache labels for newly selected values
                  const newValue = e.target.value;
                  
                  if (isMulti) {
                    if (Array.isArray(newValue)) {
                      newValue.forEach(val => {
                        getLabelForValue(val);
                      });
                    }
                  } else {
                    getLabelForValue(newValue);
                  }
                  
                  // Handle the change event
                  if (onChange) {
                    onChange(e);
                  } else {
                    if (isMulti) {
                      const values = Array.isArray(e.target.value)
                        ? e.target.value
                        : [e.target.value];
                      fieldOnChange(values);
                    } else {
                      fieldOnChange(e.target.value);
                    }
                  }
                } catch (error) {
                  console.error("Error handling select change:", error);
                }
                
                // Force an update after selection
                setTimeout(() => {
                  setRenderCount(prev => prev + 1);
                }, 0);
              }}
              renderValue={renderValue}
            >
              {options.length === 0 ? (
                <MenuItem disabled>No options available</MenuItem>
              ) : (
                renderMenuItems()
              )}
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
