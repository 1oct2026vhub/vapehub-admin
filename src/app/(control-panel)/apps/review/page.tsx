'use client';
import { useState } from 'react';
import ReviewTable from 'src/@fuse/core/ReviewTable/ReviewTable';
import ReviewHeader from './ReviewHeader';
import { Review } from '@/services/apiReview';
import ReviewCreateModal from './ReviewCreateModal';

function ReviewsPage() {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	const [editingReview, setEditingReview] = useState<Review | null>(null);

	const handleCreateClick = () => {
		setEditingReview(null);
		setIsCreateModalOpen(true);
	};

	const handleEditClick = (review: Review) => {
		setEditingReview(review);
		setIsCreateModalOpen(true);
	};

	const handleModalSuccess = () => {
		// Force refresh the review table by changing the key
		setRefreshKey(prev => prev + 1);
	};

	const handleModalClose = () => {
		setIsCreateModalOpen(false);
		setEditingReview(null);
	};

	return (
		<div className="p-4">
			<ReviewHeader onCreateClick={handleCreateClick} />
			<ReviewTable key={refreshKey} onEditClick={handleEditClick} />
			<ReviewCreateModal
				open={isCreateModalOpen}
				onClose={handleModalClose}
				onSuccess={handleModalSuccess}
				initialData={editingReview}
			/>
		</div>
	);
}

export default ReviewsPage; 