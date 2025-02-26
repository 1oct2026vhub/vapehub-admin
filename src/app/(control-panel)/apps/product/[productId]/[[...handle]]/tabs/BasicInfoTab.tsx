import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Controller, useFormContext } from 'react-hook-form';
// import { EcommerceProduct } from '../../../../ECommerceApi';

/**
 * The basic info tab.
 */  
function BasicInfoTab() {
	const methods = useFormContext();
	const { control, formState } = methods;
	const { errors } = formState;

	return (
		<div>
			<Controller
				name="name"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Name"
						autoFocus
						id="name"
						variant="outlined"
						fullWidth
						error={!!errors.name}
						helperText={errors?.name?.message as string}
					/>
				)}
			/>

			<Controller
				name="description"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						id="description"
						label="Description"
						type="text"
						multiline
						rows={5}
						variant="outlined"
						fullWidth
					/>
				)}
			/>

			<Controller
				name="capacity"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Battery Capacity"
						autoFocus
						id="capacity"
						variant="outlined"
						fullWidth
						error={!!errors.capacity}
						helperText={errors?.capacity?.message as string}
					/>
				)}
			/>
			<Controller
				name="size"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Bottle Size"
						autoFocus
						id="size"
						variant="outlined"
						fullWidth
						error={!!errors.size}
						helperText={errors?.size?.message as string}
					/>
				)}
			/>

			<Controller
				name="puffCount"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Puff Count"
						autoFocus
						id="puffCount"
						variant="outlined"
						fullWidth
						error={!!errors.puffCount}
						helperText={errors?.puffCount?.message as string}
					/>
				)}
			/>
			<Controller
				name="powerSupply"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Power Supply"
						autoFocus
						id="powerSupply"
						variant="outlined"
						fullWidth
						error={!!errors.powerSupply}
						helperText={errors?.powerSupply?.message as string}
					/>
				)}
			/>
			<Controller
				name="nicotineStrength"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Nicotine Strength"
						autoFocus
						id="nicotineStrength"
						variant="outlined"
						fullWidth
						error={!!errors.nicotineStrength}
						helperText={errors?.nicotineStrength?.message as string}
					/>
				)}
			/>
			<Controller
				name="nicotineType"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mt-2 mb-4"
						required
						label="Nicotine Type"
						autoFocus
						id="nicotineType"
						variant="outlined"
						fullWidth
						error={!!errors.nicotineType}
						helperText={errors?.nicotineType?.message as string}
					/>
				)}
			/>

			<Controller
				name="categories"
				control={control}
				defaultValue={[]}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						className="mt-2 mb-4"
						multiple
						freeSolo
						options={[]}
						// value={value as EcommerceProduct['categories']}
						onChange={(event, newValue) => {
							onChange(newValue);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Select multiple categories"
								label="Categories"
								variant="outlined"
								InputLabelProps={{
									shrink: true
								}}
							/>
						)}
					/>
				)}
			/>

			{/* <Controller
				name="tags"
				control={control}
				defaultValue={[]}
				render={({ field: { onChange, value } }) => (
					<Autocomplete
						className="mt-2 mb-4"
						multiple
						freeSolo
						options={[]}
						// value={value as EcommerceProduct['tags']}
						onChange={(event, newValue) => {
							onChange(newValue);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Select multiple tags"
								label="Tags"
								variant="outlined"
								InputLabelProps={{
									shrink: true
								}}
							/>
						)}
					/>
				)}
			/> */}
		</div>
	);
}

export default BasicInfoTab;
