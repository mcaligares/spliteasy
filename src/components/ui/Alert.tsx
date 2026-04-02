import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'info';
  message: string;
}

const styles = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const icons = {
  error: AlertCircle,
  success: CheckCircle,
  info: Info,
};

export function Alert({ type, message }: AlertProps) {
  const Icon = icons[type];
  return (
    <div className={`flex items-center gap-2 border rounded-lg px-4 py-3 text-sm ${styles[type]}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
