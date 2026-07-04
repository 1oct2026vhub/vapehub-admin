import axiosInstance from "@/utils/axiosApi";


// Generic fetcher for GET requests
export const fetcher = (url: string, params = {}) => {
  return axiosInstance.get(url, { params }).then((res) => res.data);
};

// Generic poster for POST requests
export const poster = (url: string, data: any) =>
  axiosInstance.post(url, data).then((res) => res.data);

// Generic updater for PUT requests
export const updater = (url: string, data: any) =>
  axiosInstance.put(url, data).then((res) => res.data);

// Generic deleter for DELETE requests
export const deleter = (url: string) =>
  axiosInstance.delete(url).then((res) => res.data);

// Interface for FAQ parameters
export interface FetchFaqsParams {
  page?: number;
  limit?: number;
  search?: string;
  entity_type?: string;
  entity_id?: number;
  deleted?: boolean;
  sortBy?: 'id' | 'question' | 'entity_type' | 'createdAt' | 'updatedAt';
  order?: 'ASC' | 'DESC';
}

// Interface for a single FAQ item
export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  entity_type: string;
  entity_id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  // Add any other properties that an FAQ item might have
}

// Interface for the data object within the API response
interface FaqsDataPayload {
  total: number;
  page: number;
  limit: number;
  results: FaqItem[]; // Changed from faqs to results
  // sortBy and order are not in the example "data" object, assuming they are not here
}

// Interface for the overall API response
export interface FaqsApiResponse {
  success: boolean;
  message: string;
  data: FaqsDataPayload;
}

export interface FaqApiResponse {
  success: boolean;
  message: string;
  data: FaqItem;
}

// Interface for creating a new FAQ
export interface CreateFaqPayload {
  entity_type: string;
  entity_id: number;
  question: string;
  answer: string;
}

// Interface for the response when an FAQ is created successfully (201)
// Assuming it might return the created FAQ or a simple success message.
// For now, let's assume a generic success response, adjust if needed.
export interface CreateFaqResponse {
  success: boolean;
  message: string;
  data?: FaqItem; // Optional: The created FAQ item might be returned
}

// Function to fetch FAQs
export const getFaqs = (params: FetchFaqsParams = {}): Promise<FaqsApiResponse> => {
  return fetcher("/api/admin/faqs", params);
};

export const getFaqById = (id: number): Promise<FaqApiResponse> => {
  return fetcher(`/api/admin/faqs/${id}`);
};

// Function to create a new FAQ
export const createFaq = (payload: CreateFaqPayload): Promise<CreateFaqResponse> => {
  return poster("/api/admin/faqs", payload);
};

// Interface for updating an existing FAQ (payload might be partial or full based on API)
// Assuming it's similar to CreateFaqPayload for now for the body.
export interface UpdateFaqPayload {
  entity_type?: string; // Optional if not all fields need to be updated
  entity_id?: number;   // Optional
  question?: string;    // Optional
  answer?: string;      // Optional
}

// Interface for the response when an FAQ is updated successfully
// Assuming it might return the updated FAQ or a simple success message.
export interface UpdateFaqResponse {
  success: boolean;
  message: string;
  data?: FaqItem; // Optional: The updated FAQ item might be returned
}

// Interface for the response when an FAQ is deleted successfully
export interface DeleteFaqResponse {
  success: boolean;
  message: string;
  // No data typically returned on delete, but can be added if API does
}

// Interface for the response when an FAQ is restored (can be generic)
export interface RestoreFaqResponse {
  success: boolean;
  message: string;
  data?: FaqItem; // Optional: The restored FAQ item might be returned
}

// Function to update an existing FAQ
export const updateFaq = (id: number, payload: UpdateFaqPayload): Promise<UpdateFaqResponse> => {
  return updater(`/api/admin/faqs/${id}`, payload);
};

// Function to delete an FAQ
export const deleteFaq = (id: number): Promise<DeleteFaqResponse> => {
  return deleter(`/api/admin/faqs/${id}`);
};

// Function to restore a soft-deleted FAQ
export const restoreFaq = (id: number): Promise<RestoreFaqResponse> => {
  return updater(`/api/admin/faqs/${id}/restore`, {}); // PUT request with empty payload
};

