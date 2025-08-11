
import { Metadata } from 'next';
import WelcomeList from './components/WelcomeList';

export const metadata: Metadata = {
  title: 'Welcome | VapeHub',
};

export default function WelcomePage() {
  return <WelcomeList />; 
}

