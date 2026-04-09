/** Standard API response envelope */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Provider search filters */
export interface ProviderFilters {
  specialty?: string;
  city?: string;
  minRating?: number;
  minFee?: number;
  maxFee?: number;
  gender?: string;
  availableDate?: string;
  sortBy?: "rating" | "price_asc" | "price_desc" | "reviews";
  page?: number;
  limit?: number;
}
