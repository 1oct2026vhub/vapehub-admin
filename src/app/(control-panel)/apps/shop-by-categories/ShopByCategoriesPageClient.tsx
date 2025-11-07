"use client";

import { useCallback, useRef, useState } from "react";
import ShopByCategoriesHeader from "./components/ShopByCategoriesHeader";
import ShopByCategoriesList from "./components/ShopByCategoriesList";

function ShopByCategoriesPageClient() {
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
      <ShopByCategoriesHeader onCreateClick={handleCreateClick} />
      <ShopByCategoriesList 
        refreshTrigger={refreshTrigger} 
        openCreate={isCreateOpen}
        onCreateClosed={handleCreateClosed}
      />
    </div>
  );
}

export default ShopByCategoriesPageClient;

