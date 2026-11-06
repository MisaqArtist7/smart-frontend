# Product API

Base URL: `http://localhost:4000` (env: `NEXT_PUBLIC_API_URL`)
Route prefix: `/product` (change here if the controller is renamed to `products`)
CORS: allowed origin `http://localhost:3000`

## Database (Prisma 7, PostgreSQL)

```prisma
model Product {
  id              Int            @id @default(autoincrement())
  category        Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  categoryId      Int
  title           String         @db.VarChar(200)
  slug            String         @unique @db.VarChar(220)
  description     String?        @db.Text
  specs           Json?
  metaTitle       String?        @db.VarChar(70)
  metaDescription String?        @db.VarChar(170)
  price           Int
  discountPrice   Int?
  stock           Int            @default(0)
  sku             String?        @unique @db.VarChar(50)
  isActive        Boolean        @default(true)
  images          ProductImage[]
  orderItems      OrderItem[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model ProductImage {
  id        Int      @id @default(autoincrement())
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId Int
  url       String   @db.VarChar(255)
  alt       String?  @db.VarChar(200)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}
```

## Response type (TypeScript, for the frontend)

```ts
type ProductImage = {
  id: number; productId: number; url: string;
  alt: string | null; sortOrder: number; createdAt: string;
};

type Product = {
  id: number;
  categoryId: number;
  title: string;
  slug: string;
  description: string | null;
  specs: Record<string, unknown> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  price: number;                 // Toman, integer
  discountPrice: number | null;  // null = no discount
  stock: number;
  sku: string | null;
  isActive: boolean;
  images: ProductImage[];        // sorted by sortOrder (list and detail only)
  category?: { id: number; name: string }; // included in list and detail
  createdAt: string;
  updatedAt: string;
};
```

## Endpoints

### POST /product
Body required: `title` (2-200), `slug` (lowercase English, numbers, hyphens, max 220),
`categoryId` (number), `price` (int >= 0)
Body optional: `discountPrice` (int >= 0), `stock` (int >= 0, default 0), `sku` (max 50),
`description`, `specs` (JSON object), `metaTitle` (max 70), `metaDescription` (max 170),
`isActive` (default true)
Success: 201 + created product
Errors: 400 invalid input / category not found / discountPrice >= price, 409 slug or sku already used

### GET /product
Success: 200 + `Product[]` (newest first, with images and category)

### GET /product/:id
Success: 200 + `Product`
Errors: 400 id is not a number, 404 not found

### PATCH /product/:id
Body: same fields as POST, all optional
Send `null` to clear a nullable field (discountPrice, sku, description, specs...)
Success: 200 + updated product
Errors: 400, 404, 409 (same as POST)

### DELETE /product/:id
Success: 200 + `{ "message": "Product deleted" }`
Errors: 404, 409 if the product exists in past orders (set isActive = false instead)

## Rules
- All ids are numbers, never strings.
- The API uses `forbidNonWhitelisted`: any field not listed above returns 400.
  Do NOT send `images`, `imageUrl`, `categoryName`, `id`, `createdAt`, `updatedAt`.
- Never send empty strings. Omit the field instead (critical for `sku`, which is unique).
- `categoryId` comes from a `<select>` as a string: convert with `Number()` before sending.
- Display price: `discountPrice ?? price`. If `discountPrice` is not null, show `price` struck through.
- Numeric inputs: use `valueAsNumber`. Empty optional numbers must become `undefined`.
- Slug is typed manually by the admin (English only). No auto-slug from Persian titles.

## Not implemented yet
- Image upload and ProductImage endpoints
- GET by slug (needed for the public product page)
- Auth guards (admin only on POST, PATCH, DELETE)
- Pagination, search, and filters
- Public list should return only `isActive: true`