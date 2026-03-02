export const emailBuilderApi = {
  // Fetch products for email builder (Grid, List, Featured Product blocks)
  getProducts: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            name: 'Wireless Bluetooth Headphones',
            price: '$79.99',
            category: 'Electronics',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            description: 'Premium sound quality with noise cancellation.',
          },
          {
            id: 2,
            name: 'Classic Leather Watch',
            price: '$149.00',
            category: 'Accessories',
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            description: 'Timeless design for every occasion.',
          },
          {
            id: 3,
            name: 'Minimalist Backpack',
            price: '$59.99',
            category: 'Bags',
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            description: 'Lightweight and durable for daily use.',
          },
          {
            id: 4,
            name: 'Running Sneakers',
            price: '$120.00',
            category: 'Footwear',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            description: 'Comfortable fit for long runs.',
          },
          {
            id: 5,
            name: 'Stainless Steel Water Bottle',
            price: '$29.99',
            category: 'Lifestyle',
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            description: 'Keep drinks cold for 24 hours.',
          },
          {
            id: 6,
            name: 'Portable Power Bank',
            price: '$45.00',
            category: 'Electronics',
            image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            description: 'Fast charging for all your devices.',
          },
        ]);
      }, 800);
    });
  },
};

export default emailBuilderApi;
