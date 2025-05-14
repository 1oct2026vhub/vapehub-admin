import React, { useEffect, useState, useRef } from 'react';
import { Paper, Typography, Grid, Divider, Icon, IconButton, Tooltip, Button } from '@mui/material'; // Added Button
import axios from 'axios';
// import { getAuthToken } from '@/utils/auth'; // This will be replaced by OAuth flow
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; // Corrected to use NEXT_PUBLIC_ prefix and check against placeholder
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URL || 'YOUR_REDIRECT_URI_HERE';
const GOOGLE_AUTH_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

// --- START TYPE DEFINITIONS ---

// Type for RealtimeReport API response data
type RealtimeReportRow = {
	dimensionValues: { value: string }[];
	metricValues: { value: string }[];
};

type RealtimeReportData = {
	rows: RealtimeReportRow[];
	rowCount: number;
	dimensionHeaders?: { name: string }[];
	metricHeaders?: { name: string; type: string }[];
} | null;

// Interface for historical RunReport API response data rows
interface ReportRow {
	dimensionValues: { value: string }[];
	metricValues: { value: string }[];
}

// Interface for historical RunReport API response data structure
interface ReportData {
	rows?: ReportRow[]; // Optional: data might not be present
	dimensionHeaders?: { name: string }[]; // Optional
	metricHeaders?: { name: string; type: string }[]; // Optional
	rowCount?: number; // Optional
	totals?: ReportRow[]; // Optional
}

// Main state structure for all analytics data
interface AnalyticsDataState {
	activeUsers?: RealtimeReportData; // This can be RealtimeReportData object or null
	usersBySource?: RealtimeReportData;
	viewsByPage?: RealtimeReportData;
	eventCounts?: RealtimeReportData;
	usersByAudience?: RealtimeReportData;
	activeUsersPerMinute?: RealtimeReportData;
	customMinuteRangeUsers?: RealtimeReportData; // For active users in custom minute ranges
	dailyPerformanceStats?: ReportData | null; // For daily active users, new users, and total revenue
	firstUserSourceStats?: ReportData | null; // Renaming this from firstOpenByDateStats
}

// --- END TYPE DEFINITIONS ---

