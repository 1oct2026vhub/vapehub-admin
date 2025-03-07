import { Controller } from 'react-hook-form';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, FormHelperText } from '@mui/material';

interface FormRadioGroupProps {
    name: string;
    control: any;
    label: string;
    options: { value: string; label: string }[];
    defaultValue?: string;
}

const FormRadioGroup: React.FC<FormRadioGroupProps> = ({ name, control, label, options, defaultValue }) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue} // Ensures default value is set
            render={({ field, fieldState: { error } }) => (
                <FormControl component="fieldset" margin="normal" error={!!error}>
                    <FormLabel
                        sx={{
                            '&.Mui-focused': {
                                color: '#2E9970', // Label color when focused
                            },
                        }}
                    >
                        {label}
                    </FormLabel>

                    <RadioGroup {...field} row value={field.value ?? defaultValue}>
                        {options.map((option) => (
                            <FormControlLabel
                                key={option.value}
                                value={option.value}
                                control={
                                    <Radio
                                        sx={{
                                            color: '#5F6368', // Default radio button color
                                            '&.Mui-checked': {
                                                color: '#2E9970', // Change when selected
                                            },
                                        }}
                                    />
                                }
                                label={option.label}
                            />
                        ))}
                    </RadioGroup>

                    {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
            )}
        />
    );
};

export default FormRadioGroup;
