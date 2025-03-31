// // import { useEffect, useState, useMemo, useRef, useCallback } from "react";
// // import { Control, Controller } from "react-hook-form";
// // import {
// //   FormControl,
// //   InputLabel,
// //   MenuItem,
// //   Select,
// //   SelectChangeEvent,
// //   Chip,
// //   Box,
// //   Typography,
// // } from "@mui/material";

// // // A global cache to persist label mappings between component mounts
// // const globalLabelCache: Record<string, string> = {};

// // // Track attribute-term relationships
// // const attributeTermsMap: Record<string, Record<string, string>> = {};

// // // Expose the cache to window for access from other components
// // if (typeof window !== "undefined") {
// //   (window as any).globalLabelCache = globalLabelCache;
// //   (window as any).attributeTermsMap = attributeTermsMap;
// // }

// // export type FormSelectFieldProps = {
// //   name: string;
// //   control: Control<any>;
// //   label?: string;
// //   placeholder?: string;
// //   options: { value: string | number; label: string; attributeId?: number }[];
// //   required?: boolean;
// //   clearable?: boolean;
// //   disabled?: boolean;
// //   variant?: string;
// //   multiple?: boolean;
// //   fullWidth?: boolean;
// //   renderValue?: (selected: any) => React.ReactNode;
// //   onChange?: (event: SelectChangeEvent<unknown>) => void;
// //   onBlur?: () => void;
// //   style?: React.CSSProperties;
// //   error?: boolean;
// //   helperText?: string;
// //   fullHeight?: boolean;
// //   id?: string;
// //   endAdornment?: React.ReactNode;
// //   noneText?: string;
// //   creatable?: boolean;
// //   isCreateOptionLoading?: boolean;
// //   onCreateOption?: (inputValue: string) => void;
// //   defaultValue?: any;
// //   size?: "small" | "medium";
// //   selectAllText?: string;
// //   allowSelectAll?: boolean;
// //   attributeId?: number; // Add attributeId prop for better term lookups
// //   onTermRemove?: (termId: number) => void; // Add the missing prop
// // };

// // function FormSelectField(props: FormSelectFieldProps) {
// //   // Create a persistent mapping of value to label
// //   const [valueLabelMap, setValueLabelMap] = useState<Record<string, string>>(
// //     {}
// //   );

// //   // Generate a stable ID for this instance
// //   const componentId = useRef(
// //     `select-${props.name}-${Math.random().toString(36).substring(2, 9)}`
// //   );

// //   // Track render count to force re-renders when needed
// //   const [renderCount, setRenderCount] = useState(0);

// //   // Extract attribute ID from field name if not provided directly
// //   const extractedAttributeId = useMemo(() => {
// //     // First check if we have an explicit attributeId prop
// //     if (props.attributeId) return String(props.attributeId);

// //     // Try to extract from name - format: variants.X.attributes.Y.term_id
// //     const match = props.name.match(/variants\.\d+\.attributes\.(\d+)\.term_id/);
// //     if (match && match[1]) return match[1];

// //     // Try simpler format: attributes.Y.term_id
// //     const simpleMatch = props.name.match(/attributes\.(\d+)\.term_id/);
// //     if (simpleMatch && simpleMatch[1]) return simpleMatch[1];

// //     return null;
// //   }, [props.name, props.attributeId]);

// //   // Create a lookup map for quick access to option labels
// //   const optionMap = useMemo(() => {
// //     const map: Record<string, string> = {};
// //     props.options.forEach((option) => {
// //       const key = String(option.value);
// //       map[key] = option.label;

// //       // Also update the global cache
// //       globalLabelCache[key] = option.label;

// //       // If we have an attribute ID, store term in attribute-term map
// //       if (extractedAttributeId) {
// //         if (!attributeTermsMap[extractedAttributeId]) {
// //           attributeTermsMap[extractedAttributeId] = {};
// //         }
// //         attributeTermsMap[extractedAttributeId][key] = option.label;
// //       }
// //     });
// //     return map;
// //   }, [props.options, extractedAttributeId]);

// //   // Initialize labels on mount and when options change
// //   useEffect(() => {
// //     const newMap = { ...valueLabelMap };
// //     let hasChanges = false;

// //     // Add all current options to the map
// //     props.options.forEach((option) => {
// //       const key = String(option.value);
// //       if (!newMap[key] || newMap[key] !== option.label) {
// //         newMap[key] = option.label;
// //         hasChanges = true;
// //       }
// //     });

// //     // Also use labels from global cache
// //     Object.entries(globalLabelCache).forEach(([key, label]) => {
// //       if (!newMap[key]) {
// //         newMap[key] = label;
// //         hasChanges = true;
// //       }
// //     });

// //     // Check attribute-specific term map if available
// //     if (extractedAttributeId && attributeTermsMap[extractedAttributeId]) {
// //       Object.entries(attributeTermsMap[extractedAttributeId]).forEach(
// //         ([key, label]) => {
// //           if (!newMap[key] || newMap[key].startsWith("Term ")) {
// //             newMap[key] = label;
// //             hasChanges = true;
// //           }
// //         }
// //       );
// //     }

// //     if (hasChanges) {
// //       setValueLabelMap(newMap);
// //       // Force a re-render to ensure values display properly
// //       setRenderCount((prev) => prev + 1);
// //     }
// //   }, [props.options, extractedAttributeId]);

// //   // Force immediate update when dropdown is opened to ensure labels are correct
// //   const onOpenHandler = useCallback(() => {
// //     console.log(`Select for ${props.name} opened, forcing label update`);

// //     // Immediately update our label cache with any new options
// //     const newMap = { ...valueLabelMap };
// //     let hasChanges = false;

// //     // Add all current options to the map
// //     props.options.forEach((option) => {
// //       const key = String(option.value);
// //       if (!newMap[key] || newMap[key] !== option.label) {
// //         newMap[key] = option.label;
// //         hasChanges = true;
// //         // Also update global cache
// //         globalLabelCache[key] = option.label;
// //       }
// //     });

