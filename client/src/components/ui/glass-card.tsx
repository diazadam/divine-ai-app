import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GlassCard({ 
  children, 
  className, 
  ...props 
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-effect rounded-2xl backdrop-blur-xl",
        "bg-gradient-to-br from-white/10 to-white/5",
        "border border-white/10",
        "shadow-xl shadow-black/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
