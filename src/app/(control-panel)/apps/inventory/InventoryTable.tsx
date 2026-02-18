'use client';
import {
    Paper,
    Avatar,
    Box,
    TextField,
    InputAdornment,
    ListItemIcon,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Menu,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Product, ProductsParams, getProductVariants, ProductVariant } from '@/services/apiInventory';
import { bulkUpdateMultipleVariants, type BulkUpdateMultipleVariantItem } from '@/services/apiProductVariant';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import DataTable from '@/components/data-table/DataTable';
import { type MRT_ColumnDef } from 'material-react-table';
import ClearFiltersButton from '@/components/Shared/ClearFiltersButton';
import { useRouter } from 'next/navigation';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { usePageState } from '@/hooks/usePageState';
import { MenuItem } from '@mui/material';
import GenerateReportButton from './components/GenerateReportButton';
import TablePagination from '@/components/Shared/TablePagination';
import { useSnackbar } from '@/contexts/SnackbarContext';
import AppButton from '@/components/Shared/AppButton';
interface InventoryTableProps {
    products: Product[];
    loading: boolean;
    params: ProductsParams;
    onParamsChange: (params: Partial<ProductsParams>) => void;
    page: number;
    totalPages: number;
    limit: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onProductStockUpdate?: (productId: number, totalStock: number) => void;
}
const BULK_EDIT_STORAGE_KEY = 'inventoryBulkEditVariants';

const getEditKey = (productId: number, variantId: number) => `${productId}-${variantId}`;

