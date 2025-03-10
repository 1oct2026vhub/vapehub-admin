'use client'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import _ from 'lodash';
import { useRouter } from 'next/navigation';
import { Alert } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormInputField from '@/components/Shared/FormInputField';
import { usePost } from '@/hooks/useFetch';
import { createUser } from '@/services/apiService';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Header from './Header';
import { useRoles } from '@/hooks/roleFetch';
import FormSelectField from '@/components/Shared/SelectField';
import FormRadioGroup from '@/components/Shared/RadioButton';
import FormDatePicker from '@/components/Shared/FormDatePicker';


const schema = z.object({
  first_name: z.string().min(1, 'First Name is required'),
  last_name: z.string().min(1, 'Last Name is required'),
  email: z
    .string()
    .min(1, 'Email is required') // Ensures the field is required
    .email('Invalid email format'), // Validates email format

  phone: z.string().regex(/^\d{10,15}$/, 'Enter a valid phone number'), // Ensures numeric phone number
  password: z
    .string()
    .min(1, 'Password is required') // Ensures the field is required
    .min(8, 'Password must be at least 8 characters long') // Minimum length validation
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character'),

  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format')
    .refine((dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear() >= 18;
    }, 'You must be at least 18 years old.'),

    roleId: z
    .number({ required_error: 'Role is required' }) // Explicitly mark it as required
    .min(1, 'Invalid role ID')
    .max(2, 'Invalid role ID'),
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
  const { roles } = useRoles();

  const { control, formState, handleSubmit, setError } = useForm({
    mode: 'all',
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;
  const { trigger: triggerSignup, isMutating } = usePost('signup', createUser);


  async function onSubmit(formData) {
    try {
      const formattedData = { ...formData, roleId: Number(formData.roleId) };
      const response = await triggerSignup(formattedData);
      showSnackbar('User created successfully. Please check your email for verification!', 'success');
      router.push('/apps/users'); // Redirect after successful signup
      return true;
    } catch (error) {
      // console.error('Signup Error:', error); // Log full error object
  
      const errorData = error || error; // Handle both API and unexpected errors
      const errorMessage = errorData?.message || 'An unexpected error occurred';
  
      if (errorData?.error && typeof errorData.error === 'object') {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === 'string') {
            // setError(field, { type: 'manual', message });
            showSnackbar(` ${message}`, 'error');
          }
        });
      } else {
        setError('root', { type: 'manual', message: errorMessage });
        showSnackbar(errorMessage, 'error');
      }
  
      return false;
    }
  }
  

  return (
    <div className='md:px-64 p-4'>
      <Header />
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
        {/* <FormInputField name="dob" control={control} label="DOB (YYYY-MM-DD)" type="text" required /> */}
        <FormDatePicker name="dob" control={control} label="Date of Birth" required />
        <FormSelectField
          name="roleId"
          control={control}
          label="Role"
          options={roles ? roles.map((role) => ({ value: role.id, label: role?.is_admin_panel ? role.role : "" })) : []}
          required
        />
        <FormRadioGroup
          name="gender"
          control={control}
          label="Gender"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
        />
        {/* Submit Button */}
        <AppButton
          label="Create"
          type="submit"
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


