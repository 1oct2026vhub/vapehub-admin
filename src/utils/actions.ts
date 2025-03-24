export const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
  
    const date = new Date(dateString);
  
    if (isNaN(date.getTime())) return "Invalid date";
  
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;  // DD-MM-YYYY format
  };
  