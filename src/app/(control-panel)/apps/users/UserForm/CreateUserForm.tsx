'use client'
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import _ from 'lodash';
import { useRouter } from 'next/navigation';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormHelperText from '@mui/material/FormHelperText';
import { Alert, Select, MenuItem, InputLabel } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormInputField from '@/components/Shared/FormInputField';
import { usePost } from '@/hooks/useFetch';
import { createUser } from '@/services/apiService';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Header from './Header';


const schema = z.object({
  first_name: z.string().nonempty('First Name is required'),
  last_name: z.string().nonempty('Last Name is required'),
  email: z.string().email('Enter a valid email').nonempty('Email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format')
    .refine((dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear() >= 18;
    }, 'You must be at least 18 years old.'),
    roleId: z.preprocess(
      (val) => Number(val),
      z.union([z.literal(1), z.literal(2)])
    ),
      gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
});

const defaultValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  dob: '',
  roleId: '',
  gender: '',
};

export type FormType = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  dob: string;
  roleId: number;
  gender: string;
};

function CreateUserForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar(); //Use Snackbar

  const { control, formState, handleSubmit, setError } = useForm({
    mode: 'onChange',
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerSignup, isMutating } = usePost('signup', createUser);

  async function onSubmit(formData) {
    try {
      const formattedData = { ...formData, roleId: Number(formData.roleId) };
      const response = await triggerSignup(formattedData);

      if (response?.success === false) {
        setError('root', { type: 'manual', message: response.message });
        return false;
      }
      showSnackbar('User created successfully. Please check your email for verification !', 'success'); 

      return true;
    } catch (error) {
      console.log(error);

    const errorData = error?.response?.data?.error;

    if (errorData) {
      if (errorData.email) {
        setError('email', { type: 'manual', message: errorData.email });
      }
      if (errorData.phone) {
        setError('phone', { type: 'manual', message: errorData.phone });
      }
      // if (errorData.otherField) {
      //   setError('otherField', { type: 'manual', message: errorData.otherField });
      // }
     else {
      setError('root', { type: 'manual', message: 'An unexpected error occurred' });
    }

    return false;
  }
    }
  }

  return (
    <div className='md:px-64 p-4'>
      <Header/>
    <form
      name="registerForm"
      noValidate
      className="flex w-full flex-col justify-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      {errors?.root?.message && (
        <Alert className="mb-8" severity="error">
          {errors?.root?.message}
        </Alert>
      )}

      <FormInputField name="first_name" control={control} label="First Name" type="text" required />
      <FormInputField name="last_name" control={control} label="Last Name" type="text" required />
      <FormInputField name="email" control={control} label="Email" type="email" required />
      <FormInputField name="password" control={control} label="Password" type="password" required />
      <FormInputField name="phone" control={control} label="Phone" type="text" required />
      <FormInputField name="dob" control={control} label="DOB (YYYY-MM-DD)" type="text" required />

      {/* Role Selection Dropdown */}
      <FormControl fullWidth margin="normal">
        <InputLabel id="role-select-label">Role</InputLabel>
        <Controller
          name="roleId"
          control={control}
          render={({ field }) => (
            <Select {...field} labelId="role-select-label" label="Role">
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select>
          )}
        />
        {errors.roleId && <FormHelperText error>{errors.roleId.message}</FormHelperText>}
      </FormControl>

      {/* Gender Selection */}
      <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Gender</FormLabel>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} row>
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="female" control={<Radio />} label="Female" />
              <FormControlLabel value="other" control={<Radio />} label="Other" />
            </RadioGroup>
          )}
        />
        {errors.gender && <FormHelperText error>{errors.gender.message}</FormHelperText>}
      </FormControl>

      {/* Submit Button */}
      <AppButton
        label="Create"
        type="submit"
        color="secondary"
        fullWidth
        size="large"
        aria-label="Register"
        disabled={_.isEmpty(dirtyFields) || !isValid || isMutating}
        className="mt-4 w-full"
      />
    </form>
    </div>
  );
}

export default CreateUserForm


