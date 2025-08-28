import logoImage from '@/assets/data-lineage-logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={logoImage} 
        alt="Data Lineage Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-foreground">Data Lineage</h1>
        <p className="text-sm text-muted-foreground">Visualize Your Data Flow</p>
      </div>
    </div>
  );
};

export default Logo;