// //     if (hasChanges) {
// //       setValueLabelMap(newMap);
// //       // Force a re-render immediately
// //       setRenderCount((prev) => prev + 1);
// //     }
// //   }, [props.name, props.options, valueLabelMap]);

// //   // Function to safely get a label for a value
// //   const getLabelForValue = useCallback(
// //     (value: any): string => {
// //       if (value === null || value === undefined) return "";

// //       const stringValue = String(value);

// //       // Try in this order:
// //       // 1. Check attribute-specific term map first (most accurate)
// //       if (
// //         extractedAttributeId &&
// //         attributeTermsMap[extractedAttributeId] &&
// //         attributeTermsMap[extractedAttributeId][stringValue]
// //       ) {
// //         return attributeTermsMap[extractedAttributeId][stringValue];
// //       }

// //       // 2. Check our local map
// //       if (valueLabelMap[stringValue]) {
// //         return valueLabelMap[stringValue];
// //       }

// //       // 3. Check global cache using attributeId if available
// //       if (props.attributeId && globalLabelCache[`${props.attributeId}_${stringValue}`]) {
// //         // Update local cache for next time
// //         setTimeout(() => {
// //           setValueLabelMap((prev) => ({
// //             ...prev,
// //             [stringValue]: globalLabelCache[`${props.attributeId}_${stringValue}`],
// //           }));
// //         }, 0);
// //         return globalLabelCache[`${props.attributeId}_${stringValue}`];
// //       }

// //       // 4. Try current options (should always find if in dropdown)
// //       const option = props.options.find((opt) => String(opt.value) === stringValue);
// //       if (option) {
// //         // Update caches
// //         globalLabelCache[stringValue] = option.label;
        
// //         // Add to attribute-specific map if we have an attribute ID
// //         if (extractedAttributeId) {
// //           if (!attributeTermsMap[extractedAttributeId]) {
// //             attributeTermsMap[extractedAttributeId] = {};
// //           }
// //           attributeTermsMap[extractedAttributeId][stringValue] = option.label;
// //         }

// //         // Also store with attributeId if available
// //         if (props.attributeId) {
// //           globalLabelCache[`${props.attributeId}_${stringValue}`] = option.label;
// //         }

// //         setTimeout(() => {
// //           setValueLabelMap((prev) => ({
// //             ...prev,
// //             [stringValue]: option.label,
// //           }));
// //           // Force re-render to update display
// //           setRenderCount((prev) => prev + 1);
// //         }, 0);

// //         return option.label;
// //       }

// //       // Last resort fallback
// //       const placeholder = `Term ${stringValue}`;
// //       globalLabelCache[stringValue] = placeholder;
// //       setTimeout(() => {
// //         setValueLabelMap((prev) => ({ ...prev, [stringValue]: placeholder }));
// //       }, 0);

// //       return placeholder;
// //     },
// //     [props.options, valueLabelMap, extractedAttributeId, props.attributeId]
// //   );

// //   // Handle onChange to update lookupMap with newly selected values
// //   const handleChange = useCallback(
// //     (event: SelectChangeEvent<unknown>) => {
// //       const selectedValue = event.target.value;
      
// //       // Update cache for new selections
// //       if (Array.isArray(selectedValue)) {
// //         selectedValue.forEach((value) => {
// //           const option = props.options.find((opt) => String(opt.value) === String(value));
// //           if (option && !valueLabelMap[String(value)]) {
// //             valueLabelMap[String(value)] = option.label;
            
// //             // Also update global cache with attributeId if available
// //             if (extractedAttributeId) {
// //               globalLabelCache[`${extractedAttributeId}_${value}`] = option.label;
// //             }
// //             if (props.attributeId) {
// //               globalLabelCache[`${props.attributeId}_${value}`] = option.label;
// //             }
// //           }
// //         });
// //       } else {
// //         const option = props.options.find(
// //           (opt) => String(opt.value) === String(selectedValue)
// //         );
// //         if (option && !valueLabelMap[String(selectedValue)]) {
// //           valueLabelMap[String(selectedValue)] = option.label;
          
// //           // Also update global cache with attributeId if available
// //           if (extractedAttributeId) {
// //             globalLabelCache[`${extractedAttributeId}_${selectedValue}`] = option.label;
// //           }
// //           if (props.attributeId) {
// //             globalLabelCache[`${props.attributeId}_${selectedValue}`] = option.label;
// //           }
// //         }
// //       }
      
// //       if (props.onChange) {
// //         props.onChange(event);
// //       }
// //     },
// //     [props.options, valueLabelMap, extractedAttributeId, props.attributeId, props.onChange]
// //   );

// //   return (
// //     <Controller
// //       name={props.name}
// //       control={props.control}
// //       rules={{ required: props.required ? "This field is required" : false }}
// //       render={({
// //         field: { onChange: fieldOnChange, value, ref },
// //         fieldState: { error },
// //       }) => {
// //         // Initialize values when component first renders
// //         useEffect(() => {
// //           if (value !== undefined && value !== null) {
// //             if (props.multiple && Array.isArray(value)) {
// //               value.forEach((val) => {
// //                 getLabelForValue(val);
// //               });
// //             } else {
// //               getLabelForValue(value);
// //             }
// //           }
// //         }, [value, getLabelForValue]);

// //         // Log the current value and attribute ID for debugging
// //         useEffect(() => {
// //           console.log(`Field ${props.name} - current value:`, value);
// //           console.log(`- attributeId:`, extractedAttributeId);
// //           if (extractedAttributeId) {
// //             console.log(
// //               `- term cache:`,
// //               attributeTermsMap[extractedAttributeId] || {}
// //             );
// //           }
// //         }, [props.name, value, extractedAttributeId]);

