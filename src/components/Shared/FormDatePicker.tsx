// import { Controller } from "react-hook-form";
// import { TextField, InputAdornment } from "@mui/material";
// import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import dayjs from "dayjs";
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

// interface FormDatePickerProps {
//   name: string;
//   control: any;
//   label: string;
//   required?: boolean;
// }

// const FormDatePicker: React.FC<FormDatePickerProps> = ({ name, control, label, required }) => {
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       <Controller
//         name={name}
//         control={control}
//         rules={{ required: required ? "This field is required" : false }}
//         render={({ field, fieldState }) => (
//           <DatePicker
//             {...field}
//             label={label}
//             value={field.value ? dayjs(field.value) : null}
//             onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : null)}
//             slotProps={{
//               textField: {
//                 fullWidth: true,
//                 error: !!fieldState.error,
//                 helperText: fieldState.error?.message,
//                 variant: "outlined",
//                 InputProps: {
//                   endAdornment: (
//                     <InputAdornment position="end">
//                       <CalendarTodayIcon color="action" />
//                     </InputAdornment>
//                   ),
//                 },
//                 sx: {
//                   "& .MuiOutlinedInput-root": {
//                     "& fieldset": {
//                       borderImage: "linear-gradient(to right, #2E9970, #005434) 1",
//                     },
//                     "&:hover fieldset": {
//                       borderImage: "linear-gradient(to right, #247C5C, #003F29) 1",
//                     },
//                     "&.Mui-focused fieldset": {
//                       borderImage: "linear-gradient(to right, #1E7A56, #004C30) 1",
//                     },
//                   },
//                   "& .MuiInputLabel-root.Mui-focused": {
//                     color: "#2E9970",
//                   },
//                 },
//               },
//             }}
//           />
//         )}
//       />
//     </LocalizationProvider>
//   );
// };

// export default FormDatePicker;

// import { Controller } from "react-hook-form";
// import { TextField, InputAdornment } from "@mui/material";
// import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import dayjs from "dayjs";
// import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

// interface FormDatePickerProps {
//   name: string;
//   control: any;
//   label: string;
//   required?: boolean;
// }

// const FormDatePicker: React.FC<FormDatePickerProps> = ({ name, control, label, required }) => {
//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       <Controller
//         name={name}
//         control={control}
//         rules={{ required: required ? "This field is required" : false }}
//         render={({ field, fieldState }) => (
//           <DatePicker
//             {...field}
//             format="YYYY-MM-DD" // Ensures date format
//             value={field.value ? dayjs(field.value) : null}
//             onChange={(date) => field.onChange(date ? date.format("YYYY-MM-DD") : null)}
//             openTo="day" // Opens the calendar directly to the day selection
//             disableOpenPicker={false} // Ensures calendar opens when clicking the input
//             slotProps={{
//               textField: {
//                 fullWidth: true,
//                 error: !!fieldState.error,
//                 helperText: fieldState.error?.message,
//                 variant: "outlined",
//                 InputProps: {
//                   endAdornment: (
//                     <InputAdornment position="end">
//                       <CalendarTodayIcon color="action" />
//                     </InputAdornment>
//                   ),
//                 },
//                 sx: {
//                   "& .MuiOutlinedInput-root": {
//                     "& fieldset": {
//                       borderImage: "linear-gradient(to right, #2E9970, #005434) 1",
//                     },
//                     "&:hover fieldset": {
//                       borderImage: "linear-gradient(to right, #247C5C, #003F29) 1",
//                     },
//                     "&.Mui-focused fieldset": {
//                       borderImage: "linear-gradient(to right, #1E7A56, #004C30) 1",
//                     },
//                   },
//                   "& .MuiInputLabel-root.Mui-focused": {
//                     color: "#2E9970",
//                   },
//                 },
//               },
//             }}
//           />
//         )}
//       />
//     </LocalizationProvider>
//   );
// };

// export default FormDatePicker;

import { useState } from "react";
import { Controller } from "react-hook-form";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { InputAdornment } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import dayjs from "dayjs";

interface FormDatePickerProps {
  name: string;
  control: any;
  label: string;
  required?: boolean;
}

const FormDatePicker: React.FC<FormDatePickerProps> = ({
  name,
  control,
  label,
  required,
}) => {
  const [open, setOpen] = useState(false); // Controls the DatePicker open state

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? "This field is required" : false }}
        render={({ field, fieldState }) => (
          <DatePicker
            {...field}
            format="YYYY-MM-DD"
            value={field.value ? dayjs(field.value) : null}
            onChange={(date) =>
              field.onChange(date ? date.format("YYYY-MM-DD") : null)
            }
            open={open} // Controls when the DatePicker is open
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            openTo="day"
            disableOpenPicker={false}
            slotProps={{
              actionBar: {
                actions: ["clear", "accept"],
              },
              textField: {
                fullWidth: true,
                error: !!fieldState.error,
                helperText: fieldState.error?.message,
                variant: "outlined",
                onClick: () => setOpen(true), // Open picker when clicking input
                InputProps: {
                  readOnly: true, // Prevent manual typing
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarTodayIcon
                        color="action"
                        style={{ cursor: "pointer" }}
                        onClick={() => setOpen(true)} // Open on icon click
                      />
                    </InputAdornment>
                  ),
                },
                label: (
                  <>
                    {label}{" "}
                    {required && <span style={{ color: "red" }}>*</span>}
                  </>
                ),
                sx: {
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    "& fieldset": {
                      borderImage:
                        "linear-gradient(to right, #2E9970, #005434) 1",
                    },
                    "&:hover fieldset": {
                      borderImage:
                        "linear-gradient(to right, #247C5C, #003F29) 1",
                    },
                    "&.Mui-focused fieldset": {
                      borderImage:
                        "linear-gradient(to right, #1E7A56, #004C30) 1",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: "#2E9970", // Label color before focus
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#2E9970",
                  },
                },
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

export default FormDatePicker;