function AnalyticsOverview() {
	// Dummy data structure for the bottom cards
	const summaryCards = [
		{ title: 'Active users by First user source*', col1: 'FIRST USER SOURCE', col2: 'ACTIVE USERS', dataKey: 'firstUserSourceStats' },
		{ title: 'Active users* by Audience', col1: 'Audience', col2: 'Active Users', dataKey: 'usersByAudience' },
		{ title: 'Views by Page title and screen name', col1: 'Page Title and Screen...', col2: 'Views', dataKey: 'viewsByPage' },
		{ title: 'Event count by Event name', col1: 'Event Name', col2: 'Event Count', dataKey: 'eventCounts' },
	];

	// State for API data
	const [analyticsRealtimeData, setAnalyticsRealtimeData] = useState<AnalyticsDataState>({});
	const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false); // Combined loading state
	const [analyticsErrors, setAnalyticsErrors] = useState<Record<string, string | null>>({}); // Store errors per data type
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [oauthError, setOauthError] = useState<string | null>(null);
	const [isExchangingToken, setIsExchangingToken] = useState<boolean>(false);
	const [initialAuthAttempted, setInitialAuthAttempted] = useState<boolean>(false);

	// Effect to load access token from localStorage on initial mount
	useEffect(() => {
		console.log("Attempting to load token from localStorage on mount...");
		const storedToken = localStorage.getItem('googleAccessToken');
		console.log("Token retrieved from localStorage:", storedToken); // Log the stored token
		const storedTokenExpiry = localStorage.getItem('googleTokenExpiry');
		const storedRefreshToken = localStorage.getItem('googleRefreshToken');

		try {
			if (storedToken && storedTokenExpiry) {
				const expiryTimestamp = parseInt(storedTokenExpiry, 10);
				if (Date.now() < expiryTimestamp) {
					console.log("Valid token found in localStorage, setting to state.");
					setAccessToken(storedToken);
					setOauthError(null); 
				} else {
					console.log("Token found in localStorage but has expired. Clearing.");
					localStorage.removeItem('googleAccessToken');
					localStorage.removeItem('googleTokenExpiry');
					localStorage.removeItem('googleRefreshToken');
				}
			} else {
				console.log("No token or expiry information found in localStorage.");
			}
		} catch (error) {
			console.error("Error processing token from localStorage:", error);
			// Ensure local storage is clear if there was an error processing it
			localStorage.removeItem('googleAccessToken');
			localStorage.removeItem('googleTokenExpiry');
			localStorage.removeItem('googleRefreshToken');
		} finally {
			setInitialAuthAttempted(true);
		}
	}, []); // Empty dependency array: runs only once on mount

	// console.log("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID);
	// console.log("GOOGLE_REDIRECT_URI", GOOGLE_REDIRECT_URI);
	const handleGoogleLogin = () => {
		const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
			`client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
			`redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
			`response_type=code&` +
			`scope=${encodeURIComponent(GOOGLE_AUTH_SCOPE)}&` +
			`access_type=offline&` + // Request refresh token
			`prompt=consent`; // Optional: forces consent screen and refresh token issuance, useful for dev
		window.location.href = authUrl;
	};
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const errorParam = urlParams.get('error');

		// Prioritize handling callback parameters
		if (errorParam) {
			setOauthError(`OAuth Error: ${errorParam}`);
			// Clear the error and code from URL to prevent re-processing
			window.history.replaceState({}, document.title, window.location.pathname);
			return; // Stop further processing if there's an error from callback
		}

		if (code) {
			console.log("Received authorization code on frontend:", code);
			if (!isExchangingToken) {
				setIsExchangingToken(true);
				setOauthError(null); // Clear any previous OAuth error before a new attempt

				const exchangeToken = async () => {
					console.log("Frontend: Attempting to exchange code with backend API /api/auth/google/token");
					try {
						const res = await axios.post('/api/auth/google/token', { code });
						console.log("res", res);
						
						const { access_token, refresh_token, expires_in, scope, token_type } = res.data; 

						if (access_token) {
							console.log("Frontend: Successfully exchanged code for token. Full response:", res.data);
							setAccessToken(access_token);
							console.log("Access Token obtained:", access_token);

							const expiresInMs = (expires_in || 3600) * 1000; // Default to 1 hour if not provided
							const expiryTimestamp = Date.now() + expiresInMs;

							try {
								localStorage.setItem('googleAccessToken', access_token);
								localStorage.setItem('googleTokenExpiry', expiryTimestamp.toString());
								if (refresh_token) {
									localStorage.setItem('googleRefreshToken', refresh_token);
									console.log("Refresh Token stored in localStorage.");
								}
								console.log(`Access Token and expiry (expires in ${expires_in}s) stored in localStorage.`);
							} catch (storageError) {
								console.error("Error storing token data in localStorage:", storageError);
							}
							window.history.replaceState({}, document.title, window.location.pathname);
						} else {
							console.error('Frontend: Token exchange was successful but access_token was not found in response.', res.data);
							setOauthError('Token exchange succeeded but no access_token received. Check backend logs.');
						}
					} catch (err: any) {
						console.error('Frontend: Token exchange API call failed:', err.response?.data || err.message);
						let errorMessage = 'Failed to exchange auth code for token via backend.';
						if (err.response?.data?.details) {
							errorMessage += ` Server said: ${typeof err.response.data.details === 'object' ? JSON.stringify(err.response.data.details) : err.response.data.details}`;
						}
						setOauthError(errorMessage);
					} finally {
						setIsExchangingToken(false);
					}
				};

				exchangeToken();
			} else {
				console.log("Token exchange already in progress, skipping duplicate attempt with code:", code);
			}
			// The return statement here is important if we are processing a code,
			// to prevent the logic below for automatic login from running in the same effect cycle.
			return; 
		}
		if (!accessToken && !oauthError) {
			// If no callback parameters (code or error) are being processed from URL,
			// and we have attempted initial auth, and we don't have an access token,
			// and no existing oauth error, then attempt login.
			if (initialAuthAttempted && !accessToken && !oauthError) {
				// Check if credentials are placeholders before attempting login
				if (GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || GOOGLE_REDIRECT_URI === 'YOUR_REDIRECT_URI_HERE') {
					console.warn("Google API credentials are not configured. Automatic login will not proceed.");
					// Optionally, set an OAuth error here to inform the user on the UI
					// setOauthError("Google API credentials are not configured. Please check the setup.");
				} else {
					console.log("Auto-login: initialAuthAttempted=true, accessToken is null/empty, no oauthError. Redirecting to Google Auth.");
					handleGoogleLogin();
				}
			}
		}
	}, [accessToken, oauthError, initialAuthAttempted]); // Dependencies include initialAuthAttempted

	// Effect to fetch analytics data once an access token is available
	useEffect(() => {
		const fetchData = async () => {
			if (!accessToken || analyticsLoading) return; // Prevent fetch if no token or already loading

			setAnalyticsLoading(true);
			setAnalyticsErrors({}); // Clear previous errors
			
			// const propertyId = process.env.NEXT_PUBLIC_GA_PROPERTY_ID;
			const propertyId = '487771831';
			const googleApiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`;
			const requestHeaders = {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			};

			// Define API requests
			const requests = {
				activeUsers: axios.post(googleApiUrl, {
					metrics: [{ name: "activeUsers" }],
					// Query both ranges needed for "Active Users in Last 30/5 Minutes"
					minuteRanges: [
						{ name: "30 minutes", startMinutesAgo: 29 }, 
						{ name: "5 minutes", startMinutesAgo: 4 }   
					]
				}, { headers: requestHeaders }),
				usersBySource: axios.post(googleApiUrl, {
					dimensions: [{ name: "source" }], // Changed from firstUserSource to source
					metrics: [{ name: "activeUsers" }],
					limit: 5 // Limit results for card display
				}, { headers: requestHeaders }),
				 usersByAudience: axios.post(googleApiUrl, {
					dimensions: [{ name: "audienceName" }], 
					metrics: [{ name: "activeUsers" }],
					limit: 5 
				}, { headers: requestHeaders }),
				viewsByPage: axios.post(googleApiUrl, {
					dimensions: [{ name: "unifiedScreenName" }],
					metrics: [{ name: "screenPageViews" }],
					 limit: 5 
				}, { headers: requestHeaders }),
				eventCounts: axios.post(googleApiUrl, {
					dimensions: [{ name: "eventName" }],
					metrics: [{ name: "eventCount" }],
					 limit: 5 
				}, { headers: requestHeaders }),
				activeUsersPerMinute: axios.post(googleApiUrl, {
					dimensions: [{ name: "minute" }],
					metrics: [{ name: "activeUsers" }],
					// Optional: Order by minute to ensure data is chronological if needed for display
					// orderBys: [{ "dimension": { "dimensionName": "minute" }, "desc": false }],
					limit: 30 // Get up to the last 30 minutes of data
				}, { headers: requestHeaders }),
				customMinuteRangeUsers: axios.post(googleApiUrl, {
					metrics: [{ name: "activeUsers" }],
					minuteRanges: [
						{ name: "0-4 minutes ago", startMinutesAgo: 4 },
						{ name: "25-29 minutes ago", startMinutesAgo: 29, endMinutesAgo: 25 }
					]
				}, { headers: requestHeaders }),
				dailyPerformanceStats: axios.post(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
					dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
					dimensions: [{ name: "date" }],
					metrics: [
						{ name: "activeUsers" },
						{ name: "newUsers" },
						{ name: "totalRevenue" }
					],
					orderBys: [{ dimension: { dimensionName: "date" }, desc: false }] // Optional: ensure data is chronological
				}, { headers: requestHeaders }),
				firstUserSourceStats: axios.post(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
					dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
					dimensions: [{ name: "firstUserSource" }],
					metrics: [{ name: "activeUsers" }],
					orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
					limit: 5
				}, { headers: requestHeaders })
				// Add requests for activeUsersPerMinute, keyEvents, usersByUserProperty here if needed
			};

			console.log("--- Starting Batch Realtime Analytics Fetch ---");

			let authErrorOccurred = false; // Declare outside the try block

			try {
				// Use Promise.allSettled to run all requests concurrently
				const results = await Promise.allSettled(Object.values(requests));
				const requestKeys = Object.keys(requests);
				const newData: AnalyticsDataState = {};
				const newErrors: Record<string, string | null> = {};

				results.forEach((result, index) => {
					const key = requestKeys[index] as keyof AnalyticsDataState; // Type assertion
					if (result.status === 'fulfilled') {
						console.log(`Successfully fetched data for ${key}:`, result.value.data);
						newData[key] = result.value.data;
					} else { // status === 'rejected'
						console.error(`Failed to fetch data for ${key}:`, result.reason);
						let errorMessage = `Failed to fetch ${key}.`;
						// Handle different error types (Axios vs others)
						if (axios.isAxiosError(result.reason)) {
							const axiosError = result.reason;
							if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
								// Handle auth error - only trigger re-auth process once per batch
								if (!authErrorOccurred) {
									errorMessage = `Authentication error (Status ${axiosError.response.status}) accessing Analytics API (${key}). Please re-login.`;
									setAccessToken(null); 
									localStorage.removeItem('googleAccessToken');
									localStorage.removeItem('googleTokenExpiry');
									localStorage.removeItem('googleRefreshToken');
									setOauthError("Authentication failed with Analytics API. Please re-login.");
									authErrorOccurred = true; // Prevent multiple re-auth triggers
								} else {
									errorMessage = `Auth error fetching ${key}. Re-login already initiated.`;
								}
							} else if (axiosError.response?.data?.error?.message) {
								errorMessage = `Google API Error (${key}): ${axiosError.response.data.error.message}`;
							} else {
								errorMessage = `API Request Error (${key}): ${axiosError.message}`;
							}
						} else if (result.reason instanceof Error) {
							 errorMessage = `Error fetching ${key}: ${result.reason.message}`;
						} else {
							errorMessage = `Unknown error fetching ${key}.`;
						}
						 newErrors[key] = errorMessage;
					}
				});

				setAnalyticsRealtimeData(prevData => ({ ...prevData, ...newData })); // Merge new data with previous potentially
				setAnalyticsErrors(prevErrors => ({ ...prevErrors, ...newErrors }));

				// If an auth error occurred, stop further processing in this cycle
				if (authErrorOccurred) {
					console.log("Authentication error occurred during fetch, stopping further actions in this cycle.");
					// Set loading false here as the re-auth flow will take over
					setAnalyticsLoading(false); 
					return; // Exit early
				}

			} catch (generalError: any) {
				// Less likely with Promise.allSettled, but catch errors during promise setup
				console.error("General error during analytics fetch setup:", generalError);
				setAnalyticsErrors({ general: generalError.message || "An unexpected error occurred during fetch setup." });
			} finally {
				// Only set loading false if no auth error forced an early exit
				 if (!authErrorOccurred) {
					setAnalyticsLoading(false);
				 }
				 console.log("--- Finished Batch Realtime Analytics Fetch ---");
			}
		};

		// Trigger fetch only if we have a token
		if (accessToken) { 
			fetchData();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps 
	}, [accessToken]); // Dependency: Run fetch when accessToken changes

	// --- Helper Functions to Extract Data --- (Examples)
	const getActiveUsersCount = (rangeName: "30 minutes" | "5 minutes"): string => {
		const data = analyticsRealtimeData.activeUsers;
		if (!data || !data.rows) return "0";

		// Find the row matching the minute range name
		const row = data.rows.find(r => r.dimensionValues[0]?.value === rangeName);
		// Assuming activeUsers is the first metric
		return row?.metricValues[0]?.value || "0";
	};

	return (
		<div className="w-full p-4 sm:p-6 lg:p-8">
			{/* Header for Realtime Overview */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<Typography variant="h5" component="h1" className="font-semibold mb-2 sm:mb-0">
					Realtime overview
					<Icon className="text-green-500 ml-2 align-middle">check_circle</Icon>
				</Typography>
				
			</div>

			{/* OAuth Status and Login Button */}
			{/* <Paper elevation={1} className="p-4 mb-6">
				<Typography variant="h6" component="h2" className="font-semibold mb-2">
					Authentication Status
				</Typography>
				{oauthError && (
					<Typography color="error" className="mb-2" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
						Authentication Error: {oauthError}
					</Typography>
				)}
				{!accessToken && !new URLSearchParams(window.location.search).get('code') && !oauthError && (
					 <div>
						<Typography className="mb-2">
							Attempting to automatically authenticate with your Google account...
						</Typography>
						 {(GOOGLE_CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || GOOGLE_REDIRECT_URI === 'YOUR_REDIRECT_URI_HERE') && (
							<Typography color="error" style={{ marginTop: '10px', fontWeight: 'bold' }}>
								Warning: Google API credentials are not configured. Please replace placeholder values in the code. Automatic login may not work.
							</Typography>
						)}
					</div>
				)}
				{new URLSearchParams(window.location.search).get('code') && !accessToken && !oauthError && (
					 <Typography className="mb-2">
						Processing authentication... please wait. Your authorization code has been logged to the console.
					</Typography>
				)}
				{accessToken && accessToken !== "NEEDS_ACTUAL_TOKEN_FROM_BACKEND_AFTER_CODE_EXCHANGE" && !oauthError && (
					<Typography style={{ color: 'green' }} className="mb-2">
						Successfully authenticated with Google. Analytics data should load if available.
					</Typography>
				)}
				 {accessToken === "NEEDS_ACTUAL_TOKEN_FROM_BACKEND_AFTER_CODE_EXCHANGE" && (
					<Typography color="error" className="mb-2">
						Authentication incomplete: Backend integration required to exchange authorization code for a valid access token.
					</Typography>
				)}
			</Paper> */}

			{/* Loading Indicator */}
			{analyticsLoading && <Typography className="mb-4">Loading analytics data...</Typography>}

			{/* Analytics Fetch Errors Display */}
			{/* {Object.values(analyticsErrors).some(e => e !== null) && (
				 <Paper elevation={2} className="p-4 sm:p-6 mb-6 mt-6" sx={{ borderColor: 'error.main', borderWidth: 1, borderStyle: 'solid' }}>
					 <Typography variant="h6" component="h2" className="font-semibold mb-3 text-red-600">
						Analytics Fetch Errors
					 </Typography>
					 {Object.entries(analyticsErrors).map(([key, errorMsg]) => (
						 errorMsg && <Typography key={key} color="error" className="mb-1"><strong>{key}:</strong> {errorMsg}</Typography>
					 ))}
				 </Paper>
			)} */}

			{/* Top Section - Active Users Card (Using new state) */}
			<Paper elevation={2} className="p-4 sm:p-6 mb-6"> 
				<Grid container spacing={2} className="mb-4"> 
					<Grid item xs={12} sm={6} md={4} lg={3}> 
						<Typography variant="caption" className="text-gray-600 uppercase tracking-wider mb-1 block"> 
							Active users in last 30 minutes
						</Typography>
						<Typography variant="h3" component="div" className="font-bold"> 
							{getActiveUsersCount("30 minutes")} {/* Use helper function */}
						</Typography>
					</Grid>
					<Grid item xs={12} sm={6} md={4} lg={3}> 
						<Typography variant="caption" className="text-gray-600 uppercase tracking-wider mb-1 block">
							Active users in last 5 minutes
						</Typography>
						<Typography variant="h3" component="div" className="font-bold">
							{getActiveUsersCount("5 minutes")} {/* Use helper function */}
						</Typography>
					</Grid>
				</Grid>
				{/* <Divider className="my-4" /> */}
				{/* <div>
					<Typography variant="subtitle2" className="text-gray-700 font-medium mb-2">
						Active users per minute (Last 30 mins)
					</Typography>
					{analyticsRealtimeData.activeUsersPerMinute && analyticsRealtimeData.activeUsersPerMinute.rows && analyticsRealtimeData.activeUsersPerMinute.rows.length > 0 ? (
						<div className="h-48 bg-gray-50 border rounded p-2 overflow-y-auto text-sm">
							{analyticsRealtimeData.activeUsersPerMinute.rows.map((row, index) => (
								<div key={index} className="flex justify-between">
									<span>Minute {row.dimensionValues[0]?.value || 'N/A'}:</span>
									<span>{row.metricValues[0]?.value || '0'} users</span>
								</div>
							))}
						</div>
					) : (
						<div className="h-48 bg-gray-50 border rounded flex items-center justify-center text-gray-500">
							{analyticsLoading ? 'Loading data...' : 'No per-minute data available for the last 30 minutes.'}
						</div>
					)}
				</div> */}
			</Paper>

			{/* Custom Minute Range Card */}
			{analyticsRealtimeData.customMinuteRangeUsers && (
				<Paper elevation={2} className="p-4 sm:p-6 mb-6 mt-6">
					<Typography variant="h6" component="h2" className="font-semibold mb-3">
						Active Users by Custom Time Segments
					</Typography>
					{(analyticsRealtimeData.customMinuteRangeUsers.rows || []).map((row, index) => (
						<div key={index} className="mb-2">
							<Typography variant="subtitle1">
								{row.dimensionValues[0]?.value || 'Unknown Range'}:
								<span className="font-bold ml-2">{row.metricValues[0]?.value || '0'} users</span>
							</Typography>
						</div>
					))}
					{(!analyticsRealtimeData.customMinuteRangeUsers.rows || analyticsRealtimeData.customMinuteRangeUsers.rows.length === 0) && !analyticsLoading && (
						<Typography className="text-gray-500">No data available for custom time segments.</Typography>
					)}
				</Paper>
			)}

			

			{/* Debug Section: Raw API Data Display */}
			{/* {accessToken && !analyticsLoading && Object.keys(analyticsRealtimeData).length > 0 && (
				<Paper elevation={2} className="p-4 sm:p-6 mb-6 mt-6">
					<Typography variant="h6" component="h2" className="font-semibold mb-3">
						Raw Realtime Analytics API Data (Debug)
					</Typography>
					{Object.entries(analyticsRealtimeData).map(([key, data]) => (
						data && (
							<div key={key} className="mb-4">
								<Typography variant="subtitle1" className="font-medium">{key}</Typography>
								<div className="bg-gray-100 p-3 rounded max-h-60 overflow-auto">
									<pre>{JSON.stringify(data, null, 2)}</pre>
								</div>
							</div>
						)
					))}
				</Paper>
			)} */}
			
			{/* Bottom Section - Cards (Populating dynamically) */}
			<Grid container spacing={3}> 
				{summaryCards.map((card) => {
					const dataKey = card.dataKey as keyof AnalyticsDataState;
					const reportData = analyticsRealtimeData[dataKey];
					const hasData = reportData && reportData.rows && reportData.rows.length > 0;
					const rowsToDisplay = reportData?.rows || []; // Get rows or empty array

					if (card.dataKey === 'firstUserSourceStats') {
						const report = analyticsRealtimeData.firstUserSourceStats;
						const rows = report?.rows || [];
						const hasReportData = rows.length > 0;
						const totalActiveUsers = report?.totals?.[0]?.metricValues?.[0]?.value ? parseInt(report.totals[0].metricValues[0].value, 10) : 0;

						return (
							<Grid item xs={12} sm={6} lg={3} key={card.dataKey}>
								<Paper elevation={2} className="p-4 h-full flex flex-col">
									<Typography variant="subtitle1" className="font-semibold mb-1">
										{card.title}
									</Typography>

									{analyticsLoading && !hasReportData && <Typography className="text-gray-500 my-4">Loading...</Typography>}

									{hasReportData ? (
										<>
											<div className="mb-3">
												<Typography variant="body2" component="p" className="text-gray-600">
													#1 {rows[0].dimensionValues[0]?.value || '(not set)'}
												</Typography>
												<Typography variant="h4" component="p" className="font-bold">
													{rows[0].metricValues[0]?.value || '0'}
												</Typography>
												{/* <Typography variant="caption" className="text-gray-600">
													{totalActiveUsers > 0 && rows[0].metricValues[0]?.value ? 
														((parseInt(rows[0].metricValues[0].value, 10) / totalActiveUsers) * 100).toFixed(0) + '%' 
														: 'N/A'}
												</Typography> */}
											</div>			
											<div className="flex justify-between items-center text-xs font-medium text-gray-500 mt-2 mb-1 border-b pb-1">
												<span className="uppercase">{card.col1}</span>
												<span className="uppercase">{card.col2}</span>
											</div>
											<div className="flex-grow overflow-auto text-sm" style={{ minHeight: '60px' }}>
												{rows.map((row, rowIndex) => (
													<div key={rowIndex} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
														<span className="truncate pr-2">{row.dimensionValues[0]?.value || '(not set)' }</span>
														<span className="font-medium">{row.metricValues[0]?.value || '0'}</span>
													</div>
												))}
											</div>
											<div className="text-xs text-gray-500 mt-2 text-right">
												1 - {rows.length} of {report?.rowCount || rows.length}
											</div>
										</>
									) : (
										<div className="flex items-center justify-center min-h-[150px]">
											<Typography variant="body2" className="text-gray-500">
												No data available
											</Typography>
										</div>
									)}
								</Paper>
							</Grid>
						);
					} else {
						return (
							<Grid item xs={12} sm={6} lg={3} key={card.dataKey}> 
								<Paper elevation={2} className="p-4 h-full flex flex-col"> 
									<Typography variant="subtitle1" className="font-semibold mb-3"> 
										{card.title}
									</Typography>
									{/* Header row for columns */}    
									<div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2 border-b pb-1"> 
										<span className="uppercase">{card.col1}</span> 
										<span className="uppercase">{card.col2}</span> 
									</div>
									
									{/* Data rows or No data message */}    
									<div className="flex-grow overflow-auto text-sm"> {/* Allow scrolling if content overflows */}
										{hasData ? (
											rowsToDisplay.map((row, rowIndex) => {
												let dimValue = row.dimensionValues[0]?.value || 'N/A';
												const metricValue = row.metricValues[0]?.value || '0';

												// Special handling for the firstUserSourceStats card (which was formerly firstOpenByDateStats)
												// This dataKey now refers to 'Active users by First user source*'
												// The dimension is firstUserSource, not date, so formatDateForChart is not needed here.
												// if (card.dataKey === 'firstUserSourceStats' && row.dimensionValues[0]?.value) {
												// 	dimValue = formatDateForChart(row.dimensionValues[0].value);
												// }

												return (
													<div key={rowIndex} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
														<span className="truncate pr-2">{dimValue}</span>
														<span className="font-medium">{metricValue}</span>
													</div>
												);
											})
										) : (
											<div className="flex items-center justify-center min-h-[50px]">
												<Typography variant="body2" className="text-gray-500">
													No data available
												</Typography>
											</div>
										)}
									</div>
								</Paper>
							</Grid>
						);
					}
				})}
			</Grid>
		</div>
	);
}

export default AnalyticsOverview; 