// //         return (
// //           <FormControl
// //             // Use a stable ID + render count to force re-renders when needed
// //             key={`${componentId.current}-${renderCount}`}
// //             fullWidth
// //             error={!!error}
// //             sx={{
// //               "& .MuiOutlinedInput-root": {
// //                 "& fieldset": {
// //                   borderImage: "linear-gradient(to right, #2E9970, #005434) 1",
// //                 },
// //                 "&:hover fieldset": {
// //                   borderImage: "linear-gradient(to right, #247C5C, #003F29) 1",
// //                 },
// //                 "&.Mui-focused fieldset": {
// //                   borderImage: "linear-gradient(to right, #1E7A56, #004C30) 1",
// //                 },
// //               },
// //               "& .MuiInputLabel-root": {
// //                 color: "#2E9970", // Label color before focus
// //               },
// //               "& .MuiInputLabel-root.Mui-focused": {
// //                 color: "#2E9970", // Label color on focus
// //               },
// //               "& .MuiFormLabel-asterisk": {
// //                 color: "red",
// //               },
// //               marginBottom: "20px",
// //             }}
// //           >
// //             <InputLabel>{props.label}{props.required && <span style={{ color: 'red' }}>*</span>}</InputLabel>
// //             <Select
// //               inputRef={ref}
// //               multiple={props.multiple}
// //               value={props.multiple ? value || [] : value}
// //               label={props.label}
// //               onOpen={onOpenHandler}
// //               onChange={(e: SelectChangeEvent<any>) => {
// //                 // Cache labels for newly selected values
// //                 const newValue = e.target.value;

// //                 if (props.multiple) {
// //                   if (Array.isArray(newValue)) {
// //                     newValue.forEach((val) => {
// //                       getLabelForValue(val);
// //                     });
// //                   }
// //                 } else {
// //                   getLabelForValue(newValue);
// //                 }

// //                 // Handle the change event
// //                 if (props.onChange) {
// //                   props.onChange(e);
// //                 } else {
// //                   if (props.multiple) {
// //                     const values = Array.isArray(e.target.value)
// //                       ? e.target.value
// //                       : [e.target.value];
// //                     fieldOnChange(values);
// //                   } else {
// //                     fieldOnChange(e.target.value);
// //                   }
// //                 }

// //                 // Force an update after selection
// //                 setTimeout(() => {
// //                   setRenderCount((prev) => prev + 1);
// //                 }, 0);
// //               }}
// //               renderValue={(selected) => {
// //                 if (props.multiple) {
// //                   const selectedValues = Array.isArray(selected)
// //                     ? selected
// //                     : [selected];
// //                   return (
// //                     <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
// //                       {selectedValues.map((value) => {
// //                         const label = getLabelForValue(value);
// //                         return (
// //                           <Chip
// //                             key={value}
// //                             label={label}
// //                             onDelete={() => {
// //                               if (props.onTermRemove) {
// //                                 props.onTermRemove(Number(value));
// //                               } else {
// //                                 const newValue = selectedValues.filter(
// //                                   (v) => v !== value
// //                                 );
// //                                 fieldOnChange(newValue.length ? newValue : []);
// //                               }
// //                             }}
// //                             sx={{ m: "2px" }}
// //                           />
// //                         );
// //                       })}
// //                     </Box>
// //                   );
// //                 } else {
// //                   return getLabelForValue(selected);
// //                 }
// //               }}
// //             >
// //               {props.options.map((option) => (
// //                 <MenuItem key={option.value} value={option.value}>
// //                   {option.label}
// //                 </MenuItem>
// //               ))}
// //             </Select>
// //             {error && (
// //               <Typography variant="caption" color="error">
// //                 {error.message}
// //               </Typography>
// //             )}
// //           </FormControl>
// //         );
// //       }}
// //     />
// //   );
// // }

// // export default FormSelectField;


// import { useEffect, useState, useMemo, useRef, useCallback } from "react";
// import { Control, Controller } from "react-hook-form";
// import {
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   SelectChangeEvent,
//   Chip,
//   Box,
//   Typography,
//   FormHelperText,
// } from "@mui/material";

// // A global cache to persist label mappings between component mounts
// const globalLabelCache: Record<string, string> = {};

// // Track attribute-term relationships
// const attributeTermsMap: Record<string, Record<string, string>> = {};

// // Define types for our global window extensions
// interface CustomWindow extends Window {
//   getDirectTermLabel?: (attributeId: string | number, termId: string | number) => string | undefined;
//   attributeTermsMap?: Map<string | number, Map<string | number, string>>;
//   termApi?: {
//     getTermById?: (attributeId: string | number, termId: string | number) => string | undefined;
//   };
//   termLabelMap?: Map<string | number, string>;
//   ensureTermLabel?: (attributeId: string | number, termId: string | number, label: string) => void;
// }

// // Expose the cache to window for access from other components
// if (typeof window !== 'undefined') {
//   (window as any).globalLabelCache = globalLabelCache;
//   (window as any).attributeTermsMap = attributeTermsMap;
  
//   // Add a function to force refresh the page when coming from attributes tab
//   (window as any).refreshFromAttributes = () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const fromSource = urlParams.get('source') || urlParams.get('from');
    
//     if (fromSource === 'attributes') {
//       console.log('Refreshing page after attribute changes...');
//       // Remove params and do a clean refresh
//       const currentPath = window.location.pathname;
//       window.location.href = currentPath;
//       return true;
//     }
    
//     return false;
//   };
  
//   // Add a debugging helper function
//   (window as any).printAttributeTermsMap = () => {
//     console.log('Current attributeTermsMap:', JSON.parse(JSON.stringify(attributeTermsMap)));
//     return attributeTermsMap;
//   };
  
//   // Add a utility to clear and reset all term maps
//   (window as any).resetTermMaps = () => {
//     console.log('Resetting all term maps');
//     Object.keys(attributeTermsMap).forEach(key => {
//       delete attributeTermsMap[key];
//     });
//     return true;
//   };

