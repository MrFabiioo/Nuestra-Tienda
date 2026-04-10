import { column, defineDb, defineTable } from 'astro:db';

export const Category = defineTable({
  columns: {
    id: column.text({ primaryKey: true, unique: true }),
    name: column.text(),
    slug: column.text({ unique: true }),
  },
});

export const Product = defineTable({
    columns: {
        id: column.text({ primaryKey: true, unique: true }),
        title: column.text(),
        description: column.text(),
        price: column.number(),
        sizes: column.text(),
        slug: column.text({ unique: true }),
        categoryId: column.text({ optional: true }),
        // Receta de costo almacenada como JSON serializado
        recipe: column.text({ optional: true }),
    }
})

export const ProductImage = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    productId: column.text({ references: () => Product.columns.id }),
    image: column.text(),
  },
});

export default defineDb({
  tables: {
    Category,
    Product,
    ProductImage
  },
});