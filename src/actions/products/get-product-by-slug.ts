

import { defineAction } from "astro:actions";
import { db, eq, Product, ProductImage } from "astro:db";
import { z } from "astro:schema";

const newProduct ={
      id:'',
      title: 'nuevo producto',
      description: 'descripcion',
      price: 0,
      sizes: 'Pequeño',
      slug:' nuevo-producto'
}
export const getProductBySlug= defineAction({
        accept:'json',
        input:z.string(),
        handler:async(slug)=>{
           //console.log('slugggg:  ',slug)
            if (slug==='new-product') {
                return {
                    product: newProduct,
                    images:[],
                }
            }
            
            const [product] = await db.select().from(Product).where(eq(Product.slug,slug))
            if (!product) {
                throw new Error(`Producto de nombre ${slug} no encontrado` );
                
            }
            const images = await db.select().from(ProductImage).where(eq(ProductImage.productId,product.id))
            
            return {
                product: product,
                images: images.map(img =>img.image)
            };
        }
    })
