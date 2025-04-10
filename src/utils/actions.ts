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
  