const InventoryTable: React.FC<InventoryTableProps> = ({
    products,
    loading,
    params,
    onParamsChange,
    page,
    totalPages,
    limit,
    totalRecords,
    onPageChange,
    onLimitChange,
    onProductStockUpdate,
}) => {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const lastToggledRowIdRef = useRef<string | null>(null);
    const isManualExpansionRef = useRef(false); // Track if expansion was due to user click (guards effects)
    const hasRestoredScrollPositionRef = useRef(false); // Track if we've restored scroll position on return
    const hasInitializedVariantsRef = useRef(false); // Track if we've initialized variants on mount
    const isInitialMountRef = useRef(true); // Track initial mount
    
    // Use session storage for filter state, expanded rows, variants data, and pagination
    const [pageState, setPageState, clearPageState] = usePageState(
        "inventoryTable",
        {
            search: '',
            expandedRows: {} as Record<string, boolean>,
            variantsData: {} as Record<number, ProductVariant[]>,
            variantsDataTimestamps: {} as Record<number, number>, // Track when variants were last fetched
            expandedProductId: null as number | null, // Store the opened accordion's productId
            page: 1,
            lastStockUpdateTime: null as number | null, // Track when stock was last updated
        }
    );

    // Use pageState values directly
    const { search, expandedRows: savedExpandedRows, variantsData: savedVariantsData, variantsDataTimestamps: savedVariantsDataTimestamps, expandedProductId: savedExpandedProductId, page: savedPage, lastStockUpdateTime: savedLastStockUpdateTime } = pageState;
    
    // Helper functions to update pageState
    const setSearch = (value: string) => setPageState(prev => ({ ...prev, search: value }));
    const setPage = (value: number) => setPageState(prev => ({ ...prev, page: value }));
    
    // Initialize page from session storage or use prop
    // Sync saved page with parent component on mount if different
    useEffect(() => {
        if (savedPage && savedPage !== page) {
            // If we have a saved page that differs from prop, notify parent to sync
            onPageChange(savedPage);
        } else if (!savedPage && page !== 1) {
            // If no saved page but prop is not 1, sync it to pageState
            setPage(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount
    
    // Sync page from props with pageState when prop changes externally (e.g., parent resets)
    useEffect(() => {
        if (page !== savedPage) {
            setPage(page);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]); // Only sync when prop changes
    
    // Wrapper for onPageChange that updates both session storage and notifies parent
    const handlePageChange = (newPage: number) => {
        isManualExpansionRef.current = false;
        hasRestoredScrollPositionRef.current = false; // Reset scroll restoration flag on page change
        setPage(newPage); // Update session storage
        onPageChange(newPage); // Notify parent
    };
    
    // Use saved expanded rows from session storage, fallback to empty object
    // For accordion behavior, only keep the first expanded product (or most recent)
    const getInitialExpandedRows = (): Record<string, boolean> => {
        if (!savedExpandedRows || Object.keys(savedExpandedRows).length === 0) {
            return {};
        }
        // For accordion, only restore the first expanded product
        const firstExpanded = Object.entries(savedExpandedRows).find(([_, isExpanded]) => isExpanded);
        return firstExpanded ? { [firstExpanded[0]]: true } : {};
    };
    
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(getInitialExpandedRows());
    
    // Sync expandedRows with pageState when it changes (debounced to avoid too many updates)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Extract the expanded productId from expandedRows
            const expandedProductIdStr = Object.keys(expandedRows).find((id) => expandedRows[id]);
            const expandedProductId = expandedProductIdStr ? parseInt(expandedProductIdStr, 10) : null;
            
            setPageState(prev => ({ 
                ...prev, 
                expandedRows,
                expandedProductId: Number.isFinite(expandedProductId) ? expandedProductId : null
            }));
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [expandedRows, setPageState]);

    // Restore scroll position to the opened accordion when returning to this page
    useEffect(() => {
        // Only restore if we haven't already done so and we have a saved expanded productId
        if (hasRestoredScrollPositionRef.current) return;
        if (!savedExpandedProductId) return;
        if (!products || products.length === 0) return;
        
        // Don't restore if user manually expanded (handled by isManualExpansionRef)
        if (isManualExpansionRef.current) return;

        // Check if the saved productId matches the currently expanded row
        const expandedProductIdStr = Object.keys(expandedRows).find((id) => expandedRows[id]);
        if (!expandedProductIdStr) return;
        
        const expandedProductId = parseInt(expandedProductIdStr, 10);
        if (!Number.isFinite(expandedProductId) || expandedProductId !== savedExpandedProductId) return;

        // Mark as restored to prevent multiple scrolls
        hasRestoredScrollPositionRef.current = true;

        // Helper to find scrollable parent
        const findScrollableParent = (element: HTMLElement): HTMLElement | Window => {
            let parent: HTMLElement | null = element.parentElement;
            while (parent) {
                const style = window.getComputedStyle(parent);
                const overflowY = style.overflowY;
                if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return window;
        };

        // Retry mechanism with more attempts and better timing
        const tryScrollToAccordion = (attempt: number = 0) => {
            const toggleEl = document.querySelector(
                `[data-inventory-row-toggle="${expandedProductIdStr}"]`,
            ) as HTMLElement | null;
            
            if (toggleEl && toggleEl.offsetParent !== null) {
                // Element is visible and rendered
                // Use multiple requestAnimationFrame calls to ensure layout is stable
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // Get the row element (parent tr)
                        const rowElement = toggleEl.closest('tr') as HTMLElement | null;
                        const targetElement = rowElement || toggleEl;
                        
                        if (targetElement) {
                            // Find the scrollable container
                            const scrollContainer = findScrollableParent(targetElement);
                            
                            // Get element position relative to scroll container
                            const rect = targetElement.getBoundingClientRect();
                            
                            if (scrollContainer === window) {
                                // Window scrolling
                                const elementTop = rect.top + window.pageYOffset;
                                const scrollPosition = elementTop - 100; // 100px padding from top
                                
                                window.scrollTo({
                                    top: Math.max(0, scrollPosition),
                                    behavior: 'smooth'
                                });
                            } else {
                                // Container scrolling
                                const containerRect = (scrollContainer as HTMLElement).getBoundingClientRect();
                                const relativeTop = rect.top - containerRect.top + (scrollContainer as HTMLElement).scrollTop;
                                const scrollPosition = relativeTop - 100; // 100px padding from top
                                
                                (scrollContainer as HTMLElement).scrollTo({
                                    top: Math.max(0, scrollPosition),
                                    behavior: 'smooth'
                                });
                            }
                            
                            // Fallback: also use scrollIntoView after a delay
                            setTimeout(() => {
                                if (targetElement) {
                                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, 200);
                        }
                    });
                });
            } else if (attempt < 25) {
                // Retry if element not found yet (max 25 attempts = ~2.5 seconds)
                setTimeout(() => tryScrollToAccordion(attempt + 1), 100);
            }
        };

        // Start the scroll restoration after ensuring page is loaded
        // Use a longer initial delay to ensure all components are rendered
        const startScroll = () => {
            if (document.readyState === 'complete') {
                // Page already loaded, wait a bit for React to finish rendering
                setTimeout(() => tryScrollToAccordion(0), 500);
            } else {
                // Wait for page load
                window.addEventListener('load', () => {
                    setTimeout(() => tryScrollToAccordion(0), 500);
                }, { once: true });
            }
        };
        
        startScroll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products.length, expandedRows, savedExpandedProductId]);
    
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const lastSearchRef = useRef<string | undefined>(undefined);
    
    // Initialize variantsData from session storage
    const [variantsData, setVariantsData] = useState<Record<number, ProductVariant[]>>(
        savedVariantsData || {}
    );
    
    // Helper function to check if variants data is stale (older than last stock update)
    // Use refs to prevent dependency changes from causing re-renders
    const lastStockUpdateTimeRef = useRef(savedLastStockUpdateTime);
    const variantsTimestampsRef = useRef(savedVariantsDataTimestamps);
    
    // Update refs when values change
    useEffect(() => {
        lastStockUpdateTimeRef.current = savedLastStockUpdateTime;
        variantsTimestampsRef.current = savedVariantsDataTimestamps;
    }, [savedLastStockUpdateTime, savedVariantsDataTimestamps]);
    
    const isVariantsDataStale = useCallback((productId: number): boolean => {
        const lastUpdateTime = lastStockUpdateTimeRef.current;
        if (!lastUpdateTime) return false; // No stock updates yet, not stale
        const variantTimestamp = variantsTimestampsRef.current?.[productId];
        if (!variantTimestamp) return true; // No timestamp means data is stale
        return variantTimestamp < lastUpdateTime;
    }, []); // No dependencies - uses refs instead
    
    // Track if we're updating from API to prevent sync loop
    const isUpdatingFromApiRef = useRef(false);
    
    // Sync variantsData to session storage when it changes (only for expanded product)
    // Use debounce to prevent infinite loops
    useEffect(() => {
        // Skip if we're updating from API (handleRowExpand handles its own storage update)
        if (isUpdatingFromApiRef.current) {
            return;
        }
        
        const timeoutId = setTimeout(() => {
            const expandedProductId = Object.keys(expandedRows).find(id => expandedRows[id]);
            if (expandedProductId) {
                const productId = parseInt(expandedProductId);
                const currentVariantsData: Record<number, ProductVariant[]> = {};
                const currentTimestamps: Record<number, number> = {};
                if (variantsData[productId]) {
                    currentVariantsData[productId] = variantsData[productId];
                    // Only update timestamp if variants actually changed
                    const existingTimestamp = savedVariantsDataTimestamps?.[productId];
                    if (!existingTimestamp || JSON.stringify(savedVariantsData?.[productId]) !== JSON.stringify(variantsData[productId])) {
                        currentTimestamps[productId] = Date.now();
                    }
                }
                setPageState(prev => ({
                    ...prev,
                    variantsData: currentVariantsData,
                    variantsDataTimestamps: { 
                        ...prev.variantsDataTimestamps, 
                        ...(Object.keys(currentTimestamps).length > 0 ? currentTimestamps : {})
                    }
                }));
            } else {
                // Clear variants data when no product is expanded
                setPageState(prev => ({
                    ...prev,
                    variantsData: {},
                    variantsDataTimestamps: {}
                }));
            }
        }, 300); // Debounce to prevent rapid updates
        
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantsData, expandedRows]);
    
    const [loadingVariants, setLoadingVariants] = useState<Set<number>>(new Set());
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
    const [variantMenuAnchor, setVariantMenuAnchor] = useState<{ element: HTMLElement; productId: number; variantId: number } | null>(null);

    // Pending bulk edits: key = "productId-variantId", value = payload for API
    const [pendingBulkEdits, setPendingBulkEdits] = useState<Record<string, BulkUpdateMultipleVariantItem>>({});
    const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);
    // Local input values for stock fields (to allow typing without immediate conversion)
    const [localStockInputs, setLocalStockInputs] = useState<Record<string, string>>({});

    // Restore pending bulk edits from localStorage on mount
    useEffect(() => {
        try {
            if (typeof window === 'undefined') return;
            const raw = localStorage.getItem(BULK_EDIT_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as BulkUpdateMultipleVariantItem[];
                if (Array.isArray(parsed)) {
                    const map: Record<string, BulkUpdateMultipleVariantItem> = {};
                    parsed.forEach((v) => {
                        const key = getEditKey(v.product_id, v.variant_id);
                        map[key] = v;
                    });
                    setPendingBulkEdits(map);
                }
            }
        } catch {
            // ignore invalid stored data
        }
    }, []);

    // Persist pending bulk edits to localStorage whenever they change
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const list = Object.values(pendingBulkEdits);
        if (list.length === 0) {
            localStorage.removeItem(BULK_EDIT_STORAGE_KEY);
        } else {
            localStorage.setItem(BULK_EDIT_STORAGE_KEY, JSON.stringify(list));
        }
    }, [pendingBulkEdits]);

    const areFiltersActive = useMemo(() => {
        return debouncedSearch !== '';
    }, [debouncedSearch]);

    const clearFilters = () => {
        setSearch('');
        setVariantsData({}); // Clear variants data
        setPage(1); // Reset page to 1 in session storage
        hasRestoredScrollPositionRef.current = false; // Reset scroll restoration flag
        setPageState(prev => ({ 
            ...prev, 
            variantsData: {}, 
            variantsDataTimestamps: {},
            expandedRows: {}, 
            expandedProductId: null 
        })); // Clear variants, timestamps, expanded rows, and productId from session
        onParamsChange({
            q: undefined,
            page: 1,
        });
        clearPageState(); // Clear session storage
        showSnackbar("Filters cleared", "info");
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
          setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
      }, [search]);
    
      useEffect(() => {
        // Only update if the search value is different from what we last sent
        const newQ = debouncedSearch || undefined;
        if (lastSearchRef.current !== newQ) {
          lastSearchRef.current = newQ;
          // Reset to page 1 when search changes
          setPage(1); // Update session storage
          onParamsChange({ q: newQ, page: 1 });
        }
      }, [debouncedSearch, onParamsChange]);

    // Track the currently expanded product ID to detect changes
    const currentExpandedProductIdRef = useRef<number | null>(null);
    
    // Ensure variants are available for the CURRENT expanded product (never rely on savedExpandedRows)
    useEffect(() => {
        // Track initial mount
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
        }

        // If user just clicked, let the click handler drive the first fetch; clear flag after.
        if (isManualExpansionRef.current) {
            isManualExpansionRef.current = false;
            return; // Don't interfere with manual expansion
        }

        const expandedProductIdStr = Object.keys(expandedRows).find((id) => expandedRows[id]);
        if (!expandedProductIdStr) {
            hasInitializedVariantsRef.current = false;
            currentExpandedProductIdRef.current = null;
            return;
        }

        const productId = parseInt(expandedProductIdStr, 10);
        if (!Number.isFinite(productId)) return;

        const productExists = products.some((p) => p.id === productId);
        if (!productExists) return;

        // Reset initialization flag if expanded product changed
        if (currentExpandedProductIdRef.current !== productId) {
            hasInitializedVariantsRef.current = false;
            currentExpandedProductIdRef.current = productId;
        }

        // Check if cached data is stale (older than last stock update)
        const isStale = isVariantsDataStale(productId);
        
        // If data is stale, always fetch fresh data
        if (isStale) {
            if (!loadingVariants.has(productId)) {
                handleRowExpand(productId, true).catch(() => {
                    /* handled in handleRowExpand */
                });
            }
            hasInitializedVariantsRef.current = true;
            return;
        }

        // On initial mount/return or product change: Load cached data immediately for quick display, then fetch fresh data
        if (!hasInitializedVariantsRef.current) {
            // 1) First, load cached data if available for immediate display
            const cached = savedVariantsData?.[productId];
            if (Array.isArray(cached) && cached.length > 0) {
                // Use a ref check to prevent infinite loop
                const currentVariants = variantsData[productId];
                if (!currentVariants || JSON.stringify(currentVariants) !== JSON.stringify(cached)) {
                    isUpdatingFromApiRef.current = true;
                    setVariantsData((prev) => {
                        // Only update if different
                        if (JSON.stringify(prev[productId]) === JSON.stringify(cached)) {
                            return prev;
                        }
                        return { ...prev, [productId]: cached };
                    });
                    setTimeout(() => {
                        isUpdatingFromApiRef.current = false;
                    }, 50);
                }
            }
            
            // 2) Always fetch fresh data from API when returning to page (even if cached exists)
            if (!loadingVariants.has(productId)) {
                handleRowExpand(productId, true)
                    .then(() => {
                        hasInitializedVariantsRef.current = true;
                    })
                    .catch(() => {
                        hasInitializedVariantsRef.current = true;
                        /* handled in handleRowExpand */
                    });
            } else {
                // If already loading, mark as initialized to prevent re-triggering
                hasInitializedVariantsRef.current = true;
            }
            return;
        }

        // After initialization: Only fetch if we don't have local state
        // 1) Prefer local state (if not stale and already initialized)
        if (Array.isArray(variantsData[productId])) return;

        // 2) Then session storage cache (for back/forward, if not stale)
        const cached = savedVariantsData?.[productId];
        if (Array.isArray(cached)) {
            // Only update if different to prevent loops
            const currentVariants = variantsData[productId];
            if (!currentVariants || JSON.stringify(currentVariants) !== JSON.stringify(cached)) {
                isUpdatingFromApiRef.current = true;
                setVariantsData((prev) => {
                    if (JSON.stringify(prev[productId]) === JSON.stringify(cached)) {
                        return prev;
                    }
                    return { ...prev, [productId]: cached };
                });
                setTimeout(() => {
                    isUpdatingFromApiRef.current = false;
                }, 50);
            }
            return;
        }

        // 3) Finally fetch if nothing available
        if (!loadingVariants.has(productId)) {
            handleRowExpand(productId, true).catch(() => {
                /* handled in handleRowExpand */
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products, expandedRows, isVariantsDataStale]);
    
    // Track previous products to detect actual data changes (not just pagination)
    const prevProductsRef = useRef<Product[]>([]);
    const lastVisibilityChangeRef = useRef<number | null>(null);
    
    // Refresh variants when products prop changes (indicating parent refresh after stock update)
    useEffect(() => {
        // Check if products actually changed (not just pagination)
        // Compare product IDs and stock values to detect real updates
        const hasProductChanges = prevProductsRef.current.length !== products.length ||
            products.some((product, index) => {
                const prevProduct = prevProductsRef.current[index];
                return !prevProduct || 
                    prevProduct.id !== product.id || 
                    prevProduct.currentStock !== product.currentStock;
            });
        
        // If products changed (refresh from parent after stock update), mark stock update time
        if (hasProductChanges && products.length > 0 && !loading) {
            // Mark current time as last stock update to invalidate all cached variants
            setPageState(prev => ({
                ...prev,
                lastStockUpdateTime: Date.now()
            }));
        }
        
        prevProductsRef.current = products;
        
        const expandedProductIdStr = Object.keys(expandedRows).find((id) => expandedRows[id]);
        if (!expandedProductIdStr) return;

        const productId = parseInt(expandedProductIdStr, 10);
        if (!Number.isFinite(productId)) return;

        // If we have cached variants but products prop changed (parent refresh), refresh variants
        if (variantsData[productId] && !loadingVariants.has(productId)) {
            // Check if data might be stale based on timestamp
            if (isVariantsDataStale(productId)) {
                handleRowExpand(productId, true).catch(() => {
                    /* handled in handleRowExpand */
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [products.length, products]); // Trigger when products array changes (refresh from parent)
    
    // Detect when user returns to the page (e.g., from detail page) and refresh stale variants
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Page became visible - check if we need to refresh stale variants
                const now = Date.now();
                // Only refresh if page was hidden for more than 1 second (to avoid false positives)
                if (lastVisibilityChangeRef.current && (now - lastVisibilityChangeRef.current) > 1000) {
                    const expandedProductIdStr = Object.keys(expandedRows).find((id) => expandedRows[id]);
                    if (expandedProductIdStr) {
                        const productId = parseInt(expandedProductIdStr, 10);
                        if (Number.isFinite(productId) && isVariantsDataStale(productId) && !loadingVariants.has(productId)) {
                            // Refresh stale variants when page becomes visible
                            handleRowExpand(productId, true).catch(() => {
                                /* handled in handleRowExpand */
                            });
                        }
                    }
                }
                lastVisibilityChangeRef.current = now;
            } else {
                // Page became hidden - record the time
                lastVisibilityChangeRef.current = Date.now();
            }
        };
        
        const handleFocus = () => {
            // Also check on window focus (e.g., switching tabs back)
            const expandedProductIdStr = Object.keys(expandedRows).find((id) => expandedRows[id]);
            if (expandedProductIdStr) {
                const productId = parseInt(expandedProductIdStr, 10);
                if (Number.isFinite(productId) && isVariantsDataStale(productId) && !loadingVariants.has(productId)) {
                    // Refresh stale variants when window regains focus
                    handleRowExpand(productId, true).catch(() => {
                        /* handled in handleRowExpand */
                    });
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandedRows, isVariantsDataStale, loadingVariants]);

    const handleRowExpand = async (productId: number, isExpanded: boolean): Promise<void> => {
        if (isExpanded) {
            // Always fetch variants for the clicked product (don't check cache)
            // This ensures we always use the correct clicked product ID
            setLoadingVariants(prev => new Set(prev).add(productId));
            isUpdatingFromApiRef.current = true; // Prevent sync effect from running
            try {
                const response = await getProductVariants(productId);
                const freshVariants = response.data.variants;
                const fetchTime = Date.now();
                
                setVariantsData(prev => ({
                    ...prev,
                    [productId]: freshVariants
                }));
                
                // Update session storage with fresh data and timestamp
                setPageState(prev => ({
                    ...prev,
                    variantsData: {
                        ...prev.variantsData,
                        [productId]: freshVariants
                    },
                    variantsDataTimestamps: {
                        ...prev.variantsDataTimestamps,
                        [productId]: fetchTime
                    }
                }));
            } catch (error) {
                console.error('Failed to fetch variants', error);
                throw error; // Re-throw to allow caller to handle
            } finally {
                setLoadingVariants(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(productId);
                    return newSet;
                });
                // Reset flag after a short delay to allow state updates to complete
                setTimeout(() => {
                    isUpdatingFromApiRef.current = false;
                }, 100);
            }
        }
    };

    const handleVariantMenuOpen = (event: React.MouseEvent<HTMLElement>, productId: number, variantId: number) => {
        event.stopPropagation();
        setVariantMenuAnchor({ element: event.currentTarget, productId, variantId });
    };

    const handleVariantMenuClose = () => {
        setVariantMenuAnchor(null);
    };

    const handleVariantViewDetails = (variantId: number) => {
        // Navigate to variant details page
        router.push(`/apps/inventory/${variantId}`);
        handleVariantMenuClose();
    };

    const handlePendingStockChange = (productId: number, variantId: number, value: number | '', originalStock: number | undefined) => {
        const key = getEditKey(productId, variantId);
        const numValue = value === '' ? undefined : Number(value);
        if (numValue !== undefined && (isNaN(numValue) || numValue < 0)) return;
        setPendingBulkEdits((prev) => {
            const next = { ...prev };
            const existing = next[key];
            const stock = value === '' ? undefined : (numValue !== undefined ? numValue : existing?.stock);
            const hasOtherFields = existing && (existing.regular_price !== undefined || existing.discount_price !== undefined || existing.status !== undefined);
            const isUnchanged = stock !== undefined && originalStock !== undefined && stock === originalStock && !hasOtherFields;
            const clearedWithNoOtherFields = stock === undefined && !hasOtherFields;
            if (isUnchanged || clearedWithNoOtherFields || (stock === undefined && !existing)) {
                if (key in next) delete next[key];
                return Object.keys(next).length === 0 ? {} : { ...next };
            }
            next[key] = {
                product_id: productId,
                variant_id: variantId,
                ...existing,
                ...(stock !== undefined && { stock }),
            };
            return next;
        });
    };

    const handleBulkStockUpdate = async () => {
        const list = Object.values(pendingBulkEdits).filter(
            (v) => v.stock !== undefined || v.regular_price !== undefined || v.discount_price !== undefined || v.status !== undefined
        );
        if (list.length === 0) {
            showSnackbar('No variant changes to update', 'warning');
            return;
        }
        setBulkUpdateLoading(true);
        try {
            await bulkUpdateMultipleVariants({ variants: list });
            setPendingBulkEdits({});
            setLocalStockInputs({}); // Clear local input values
            showSnackbar(`Successfully updated ${list.length} variant(s)`, 'success');
            setPageState((prev) => ({ ...prev, lastStockUpdateTime: Date.now() }));
            setVariantsData({});
            setPageState((prev) => ({
                ...prev,
                variantsData: {},
                variantsDataTimestamps: {},
            }));
            onParamsChange({}); // Trigger parent refresh if needed
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            showSnackbar(message || 'Failed to update variants', 'error');
        } finally {
            setBulkUpdateLoading(false);
        }
    };

    const renderVariantDetails = (variants: ProductVariant[], productId: number) => {
        if (variants.length === 0) {
            return (
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        No variants found
                    </Typography>
                </Box>
            );
        }

        const currentMenu = variantMenuAnchor?.productId === productId 
            ? variantMenuAnchor 
            : null;

        return (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Variants ({variants.length})
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell align="center">Name</TableCell>
                                <TableCell>Image</TableCell>
                                {/* <TableCell>SKU</TableCell>                               */}
                                {/* <TableCell>Barcode</TableCell> */}
                                <TableCell align="center">Current Stock</TableCell>
                                <TableCell align="center">Low Stock Threshold</TableCell>
                                <TableCell align="center">Stock Status</TableCell>
                                <TableCell align="center">Price</TableCell>
                                <TableCell align="center">Sales (28 days)</TableCell>
                                <TableCell align="center">Stock Will Last (Days)</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variants.map((variant) => {
                                const editKey = getEditKey(productId, variant.id);
                                const isEdited = editKey in pendingBulkEdits;
                                const originalStock = variant.currentStock ?? 0;
                                // Use local input if exists, otherwise use pending edit or original stock
                                const displayStock = localStockInputs[editKey] !== undefined 
                                    ? localStockInputs[editKey] 
                                    : (pendingBulkEdits[editKey]?.stock ?? originalStock ?? '');
                                return (
                                <TableRow
                                    key={variant.id}
                                    sx={{
                                        backgroundColor: isEdited ? 'rgba(33, 150, 243, 0.08)' : undefined,
                                    }}
                                >
                                   <TableCell align="center">
                                        {variant.name 
                                            ? variant.name.charAt(0).toUpperCase() + variant.name.slice(1)
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {variant.image ? (
                                            <Avatar src={variant.image} sx={{ width: 40, height: 40 }} />
                                        ) : (
                                            <Avatar sx={{ width: 40, height: 40 }}>N/A</Avatar>
                                        )}
                                    </TableCell>
                                    {/* <TableCell>{variant.sku || 'N/A'}</TableCell> */}
                                    {/* <TableCell>{variant.barcode || 'N/A'}</TableCell> */}
                                    <TableCell align="center" sx={{ minWidth: 100 }}>
                                        <TextField
                                            type="number"
                                            size="small"
                                            value={displayStock}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                // Store raw input value locally for smooth typing
                                                setLocalStockInputs(prev => ({ ...prev, [editKey]: v }));
                                            }}
                                            onBlur={(e) => {
                                                const v = e.target.value;
                                                const num = v === '' ? undefined : Number(v);
                                                // Clear local input
                                                setLocalStockInputs(prev => {
                                                    const next = { ...prev };
                                                    delete next[editKey];
                                                    return next;
                                                });
                                                // Update pending edits if value is valid and different
                                                if (v !== '' && !isNaN(num!) && num! >= 0) {
                                                    handlePendingStockChange(productId, variant.id, num!, originalStock);
                                                } else if (v === '') {
                                                    // Clear pending edit if field is empty
                                                    handlePendingStockChange(productId, variant.id, '', originalStock);
                                                }
                                            }}
                                            inputProps={{ min: 0, step: 1 }}
                                            sx={{ width: 72, '& .MuiInputBase-input': { textAlign: 'center' } }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.lowStockThreshold !== null && variant.lowStockThreshold !== undefined 
                                            ? variant.lowStockThreshold 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.isOutOfStock ? (
                                            <Chip label="Out of Stock" color="error" size="small" />
                                        ) : variant.isLowStock ? (
                                            <Chip label="Low Stock" color="warning" size="small" />
                                        ) : (
                                            <Chip label="In Stock" color="success" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.discount_price ? (
                                            <Box>
                                                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                                    £{variant.regular_price}
                                                </Typography>
                                                <Typography variant="body2" color="error">
                                                    £{variant.discount_price}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            `£${variant.price}`
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.salesLast28Days !== null && variant.salesLast28Days !== undefined 
                                            ? variant.salesLast28Days 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        {variant.stockWillLastDays !== null && variant.stockWillLastDays !== undefined 
                                            ? variant.stockWillLastDays 
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleVariantMenuOpen(e, productId, variant.id)}
                                            aria-label="variant actions"
                                        >
                                            <FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
                                        </IconButton>
                                        <Menu
                                            anchorEl={currentMenu?.variantId === variant.id ? currentMenu.element : null}
                                            open={currentMenu?.variantId === variant.id}
                                            onClose={handleVariantMenuClose}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                            transformOrigin={{
                                                vertical: 'top',
                                                horizontal: 'right',
                                            }}
                                        >
                                            <MenuItem
                                                onClick={() => handleVariantViewDetails(variant.id)}
                                            >
                                                <ListItemIcon>
                                                    <FuseSvgIcon>heroicons-outline:eye</FuseSvgIcon>
                                                </ListItemIcon>
                                                View Details
                                            </MenuItem>
                                        </Menu>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    };

    const columns = useMemo<MRT_ColumnDef<Product>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Product Name',
                size: 300,
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => {
                    const productId = row.original.id;
                    const rowId = productId.toString();
                    const isExpanded = row.getIsExpanded();

                    return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    lastToggledRowIdRef.current = rowId;

                                    // Fully control accordion state ourselves to avoid MRT updater races
                                    isManualExpansionRef.current = true;
                                    const nextExpanded: Record<string, boolean> = isExpanded
                                        ? {}
                                        : { [rowId]: true };

                                    // Immediately update UI + session to the clicked row
                                    setExpandedRows(nextExpanded);
                                    // Only clear variants data if switching to a different product
                                    if (!nextExpanded[rowId] || !variantsData[productId]) {
                                        setVariantsData({});
                                    }
                                    hasRestoredScrollPositionRef.current = false; // Reset scroll restoration flag when manually opening
                                    setPageState((prev) => ({
                                        ...prev,
                                        expandedRows: nextExpanded,
                                        variantsData: nextExpanded[rowId] && variantsData[productId] ? { [productId]: variantsData[productId] } : {},
                                        expandedProductId: nextExpanded[rowId] ? productId : null,
                                    }));

                                    // Fetch variants for the clicked product (only when opening or if stale)
                                    const shouldFetch = !isExpanded && !loadingVariants.has(productId);
                                    const shouldRefresh = isExpanded && isVariantsDataStale(productId) && !loadingVariants.has(productId);
                                    
                                    if (shouldFetch || shouldRefresh) {
                                        handleRowExpand(productId, true)
                                            .then(() => {
                                                // handleRowExpand already updates session storage, just mark as initialized
                                                hasInitializedVariantsRef.current = true;
                                            })
                                            .catch(() => {
                                                hasInitializedVariantsRef.current = true;
                                                /* logged in handleRowExpand */
                                            });
                                    } else if (shouldFetch) {
                                        // Mark as initialized even if we don't fetch (already have fresh data)
                                        hasInitializedVariantsRef.current = true;
                                    }
                                }}
                                sx={{ 
                                    mr: 1, 
                                    p: 0.5, 
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                                aria-label={isExpanded ? "Close variant list" : "Open variant list"}
                                data-inventory-row-toggle={rowId}
                            >
                                {isExpanded ? (
                                    <ExpandLessIcon fontSize="small" color="action" /> // Up arrow - click to close
                                ) : (
                                    <ExpandMoreIcon fontSize="small" color="action" /> // Down arrow - click to open
                                )}
                            </IconButton>
                            <Avatar src={row.original.image || undefined} sx={{ mr: 2 }}>
                                {row.original.name?.charAt(0) || 'N/A'}
                            </Avatar>
                            {row.original.name || 'N/A'}
                    </Box>
                    );
                },
            },
            { 
                accessorKey: 'currentStock', 
                header: 'Current Stock',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.currentStock !== null && row.original.currentStock !== undefined 
                        ? row.original.currentStock 
                        : 'N/A'
                ),
            },
            // { 
            //     accessorKey: 'stockOnHold', 
            //     header: 'Stock On Hold',
            //     muiTableHeadCellProps: { align: 'center' },
            //     muiTableBodyCellProps: { align: 'center' },
            //     enableSorting: false,
            //     enableColumnActions: false,
            //     Cell: ({ row }) => (
            //         row.original.stockOnHold !== null && row.original.stockOnHold !== undefined 
            //             ? row.original.stockOnHold 
            //             : 'N/A'
            //     ),
            // },
            { 
                accessorKey: 'reservedStock', 
                header: 'Reserved Stock',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.reservedStock !== null && row.original.reservedStock !== undefined 
                        ? row.original.reservedStock 
                        : 'N/A'
                ),
            },
            { 
                accessorKey: 'salesLast28Days', 
                header: 'Sales (Last 28 days)',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.salesLast28Days !== null && row.original.salesLast28Days !== undefined 
                        ? row.original.salesLast28Days 
                        : 'N/A'
                ),
            },
            { 
                accessorKey: 'stockWillLastDays', 
                header: 'Stock Will Last (Days)',
                muiTableHeadCellProps: { align: 'center' },
                muiTableBodyCellProps: { align: 'center' },
                enableSorting: false,
                enableColumnActions: false,
                Cell: ({ row }) => (
                    row.original.stockWillLastDays !== null && row.original.stockWillLastDays !== undefined 
                        ? row.original.stockWillLastDays 
                        : 'N/A'
                ),
            },
        ],
        []
      );
    
    return (
        <div>
            <div className="flex items-end justify-end mb-4 gap-2 flex-wrap">
                <Box>
                    <GenerateReportButton disabled={loading} />
                </Box>
                <AppButton
                    label={bulkUpdateLoading ? 'Updating...' : 'Stock Update'}
                    onClick={handleBulkStockUpdate}
                    disabled={bulkUpdateLoading || Object.keys(pendingBulkEdits).length === 0}
                    loading={bulkUpdateLoading}
                />
            </div>
            <Paper sx={{ width: '100%', overflow: 'hidden', p:2, backgroundColor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                        label="Search by product name"
                        variant="outlined"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        size="small"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            minWidth: 300,
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                  borderColor: '#2E9970',
                                  borderWidth: '2px',
                                },
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: '#2E9970',
                              },
                        }}
                    />
                    <Box className="flex items-center flex-wrap gap-2">
                        {areFiltersActive && <ClearFiltersButton onClick={clearFilters} />}
                    </Box>
                </Box>

            <DataTable
                data={products}
                columns={columns}
                manualPagination={true}
                state={{ 
                    isLoading: loading, 
                    expanded: expandedRows,
                    pagination: {
                        pageIndex: 0,
                        pageSize: products.length || limit || 10
                    }
                }}
                enableColumnDragging={false}
                enableExpanding={true}
                enableRowSelection={false}
                onRowSelectionChange={setRowSelection}
                getRowId={(row) => row.id.toString()}
                initialState={{
                    columnVisibility: { 'mrt-row-expand': false }, // Hide the expand column
                    columnPinning: {
                        right: ['mrt-row-actions'], // Pin the actions column to the right
                    },
                }}
                onExpandedChange={(updater) => {
                    // Save current scroll position (container) to prevent jump
                    const container = tableContainerRef.current;
                    const prevTop = container?.scrollTop ?? 0;
                    const prevLeft = container?.scrollLeft ?? 0;
                    
                    let newExpanded: Record<string, boolean>;
                    if (typeof updater === 'function') {
                        newExpanded = updater(expandedRows) as Record<string, boolean>;
                    } else {
                        newExpanded = updater as Record<string, boolean>;
                    }
                    
                    // Normalize to accordion behavior (keep only one open)
                    const nextOpenId = Object.entries(newExpanded).find(([, v]) => v)?.[0] ?? null;
                    const normalized: Record<string, boolean> = nextOpenId ? { [nextOpenId]: true } : {};
                    const expandedProductId = nextOpenId ? parseInt(nextOpenId, 10) : null;
                    setExpandedRows(normalized);
                    hasRestoredScrollPositionRef.current = false; // Reset scroll restoration flag when expanding/collapsing
                    setPageState((prev) => ({ 
                        ...prev, 
                        expandedRows: normalized,
                        expandedProductId: Number.isFinite(expandedProductId) ? expandedProductId : null
                    }));

                    // If everything closed, clear cached variants
                    if (!nextOpenId) {
                        setVariantsData({});
                        setPageState((prev) => ({ 
                            ...prev, 
                            variantsData: {}, 
                            variantsDataTimestamps: {},
                            expandedRows: {}, 
                            expandedProductId: null 
                        }));
                    }

                    // Restore scroll + ensure the clicked row stays in view
                    requestAnimationFrame(() => {
                        const el = tableContainerRef.current;
                        if (el) {
                            el.scrollTop = prevTop;
                            el.scrollLeft = prevLeft;
                        }
                        const rowIdToKeep = lastToggledRowIdRef.current;
                        if (rowIdToKeep) {
                            const toggleEl = document.querySelector(
                                `[data-inventory-row-toggle="${rowIdToKeep}"]`,
                            ) as HTMLElement | null;
                            toggleEl?.scrollIntoView({ block: 'nearest' });
                        }
                    });
                }}
                getRowCanExpand={() => true}
                enableExpandAll={false}
                muiTableContainerProps={{
                    ref: tableContainerRef as any,
                    className: 'flex-auto',
                    sx: {
                        // Prevent browser scroll anchoring from jumping on expand/collapse
                        overflowAnchor: 'none',
                    },
                }}
                renderDetailPanel={({ row }) => {
                    const productId = row.original.id;
                    const isExpanded = row.getIsExpanded(); // Use MRT's built-in state
                    
                    // Accordion: Only show detail panel when expanded
                    if (!isExpanded) {
                        return null;
                    }
                    
                    const isLoading = loadingVariants.has(productId);
                    const variants = variantsData[productId];

                    // Show loading spinner while fetching variants
                    if (isLoading) {
                        return (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 100 }}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" sx={{ ml: 2 }} color="text.secondary">
                                    Loading variants...
                                </Typography>
                            </Box>
                        );
                    }

                    // Show variant details if loaded
                    if (variants && variants.length > 0) {
                        return renderVariantDetails(variants, productId);
                    }

                    // Show message if no variants found
                    if (variants && variants.length === 0) {
                        return (
                            <Box sx={{ p: 3 }}>
                                <Typography variant="body2" color="text.secondary" align="center">
                                    No variants found for this product
                                </Typography>
                            </Box>
                        );
                    }

                    // If variants haven't been fetched yet, show loading
                    // This should only happen briefly before the API call starts
                    return (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, minHeight: 100 }}>
                            <CircularProgress size={24} />
                        </Box>
                    );
                }}
                renderRowActionMenuItems={({ closeMenu, row }) => [
                    // View Details removed from product row - now only in variant rows
                  ]}
            />

            <TablePagination
                page={savedPage ?? page}
                totalPages={totalPages}
                limit={limit}
                totalRecords={totalRecords}
                onPageChange={handlePageChange}
                onLimitChange={onLimitChange}
            />
        </Paper>
        </div>
    );
};

export default InventoryTable; 