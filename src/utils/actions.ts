export const formatDate = (dateString: string, format?: string): string => {
    if (!dateString) return "N/A";
  
    const date = new Date(dateString);
  
    if (isNaN(date.getTime())) return "Invalid date";
  
    if (format === 'MMMM D, YYYY h:mm A') {
      return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;  // DD-MM-YYYY format
  };
  
/**
 * Formats numbers with K (thousands) and M (millions) suffixes
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "5.3K" or "1.2M")
 */
export const formatCompactNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toString();
};

/**
 * Formats currency values with pound symbol and K/M suffixes for large numbers
 * @param amount - Amount to format
 * @returns Formatted currency string with compact notation
 */
export const formatCompactPounds = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '£0';
  
  return '£' + formatCompactNumber(num);
};

// Currency code mapping for numeric ISO 4217 codes
export const NUMERIC_CURRENCY_CODES: { [key: string]: string } = {
  '826': 'GBP', // British Pound
  '840': 'USD', // US Dollar
  '978': 'EUR', // Euro
  '036': 'AUD', // Australian Dollar
  '124': 'CAD', // Canadian Dollar
  '392': 'JPY', // Japanese Yen
  '756': 'CHF', // Swiss Franc
  '156': 'CNY', // Chinese Yuan
  '356': 'INR', // Indian Rupee
  '971': 'AFN', // Afghan Afghani
  // Add more currency codes as needed
};

/**
 * Converts numeric currency codes to ISO currency codes
 * @param code - Currency code (numeric or alphabetic)
 * @returns ISO currency code string (default: 'GBP')
 */
export const getCurrencyCode = (code: string | number | undefined): string => {
  if (!code) return 'GBP';
  
  if (typeof code === 'number' || /^\d+$/.test(code.toString())) {
    return NUMERIC_CURRENCY_CODES[code.toString()] || 'GBP';
  }
  return code.toString() || 'GBP';
};

/**
 * Formats a number as currency
 * @param amount - Amount to format
 * @param currencyCode - Currency code (numeric or alphabetic)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | string, currencyCode?: string | number): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '£0.00';
  
  const code = getCurrencyCode(currencyCode);
  
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: code
  }).format(numericAmount);
};

/**
 * Simple currency formatter with pound symbol
 * @param amount - Amount to format
 * @returns Formatted string with pound symbol
 */
export const formatPounds = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `£${isNaN(numericAmount) ? '0.00' : numericAmount.toFixed(2)}`;
};

// Add the formatStatusText function export
export const formatStatusText = (status: string): string => {
  if (!status) return '';
  
  // Special case for "fail" and "cancel"
  if (status === 'fail') return 'Failed';
  if (status === 'cancel') return 'Cancelled';
  
  // Replace underscores with spaces and capitalize each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
  