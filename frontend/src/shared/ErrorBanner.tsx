import { Alert } from '../ui/Alert';

export function ErrorBanner({ message }: { message: string }) {
  return <Alert variant="danger">{message}</Alert>;
}
