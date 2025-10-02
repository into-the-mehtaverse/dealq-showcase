"use client";

import { useVerificationStore, useVerificationSelectors } from "@/features/verification/store";
import TableViewer from "@/features/verification/shared/table-viewer";

interface VerifyRRProps {
  className?: string;
}

export default function VerifyRR({
  className = ""
}: VerifyRRProps) {
  // Get store data and actions
  const rentRollData = useVerificationSelectors.useRentRollData();
  const hasRentRollData = useVerificationSelectors.useHasRentRollData();
  const { updateRentRollData } = useVerificationStore();

  return (
    <div className={className}>
      {hasRentRollData ? (
        <TableViewer
          data={rentRollData}
          title="Rent Roll Data"
          description="Unit-by-unit rent roll information"
          isEditable={true}
          onDataChange={(newData) => updateRentRollData(newData)}
          dataType="structured"
          sheetName="Rent Roll"
          columnValidation={{
            status: {
              type: 'select',
              options: ['Occupied', 'Vacant'],
              required: true
            }
          }}
        />
      ) : (
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rent Roll Data Found</h3>
          <p className="text-gray-600">
            Rent roll data will appear here once it&apos;s extracted from your uploaded documents.
          </p>
        </div>
      )}
    </div>
  );
}