//   // Clear all attribute term maps and start fresh
//   // Clear all maps on page load
//   window.addEventListener('load', () => {
//     console.log('Page loaded, clearing all attribute-term maps');
//     Object.keys(attributeTermsMap).forEach(key => {
//       delete attributeTermsMap[key];
//     });
//   });

//   // Add a new function to get a term label by attribute and term ID
//   (window as any).getTermLabel = (attributeId: string, termId: string | number) => {
//     if (!attributeId || !termId) return `Term ${termId}`;
    
//     const termIdStr = String(termId);
    
//     // Look up in attribute-term map
//     if (attributeTermsMap[attributeId] && attributeTermsMap[attributeId][termIdStr]) {
//       return attributeTermsMap[attributeId][termIdStr];
//     }
    
//     return `Term ${termId}`;
//   };
  
//   // Add a utility to manually set a term label
//   (window as any).setTermLabel = (attributeId: string, termId: string | number, label: string) => {
//     if (!attributeId || !termId || !label) return false;
    
//     const termIdStr = String(termId);
    
//     if (!attributeTermsMap[attributeId]) {
//       attributeTermsMap[attributeId] = {};
//     }
    
//     attributeTermsMap[attributeId][termIdStr] = label;
//     console.log(`Manually set term label: attr=${attributeId}, term=${termId}, label=${label}`);
//     return true;
//   };

//   // Create a more direct way to ensure labels are always displayed correctly
//   // This will override everything else for term display
//   (window as any).directTermLabelMap = {
//     // Map of attribute ID to terms
//     // Format: attributeId: { termId: termLabel }
//   };

//   // Add a function to ensure a term label is set
//   (window as any).ensureTermLabel = (attributeId: string | number, termId: string | number, label: string) => {
//     const attrId = String(attributeId);
//     const termIdStr = String(termId);
    
//     // Initialize maps if needed
//     if (!(window as any).directTermLabelMap[attrId]) {
//       (window as any).directTermLabelMap[attrId] = {};
//     }
    
//     // Set the term label
//     (window as any).directTermLabelMap[attrId][termIdStr] = label;
    
//     // Also set in our regular maps
//     if (!attributeTermsMap[attrId]) {
//       attributeTermsMap[attrId] = {};
//     }
//     attributeTermsMap[attrId][termIdStr] = label;
    
//     return true;
//   };
  
//   // Add a function to get a term label with highest priority
//   (window as any).getDirectTermLabel = (attributeId: string | number, termId: string | number) => {
//     const attrId = String(attributeId);
//     const termIdStr = String(termId);
    
//     // Check direct map first
//     if ((window as any).directTermLabelMap[attrId] && 
//         (window as any).directTermLabelMap[attrId][termIdStr]) {
//       return (window as any).directTermLabelMap[attrId][termIdStr];
//     }
    
//     // Fall back to regular map
//     if (attributeTermsMap[attrId] && attributeTermsMap[attrId][termIdStr]) {
//       return attributeTermsMap[attrId][termIdStr];
//     }
    
//     // Default
//     return `Term ${termId}`;
//   };
// }

// // Function to initialize attribute-term map for a specific attribute
// function initializeAttributeTermMap(attributeId: string, options: { value: string | number; label: string }[]) {
//   if (!attributeId) return;
  
//   // Initialize the attribute mapping if needed
//   if (!attributeTermsMap[attributeId]) {
//     attributeTermsMap[attributeId] = {};
//   }
  
//   // Populate with current options
//   options.forEach(option => {
//     const key = String(option.value);
//     attributeTermsMap[attributeId][key] = option.label;
//   });
  
//   console.log(`Initialized attributeTermsMap for attribute ${attributeId}:`, 
//     attributeTermsMap[attributeId]);
// }

// interface FormSelectFieldProps {
//   name: string;
//   control: Control<any>;
//   label: string;
//   options: { value: string | number; label: string; attributeId?: number }[];
//   required?: boolean;
//   isMulti?: boolean;
//   onChange?: (event: SelectChangeEvent<any>) => void;
//   onTermRemove?: (termId: number) => void;
//   attributeId?: number;
//   currentValue?: { value: string | number; label: string }; // Add currentValue prop
// }

// function FormSelectField({
//   name,
//   control,
//   label,
//   options,
//   required,
//   isMulti,
//   onChange,
//   onTermRemove,
//   attributeId,
//   currentValue,
// }: FormSelectFieldProps) {
//   // Create a persistent mapping of value to label
//   const [valueLabelMap, setValueLabelMap] = useState<Record<string, string>>({});
  
//   // Generate a stable ID for this instance
//   const componentId = useRef(`select-${name}-${Math.random().toString(36).substring(2, 9)}`);
  
//   // Track render count to force re-renders when needed
//   const [renderCount, setRenderCount] = useState(0);
  
//   // Track if this is the first mount of the component
//   const isFirstMount = useRef(true);
  
//   // CRITICAL FIX: Always pre-check term maps at render time
//   useEffect(() => {
//     if (typeof window !== 'undefined' && attributeId) {
//       const attrId = String(attributeId);
//       // Force immediate refresh of term maps
//       console.log(`🔥 Critical precheck for attributeId=${attrId} (${label}) at render time`);
      
//       // Log the current maps
//       const directMap = (window as any).directTermLabelMap?.[attrId] || {};
//       const attrMap = (window as any).attributeTermsMap?.[attrId] || {};
      
//       console.log(`${label} - Direct map:`, directMap);
//       console.log(`${label} - Attribute map:`, attrMap);
      
//       // Trigger re-render to ensure labels display properly
//       setRenderCount(c => c + 1);
//     }
//   }, [attributeId, label]);
  
//   // Check if we need to refresh the page (only on first mount)
//   useEffect(() => {
//     if (isFirstMount.current && typeof window !== 'undefined') {
//       isFirstMount.current = false;
      
