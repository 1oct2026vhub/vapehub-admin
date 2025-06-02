import React from 'react';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// Assuming these types might be moved to a shared location later
// For now, let's define a simplified version for the card's needs
interface VariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface VariantAttributeDisplay {
  id: number | string;
  attribute_name: string; // Combined from attribute.name
  term_name: string;      // Combined from term.name
}

interface VariantForCard {
  id: number;
  slug: string; // Used for alt text
  price: string | number;
  stock: number;
  status: string; // 'active' or 'inactive'
  variantImages?: VariantImage[];
  variantAttributes: VariantAttributeDisplay[];
}

interface VariantDisplayCardProps {
  variant: VariantForCard;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (variantId: number) => void;
  isActionDisabled?: boolean;
}

const VariantDisplayCard: React.FC<VariantDisplayCardProps> = ({
  variant,
  isSelected,
  onClick,
  onDelete,
  isActionDisabled,
}) => {
  // Add this log to inspect received variant data

  const primaryImage = variant.variantImages?.find(img => img.is_primary)?.image_url || 
                       (variant.variantImages && variant.variantImages.length > 0 ? variant.variantImages[0].image_url : null);

  return (
    <div
      key={variant.id}
      className={`border border-gray-200 overflow-hidden cursor-pointer bg-white mb-2 rounded-xl ${
        isSelected ? 'border-l-4 border-l-green-600' : 'border-l-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex p-3">
        <div className="w-16 mr-3">
          <div className="h-16 w-16 flex items-center justify-center">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={variant.slug || `Variant ${variant.id}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-gray-400 text-xs flex items-center justify-center h-full">No image</div>
            )}
          </div>
        </div>
        <div className="flex-1 pl-4">
          <div className="mb-2">
            <p className="text-sm font-semibold text-gray-700">ID: {variant.id}</p>
          </div>

          {/* Attributes section - Ensuring this is correctly placed and styled */}
          {variant.variantAttributes && variant.variantAttributes.length > 0 && (
            <div className="mb-3"> {/* Increased bottom margin for better separation */}
              {variant.variantAttributes.map((attr) => (
                <div key={attr.id} className="text-sm mb-2"> {/* Increased bottom margin for each attribute group */}
                  <div>
                    <span className="text-green-700 font-semibold">{attr.attribute_name}:</span>
                  </div>
                  <div className="bg-gray-100 border border-gray-300 rounded px-2 py-1 mt-1 text-gray-800 shadow-sm"> {/* Adjusted styling for the value box */}
                    {attr.term_name}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center pt-3 justify-between">
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center space-x-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1 cursor-default">
                <span className="text-[#14854E] text-sm font-medium">Stock:</span>
                <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold">
                  {variant.stock}
                </div>
              </div>
              <div className="flex items-center gap-1 border border-[#005B2F] rounded-md bg-green-50 px-2.5 py-1 cursor-default">
                <span className="text-[#14854E] text-sm font-medium">Price:</span>
                <div className="bg-[#14854E] px-1.5 py-0.5 rounded-sm text-white text-sm font-semibold">
                  ${Number(variant.price).toFixed(2)}
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-md text-sm font-medium cursor-default ${
              variant.status === 'active' 
                ? 'bg-white border border-[#005B2F] text-[#14854E]' 
                : 'bg-white border border-red-500 text-red-500'
            }`}>
              {variant.status === 'active' ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
        <div className="ml-2">
          <IconButton 
            size="small" 
            color="error"
            onClick={(e) => { 
              e.stopPropagation(); // Prevent card click selection
              onDelete(variant.id); 
            }}
            disabled={isActionDisabled} 
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default VariantDisplayCard; 