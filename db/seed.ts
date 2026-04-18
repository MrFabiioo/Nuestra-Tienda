import { db, Category, Product, ProductImage } from 'astro:db';
import { v4 as UUID } from 'uuid';
import { seedProducts } from './seed-data';
import { resolveProductImageUrl } from '../src/utils/product-images';

// https://astro.build/db/seed
export default async function seed() {
//   const roles = [
//     { id: 'admin', name: 'Administrador' },
//     { id: 'user', name: 'Usuario de sistema' },
//   ];

//   const johnDoe = {
//     id: UUID(),
//     name: 'John Doe',
//     email: 'john.doe@google.com',
//     password: bcrypt.hashSync('123456'),
//     role: 'admin',
//   };

//   const janeDoe = {
//     id: UUID(),
//     name: 'Jane Doe',
//     email: 'jane.doe@google.com',
//     password: bcrypt.hashSync('123456'),
//     role: 'user',
//   };

//   await db.insert(Role).values(roles);
//   await db.insert(User).values([johnDoe, janeDoe]);

  // Insert categories first (before products since products reference them)
  // Use onConflictDoNothing to handle case where categories already exist
  const categories = [
    { id: 'cat-salsas', name: 'Salsas y Aderezos', slug: 'salsas-y-aderezos' },
    { id: 'cat-charcuteria', name: 'Charcutería', slug: 'charcuteria' },
    { id: 'cat-postres', name: 'Postres', slug: 'postres' },
  ];
  await db.insert(Category).values(categories).onConflictDoNothing();

  const queries: any = [];

  seedProducts.forEach((p) => {
    const product = {
      id: UUID(),
      title: p.title,
      description: p.description,
      price: p.price,
      sizes: p.sizes.join(','),
      slug: p.slug,
      categoryId: p.categoryId || undefined,
    };

    queries.push(db.insert(Product).values(product).onConflictDoNothing());

    p.images.forEach((img) => {
      const image = {
        id: UUID(),
        image: resolveProductImageUrl(img),
        productId: product.id,
      };

      queries.push(db.insert(ProductImage).values(image));
    });
  });

  // Execute queries sequentially instead of batch to avoid FK issues
  for (const query of queries) {
    await query;
  }
}