//       // Check if we should refresh the page from attributes tab
//       const refreshFunction = (window as any).refreshFromAttributes;
//       if (typeof refreshFunction === 'function') {
//         refreshFunction();
//       }
//     }
//   }, []);
  
//   // Extract attribute ID from field name if not provided directly
//   const extractedAttributeId = useMemo(() => {
//     // First check if we have an explicit attributeId prop
//     if (attributeId) return String(attributeId);
    
//     // Try to extract from name - format: variants.X.attributes.Y.term_id
//     const match = name.match(/variants\.\d+\.attributes\.(\d+)\.term_id/);
//     if (match && match[1]) return match[1];
    
//     // Try simpler format: attributes.Y.term_id
//     const simpleMatch = name.match(/attributes\.(\d+)\.term_id/);
//     if (simpleMatch && simpleMatch[1]) return simpleMatch[1];
    
//     return null;
//   }, [name, attributeId]);
  
//   // Create a lookup map for quick access to option labels
//   const optionMap = useMemo(() => {
//     const map: Record<string, string> = {};
//     options.forEach(option => {
//       const key = String(option.value);
//       map[key] = option.label;
      
//       // Also update the global cache
//       globalLabelCache[key] = option.label;
      
//       // If we have an attribute ID, store term in attribute-term map
//       if (extractedAttributeId) {
//         if (!attributeTermsMap[extractedAttributeId]) {
//           attributeTermsMap[extractedAttributeId] = {};
//         }
//         attributeTermsMap[extractedAttributeId][key] = option.label;
//         console.log(`Cached term for attribute ${extractedAttributeId}: ${key} -> ${option.label}`);
//       }
//     });
//     return map;
//   }, [options, extractedAttributeId]);
  
//   // Initialize labels on mount and when options change
//   useEffect(() => {
//     const newMap = {...valueLabelMap};
//     let hasChanges = false;
    
//     // Add all current options to the map
//     options.forEach(option => {
//       const key = String(option.value);
//       if (!newMap[key] || newMap[key] !== option.label) {
//         newMap[key] = option.label;
//         hasChanges = true;
//       }
//     });
    
//     // Also use labels from global cache
//     Object.entries(globalLabelCache).forEach(([key, label]) => {
//       if (!newMap[key]) {
//         newMap[key] = label;
//         hasChanges = true;
//       }
//     });
    
//     // Check attribute-specific term map if available
//     if (extractedAttributeId && attributeTermsMap[extractedAttributeId]) {
//       Object.entries(attributeTermsMap[extractedAttributeId]).forEach(([key, label]) => {
//         if (!newMap[key] || newMap[key].startsWith('Term ')) {
//           newMap[key] = label;
//           hasChanges = true;
//         }
//       });
//     }
    
//     if (hasChanges) {
//       setValueLabelMap(newMap);
//       // Force a re-render to ensure values display properly
//       setRenderCount(prev => prev + 1);
//     }
//   }, [options, extractedAttributeId]);
  
//   // Force immediate update when dropdown is opened to ensure labels are correct
//   const onOpenHandler = useCallback(() => {
//     console.log(`Select for ${name} opened, forcing label update`);
    
//     // Immediately update our label cache with any new options
//     const newMap = {...valueLabelMap};
//     let hasChanges = false;
    
//     // Add all current options to the map
//     options.forEach(option => {
//       const key = String(option.value);
//       if (!newMap[key] || newMap[key] !== option.label) {
//         newMap[key] = option.label;
//         hasChanges = true;
//         // Also update global cache
//         globalLabelCache[key] = option.label;
//       }
//     });
    
//     if (hasChanges) {
//       setValueLabelMap(newMap);
//       // Force a re-render immediately
//       setRenderCount(prev => prev + 1);
//     }
//   }, [name, options, valueLabelMap]);

//   // Enhance the getLabelForValue function to better handle term lookups
//   const getLabelForValue = useCallback(
//     (value: any) => {
//       if (value === null || value === undefined || value === '') {
//         return '';
//       }

//       try {
//         const customWindow = window as CustomWindow;

//         // DIRECT API LOOKUP - This should be the most accurate source of truth
//         // If we have an extractedAttributeId and the direct lookup function exists, use it
//         if (extractedAttributeId && customWindow.getDirectTermLabel) {
//           const directLabel = customWindow.getDirectTermLabel(extractedAttributeId, value);
//           if (directLabel && !directLabel.startsWith('Term ')) {
//             console.log(`✅ DIRECT TERM LOOKUP SUCCESS for attr=${extractedAttributeId}, value=${value}: "${directLabel}"`);
//             return directLabel;
//           }
//           console.log(`⚠️ DIRECT TERM LOOKUP FAILED for attr=${extractedAttributeId}, value=${value}, falling back...`);
//         }

//         // Now try to look up the label with attribute-specific term mappings
//         if (extractedAttributeId && customWindow.attributeTermsMap?.has(extractedAttributeId)) {
//           const attrTerms = customWindow.attributeTermsMap.get(extractedAttributeId);
//           if (attrTerms?.has(value)) {
//             const termLabel = attrTerms.get(value);
//             console.log(`✅ ATTRIBUTE-SPECIFIC MAP HIT for attr=${extractedAttributeId}, value=${value}: "${termLabel}"`);
//             // Update the cache for next time
//             if (options) {
//               const foundOption = options.find(
//                 (option) => option.value === value
//               );
//               if (foundOption && (!foundOption.label || foundOption.label.startsWith('Term '))) {
//                 foundOption.label = termLabel;
//                 console.log(`Updated option label in component for value ${value} to "${termLabel}"`);
//               }
//             }
//             return termLabel;
//           }
//         }

