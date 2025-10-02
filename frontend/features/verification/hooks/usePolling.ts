import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { checkUploadJobStatus } from '@/lib/api/actions/uploadJobStatusCheck';
import { getDealDraft } from '@/lib/api/actions/getDealDraft';
import { useVerificationStore } from '@/features/verification/store';

export interface JobStatus {
  job_id: string;
  deal_id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  stage: string | null;
  attempts: number;
  created_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_text: string | null;
}

interface UseJobPollingOptions {
  onSuccess?: (dealId: string) => void;
  onError?: (error: string) => void;
  onProgress?: (stage: string) => void;
  autoNavigate?: boolean;
  navigateDelay?: number;
}

export function useJobPolling(options: UseJobPollingOptions = {}) {
  const {
    onSuccess,
    onError,
    onProgress,
    autoNavigate = true,
    navigateDelay = 2000
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  const router = useRouter();
  const { initializeFromDealResponse } = useVerificationStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Calculate progress percentage based on stage
  const calculateProgress = useCallback((stage: string | null): number => {
    if (!stage) return 15; // Start at 15% for initial "uploading documents" state

    const stageOrder = [
      'uploading_data',
      'classifying_om',
      'extracting_rent_roll',
      'extracting_t12',
      'structuring_information'
    ];

    const currentIndex = stageOrder.indexOf(stage);
    if (currentIndex === -1) return 15;

    // Calculate percentage: 15% to 80% range
    // 15% (uploading) -> 25% (classifying) -> 40% (RR) -> 55% (T12) -> 80% (structuring)
    const baseProgress = 15;
    const stageProgress = Math.round(((currentIndex + 1) / stageOrder.length) * 65); // 65% range from 15% to 80%
    return baseProgress + stageProgress;
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    isPollingRef.current = false;
  }, []);

  // Poll function
  const pollJob = useCallback(async (jobId: string) => {
    if (!isPollingRef.current) return;

    try {
      const status = await checkUploadJobStatus(jobId);
      setJobStatus(status);

      // Update progress based on status and stage
      if (status.status === 'running' && status.stage) {
        let progressMessage = '';

        // Map backend stages to user-friendly messages
        switch (status.stage) {
          case 'uploading_data':
            progressMessage = 'Processing uploaded documents...';
            break;
          case 'classifying_om':
            progressMessage = 'Analyzing property documents...';
            break;
          case 'extracting_rent_roll':
            progressMessage = 'Extracting rent roll data...';
            break;
          case 'extracting_t12':
            progressMessage = 'Extracting T12 financial data...';
            break;
          case 'structuring_information':
            progressMessage = 'Organizing and structuring data...';
            break;
          default:
            progressMessage = `Processing: ${status.stage}`;
        }

        setCurrentStep(progressMessage);
        setProgressPercentage(calculateProgress(status.stage));
        onProgress?.(status.stage);
      } else if (status.status === 'queued') {
        setCurrentStep('Job queued for processing...');
        setProgressPercentage(15);
      }

      // Handle completion
      if (status.status === 'succeeded' || status.status === 'failed') {
        cleanup();

        if (status.status === 'succeeded') {
          try {
            // Set progress to 100% and show completion message
            setProgressPercentage(100);
            setCurrentStep('Completed - taking you to deal...');

            // Fetch the actual deal data
            const actualDealResponse = await getDealDraft(status.deal_id);

            // Log the response for debugging
            console.log('🔍 getDealDraft Response:', {
              success: actualDealResponse.success,
              message: actualDealResponse.message,
              deal_id: actualDealResponse.deal_id,
              files: actualDealResponse.files,
              property_info: actualDealResponse.property_info,
              structured_t12: actualDealResponse.structured_t12,
              structured_rent_roll: actualDealResponse.structured_rent_roll,
              classification_result: actualDealResponse.classification_result,
              om_file_url: actualDealResponse.om_file_url,
              t12_file_url: actualDealResponse.t12_file_url,
              rent_roll_file_url: actualDealResponse.rent_roll_file_url
            });

            // Initialize the store with the real deal response
            initializeFromDealResponse(actualDealResponse);
            console.log('🔍 Store initialized with deal response. Deal ID:', actualDealResponse.deal_id);

            // Log store state after initialization for debugging
            console.log('🔍 Verification Store State After Initialization:', {
              currentDealId: useVerificationStore.getState().currentDealId,
              propertyDetails: useVerificationStore.getState().propertyDetails,
              t12Data: useVerificationStore.getState().t12Data,
              rentRollData: useVerificationStore.getState().rentRollData,
              dealResponse: useVerificationStore.getState().dealResponse
            });

            // Log final state before navigation
            console.log('🔍 Final Store State Before Navigation:', {
              currentDealId: useVerificationStore.getState().currentDealId,
              hasPropertyDetails: Object.keys(useVerificationStore.getState().propertyDetails).length > 0,
              t12DataLength: useVerificationStore.getState().t12Data.length,
              rentRollDataLength: useVerificationStore.getState().rentRollData.length
            });

            // Call success callback
            onSuccess?.(status.deal_id);

            // Auto-navigate if enabled
            if (autoNavigate) {
              setTimeout(() => {
                router.push('/upload/details');
              }, navigateDelay);
            }
          } catch (error) {
            const errorMessage = 'Upload completed but failed to fetch deal data. Please try refreshing the page.';
            console.error('Error fetching deal data:', error);
            setError(errorMessage);
            onError?.(errorMessage);
          }
        } else if (status.status === 'failed') {
          const errorMessage = status.error_text || 'Job processing failed';
          setError(errorMessage);
          onError?.(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      const errorMessage = 'Failed to check job status';
      setError(errorMessage);
      onError?.(errorMessage);
      cleanup();
    }
  }, [cleanup, onSuccess, onError, onProgress, autoNavigate, navigateDelay, router, initializeFromDealResponse, calculateProgress]);

  // Start polling
  const startPolling = useCallback((jobId: string) => {
    if (!jobId) return;

    // Clean up any existing polling
    cleanup();

    // Start new polling
    setIsPolling(true);
    isPollingRef.current = true;
    setCurrentStep('Uploading documents...');
    setProgressPercentage(15);
    setError(null);

    // Start polling immediately
    pollJob(jobId);

    // Set up interval for continued polling
    intervalRef.current = setInterval(() => {
      pollJob(jobId);
    }, 3000);
  }, [cleanup, pollJob]);

  // Stop polling manually
  const stopPolling = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    isPolling,
    jobStatus,
    currentStep,
    error,
    progressPercentage,

    // Actions
    startPolling,
    stopPolling,

    // Setters (for external state management)
    setCurrentStep,
    setProgressPercentage,

    // Utilities
    isComplete: jobStatus?.status === 'succeeded' || jobStatus?.status === 'failed',
    isSuccess: jobStatus?.status === 'succeeded',
    isFailed: jobStatus?.status === 'failed'
  };
}
