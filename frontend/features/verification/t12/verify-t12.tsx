"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getModel } from "@/lib/api/actions/getModel";
import { GetModelRequest } from "@/types/api/getModel";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, Loader2 } from "lucide-react";
import { useVerificationStore, useVerificationSelectors } from "@/features/verification/store";
import TableViewer from "@/features/verification/shared/table-viewer";
import CategoryView from "@/features/verification/t12/category-view";

interface VerifyT12Props {
  className?: string;
}

export default function VerifyT12({
  className = ""
}: VerifyT12Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'category'>('category');

  // Get store data and actions
  const dealResponse = useVerificationSelectors.useDealResponse();
  const propertyDetails = useVerificationSelectors.usePropertyDetails();
  const t12Data = useVerificationSelectors.useT12Data();
  const rentRollData = useVerificationSelectors.useRentRollData();
  const hasT12Data = useVerificationSelectors.useHasT12Data();
  const { updateT12Data } = useVerificationStore();

  // Get computed financials from store
  const computedFinancials = useVerificationSelectors.useComputedFinancials();

  const handleSubmit = async () => {
    if (!dealResponse) {
      alert('No deal data available');
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform APIUploadResponse to GetModelRequest format
      const modelRequest: GetModelRequest = {
        // Property information from verification store
        property_name: propertyDetails.property_name,
        address: propertyDetails.address,
        city: propertyDetails.city,
        state: propertyDetails.state,
        zip_code: propertyDetails.zip_code,
        number_of_units: propertyDetails.number_of_units,
        year_built: propertyDetails.year_built,
        parking_spaces: propertyDetails.parking_spaces,
        gross_square_feet: propertyDetails.gross_square_feet,
        asking_price: propertyDetails.asking_price,

        // Financial data from computed financials
        revenue: computedFinancials?.grossIncome || 0,
        expenses: computedFinancials?.totalExpenses || 0,

        // Structured data - use current data from store
        structured_t12: t12Data,
        structured_rent_roll: rentRollData,

        // Deal information
        deal_id: dealResponse.deal_id,
      };

      console.log('Submitting model request:', modelRequest);

      // Call the API to generate the model
      const result = await getModel(modelRequest);

      console.log('Model generation successful:', result);

      // Get the dealId from the deal response
      const dealId = dealResponse.deal_id;

      // Show success message
      setMessage({ type: 'success', text: 'Model generated successfully! Redirecting to deal dashboard...' });

      // Route to the deal detail page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/deals/${dealId}`);
      }, 1500);
    } catch (error) {
      console.error('Error generating model:', error);
      setMessage({ type: 'error', text: `Error generating model: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      {/* View Toggle */}
      {hasT12Data && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">View Mode</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('category')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'category'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Category View
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sheet View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* T12 Data Display */}
      {hasT12Data ? (
        viewMode === 'table' ? (
          <TableViewer
            data={t12Data}
            title="T12 Financial Data"
            description="Trailing 12 months financial information"
            isEditable={true}
            onDataChange={(newData) => updateT12Data(newData)}
            dataType="structured"
            sheetName="T12"
          />
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700">T12 Financial Data</h3>
              <p className="text-xs text-gray-500">Trailing 12 months financial information grouped by category</p>
            </div>
            <CategoryView
              data={t12Data}
              onDataChange={(newData) => updateT12Data(newData)}
            />
          </div>
        )
      ) : (
        <div className="p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No T12 Data Found</h3>
          <p className="text-gray-600">
            T12 data will appear here once it&apos;s extracted from your uploaded documents.
          </p>
          {dealResponse && !t12Data.length && (
            <p className="text-red-600 mt-2">
              Deal data exists but structured_t12 field is missing or empty.
            </p>
          )}
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setMessage(null)}
                className="inline-flex text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Model Button */}
      <div className="flex justify-center mt-8">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          size="lg"
          className="px-8 py-4 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Generating Model...
            </>
          ) : (
            <>
              <Calculator className="h-5 w-5 mr-3" />
              Generate Model
              <ArrowRight className="h-5 w-5 ml-3" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
