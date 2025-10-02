import React from 'react';
import { DealSummary } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Building2, MapPin, Calendar, Car, Ruler } from 'lucide-react';
import { useDealSelectors, useDealActions } from './store';

interface AssetSummaryCardProps {
  dealData: DealSummary;
  className?: string;
}

export default function AssetSummaryCard({ dealData, className = '' }: AssetSummaryCardProps) {
  // Get store data and actions
  const isEditing = useDealSelectors.useIsEditing();
  const editableFields = useDealSelectors.useEditableFields();
  const { updateEditableField } = useDealActions();

  // Handle field changes - directly update store
  const handleFieldChange = (field: keyof DealSummary, value: any) => {
    updateEditableField(field, value);
  };

  // Define the editable property details
  const propertyDetails = [
    {
      title: 'Property Name',
      field: 'property_name' as keyof DealSummary,
      value: isEditing ? editableFields.property_name || '' : dealData.property_name || 'N/A',
      icon: Building2,
      type: 'text'
    },
    {
      title: 'Address',
      field: 'address' as keyof DealSummary,
      value: isEditing ? editableFields.address || '' : dealData.address || 'N/A',
      icon: MapPin,
      type: 'text'
    },
    {
      title: 'Units',
      field: 'number_of_units' as keyof DealSummary,
      value: isEditing ? editableFields.number_of_units || '' : dealData.number_of_units ? `${dealData.number_of_units} units` : 'N/A',
      icon: Building2,
      type: 'number'
    },
    {
      title: 'Year Built',
      field: 'year_built' as keyof DealSummary,
      value: isEditing ? editableFields.year_built || '' : dealData.year_built ? dealData.year_built.toString() : 'N/A',
      icon: Calendar,
      type: 'number'
    },
    {
      title: 'Parking Spaces',
      field: 'parking_spaces' as keyof DealSummary,
      value: isEditing ? editableFields.parking_spaces || '' : dealData.parking_spaces ? `${dealData.parking_spaces} spaces` : 'N/A',
      icon: Car,
      type: 'number'
    },
    {
      title: 'Square Footage',
      field: 'gross_square_feet' as keyof DealSummary,
      value: isEditing ? editableFields.gross_square_feet || '' : dealData.gross_square_feet ? `${dealData.gross_square_feet.toLocaleString()} sq ft` : 'N/A',
      icon: Ruler,
      type: 'number'
    }
  ];

  return (
    <Card className={`p-6 ${className}`}>
            {/* Header with title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Asset Summary</h2>
      </div>

      {/* Property Details Layout - 2 columns, 3 rows */}
      <div className="grid grid-cols-2 gap-6">
        {propertyDetails.map((detail, index) => {
          const IconComponent = detail.icon;
          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-600">{detail.title}</h3>
              </div>

              {isEditing ? (
                <Input
                  type={detail.type}
                  value={detail.value}
                  onChange={(e) => {
                    const value = detail.type === 'number' ?
                      (e.target.value ? parseInt(e.target.value) : undefined) :
                      e.target.value;
                    handleFieldChange(detail.field, value);
                  }}
                  placeholder={`Enter ${detail.title.toLowerCase()}`}
                  className="text-sm"
                />
              ) : (
                <p className="text-md font-medium text-gray-900">{detail.value}</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
