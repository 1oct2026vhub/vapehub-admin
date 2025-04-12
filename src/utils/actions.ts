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
  