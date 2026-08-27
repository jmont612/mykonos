import { Link } from 'react-router-dom';
import type { Product } from '../api/types';
import { formatCents } from './formatCents';
import { stockBadge } from './stockBadge';
import { ProductThumbnail } from './ProductThumbnail';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function ProductCard({ product, to }: { product: Product; to: string }) {
  const badge = stockBadge(product.stock);
  return (
    <li>
      <Card interactive className="h-full overflow-hidden">
        <Link to={to} className="flex h-full flex-col">
          <ProductThumbnail images={product.images} alt={product.name} />
          <div className="flex flex-1 flex-col gap-1 p-4">
            <span className="font-semibold">{product.name}</span>
            <span className="text-xs text-muted">{product.category}</span>
            <span className="mt-1 font-display text-lg font-bold">
              {formatCents(product.priceCents)}
            </span>
            <span className="mt-2">
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </span>
          </div>
        </Link>
      </Card>
    </li>
  );
}
