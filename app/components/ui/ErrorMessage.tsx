import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  fullScreen = false,
}: ErrorMessageProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center p-8" suppressHydrationWarning>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-100">
      {content}
    </div>
  );
}
