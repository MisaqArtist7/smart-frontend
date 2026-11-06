# Category Backend Specification

## DTO (CreateCategoryDto)
```ts
import {
  IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString() @MinLength(2) @MaxLength(100)
  name: string;

  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase English letters, numbers, and hyphens',
  })
  @MaxLength(120)
  slug: string;

  @IsOptional() @IsInt()
  parentId?: number;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString() @MaxLength(255)
  image?: string;

  @IsOptional() @IsString() @MaxLength(150)
  imageAlt?: string;

  @IsOptional() @IsString() @MaxLength(70)
  metaTitle?: string;

  @IsOptional() @IsString() @MaxLength(170)
  metaDescription?: string;

  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
```

## Prisma Model
```prisma
model Category {
  id              Int        @id @default(autoincrement())
  parent          Category?  @relation("CategoryTree", fields: [parentId], references: [id], onDelete: Restrict)
  parentId        Int?
  children        Category[] @relation("CategoryTree")
  name            String     @db.VarChar(100)
  slug            String     @unique @db.VarChar(120)
  description     String?    @db.Text
  image           String?    @db.VarChar(255)
  imageAlt        String?    @db.VarChar(150)
  metaTitle       String?    @db.VarChar(70)
  metaDescription String?    @db.VarChar(170)
  sortOrder       Int        @default(0)
  isActive        Boolean    @default(true)
  products        Product[]
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([parentId])
  @@index([isActive])
}
```

## Endpoints
- `GET /categories` - Get all categories
- `POST /categories` - Create new category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

