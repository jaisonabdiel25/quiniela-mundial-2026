"use client";

type Props = {
  action: () => Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function ConfirmButton({
  action,
  confirmMessage,
  children,
  className,
  disabled,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (disabled || !confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={className} disabled={disabled}>
        {children}
      </button>
    </form>
  );
}
