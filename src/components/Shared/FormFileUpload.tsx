// 'use client';

// import { useState } from 'react';
// import { Controller } from 'react-hook-form';
// import { Button, Typography } from '@mui/material';
// import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// function FormFileUpload({ name, control, label, setValue, accept = 'image/*', maxSize = 2 * 1024 * 1024 }) {
//   const [fileName, setFileName] = useState('');
//   const [error, setError] = useState(null);

//   const handleFileChange = (event, field) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     if (file.size > maxSize) {
//       setError(`File size should be less than ${maxSize / 1024 / 1024}MB`);
//       return;
//     }

//     setError(null);
//     setFileName(file.name);
//     setValue(name, file); // Store file in form state
//     field.onChange(file); // Update React Hook Form state
//   };

//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field }) => (
//         <div className="flex flex-col space-y-2">
//           <Typography>{label}</Typography>
//           <input
//             type="file"
//             accept={accept}
//             onChange={(e) => handleFileChange(e, field)}
//             hidden
//             id={`file-upload-${name}`}
//           />
//           <label htmlFor={`file-upload-${name}`}>
//             <Button
//               variant="contained"
//               component="span"
//               startIcon={<CloudUploadIcon />}
//               className="w-full"
//             >
//               Upload File
//             </Button>
//           </label>
//           {fileName && <Typography className="text-sm text-gray-600">Selected: {fileName}</Typography>}
//           {error && <Typography className="text-sm text-red-500">{error}</Typography>}
//         </div>
//       )}
//     />
//   );
// }

// export default FormFileUpload;



// import { Controller } from 'react-hook-form';
// import { Button, Typography } from '@mui/material';
// import CloudUploadIcon from '@mui/icons-material/CloudUpload';

// function FormFileUpload({ name, control, label, setValue }) {
//     return (
//         <Controller
//             name={name}
//             control={control}
//             render={({ field: { value, onChange }, fieldState: { error } }) => (
//                 <div className="flex flex-col space-y-2">
//                     <Typography>{label}</Typography>
//                     <input
//                         type="file"
//                         accept="image/png, image/jpeg, image/jpg, image/webp"
//                         onChange={(e) => {
//                             const file = e.target.files?.[0] || null;
//                             setValue(name, file, { shouldValidate: true });
//                         }}
//                         hidden
//                         id={name}
//                     />
//                     <label htmlFor={name}>
//                         <Button
//                             component="span"
//                             variant="contained"
//                             startIcon={<CloudUploadIcon />}
//                         >
//                             Upload File
//                         </Button>
//                     </label>
//                     {value ? <Typography>{value.name}</Typography> : null}
//                     {error && <Typography color="error">{error.message}</Typography>}
//                 </div>
//             )}
//         />
//     );
// }

// export default FormFileUpload;



import { Controller } from "react-hook-form";
import { Button, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

function FormFileUpload({ name, control, label, setValue }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { value }, fieldState: { error } }) => (
                <div className="flex flex-col space-y-2">
                    <Typography>{label}</Typography>
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            console.log("Selected File:", file); // ✅ Debugging
                            setValue(name, file, { shouldValidate: true });
                        }}
                        hidden
                        id={name}
                    />
                    <label htmlFor={name}>
                        <Button component="span" variant="contained" startIcon={<CloudUploadIcon />}>
                            Upload File
                        </Button>
                    </label>
                    {value && value.name && <Typography>{value.name}</Typography>}
                    {error && <Typography color="error">{error.message}</Typography>}
                </div>
            )}
        />
    );
}

export default FormFileUpload;