//         // Next check if the options array has this value and its label
//         if (options) {
//           const foundOption = options.find(
//             (option) => option.value === value
//           );
//           if (foundOption?.label) {
//             // If we have a proper label (not starting with 'Term '), use it
//             if (!foundOption.label.startsWith('Term ')) {
//               return foundOption.label;
//             }
            
//             // Try to find a better label from API or cache
//             console.log(`⚠️ Found placeholder label "${foundOption.label}" for value ${value}, trying to find better label...`);
            
//             // If we have an attributeId, look through all terms for this attribute in the API data
//             if (customWindow.termApi?.getTermById && extractedAttributeId) {
//               const betterLabel = customWindow.termApi.getTermById(extractedAttributeId, value);
//               if (betterLabel && !betterLabel.startsWith('Term ')) {
//                 console.log(`✅ API LOOKUP SUCCESS for attr=${extractedAttributeId}, value=${value}: "${betterLabel}"`);
                
//                 // Update the option label for future reference
//                 foundOption.label = betterLabel;
                
//                 // Update the attribute-specific map if it exists
//                 if (customWindow.attributeTermsMap && extractedAttributeId) {
//                   if (!customWindow.attributeTermsMap.has(extractedAttributeId)) {
//                     customWindow.attributeTermsMap.set(extractedAttributeId, new Map());
//                   }
//                   customWindow.attributeTermsMap.get(extractedAttributeId)?.set(value, betterLabel);
//                   console.log(`Updated attributeTermsMap for attr=${extractedAttributeId}, value=${value}`);
//                 }
                
//                 return betterLabel;
//               }
//             }
//           }
//         }

//         // Finally try the global mapping if it exists
//         if (customWindow.termLabelMap?.has(value)) {
//           return customWindow.termLabelMap.get(value) || String(value);
//         }

//         // If all else fails, just return the value as a string
//         return String(value);
//       } catch (error) {
//         console.error('Error in getLabelForValue:', error);
//         return String(value);
//       }
//     },
//     [options, extractedAttributeId]
//   );

//   // Initialize attribute-specific term map when component mounts
//   useEffect(() => {
//     if (extractedAttributeId) {
//       // Always clear the previous mapping for this attribute to prevent cross-contamination
//       attributeTermsMap[extractedAttributeId] = {};
      
//       // Use the centralized function to initialize the attribute-term map
//       console.log(`Initializing attribute ${extractedAttributeId} with options:`, options);
      
//       // Populate with current options
//       options.forEach(option => {
//         const key = String(option.value);
        
//         // Create the attribute map if needed
//         if (!attributeTermsMap[extractedAttributeId]) {
//           attributeTermsMap[extractedAttributeId] = {};
//         }
        
//         // Set the label explicitly
//         attributeTermsMap[extractedAttributeId][key] = option.label;
//         console.log(`Set term for attribute ${extractedAttributeId}: ${key} = ${option.label}`);
//       });
      
//       console.log(`Completed mapping for attribute ${extractedAttributeId}:`, attributeTermsMap[extractedAttributeId]);
      
//       // Force a re-render with the new mapping
//       setRenderCount(prev => prev + 1);
//     }
//   }, [extractedAttributeId, options]);

//   // Force initialization when input changes
//   useEffect(() => {
//     if (extractedAttributeId && options.length > 0) {
//       // Re-initialize the map when options change
//       initializeAttributeTermMap(extractedAttributeId, options);
//     }
//   }, [options, extractedAttributeId]);

//   // Force initialization when component mounts
//   useEffect(() => {
//     // First-time initialization
//     if (isFirstMount.current && extractedAttributeId) {
//       isFirstMount.current = false;
//       initializeAttributeTermMap(extractedAttributeId, options);
//       console.log(`First-time initialization of attribute ${extractedAttributeId} complete`);
//     }
//   }, []);

//   // Immediately update when the component renders with a new value
//   useEffect(() => {
//     setRenderCount(prev => prev + 1);
//   }, [options, extractedAttributeId]);

//   // Create a special version of renderValue that prioritizes the current options
//   const renderMenuItems = useCallback(() => {
//     return options.map((option) => {
//       // For debugging, add attribute info
//       let optionLabel = option.label || `Term ${option.value}`;
      
//       // Try direct term lookup first if we have an attribute ID
//       if (extractedAttributeId && typeof window !== 'undefined' && (window as any).getDirectTermLabel) {
//         const directLabel = (window as any).getDirectTermLabel(extractedAttributeId, option.value);
//         if (directLabel && !directLabel.startsWith('Term ')) {
//           optionLabel = directLabel;
//         }
//       }
      
//       const debugInfo = extractedAttributeId 
//         ? `[attr=${extractedAttributeId}, term=${option.value}]` 
//         : '';
      
//       // Also ensure the term label is properly set
//       if (extractedAttributeId && typeof window !== 'undefined' && (window as any).ensureTermLabel) {
//         (window as any).ensureTermLabel(extractedAttributeId, option.value, optionLabel);
//       }
      
//       return (
//         <MenuItem 
//           key={option.value} 
//           value={option.value}
//           title={`${optionLabel} ${debugInfo}`}
//         >
//           {optionLabel}
//         </MenuItem>
//       );
//     });
//   }, [options, extractedAttributeId]);

//   // THIS IS CRITICAL: Log all inputs affecting the display at render time
//   console.log(`🧐 RENDERING SELECT for ${name} with:`, {
//     attributeId,
//     extractedAttributeId: extractedAttributeId || 'none',
//     currentValue: currentValue || 'none',
//     options
//   });

//   return (
//     <Controller
//       key={`controller-${componentId.current}-attr${extractedAttributeId || ''}-${renderCount}-${options.length}`}
//       name={name}
//       control={control}
//       rules={{ required: required ? "This field is required" : false }}
//       render={({
//         field: { onChange: fieldOnChange, value, ref },
//         fieldState: { error },
//       }) => {
//         // Initialize values when component first renders
//         useEffect(() => {
//           if (value !== undefined && value !== null) {
//             try {
//               if (isMulti && Array.isArray(value)) {
//                 value.forEach(val => {
//                   getLabelForValue(val);
//                 });
//               } else {
//                 getLabelForValue(value);
//               }
//             } catch (err) {
//               console.error("Error initializing value labels:", err);
//             }
//           }
//         }, [value]);
        
