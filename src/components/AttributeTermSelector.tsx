import React, { useEffect, useRef } from 'react';
import { Control } from 'react-hook-form';
import { SelectChangeEvent } from '@mui/material';
import FormSelectField from '@/components/Shared/SelectField';

interface AttributeTermSelectorProps {
  instanceId: string;
  name: string;
  control: Control<any>;
  attributeId: number;
  termId?: number;
  options: Array<{
    value: string | number;
    label: string;
    attributeId?: number;
  }>;
  attributeName: string;
  getTermName: (attributeId: number, termId: number) => string;
  index: number;
  attrIndex: number;
  handleTermChange: (event: SelectChangeEvent<unknown>, index: number, attrIndex: number) => void;
}

const AttributeTermSelector = ({
  instanceId,
  name,
  control,
  attributeId,
  termId,
  options,
  attributeName,
  getTermName,
  index,
  attrIndex,
  handleTermChange
}: AttributeTermSelectorProps) => {
  // Create a ref to track component mount status
  const isMounted = useRef(false);
  
  // Get the actual term label for this term
  const termName = termId ? getTermName(attributeId, termId) : '';
  
  // Create a current value object for the selected term
  const currentValue = termId ? {
    value: termId,
    label: termName || `Term ${termId}`
  } : undefined;
  
  // After mount, update the display as needed
  useEffect(() => {
    isMounted.current = true;
    
    // Handle term display update
    const updateTermDisplay = () => {
      try {
        if (!termId) return;
        
        // Find the DOM elements
        const selectContainer = document.getElementById(instanceId);
        if (!selectContainer) return;
        
        // Find the display element
        const displayElements = selectContainer.querySelectorAll('[role="button"]');
        
        displayElements.forEach(el => {
          // Update attribute label if needed
          const labelEl = selectContainer.querySelector('label');
          if (labelEl && labelEl.textContent !== attributeName) {
            labelEl.textContent = attributeName;
          }
          
          // Get and update the term name if needed
          const termName = getTermName(attributeId, termId);
          if (termName && el.textContent !== termName) {
            el.textContent = termName;
          }
        });

        // Update any dropdowns showing the wrong value
        const dropdowns = selectContainer.querySelectorAll('.MuiSelect-select');
        dropdowns.forEach(dropdown => {
          const currentText = dropdown.textContent;
          // If the current text looks like a number (which would be the ID), replace it
          if (currentText && /^\d+$/.test(currentText.trim())) {
            dropdown.textContent = termName || `Term ${termId}`;
          }
        });
      } catch (e) {
        console.error('Error updating select display:', e);
      }
    };
    
    // Run the update immediately
    updateTermDisplay();
    
    // And also after a short delay to ensure elements are rendered
    const timerId = setTimeout(updateTermDisplay, 100);
    
    // Ensure we update after React has finished rendering
    requestAnimationFrame(() => {
      if (isMounted.current) {
        updateTermDisplay();
      }
    });
    
    return () => {
      isMounted.current = false;
      clearTimeout(timerId);
    };
  }, [instanceId, attributeId, termId, attributeName, getTermName]);
  
  return (
    <div id={instanceId}>
      <FormSelectField
        name={name}
        control={control}
        label={attributeName}
        options={options}
        required
        attributeId={attributeId}
        onChange={(event: SelectChangeEvent<unknown>) => 
          handleTermChange(event, index, attrIndex)
        }
        currentValue={currentValue}
      />
    </div>
  );
};

export default AttributeTermSelector; 