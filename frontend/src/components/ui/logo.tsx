import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'white' | 'black';
}

export function Logo({ size = 'md', className, variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    default: 'fill-accent',
    white: 'fill-white',
    black: 'fill-black'
  };

  return (
    <svg 
      className={cn(sizeClasses[size], colorClasses[variant], className)} 
      viewBox="0,0,256,256"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g 
        fill="currentColor" 
        fillRule="nonzero" 
        stroke="none" 
        strokeWidth="1" 
        strokeLinecap="butt" 
        strokeLinejoin="miter" 
        strokeMiterlimit="10" 
        strokeDasharray="" 
        strokeDashoffset="0" 
        fontFamily="none" 
        fontWeight="none" 
        fontSize="none" 
        textAnchor="none" 
        style={{ mixBlendMode: 'normal' }}
      >
        <g transform="scale(5.12,5.12)">
          <path d="M25,2c-12.69922,0 -23,9.60156 -23,21.5c0,6.30078 2.89844,12.19922 8,16.30078v8.80078l8.60156,-4.5c2.09766,0.59766 4.19922,0.79688 6.39844,0.79688c12.69922,0 23,-9.59766 23,-21.5c0,-11.79687 -10.30078,-21.39844 -23,-21.39844zM27.30078,30.60156l-5.80078,-6.20312l-10.80078,6.10156l12,-12.69922l5.90234,5.89844l10.5,-5.89844z"></path>
        </g>
      </g>
    </svg>
  );
}
