// "use client";

// import { CKEditor } from '@ckeditor/ckeditor5-react';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// import { FormControl, FormHelperText } from '@mui/material';
// import { Control, Controller, FieldValues, Path } from 'react-hook-form';

// interface FormCKEditorProps<T extends FieldValues> {
//   control: Control<T>;
//   name: Path<T>;
//   label?: string;
//   error?: boolean;
//   helperText?: string;
// }

// function FormCKEditor<T extends FieldValues>({
//   control,
//   name,
//   label,
//   error,
//   helperText,
// }: FormCKEditorProps<T>) {
//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field: { onChange, value } }) => (
//         <FormControl error={error} fullWidth>
//           <CKEditor
//             editor={ClassicEditor}
//             data={value}
//             onChange={(event, editor) => {
//               const data = editor.getData();
//               onChange(data);
//             }}
//             config={{
//               toolbar: [
//                 'heading',
//                 '|',
//                 'bold',
//                 'italic',
//                 'link',
//                 'bulletedList',
//                 'numberedList',
//                 '|',
//                 'outdent',
//                 'indent',
//                 '|',
//                 'blockQuote',
//                 'insertTable',
//                 'undo',
//                 'redo',
//               ],
//               language: 'en',
//               removePlugins: ['CKFinderUploadAdapter', 'CKFinder', 'EasyImage', 'Image', 'ImageCaption', 'ImageStyle', 'ImageToolbar', 'ImageUpload', 'MediaEmbed'],
//             }}
//           />
//           {helperText && <FormHelperText>{helperText}</FormHelperText>}
//         </FormControl>
//       )}
//     />
//   );
// }

// export default FormCKEditor;
