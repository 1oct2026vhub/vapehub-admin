export interface Carousel {
  id: number;
  display_order: number;
  image_url: string;
  image_url_low: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  redirect_url: string;
  updated_by: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CarouselCreate {
  image_url: string;
  image_url_low: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  redirect_url: string;
}

export interface CarouselUpdate {
  image_url?: string;
  image_url_low?: string;
  title?: string;
  description?: string;
  status?: 'active' | 'inactive';
  redirect_url?: string;
}

export interface CarouselReorder {
  id: number;
  display_order: number;
} 