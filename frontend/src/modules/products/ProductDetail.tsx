// src/modules/products/ProductDetail.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProduct } from './useProducts';
import { useAddCartItem } from '../cart/useCart';
import { formatCents } from '../../shared/formatCents';
import { ApiError } from '../../api/client';
import { formatApiErrorDetails } from '../../shared/formatApiErrorDetails';
import { imageUrl } from '../../shared/imageUrl';
import { stockBadge } from '../../shared/stockBadge';
import { Alert } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { LoadingState } from '../../ui/LoadingState';
import { cn } from '../../ui/cn';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isPending, error } = useProduct(id ?? '');
  const addCartItem = useAddCartItem();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  if (isPending) return <LoadingState label="Cargando producto…" />;
  if (error) {
    return (
      <Alert variant="danger">
        {error instanceof ApiError ? error.message : 'No se pudo cargar el producto'}
      </Alert>
    );
  }
  if (!product) return null;

  const images = product.images ?? [];
  const selectedImage =
    images.find((image) => image.id === selectedImageId) ??
    images.find((image) => image.isPrimary) ??
    images[0];
  const badge = stockBadge(product.stock);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        {selectedImage ? (
          <>
            <img
              src={imageUrl(selectedImage.url)}
              alt={product.name}
              className="aspect-square w-full rounded border border-border object-cover"
            />
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedImageId(image.id)}
                    aria-label={`Ver foto ${index + 1}`}
                    className={cn(
                      'ui-focus h-16 w-16 overflow-hidden rounded-sm border',
                      selectedImage.id === image.id ? 'border-primary' : 'border-border',
                    )}
                  >
                    <img src={imageUrl(image.url)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded border border-border bg-surface-2 text-sm text-muted">
            Sin foto
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{product.category}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-3 font-display text-2xl font-bold">{formatCents(product.priceCents)}</p>
        <p className="mt-1">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

        <div className="mt-6 flex items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Cantidad
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24"
            />
          </label>
          <Button
            onClick={() => {
              if (quantity < 1) return;
              addCartItem.mutate({ productId: product.id, quantity });
            }}
            loading={addCartItem.isPending}
            disabled={quantity < 1}
          >
            Agregar al carrito
          </Button>
        </div>

        {addCartItem.isError && (
          <div className="mt-3">
            <Alert variant="danger">
              {addCartItem.error instanceof ApiError
                ? formatApiErrorDetails(addCartItem.error)
                : 'No se pudo agregar al carrito'}
            </Alert>
          </div>
        )}
        {addCartItem.isSuccess && (
          <div className="mt-3">
            <Alert variant="success">Agregado al carrito.</Alert>
          </div>
        )}
      </div>
    </div>
  );
}
