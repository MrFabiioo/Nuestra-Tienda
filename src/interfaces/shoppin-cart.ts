export type Product = {
  productId: string;
  title: string;
  sizes: string;
  quantity: number;
  price: number;
  slug: string;
  image: string;
};

export type ShoppingCartProps = {
  products: Product[];
};