import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useDealSelectors, useDealActions } from './store';

interface DealDescriptionProps {
  className?: string;
  description?: string;
}

export default function DealDescription({ className = '', description }: DealDescriptionProps) {
  // Get store data and actions
  const isEditing = useDealSelectors.useIsEditing();
  const editableFields = useDealSelectors.useEditableFields();
  const { updateEditableField } = useDealActions();

  // Handle description changes - directly update store
  const handleDescriptionChange = (value: string) => {
    updateEditableField('description', value);
  };

  return (
    <Card className={className}>
            <CardHeader>
        <CardTitle className="text-xl">Deal Description</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          {isEditing ? (
            <Textarea
              value={editableFields.description || ''}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Enter deal description..."
              className="min-h-[120px] resize-none"
            />
          ) : (
            description ? (
              <p>{description}</p>
            ) : (
              <p className="text-gray-500 italic">
                No deal description available.
              </p>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
