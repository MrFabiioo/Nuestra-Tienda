import { column, defineDb, defineTable } from 'astro:db';

export const SiteSettings = defineTable({
  columns: {
    key:       column.text({ primaryKey: true, unique: true }),
    value:     column.text(),
    updatedAt: column.date(),
  },
});

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
        // Marca el producto para aparecer en el banner del home
        featured: column.boolean({ optional: true }),
    }
})

export const ProductImage = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    productId: column.text({ references: () => Product.columns.id }),
    image: column.text(),
  },
});

export const Order = defineTable({
  columns: {
    id: column.text({ primaryKey: true, unique: true }),
    publicTokenHash: column.text({ unique: true }),
    customerName: column.text(),
    customerEmail: column.text(),
    customerPhone: column.text(),
    deliveryMethod: column.text(),
    address: column.text(),
    city: column.text(),
    notes: column.text({ optional: true }),
    subtotal: column.number(),
    tax: column.number(),
    total: column.number(),
    status: column.text(),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export const OrderItem = defineTable({
  columns: {
    id: column.text({ primaryKey: true, unique: true }),
    orderId: column.text({ references: () => Order.columns.id }),
    productId: column.text({ references: () => Product.columns.id }),
    title: column.text(),
    slug: column.text(),
    size: column.text(),
    quantity: column.number(),
    unitPrice: column.number(),
    lineTotal: column.number(),
    image: column.text({ optional: true }),
  },
});

export const Payment = defineTable({
  columns: {
    id: column.text({ primaryKey: true, unique: true }),
    orderId: column.text({ references: () => Order.columns.id, unique: true }),
    method: column.text(),
    amount: column.number(),
    status: column.text(),
    submittedAt: column.date({ optional: true }),
    reviewedAt: column.date({ optional: true }),
    reviewerUid: column.text({ optional: true }),
    rejectionReason: column.text({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export const PaymentProof = defineTable({
  columns: {
    id: column.text({ primaryKey: true, unique: true }),
    paymentId: column.text({ references: () => Payment.columns.id }),
    assetUrl: column.text(),
    assetPublicId: column.text({ optional: true }),
    originalFilename: column.text(),
    mimeType: column.text(),
    sizeBytes: column.number(),
    uploadedAt: column.date(),
  },
});

export const NotificationLog = defineTable({
  columns: {
    id: column.text({ primaryKey: true, unique: true }),
    orderId: column.text({ references: () => Order.columns.id }),
    channel: column.text(),
    template: column.text(),
    recipient: column.text(),
    provider: column.text(),
    status: column.text(),
    attempts: column.number(),
    lastError: column.text({ optional: true }),
    sentAt: column.date({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  },
});

export default defineDb({
  tables: {
    Category,
    Product,
    ProductImage,
    Order,
    OrderItem,
    Payment,
    PaymentProof,
    NotificationLog,
    SiteSettings,
  },
});
