import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { width: 100, height: 40 },
  md: { width: 140, height: 56 },
  lg: { width: 200, height: 80 },
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const { width, height } = sizeMap[size];

  return (
    <Image
      src="/logo-kuneo.png"
      alt="KUNEO BUILDING"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      style={{ width, height }}
      priority
    />
  );
}
