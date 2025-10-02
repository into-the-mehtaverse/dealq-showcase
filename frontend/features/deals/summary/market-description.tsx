import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useDealSelectors, useDealActions } from './store';

interface MarketDescriptionProps {
  className?: string;
  marketDescription?: string;
}

export default function MarketDescription({ className = '', marketDescription }: MarketDescriptionProps) {
  // Get store data and actions
  const isEditing = useDealSelectors.useIsEditing();
  const editableFields = useDealSelectors.useEditableFields();
  const { updateEditableField } = useDealActions();

  // Handle market description changes - directly update store
  const handleMarketDescriptionChange = (value: string) => {
    updateEditableField('market_description', value);
  };

  return (
    <Card className={className}>
            <CardHeader>
        <CardTitle className="text-xl">Market Description</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          {isEditing ? (
            <Textarea
              value={editableFields.market_description || ''}
              onChange={(e) => handleMarketDescriptionChange(e.target.value)}
              placeholder="Enter market description..."
              className="min-h-[120px] resize-none"
            />
          ) : (
            marketDescription ? (
              <p>{marketDescription}</p>
            ) : (
              <p className="text-gray-500 italic">
                No market description available.
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
