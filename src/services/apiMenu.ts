import axiosInstance from '@/utils/axiosApi';

export interface MenuItem {
  id: number;
  label: string;
  status: 'active' | 'inactive';
  entity_type?: 'brand' | 'category' | 'product' | 'blog' | 'page' | 'deal';
  parent_id?: number | null;
  children?: MenuItem[];
  menu_parent?: number | null;
  entity_id?: number;
  original?: string;
  show_image?: boolean;
  image?: string;
  image_url?: string;
  icon?: string;
  hide_text?: boolean;
  hide_mobile_view?: boolean;
  hide_desktop_view?: boolean;
  icon_position?: 'left' | 'right';
  list_on_active_product?: boolean;
  [key: string]: any; // For any additional fields
}

export interface FetchMenusParams {
  status?: boolean;
  entity_type?: 'brand' | 'category' | 'product' | 'blog' | 'page' | 'deal';
  label?: string;
}

export interface MenusApiResponse {
  success: boolean;
  message: string;
  data: MenuItem[];
}

export type CreateMenuPayload = Omit<MenuItem, 'id' | 'children' | 'status'>;
export type UpdateMenuPayload = Partial<CreateMenuPayload>;

/**
 * Fetches a list of menus with tree structure.
 * GET /api/admin/menus
 */
export const getMenus = async (params: FetchMenusParams = {}): Promise<MenuItem[]> => {
  try {
    const response = await axiosInstance.get<MenusApiResponse>('/api/admin/menus', { params });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch menus');
  } catch (error: any) {
    console.error('Error fetching menus:', error);
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while fetching menus.';
    throw new Error(errorMessage);
  }
};

/**
 * Creates a new menu item.
 * POST /api/admin/menus
 */
export const createMenu = async (payload: CreateMenuPayload): Promise<MenuItem> => {
  try {
    const response = await axiosInstance.post('/api/admin/menus', payload);
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while creating the menu.';
    throw new Error(errorMessage);
  }
};

/**
 * Updates an existing menu item.
 * PUT /api/admin/menus/{id}
 */
export const updateMenu = async (id: number, payload: UpdateMenuPayload): Promise<MenuItem> => {
  try {
    const response = await axiosInstance.put(`/api/admin/menus/${id}`, payload);
    return response.data.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while updating the menu.';
    throw new Error(errorMessage);
  }
};

/**
 * Deletes a menu item.
 * DELETE /api/admin/menus/{id}
 */
export const deleteMenu = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/admin/menus/${id}`);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while deleting the menu.';
    throw new Error(errorMessage);
  }
};

export interface ReorderMenuItemPayload {
  id: number;
  order: number;
  menu_parent: number | null;
}

/**
 * Reorders menu items.
 * PATCH /api/admin/menus/reorder
 */
export const reorderMenus = async (payload: ReorderMenuItemPayload[]): Promise<void> => {
  try {
    await axiosInstance.patch('/api/admin/menus/reorder', payload);
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while reordering menus.';
    throw new Error(errorMessage);
  }
};

/**
 * Syncs a product to the menu.
 * POST /api/admin/menus/sync-product
 */
export const syncProductToMenu = async (productId: number): Promise<any> => {
  try {
    const response = await axiosInstance.post('/api/admin/menus/sync-product', { productId });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred while syncing product to menu.';
    throw new Error(errorMessage);
  }
};
