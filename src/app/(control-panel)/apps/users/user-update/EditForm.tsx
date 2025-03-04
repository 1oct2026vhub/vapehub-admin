'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import _ from 'lodash';
import { useRouter } from 'next/navigation';
import { FormControl, FormControlLabel, FormLabel, RadioGroup, Radio, FormHelperText, Alert, Select, MenuItem, InputLabel } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormInputField from '@/components/Shared/FormInputField';
import { updateUser } from '@/services/apiService';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Header from './Header';

// Validation Schema
const schema = z.object({
  first_name: z.string().nonempty('First Name is required'),
  last_name: z.string().nonempty('Last Name is required'),
  email: z.string().email('Enter a valid email').nonempty('Email is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format')
    .refine((dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear() >= 18;
    }, 'You must be at least 18 years old.'),
  roleId: z.preprocess((val) => Number(val), z.union([z.literal(1), z.literal(2)])),
  gender: z.enum(['male', 'female', 'other'], { message: 'Gender is required' }),
});

// Form Type
export type FormType = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  roleId: number;
  gender: string;
  id: string;
};

const EditForm = ({ user }: { user: FormType }) => {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  // Form handling
  const { control, formState, handleSubmit, setError, reset } = useForm<FormType>({
    mode: 'onChange',
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  // Prefill form when user data is available
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        roleId: user.roleId,
        gender: user.gender,
      });
    }
  }, [user, reset]);
  console.log("uuuuu", user);

  async function onSubmit(formData: FormType) {
    try {
      const formattedData = { ...formData, roleId: Number(formData.roleId) };
      const response = await updateUser(user?.id, formattedData);

      if (response?.success === false) {
        setError('root', { type: 'manual', message: response.message });
        return;
      }

      showSnackbar('User updated successfully!', 'success');
      router.push('/apps/users'); // Redirect after update
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
      } else {
        setError('root', { type: 'manual', message: 'An unexpected error occurred' });
      }
    }
  }

  return (
    <div className='md:px-64 p-4'>
      <Header/>
    <form
      name="editUserForm"
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
      <FormInputField name="phone" control={control} label="Phone" type="text" required />
      <FormInputField name="dob" control={control} label="DOB (YYYY-MM-DD)" type="text" required />

      {/* <Controller
        name="roleId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              {...field}
              labelId="role-select-label"
              label="Role"
              value={field.value} 
            >
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select>
          </FormControl>
        )}
      /> */}

      <Controller
        name="roleId"
        control={control}
        // defaultValue={2} // Ensures default value is set
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              {...field}
              labelId="role-select-label"
              label="Role"
              value={field.value || user?.roleId} // Fallback in case defaultValue is not applied
            >
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>User</MenuItem>
            </Select>
          </FormControl>
        )}
      />


      {/* Gender Selection */}
      <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Gender</FormLabel>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} row value={field.value ?? ''}>
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
        label="Update User"
        type="submit"
        color="secondary"
        fullWidth
        size="large"
        aria-label="Update"
        // disabled={_.isEmpty(dirtyFields) || !isValid}
        className="mt-4 w-full"
      />
    </form>
    </div>
  );
};

export default EditForm;
