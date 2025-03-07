// import { Controller } from 'react-hook-form';
// import { FormControl, InputLabel, MenuItem, Select, FormHelperText } from '@mui/material';

// interface FormSelectFieldProps {
//     name: string;
//     control: any; // from react-hook-form
//     label: string;
//     options: { value: string | number; label: string }[];
// }

// const FormSelectField: React.FC<FormSelectFieldProps> = ({ name, control, label, options = [] }) => {
//     return (
//         <Controller
//             name={name}
//             control={control}
//             render={({ field, fieldState: { error } }) => (
//                 <FormControl
//                     fullWidth
//                     margin="normal"
//                     error={!!error}
//                     sx={{
//                         '& .MuiOutlinedInput-root': {
//               '& fieldset': {
//                 borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
//               },
//               '&:hover fieldset': {
//                 borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
//               },
//               '&.Mui-focused fieldset': {
//                 borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
//               },
//             },
//             '& .MuiInputLabel-root.Mui-focused': {
//               color: '#2E9970', // Label color when focused
//             },
//                     }}
//                 >
//                     <InputLabel>{label}</InputLabel>
//                     <Select {...field} label={label}>
//                         <MenuItem value="">Select {label}</MenuItem> {/* Default option */}
//                         {options?.map((option) => (
//                             <MenuItem key={option.value} value={option.value}>
//                                 {option.label}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                     {error && <FormHelperText>{error.message}</FormHelperText>}
//                 </FormControl>

//             )}
//         />
//     );
// };

// export default FormSelectField;



import { Controller } from 'react-hook-form';
import { FormControl, InputLabel, MenuItem, Select, FormHelperText } from '@mui/material';

interface FormSelectFieldProps {
    name: string;
    control: any;
    label: string;
    options: { value: string | number; label: string }[];
    defaultValue?: string | number;
}

const FormSelectField: React.FC<FormSelectFieldProps> = ({ name, control, label, options = [], defaultValue }) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue} // Ensuring default value is set
            render={({ field, fieldState: { error } }) => (
                <FormControl
                    fullWidth
                    margin="normal"
                    error={!!error}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderImage: 'linear-gradient(to right, #2E9970, #005434) 1',
                            },
                            '&:hover fieldset': {
                                borderImage: 'linear-gradient(to right, #247C5C, #003F29) 1',
                            },
                            '&.Mui-focused fieldset': {
                                borderImage: 'linear-gradient(to right, #1E7A56, #004C30) 1',
                            },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                            color: '#2E9970', // Label color when focused
                        },
                    }}
                >
                    <InputLabel>{label}</InputLabel>
                    <Select {...field} value={field.value ?? defaultValue} label={label}>
                        <MenuItem value="">Select {label}</MenuItem> {/* Default option */}
                        {options?.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
            )}
        />
    );
};

export default FormSelectField;
