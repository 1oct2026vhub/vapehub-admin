import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Ensure these environment variables are set in your .env.local or environment
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!; 
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
// This should be the same redirect URI registered in your Google Cloud Console
// and used in the frontend OAuth initiation.
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URL!; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.error('Missing Google OAuth environment variables on the backend.');
    return res.status(500).json({ error: 'Server configuration error: Missing OAuth credentials.' });
  }
  
  console.log("Backend: Preparing to exchange token. Received code:", code);
  console.log("Backend: Using CLIENT_ID:", GOOGLE_CLIENT_ID);
  console.log("Backend: Using REDIRECT_URI:", GOOGLE_REDIRECT_URI);
  // For debugging only, consider if it's safe to log the secret in your environment:
  // console.log("Backend: Using CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "Exists" : "MISSING or empty");

  try {
    const tokenExchangeParams = {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    };

    // console.log("Backend: Token Exchange Params to Google:", JSON.stringify(tokenExchangeParams)); // Sensitive: logs client_secret

    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      tokenExchangeParams, // Pass parameters directly in the body
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded' 
        }
      }
    );
    
    console.log("Backend: Data received from Google token endpoint:", response.data);

    console.log("Token exchange successful. Sending token data to client.");
    res.status(200).json(response.data); // includes access_token, refresh_token, etc.
  } catch (error: any) {
    console.error('Token exchange failed on backend:', error.response?.data || error.message);
    // Log more details if available
    if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
    }
    res.status(error.response?.status || 500).json({ 
        error: 'Failed to exchange code for token', 
        details: error.response?.data || error.message 
    });
  }
} 