import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProduct } from '../products/useProducts';
import {
  useCreateProduct,
  useDeleteProduct,
  useDeleteProductImage,
  useSetPrimaryImage,
  useUpdateProduct,
  useUploadProductImages,
} from './useSellerProducts';
import { ApiError } from '../../api/client';
import { formatApiErrorDetails } from '../../shared/formatApiErrorDetails';
import { imageUrl } from '../../shared/imageUrl';
import { Alert } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Field } from '../../ui/Field';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';

export function SellerProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const { data: product } = useProduct(id ?? '');
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImages = useUploadProductImages();
  const deleteImage = useDeleteProductImage();
  const setPrimaryImage = useSetPrimaryImage();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [priceEdited, setPriceEdited] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const initialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product && !initialized.current) {
      initialized.current = true;
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setPrice((product.priceCents / 100).toFixed(2));
      setStock(String(product.stock));
    }
  }, [product]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const basePriceCents = Math.round(Number(price) * 100);
    try {
      if (isEditing && id) {
        const input: {
          name: string;
          description: string;
          category: string;
          stock: number;
          basePriceCents?: number;
        } = { name, description, category, stock: Number(stock) };
        if (priceEdited) {
          input.basePriceCents = basePriceCents;
        }
        await updateProduct.mutateAsync({ id, input });
      } else {
        await createProduct.mutateAsync({
          name,
          description,
          category,
          basePriceCents,
          initialStock: Number(stock),
        });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudo guardar el producto');
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('¿Eliminar este producto?')) return;
    setError(null);
    try {
      await deleteProduct.mutateAsync(id);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudo eliminar el producto');
    }
  }

  async function handleUploadImages() {
    if (!id || pendingFiles.length === 0) return;
    setImagesError(null);
    try {
      await uploadImages.mutateAsync({ productId: id, files: pendingFiles });
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setImagesError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudieron subir las fotos');
    }
  }

  async function handleDeleteImage(imageId: string) {
    if (!id) return;
    if (!window.confirm('¿Eliminar esta foto?')) return;
    setImagesError(null);
    try {
      await deleteImage.mutateAsync({ productId: id, imageId });
    } catch (err) {
      setImagesError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudo eliminar la foto');
    }
  }

  async function handleSetPrimary(imageId: string) {
    if (!id) return;
    setImagesError(null);
    try {
      await setPrimaryImage.mutateAsync({ productId: id, imageId });
    } catch (err) {
      setImagesError(err instanceof ApiError ? formatApiErrorDetails(err) : 'No se pudo marcar como principal');
    }
  }

  const saving = createProduct.isPending || updateProduct.isPending;
  const images = product?.images ?? [];
  const atImageLimit = images.length >= 5;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 font-display text-2xl font-semibold tracking-tight">
        {isEditing ? 'Editar producto' : 'Nuevo producto'}
      </h1>
      <Card className="p-6">
        {error && (
          <div className="mb-4">
            <Alert variant="danger">{error}</Alert>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nombre">
            {(control) => (
              <Input value={name} onChange={(e) => setName(e.target.value)} required {...control} />
            )}
          </Field>
          <Field label="Descripción">
            {(control) => (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                {...control}
              />
            )}
          </Field>
          <Field label="Categoría">
            {(control) => (
              <Input value={category} onChange={(e) => setCategory(e.target.value)} required {...control} />
            )}
          </Field>
          <Field label="Precio">
            {(control) => (
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setPriceEdited(true);
                }}
                required
                {...control}
              />
            )}
          </Field>
          <Field label="Stock">
            {(control) => (
              <Input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                {...control}
              />
            )}
          </Field>
          <Button type="submit" loading={saving} className="w-full">
            Guardar
          </Button>
        </form>
      </Card>

      {isEditing && (
        <button
          onClick={handleDelete}
          disabled={deleteProduct.isPending}
          className="mt-4 text-sm font-medium text-danger hover:underline disabled:opacity-50"
        >
          Eliminar producto
        </button>
      )}

      {isEditing && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold">Fotos</h2>
          {imagesError && (
            <div className="mb-3">
              <Alert variant="danger">{imagesError}</Alert>
            </div>
          )}
          <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {images.map((image) => (
              <li key={image.id} className="flex flex-col gap-1">
                <div className="relative overflow-hidden rounded-sm border border-border">
                  <img src={imageUrl(image.url)} alt="" className="aspect-square w-full object-cover" />
                  {image.isPrimary && (
                    <span className="absolute left-1 top-1">
                      <Badge variant="success">Principal</Badge>
                    </span>
                  )}
                </div>
                {!image.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(image.id)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id)}
                  className="text-xs font-medium text-danger hover:underline"
                >
                  Eliminar foto
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
              disabled={atImageLimit}
              aria-label="Seleccionar fotos"
              className="text-sm text-muted file:mr-3 file:rounded-sm file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleUploadImages}
              loading={uploadImages.isPending}
              disabled={atImageLimit || pendingFiles.length === 0}
            >
              Subir fotos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
