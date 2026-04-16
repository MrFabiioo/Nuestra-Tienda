export interface ProductWithImages{
    id: string,
    title: string,
    description: string,
    price: number,
    sizes: string,
    slug: string,
    images:string,
    categoryName?: string,
    categoryId?: string,
    categorySlug?: string,
    isEnabled?: boolean | null,
    product?: {
        title: string;
        description: string;
        price: number;
        slug: string;
        images: string;
    };
}