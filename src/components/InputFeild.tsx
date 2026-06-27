import React, { useEffect, useState } from "react";

interface InputFieldProps {
	label: string;
	name: string;
	type?: string;
	required?: boolean;
	placeholder?: string;
	value?: string;
	error?: string;
	onChange?: (name: string, value: string) => void;
	className?: string;
	onBlur?: () => void;
	disabled?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
	label,
	name,
	type = "text",
	required = false,
	placeholder,
	value,
	error,
	onChange,
	className = "",
	onBlur,
	disabled = false,
}) => {
	const [isFocused, setIsFocused] = useState(false);
	const [innerValue, setInnerValue] = useState(value ?? "");

	useEffect(() => {
		if (value !== undefined) {
			setInnerValue(value);
		}
	}, [value]);

	const displayValue = value !== undefined ? value : innerValue;
	const hasValue = displayValue.trim().length > 0;
	const showFloatingLabel = isFocused || hasValue;

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (value === undefined) {
			setInnerValue(event.target.value);
		}

		if (onChange) {
			onChange(name, event.target.value);
		}
	};

	const handleBlur = () => {
		setIsFocused(false);

		if (onBlur) {
			onBlur();
		}
	};

	return (
		<div className="relative mt-6">
			<label
				htmlFor={name}
				className={`absolute left-3 bg-white px-1 transition-all duration-200 pointer-events-none ${
					showFloatingLabel
						? "-top-2 text-xs text-gray-500"
						: "top-3 text-sm text-gray-700"
				}`}
				style={{
					zIndex: showFloatingLabel ? 10 : 0,
				}}
			>
				{label} {required && "*"}
			</label>

			<input
				id={name}
				name={name}
				type={type}
				value={displayValue}
				placeholder={placeholder}
				required={required}
				disabled={disabled}
				onChange={handleChange}
				onFocus={() => setIsFocused(true)}
				onBlur={handleBlur}
				className={`mt-1 block w-full rounded-md border px-3 py-3 shadow-sm placeholder-gray-400 transition-transform focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${
					error ? "border-red-500" : "border-gray-300"
				} ${disabled ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""} ${className}`}
			/>

			{error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
		</div>
	);
};

export default InputField;
