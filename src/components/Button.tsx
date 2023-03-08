import type { DetailedHTMLProps, ButtonHTMLAttributes } from 'react';

// eslint-disable-next-line prettier/prettier
export const Button = (props: DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & { active?: boolean }) => {
  const { children, active = false, ...rest } = props;

  return (
    <button
      {...rest}
      className={[
        'bg-white text-zinc-200 font-bold py-2 px-5 rounded-full transition-all duration-150 ease-in-out',
        active
          ? 'bg-opacity-[0.15]'
          : 'bg-opacity-10 opacity-50 hover:opacity-75',
        rest.className,
      ].join(' ')}
    >
      {children}
    </button>
  );
};
