import { memo } from 'react';

const icons = {
  play: (
    <>
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </>
  ),
  pause: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  ),
  next: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M13 5l7 7-7 7M5 5l7 7-7 7" 
    />
  ),
  previous: (
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="2" 
      d="M12 19l-7-7 7-7m7 14l-7-7 7-7" 
    />
  ),
};

const Icon = memo(({ 
  name, 
  className = 'w-6 h-6', 
  ...props 
}) => {
  const icon = icons[name];
  
  if (!icon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      {...props}
    >
      {icon}
    </svg>
  );
});

Icon.displayName = 'Icon';

export default Icon;
