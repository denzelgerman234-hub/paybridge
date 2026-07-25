import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

const paddings = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };

export function Card({ children, className, padding = 'md', hover, glow, onClick, ...props }: CardProps) {
  return (
    <div
      {...props}
      onClick={onClick}
      className={cn(
        'card transition-colors duration-150',
        paddings[padding],
        hover && 'hover:border-gold/40 cursor-pointer',
        glow && 'border-gold/30',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
