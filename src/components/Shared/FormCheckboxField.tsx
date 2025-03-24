// import { Controller, Control } from 'react-hook-form';
// import { Checkbox } from '@mui/material';
// import { styled } from '@mui/material/styles';


// interface FormCheckboxFieldProps {
//   name: string;
//   control: Control<any>;
//   label: string;
//   disabled?: boolean;
// }


// // Styled Checkbox with custom color
// const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
//   color: '#2E9970',
//   '&.Mui-checked': {
//     color: '#2E9970',
//   },
// }));

// const FormCheckboxField: React.FC<FormCheckboxFieldProps> = ({
//   name,
//   control,
//   label,
//   disabled = false,
// }) => {
//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field: { value, onChange } }) => (
//         <div className="flex items-center">
//            <CustomCheckbox
//             checked={value}
//             onChange={onChange}
//             disabled={disabled}
//           />
//           <span>{label}</span>
//         </div>
//       )}
//     />
//   );
// };

// export default FormCheckboxField;


import { Controller, Control } from 'react-hook-form';
import { Checkbox, FormControlLabel } from '@mui/material';
import { styled } from '@mui/material/styles';

interface FormCheckboxFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: () => void;
}

// Styled Checkbox with custom color
const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
  color: '#2E9970',
  '&.Mui-checked': {
    color: '#2E9970',
  },
}));

const FormCheckboxField: React.FC<FormCheckboxFieldProps> = ({
  name,
  control,
  label,
  disabled = false,
  checked,
  onChange,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange: fieldOnChange } }) => (
        <FormControlLabel
          control={
            <CustomCheckbox
              checked={checked ?? value}
              onChange={onChange ?? fieldOnChange}
              disabled={disabled}
            />
          }
          label={label}
        />
      )}
    />
  );
};

export default FormCheckboxField;
