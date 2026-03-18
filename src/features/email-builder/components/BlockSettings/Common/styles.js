import theme from '../../../theme';

export const inputClasses = `
    !h-[36px]
    !rounded-[4px]
    !border
    !px-[16px]
    !text-[14px]
    !leading-[20px]
    !w-full
    !shadow-none
    !appearance-none
    focus:!outline-none
    focus:!shadow-none
    transition-all
`.replace(/\s+/g, ' ');

export const inputStyle = {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    color: theme.colors.text.primary,
};

export const colorInputClasses = "!h-[36px] !w-10 !p-0 !border !rounded-[4px] !overflow-hidden !cursor-pointer";

export const colorInputStyle = {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background
};
