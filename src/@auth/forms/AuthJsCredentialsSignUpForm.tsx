import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import _ from "lodash";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Checkbox from "@mui/material/Checkbox";
import { signIn } from "next-auth/react";
import FormHelperText from "@mui/material/FormHelperText";
import { Alert } from "@mui/material";
import signinErrors from "./signinErrors";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { storeAuthToken } from "@/utils/auth";
import { usePost } from "@/hooks/useFetch";
import { createUser } from "@/services/apiService";
import { useRouter } from "next/navigation";

const schema = z.object({
  first_name: z.string().nonempty("First Name is required"),
  last_name: z.string().nonempty("Last Name is required"),
  email: z.string().email("Enter a valid email").nonempty("Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  // passwordConfirm: z.string().nonempty('Password confirmation is required'),
  phone: z.string().min(10, "Enter a valid phone number"),
  // dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be in YYYY-MM-DD format")
    .refine((dob) => {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    }, "You must be at least 18 years old."),
  roleId: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Role ID must be a positive integer"),
  ),
  gender: z.enum(["male", "female", "other"], {
    message: "Gender is required",
  }),
  // acceptTermsConditions: z.boolean().refine((val) => val === true, 'You must accept terms and conditions'),
});
// .refine((data) => data.password === data.passwordConfirm, {
//   message: 'Passwords must match',
//   path: ['passwordConfirm'],
// });

/**
 * Default Values for the form
 */
const defaultValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  dob: "",
  roleId: "",
  gender: "",
  // acceptTermsConditions: false,
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

function AuthJsCredentialsSignUpForm() {
  const router = useRouter();
  const { control, formState, handleSubmit, setError } = useForm({
    mode: "onChange",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  // Use the custom POST hook for signup
  const { trigger: triggerSignup, isMutating } = usePost("signup", createUser);

  async function onSubmit(formData) {
    try {
      // Convert roleId to an integer before sending it
      const formattedData = { ...formData, roleId: Number(formData.roleId) };

      const response = await triggerSignup(formattedData);

      if (response?.error) {
        setError("root", { type: "manual", message: response.error });
        return false;
      }
      // storeAuthToken(response?.data?.accessToken);
      // router.push('/dashboards/project');
      return true;
    } catch (error) {
      setError("root", {
        type: "manual",
        message: "Signup failed. Please try again.",
      });
      return false;
    }
  }

  return (
    <form
      name="registerForm"
      noValidate
      className="mt-8 flex w-full flex-col justify-center"
      onSubmit={handleSubmit(onSubmit)}
    >
      {errors?.root?.message && (
        <Alert className="mb-8" severity="error">
          {errors?.root?.message}
        </Alert>
      )}

      <FormInputField
        name="first_name"
        control={control}
        label="First Name"
        type="text"
        required
      />
      <FormInputField
        name="last_name"
        control={control}
        label="Last Name"
        type="text"
        required
      />
      <FormInputField
        name="email"
        control={control}
        label="Email"
        type="email"
        required
      />
      <FormInputField
        name="password"
        control={control}
        label="Password"
        type="password"
        required
      />
      <FormInputField
        name="phone"
        control={control}
        label="Phone"
        type="text"
        required
      />
      <FormInputField
        name="roleId"
        control={control}
        label="Role Id"
        type="number"
        required
      />
      <FormInputField
        name="dob"
        control={control}
        label="DOB (YYYY-MM-DD)"
        type="text"
        required
      />
      <FormControl component="fieldset" margin="normal">
        <FormLabel component="legend">Gender</FormLabel>
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <RadioGroup {...field} row>
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel
                value="female"
                control={<Radio />}
                label="Female"
              />
              <FormControlLabel
                value="other"
                control={<Radio />}
                label="Other"
              />
            </RadioGroup>
          )}
        />
        {errors.gender && (
          <FormHelperText error>{errors.gender.message}</FormHelperText>
        )}
      </FormControl>

      {/* Terms & Conditions Checkbox */}
      {/* <FormControlLabel
        control={
          <Controller
            name="acceptTermsConditions"
            control={control}
            render={({ field }) => <Checkbox {...field} checked={field.value} />}
          />
        }
        label="I accept the terms and conditions"
      />
      {errors.acceptTermsConditions && <FormHelperText error>{errors.acceptTermsConditions.message}</FormHelperText>} */}

      {/* Submit Button */}
      <AppButton
        label="Create your free account"
        type="submit"
        // color="secondary"
        fullWidth
        size="large"
        aria-label="Register"
        disabled={_.isEmpty(dirtyFields) || !isValid} // Ensure form validation works before enabling
        className="mt-4 w-full"
      />
    </form>
  );
}

export default AuthJsCredentialsSignUpForm;
