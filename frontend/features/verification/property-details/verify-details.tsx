"use client";

import { useState, useEffect } from 'react';
import { useVerificationStore, useVerificationSelectors } from '@/features/verification/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building, MapPin, Calendar, Car, Ruler, DollarSign, FileText } from "lucide-react";
import { PropertyDetails } from '@/features/verification/store';

interface VerifyDetailsProps {
  className?: string;
}

export default function VerifyDetails({
  className = ""
}: VerifyDetailsProps) {
  // Get store data and actions
  const propertyDetails = useVerificationSelectors.usePropertyDetails();
  const { updatePropertyDetails } = useVerificationStore();

  // Local state for editing (to avoid direct store mutations during typing)
  const [editedData, setEditedData] = useState<PropertyDetails>({});

  // Initialize edited data when property details are loaded
  useEffect(() => {
    if (Object.keys(propertyDetails).length > 0) {
      setEditedData(propertyDetails);
    }
  }, [propertyDetails]);

  const handleInputChange = (field: keyof PropertyDetails, value: string | number) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update the store with the new value
    updatePropertyDetails({ [field]: value });
  };

  const formatCurrency = (value: number | undefined): string => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number | undefined): string => {
    if (!value) return '';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/[$,]/g, '')) || 0;
  };

  const getFieldValue = (field: keyof PropertyDetails, isEditing: boolean) => {
    const data = isEditing ? editedData : propertyDetails;
    const value = data[field];

    if (field === 'asking_price' && value) {
      return isEditing ? formatCurrency(value as number) : formatCurrency(value as number);
    }
    if (['number_of_units', 'parking_spaces', 'gross_square_feet'].includes(field) && value) {
      return isEditing ? value : formatNumber(value as number);
    }
    return value || '';
  };

  const renderField = (
    field: keyof PropertyDetails,
    label: string,
    placeholder: string,
    type: 'text' | 'number' | 'currency' = 'text',
    icon?: React.ReactNode
  ) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium text-foreground flex items-center gap-2">
        {icon}
        {label}
      </Label>
      <Input
        id={field}
        type={type === 'currency' ? 'text' : type}
        value={getFieldValue(field, true)}
        onChange={(e) => {
          if (type === 'currency') {
            handleInputChange(field, parseCurrency(e.target.value));
          } else if (type === 'number') {
            handleInputChange(field, parseInt(e.target.value) || 0);
          } else {
            handleInputChange(field, e.target.value);
          }
        }}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );



  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle className="text-xl">Property Details</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Verify and edit property information extracted from your documents
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Name */}
          {renderField(
            'property_name',
            'Property Name',
            'Enter property name',
            'text',
            <Building className="h-4 w-4" />
          )}

          {/* Address */}
          {renderField(
            'address',
            'Address',
            'Enter property address',
            'text',
            <MapPin className="h-4 w-4" />
          )}

          {/* City */}
          {renderField(
            'city',
            'City',
            'Enter city',
            'text'
          )}

          {/* State */}
          {renderField(
            'state',
            'State',
            'Enter state',
            'text'
          )}

          {/* Zip Code */}
          {renderField(
            'zip_code',
            'Zip Code',
            'Enter zip code',
            'text'
          )}

          {/* Number of Units */}
          {renderField(
            'number_of_units',
            'Number of Units',
            'Enter number of units',
            'number'
          )}

          {/* Year Built */}
          {renderField(
            'year_built',
            'Year Built',
            'Enter year built',
            'number',
            <Calendar className="h-4 w-4" />
          )}

          {/* Parking Spaces */}
          {renderField(
            'parking_spaces',
            'Parking Spaces',
            'Enter parking spaces',
            'number',
            <Car className="h-4 w-4" />
          )}

          {/* Gross Square Feet */}
          {renderField(
            'gross_square_feet',
            'Gross Square Feet',
            'Enter gross square feet',
            'number',
            <Ruler className="h-4 w-4" />
          )}

          {/* Asking Price */}
          {renderField(
            'asking_price',
            'Asking Price',
            'Enter asking price',
            'currency',
            <DollarSign className="h-4 w-4" />
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Description
          </Label>
          <Textarea
            id="description"
            value={editedData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
            placeholder="Enter property description"
            rows={3}
            className="w-full"
          />
        </div>

        {/* Market Description */}
        <div className="space-y-2">
          <Label htmlFor="market_description" className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Market Description
          </Label>
          <Textarea
            id="market_description"
            value={editedData.market_description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('market_description', e.target.value)}
            placeholder="Enter market description"
            rows={3}
            className="w-full"
          />
        </div>
      </CardContent>


    </Card>
  );
}
