import { column, defineDb, defineTable } from 'astro:db';

const Product = defineTable({
    columns: {
        id: column.text({ primaryKey: true, unique: true }),
        title: column.text(),
        description: column.text(),
        price: column.number(),
        sizes: column.text(),
        slug: column.text({ unique: true }),
    }
})

const ProductImage = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    productId: column.text({ references: () => Product.columns.id }),
    image: column.text(),
  },
});

export default defineDb({
  tables: {
    Product,
    ProductImage
  },
});