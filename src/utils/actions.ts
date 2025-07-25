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
  if (!code) {
    return 'GBP';
  }

  const codeStr = String(code);

  // Handle numeric codes from the map
  if (NUMERIC_CURRENCY_CODES[codeStr]) {
    return NUMERIC_CURRENCY_CODES[codeStr];
  }

  // Handle standard 3-letter ISO codes, case-insensitive
  if (/^[a-zA-Z]{3}$/.test(codeStr)) {
    return codeStr.toUpperCase();
  }

  // Fallback for invalid codes (e.g., "string", longer codes, etc.)
  return 'GBP';
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
  return `£${isNaN(numericAmount) ? '0.00' : numericAmount?.toFixed(2)}`;
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

export const formatCustomerNameSafely = (customerData: any): string => {
  if (!customerData) {
    return "N/A"; // Or an empty string, depending on display preference
  }

  // If it's already a string, return it
  if (typeof customerData === 'string') {
    return customerData.trim();
  }

  // If it's an object, try common patterns
  if (typeof customerData === 'object' && customerData !== null) {
    // Check for a direct 'name' property
    if (typeof customerData.name === 'string' && customerData.name.trim() !== '') {
      return customerData.name.trim();
    }

    // Check for firstName/lastName or first_name/last_name patterns
    const firstName = customerData.firstName || customerData.first_name;
    const lastName = customerData.lastName || customerData.last_name;

    // Helper to capitalize first letter
    const capitalize = (str: string | null | undefined) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

    if (typeof firstName === 'string' && typeof lastName === 'string') {
      const fName = capitalize(firstName.trim());
      const lName = capitalize(lastName.trim());
      if (fName && lName) {
        return `${fName} ${lName}`;
      }
      // Handle cases where only one part might be present
      if (fName) return fName;
      if (lName) return lName;
    }
    
    // If only one part is available as a string (and the other wasn't a string or was empty)
    if (typeof firstName === 'string' && firstName.trim() !== '') return capitalize(firstName.trim());
    if (typeof lastName === 'string' && lastName.trim() !== '') return capitalize(lastName.trim());

    // Fallback for other object structures: log a warning and return a placeholder
    console.warn("Unformattable customer data object:", customerData);
    return "N/A"; 
  }

  // For other types (e.g., number, boolean), convert to string or handle as an error/placeholder
  console.warn("Unexpected customer data type:", typeof customerData, customerData);
  return String(customerData); // Or "Invalid Customer Data"
}; 
  