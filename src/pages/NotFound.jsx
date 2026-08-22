import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState
        icon="🤔"
        title="404 - Page not found"
        message="The page you're looking for doesn't exist or has moved."
      />
      <div style={{ textAlign: 'center' }}>
        <Link to="/" className="btn btn-primary">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
