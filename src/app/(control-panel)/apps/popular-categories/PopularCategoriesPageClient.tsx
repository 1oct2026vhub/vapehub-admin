"use client";

import { useCallback, useRef, useState } from "react";
import PopularCategoriesHeader from "./components/PopularCategoriesHeader";
import PopularCategoriesList from "./components/PopularCategoriesList";

function PopularCategoriesPageClient() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreateClick = () => {
    setIsCreateOpen(true);
  };

  const handleCreateClosed = () => {
    setIsCreateOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="p-4">
      <br />
      <PopularCategoriesHeader onCreateClick={handleCreateClick} />
      <PopularCategoriesList 
        refreshTrigger={refreshTrigger} 
        openCreate={isCreateOpen}
        onCreateClosed={handleCreateClosed}
      />
    </div>
  );
}

export default PopularCategoriesPageClient;