//         // Log the current value and attribute ID for debugging
//         useEffect(() => {
//           console.log(`Field ${name} - current value:`, value);
//           console.log(`- attributeId:`, extractedAttributeId);
//           if (extractedAttributeId) {
//             console.log(`- term cache:`, attributeTermsMap[extractedAttributeId] || {});
//           }
//         }, [name, value, extractedAttributeId]);
        
//         // Take direct control of the renderValue function with currentValue
//         const renderValue = useCallback((selected: any) => {
//           try {
//             // ALWAYS prioritize currentValue if it's provided - this is critical
//             if (!isMulti && currentValue && selected !== null && String(selected) === String(currentValue.value)) {
//               console.log(`🎯 Using direct currentValue for field ${name}: "${currentValue.label}"`);
//               return currentValue.label;
//             }
            
//             if (selected === null || selected === undefined) {
//               return '';
//             }
            
//             if (isMulti) {
//               const selectedValues = Array.isArray(selected) ? selected : [];
//               return (
//                 <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
//                   {selectedValues.map((value: any) => {
//                     // Always try direct lookup first with attribute ID
//                     let label = "";
//                     if (extractedAttributeId) {
//                       console.log(`Using direct lookup for attr=${extractedAttributeId}, term=${value}`);
//                       if (typeof window !== 'undefined' && (window as any).directTermLabelMap && 
//                           (window as any).directTermLabelMap[extractedAttributeId] && 
//                           (window as any).directTermLabelMap[extractedAttributeId][value]) {
//                         label = (window as any).directTermLabelMap[extractedAttributeId][value];
//                       } else if (attributeTermsMap[extractedAttributeId] && attributeTermsMap[extractedAttributeId][value]) {
//                         label = attributeTermsMap[extractedAttributeId][value];
//                       } else {
//                         // Look through options
//                         const option = options.find(opt => String(opt.value) === String(value));
//                         if (option) {
//                           label = option.label;
//                           // Store for future use
//                           if (extractedAttributeId) {
//                             if (!attributeTermsMap[extractedAttributeId]) {
//                               attributeTermsMap[extractedAttributeId] = {};
//                             }
//                             attributeTermsMap[extractedAttributeId][value] = option.label;
                            
//                             // Also ensure in direct map
//                             if (typeof window !== 'undefined' && (window as any).ensureTermLabel) {
//                               (window as any).ensureTermLabel(extractedAttributeId, value, option.label);
//                             }
//                           }
//                         } else {
//                           label = getLabelForValue(value);
//                         }
//                       }
//                     } else {
//                       label = getLabelForValue(value);
//                     }
                    
//                     return (
//                       <Chip
//                         key={value}
//                         label={label}
//                         onDelete={() => {
//                           if (onTermRemove) {
//                             onTermRemove(Number(value));
//                           } else {
//                             const newValue = selectedValues.filter(
//                               (v) => v !== value,
//                             );
//                             fieldOnChange(newValue);
//                           }
//                         }}
//                         onClick={(e) => {
//                           e.stopPropagation();
//                         }}
//                         onMouseDown={(e) => {
//                           e.stopPropagation();
//                         }}
//                       />
//                     );
//                   })}
//                 </Box>
//               );
//             } else {
//               // Single select - use direct attribute term mapping first
//               if (extractedAttributeId) {
//                 console.log(`Rendering single value for attr=${extractedAttributeId}, term=${selected}`);
                
//                 // Look directly in maps first
//                 if (typeof window !== 'undefined' && (window as any).directTermLabelMap && 
//                     (window as any).directTermLabelMap[extractedAttributeId] && 
//                     (window as any).directTermLabelMap[extractedAttributeId][selected]) {
//                   return (window as any).directTermLabelMap[extractedAttributeId][selected];
//                 }
                
//                 if (attributeTermsMap[extractedAttributeId] && attributeTermsMap[extractedAttributeId][selected]) {
//                   return attributeTermsMap[extractedAttributeId][selected];
//                 }
                
//                 // Try to find in current options
//                 const option = options.find(opt => String(opt.value) === String(selected));
//                 if (option) {
//                   // Store for future use
//                   if (!attributeTermsMap[extractedAttributeId]) {
//                     attributeTermsMap[extractedAttributeId] = {};
//                   }
//                   attributeTermsMap[extractedAttributeId][selected] = option.label;
                  
//                   // Also ensure in direct map
//                   if (typeof window !== 'undefined' && (window as any).ensureTermLabel) {
//                     (window as any).ensureTermLabel(extractedAttributeId, selected, option.label);
//                   }
                  
//                   return option.label;
//                 }
//               }
              
//               // Fallback to regular lookup
//               return getLabelForValue(selected);
//             }
//           } catch (error) {
//             console.error("Error rendering select value:", error);
//             return String(selected);
//           }
//         }, [isMulti, fieldOnChange, getLabelForValue, onTermRemove, extractedAttributeId, options, currentValue, name]);

