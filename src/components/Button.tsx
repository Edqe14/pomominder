import type { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';

type Props = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { active?: boolean };

export const Button = ({ children, active = false, ...rest }: Props) => (
  <button
    type="button"
    {...rest}
    className={[
      'text-zinc-200 font-bold py-2 px-5 rounded-full transition-all duration-150 ease-in-out',
      active ? 'bg-white/15' : 'bg-white/10 opacity-50 hover:opacity-75',
      rest.className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </button>
);
