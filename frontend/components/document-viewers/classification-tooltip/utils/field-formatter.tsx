// Format field names for display
export const formatFieldName = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get field category for grouping
export const getFieldCategory = (fieldName: string): string => {
  if (['property_name', 'address', 'city', 'state', 'zip_code'].includes(fieldName)) {
    return 'location';
  }
  if (['asking_price', 'revenue', 'expenses'].includes(fieldName)) {
    return 'financial';
  }
  if (['year_built', 'parking_spaces', 'gross_square_feet', 'number_of_units'].includes(fieldName)) {
    return 'physical';
  }
  return 'other';
};

// Format field value for display
export const formatFieldValue = (value: string, fieldName: string): string => {
  // Add special formatting for specific fields
  if (fieldName === 'asking_price' || fieldName === 'revenue' || fieldName === 'expenses') {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return `$${numValue.toLocaleString()}`;
    }
  }

  if (fieldName === 'year_built') {
    const year = parseInt(value);
    if (!isNaN(year)) {
      return year.toString();
    }
  }

  return value;
};
