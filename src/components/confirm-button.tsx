"use client";

type Props = {
  action: () => Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
};

export function ConfirmButton({ action, confirmMessage, children, className }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}
