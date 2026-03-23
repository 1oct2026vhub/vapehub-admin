import { useState, useEffect, useCallback, useMemo } from 'react';
import { MRT_ColumnDef } from 'material-react-table';

/**
 * A custom hook for managing column ordering with localStorage persistence
 * @param tableId - Unique ID for the table to store/retrieve column order
 * @param defaultColumns - Default column definitions
 * @returns An object with columns, columnOrder, and handlers for column ordering
 */
const getColKey = <T extends Record<string, any>>(col: MRT_ColumnDef<T>): string =>
  (col.id ?? col.accessorKey) as string;

const useColumnOrder = <T extends Record<string, any>>(
  tableId: string,
  defaultColumns: MRT_ColumnDef<T>[]
) => {
  const storageKey = `table_columns_order_${tableId}`;
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  const defaultOrder = useMemo(
    () => defaultColumns.map(getColKey).filter(Boolean),
    [defaultColumns]
  );

  // Load column order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(storageKey);
    if (savedOrder) {
      try {
        const parsedOrder: string[] = JSON.parse(savedOrder);

        // Only keep saved keys that still exist in the current defaultOrder
        const knownSaved = parsedOrder.filter((key) => defaultOrder.includes(key));
        // Find columns added since the order was saved
        const newCols = defaultOrder.filter((key) => !parsedOrder.includes(key));
        // Find columns whose relative order has changed vs the default
        const knownSavedFiltered = knownSaved.filter((key) => defaultOrder.includes(key));
        const defaultFiltered = defaultOrder.filter((key) => knownSaved.includes(key));
        const orderChanged = knownSavedFiltered.join(",") !== defaultFiltered.join(",");

        if (newCols.length === 0 && !orderChanged) {
          // Nothing new and no reorder — use saved order as-is
          setColumnOrder(knownSaved);
        } else if (newCols.length > 0) {
          // Insert each new column at its correct default position by finding
          // the closest preceding column that already exists in the result.
          const result = [...knownSaved];
          newCols.forEach((newKey) => {
            const defaultIdx = defaultOrder.indexOf(newKey);
            let insertAt = result.length; // fallback: append
            for (let i = defaultIdx - 1; i >= 0; i--) {
              const precedingKey = defaultOrder[i];
              const posInResult = result.indexOf(precedingKey);
              if (posInResult !== -1) {
                insertAt = posInResult + 1;
                break;
              }
            }
            result.splice(insertAt, 0, newKey);
          });
          setColumnOrder(result);
          // Persist the corrected order so stale data doesn't re-appear
          localStorage.setItem(storageKey, JSON.stringify(result));
        } else {
          // Default order has changed (e.g. column moved) — reset to default
          setColumnOrder(defaultOrder);
          localStorage.setItem(storageKey, JSON.stringify(defaultOrder));
        }
      } catch (error) {
        console.error(`Error parsing saved column order for ${tableId}:`, error);
        setColumnOrder(defaultOrder);
      }
    } else {
      setColumnOrder(defaultOrder);
    }
  }, [defaultOrder, storageKey]);

  // Handle column reordering
  const handleColumnOrderChange = useCallback((newColumnOrder: string[]) => {
    setColumnOrder(newColumnOrder);
    localStorage.setItem(storageKey, JSON.stringify(newColumnOrder));
  }, [storageKey]);

  // Apply the column order
  const columns = useMemo<MRT_ColumnDef<T>[]>(() => {
    if (!columnOrder.length) return defaultColumns;

    const orderedColumns: MRT_ColumnDef<T>[] = [];

    // First add columns that exist in both columnOrder and defaultColumns
    columnOrder.forEach(key => {
      const column = defaultColumns.find(col => getColKey(col) === key);
      if (column) {
        orderedColumns.push(column);
      }
    });

    // Then add any new columns that exist in defaultColumns but not in columnOrder
    defaultColumns.forEach(column => {
      if (!columnOrder.includes(getColKey(column))) {
        orderedColumns.push(column);
      }
    });

    return orderedColumns;
  }, [defaultColumns, columnOrder]);

  // Column order change handler that works with Material React Table's onColumnOrderChange
  const onColumnOrderChange = useCallback((updaterFn: any) => {
    // Material React Table passes a function that accepts the old order and returns the new order
    const newColumnOrder = typeof updaterFn === 'function' 
      ? updaterFn(columnOrder)
      : updaterFn;
      
    handleColumnOrderChange(newColumnOrder);
  }, [columnOrder, handleColumnOrderChange]);

  return {
    columns,
    columnOrder,
    handleColumnOrderChange,
    onColumnOrderChange
  };
};

export default useColumnOrder; 