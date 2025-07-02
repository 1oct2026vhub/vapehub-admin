'use client';
import { useState } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Popper } from '@mui/material';
import { listProducts} from '@/services/apiProduct';
import { addProductsToDeal } from '@/services/apiDeals';
import AppButton from '@/components/Shared/AppButton';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { useFetch } from '@/hooks/useFetch';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductSelectorProps {
    dealId: number;
    onProductAdded: (product) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ dealId, onProductAdded }) => {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { showSnackbar } = useSnackbar();
    const [isAdding, setIsAdding] = useState(false);

    const debouncedInputValue = useDebounce(inputValue, 500);

    const { data: response, isLoading: loading } = useFetch(
        ['products', debouncedInputValue],
        () => listProducts({ search: debouncedInputValue, limit: 10 })
    );
    
    const options = response?.data?.products || [];

    const CustomPopper = (props: any) => {
        return <Popper {...props} placement="bottom-start" />;
    };

    const handleAddClick = async () => {
        if (!selectedProduct) {
            showSnackbar('Please select a product to add.', 'warning');
            return;
        }

        setIsAdding(true);
        try {
            await addProductsToDeal(dealId, [selectedProduct.id]);
            showSnackbar('Product added successfully!', 'success');
            onProductAdded(selectedProduct);
            setSelectedProduct(null);
        } catch (error: any) {
            showSnackbar(error.message || 'Failed to add product.', 'error');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <Autocomplete
                sx={{ flexGrow: 1 }}
                id="product-selector"
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name}
                options={options}
                loading={loading}
                value={selectedProduct}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                onChange={(event, value) => {
                    setSelectedProduct(value);
                }}
                componentsProps={{
                    popper: {
                        placement: 'bottom-start'
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search for a product"
                        className='h-8'
                        // size="small"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />
            <AppButton
                label="Add"
                onClick={handleAddClick}
                disabled={!selectedProduct || isAdding}
                loading={isAdding}
            />
        </Box>
    );
};

export default ProductSelector; 