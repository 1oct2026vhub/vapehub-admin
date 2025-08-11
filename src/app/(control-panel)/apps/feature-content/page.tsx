import { Metadata } from 'next';
import FeatureContentPageClient from './FeatureContentPageClient';

export const metadata: Metadata = {
  title: 'Feature Content | VapeHub',
};

export default function FeatureContentPage() {
  return <FeatureContentPageClient />;
}

