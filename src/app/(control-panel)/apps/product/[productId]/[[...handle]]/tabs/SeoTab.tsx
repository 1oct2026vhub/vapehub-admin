import SeoForm from '@/app/(control-panel)/apps/seo/components/SeoForm';
import { useProductForm } from '../ProductFormContext';


function SeoTab() {
  const { formData } = useProductForm();

  if (!formData.productId) {
    return <div>Please save the product's basic information first to manage SEO.</div>;
  }

  return (
    <SeoForm
      entityType="product"
      entityId={formData.productId}
      entityName={formData.name}
      entitySlug={formData.slug}
    />
  );
}

export default SeoTab; 