import i18n from '@i18n';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import ar from './navigation-i18n/ar';
import en from './navigation-i18n/en';
import tr from './navigation-i18n/tr';

i18n.addResourceBundle('en', 'navigation', en);
i18n.addResourceBundle('tr', 'navigation', tr);
i18n.addResourceBundle('ar', 'navigation', ar);

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'example-component',
		title: 'Dashboard',
		// translate: 'EXAMPLE',
		type: 'item',
		icon: 'heroicons-outline:squares-2x2',
		url: '/dashboards/project'
	},
	{
		id: 'apps.ecommerce',
		title: 'Procucts',
		type: 'collapse',
		icon: 'heroicons-outline:shopping-bag',
		children: [
			{
				id: 'product',
				title: 'Product',
				type: 'item',
				url: '/apps/product',
				end: true
			},
			{
				id: 'brand',
				title: 'Product Brand',
				type: 'item',
				url: '/apps/product-brand',
				end: true
			},
			{
				id: 'category',
				title: 'Product Category',
				type: 'item',
				url: '/apps/product-category'
			},
		]
	},
	{
		id: 'user',
		title: 'Users',
		type: 'item',
		icon: 'heroicons-outline:user-group', // Clipboard List Icon for Orders
		url: '/apps/users'
	},
	{
		id: 'customer',
		title: 'Customers',
		type: 'item',
		icon: 'heroicons-outline:users', // Clipboard List Icon for Orders
		url: '/apps/customer'
	},
	{
		id: 'order',
		title: 'Order List',
		type: 'item',
		icon: 'heroicons-outline:shopping-cart', // Clipboard List Icon for Orders
		url: ''
	},
	// {
	// 	id: 'apps.forgotPassword',
	// 	title: 'Authentication',
	// 	type: 'collapse',
	// 	icon: 'heroicons-outline:lock-closed',
	// 	children: [
	// 		{
	// 			id: 'forgotPassword',
	// 			title: 'Forgot Password',
	// 			type: 'item',
	// 			url: '/pages/authentication/forgot-password',
	// 			end: true
	// 		}
	// 	]
	// }
];

export default navigationConfig;


