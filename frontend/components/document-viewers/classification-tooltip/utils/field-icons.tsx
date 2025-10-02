import React from 'react';
import {
  ChevronRight,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  Car,
  Ruler,
  Home
} from 'lucide-react';

// Icon mapping for different classification fields
export const getFieldIcon = (fieldName: string): React.ReactNode => {
  switch (fieldName) {
    case 'property_name':
      return <Building className="w-4 h-4" />;
    case 'address':
    case 'city':
    case 'state':
    case 'zip_code':
      return <MapPin className="w-4 h-4" />;
    case 'asking_price':
    case 'revenue':
    case 'expenses':
      return <DollarSign className="w-4 h-4" />;
    case 'year_built':
      return <Calendar className="w-4 h-4" />;
    case 'parking_spaces':
      return <Car className="w-4 h-4" />;
    case 'gross_square_feet':
      return <Ruler className="w-4 h-4" />;
    case 'number_of_units':
      return <Home className="w-4 h-4" />;
    default:
      return <ChevronRight className="w-4 h-4" />;
  }
};

// Get icon color based on field type
export const getFieldIconColor = (fieldName: string): string => {
  switch (fieldName) {
    case 'property_name':
    case 'address':
    case 'city':
    case 'state':
    case 'zip_code':
      return 'text-blue-600';
    case 'asking_price':
    case 'revenue':
      return 'text-green-600';
    case 'expenses':
      return 'text-red-600';
    case 'year_built':
    case 'parking_spaces':
    case 'gross_square_feet':
    case 'number_of_units':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
};
