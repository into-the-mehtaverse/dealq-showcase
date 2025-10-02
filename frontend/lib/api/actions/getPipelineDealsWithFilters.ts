'use server'

import { createClient } from '@/lib/supabase/serverClient';
import { DealSummary } from '@/types/api/dealSummary';
import { endpoints } from '@/lib/api/endpoints';

// Define the response type for pipeline deals with filters
interface PipelineDealsWithFiltersResponse {
  deals: DealSummary[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// Define the filter parameters interface
interface DealFilters {
  status?: 'active' | 'draft' | 'dead';
  min_units?: number;
  max_units?: number;
  min_price?: number;
  max_price?: number;
  min_year_built?: number;
  max_year_built?: number;
  cities?: string[];
  states?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Fetches deals with flexible filtering, sorting, and pagination for the pipeline
 * @param filters - Optional filter parameters
 * @param page - Page number (1-based)
 * @param limit - Number of deals per page (default: 12)
 * @returns Promise<PipelineDealsWithFiltersResponse> - Deals and pagination data
 */
export async function getPipelineDealsWithFilters(
  filters: DealFilters = {},
  page: number = 1,
  limit: number = 12
): Promise<PipelineDealsWithFiltersResponse> {
  try {
    // Create server-side Supabase client
    const supabase = await createClient();

    // Get the current user and session for authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (userError || sessionError) {
      throw new Error(`Authentication error: ${userError?.message || sessionError?.message}`);
    }

    if (!user || !session) {
      throw new Error('No authenticated user found');
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Add pagination parameters
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    // Add filter parameters if provided
    if (filters.status) {
      queryParams.append('status', filters.status);
    }

    if (filters.min_units !== undefined) {
      queryParams.append('min_units', filters.min_units.toString());
    }

    if (filters.max_units !== undefined) {
      queryParams.append('max_units', filters.max_units.toString());
    }

    if (filters.min_price !== undefined) {
      queryParams.append('min_price', filters.min_price.toString());
    }

    if (filters.max_price !== undefined) {
      queryParams.append('max_price', filters.max_price.toString());
    }

    if (filters.min_year_built !== undefined) {
      queryParams.append('min_year_built', filters.min_year_built.toString());
    }

    if (filters.max_year_built !== undefined) {
      queryParams.append('max_year_built', filters.max_year_built.toString());
    }

    if (filters.cities && filters.cities.length > 0) {
      filters.cities.forEach(city => {
        queryParams.append('cities', city);
      });
    }

    if (filters.states && filters.states.length > 0) {
      filters.states.forEach(state => {
        queryParams.append('states', state);
      });
    }

    if (filters.sort_by) {
      queryParams.append('sort_by', filters.sort_by);
    }

    if (filters.sort_order) {
      queryParams.append('sort_order', filters.sort_order);
    }

    // Make API call to backend pipeline filter endpoint
    const response = await fetch(`${endpoints.pipelineDealsFilter}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const pipelineData: PipelineDealsWithFiltersResponse = await response.json();
    return pipelineData;

  } catch (error) {
    console.error('Error fetching pipeline deals with filters:', error);
    throw error;
  }
}
