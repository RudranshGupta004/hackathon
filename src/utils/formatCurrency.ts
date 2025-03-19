
/**
 * Formats a number as Indian Rupees (₹)
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number, 
  options: { 
    minimumFractionDigits?: number; 
    maximumFractionDigits?: number;
    displaySymbol?: boolean;
  } = {}
): string => {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    displaySymbol = true
  } = options;
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
    currencyDisplay: 'symbol'
  });
  
  const formatted = formatter.format(value);
  
  return displaySymbol ? formatted : formatted.replace('₹', '').trim();
};