//         return (
//           <FormControl
//             // Use a stable ID + attributeId + render count to force re-renders when attribute changes
//             key={`${componentId.current}-attr${extractedAttributeId || ''}-${renderCount}`}
//             fullWidth
//             error={!!error}
//             sx={{
//               '& .MuiOutlinedInput-root': {
//                 '& fieldset': {
//                   borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
//                 },
//                 '&:hover fieldset': {
//                   borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
//                 },
//                 '&.Mui-focused fieldset': {
//                   borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
//                 },
//               },
//               '& .MuiInputLabel-root': {
//                 color: '#2E9970', // Label color before focus
//               },
//               '& .MuiInputLabel-root.Mui-focused': {
//                 color: '#2E9970', // Label color on focus
//               },
//               '& .MuiFormLabel-asterisk': {
//                 color: 'red',
//               },
//               marginBottom: '20px'
//             }}
//           >
//             <InputLabel>{label}</InputLabel>
//             <Select
//               inputRef={ref}
//               multiple={isMulti}
//               value={isMulti ? (value || []) : (value === null ? '' : value)}
//               label={label}
//               onOpen={onOpenHandler}
//               onChange={(e: SelectChangeEvent<any>) => {
//                 // Log the actual change event
//                 console.log(`📥 SELECT CHANGE in ${name}:`, {
//                   newValue: e.target.value,
//                   attributeId,
//                   currentValue
//                 });
                
//                 try {
//                   // Cache labels for newly selected values
//                   const newValue = e.target.value;
                  
//                   if (isMulti) {
//                     if (Array.isArray(newValue)) {
//                       newValue.forEach(val => {
//                         getLabelForValue(val);
//                       });
//                     }
//                   } else {
//                     getLabelForValue(newValue);
//                   }
                  
//                   // Handle the change event
//                   if (onChange) {
//                     onChange(e);
//                   } else {
//                     if (isMulti) {
//                       const values = Array.isArray(e.target.value)
//                         ? e.target.value
//                         : [e.target.value];
//                       fieldOnChange(values);
//                     } else {
//                       fieldOnChange(e.target.value);
//                     }
//                   }
//                 } catch (error) {
//                   console.error("Error handling select change:", error);
//                 }
                
//                 // Force an update after selection
//                 setTimeout(() => {
//                   setRenderCount(prev => prev + 1);
//                 }, 0);
//               }}
//               renderValue={renderValue}
//             >
//               {options.length === 0 ? (
//                 <MenuItem disabled>No options available</MenuItem>
//               ) : (
//                 renderMenuItems()
//               )}
//             </Select>
//             {error && (
//               <FormHelperText>{error.message}</FormHelperText>
//             )}
//           </FormControl>
//         );
//       }}
//     />
//   );
// }

// export default FormSelectField;



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

interface FormSelectFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  options: { value: string | number; label: string; attributeId?: number }[];
  required?: boolean;
  isMulti?: boolean;
  onChange?: (event: SelectChangeEvent<any>) => void;
  onTermRemove?: (termId: number) => void;
  attributeId?: number; // Add attributeId prop
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
}: FormSelectFieldProps) {
  // Create a persistent mapping of value to label
  const [valueLabelMap, setValueLabelMap] = useState<Record<string, string>>({});
  
  // Generate a stable ID for this instance
  const componentId = useRef(`select-${name}-${Math.random().toString(36).substring(2, 9)}`);
  
  // Track render count to force re-renders when needed
  const [renderCount, setRenderCount] = useState(0);
  
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

  // Function to safely get a label for a value
  const getLabelForValue = useCallback((value: any): string => {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // Try in this order:
    // 1. Check attribute-specific term map first (most accurate)
    if (extractedAttributeId && 
        attributeTermsMap[extractedAttributeId] && 
        attributeTermsMap[extractedAttributeId][stringValue]) {
      return attributeTermsMap[extractedAttributeId][stringValue];
    }
    
    // 2. Check our local map
    if (valueLabelMap[stringValue]) {
      return valueLabelMap[stringValue];
    }
    
    // 3. Check global cache
    if (globalLabelCache[stringValue]) {
      // Update local cache for next time
      setTimeout(() => {
        setValueLabelMap(prev => ({...prev, [stringValue]: globalLabelCache[stringValue]}));
      }, 0);
      return globalLabelCache[stringValue];
    }
    
    // 4. Try current options (should always find if in dropdown)
    const option = options.find(opt => String(opt.value) === stringValue);
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
      
      setTimeout(() => {
        setValueLabelMap(prev => ({...prev, [stringValue]: option.label}));
        // Force re-render to update display
        setRenderCount(prev => prev + 1);
      }, 0);
      
      return option.label;
    }
    
    // Last resort fallback
    const placeholder = `Term ${stringValue}`;
    globalLabelCache[stringValue] = placeholder;
    setTimeout(() => {
      setValueLabelMap(prev => ({...prev, [stringValue]: placeholder}));
    }, 0);
    
    return placeholder;
  }, [options, valueLabelMap, extractedAttributeId]);

  return (
    <Controller
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
            if (isMulti && Array.isArray(value)) {
              value.forEach(val => {
                getLabelForValue(val);
              });
            } else {
              getLabelForValue(value);
            }
          }
        }, [value, getLabelForValue]);
        
        // Log the current value and attribute ID for debugging
        useEffect(() => {
          console.log(`Field ${name} - current value:`, value);
          console.log(`- attributeId:`, extractedAttributeId);
          if (extractedAttributeId) {
            console.log(`- term cache:`, attributeTermsMap[extractedAttributeId] || {});
          }
        }, [name, value, extractedAttributeId]);
        
        return (
          <FormControl
            // Use a stable ID + render count to force re-renders when needed
            key={`${componentId.current}-${renderCount}`}
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
              value={isMulti ? value || [] : value}
              label={label}
              onOpen={onOpenHandler}
              onChange={(e: SelectChangeEvent<any>) => {
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
                
                // Force an update after selection
                setTimeout(() => {
                  setRenderCount(prev => prev + 1);
                }, 0);
              }}
              renderValue={(selected) => {
                if (isMulti) {
                  const selectedValues = Array.isArray(selected) ? selected : [];
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selectedValues.map((value: any) => {
                        const label = getLabelForValue(value);
                        return (
                          <Chip
                            key={value}
                            label={label}
                            onDelete={() => {
                              if (onTermRemove) {
                                onTermRemove(value);
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
                  return getLabelForValue(selected);
                }
              }}
            >
              {options.map((option) => (
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
