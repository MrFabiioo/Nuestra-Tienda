export interface ProductWithImages{
    id: string,
    title: string,
    description: string,
    price: number,
    sizes: string,
    slug: string, 
    images:string,
    categoryName?: string,
}