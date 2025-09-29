import { Metadata } from 'next';
import ShippingMethods from './ShippingMethods';

export const metadata: Metadata = {
  title: 'Shipping Methods | VapeHub',
};

export default function ShippingMethodsPage() {
  return <ShippingMethods />;
}
