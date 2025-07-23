

import type { CartItem } from "@interfaces/cart-item";
import { defineAction } from "astro:actions";
import { db, eq, inArray, Product, ProductImage } from "astro:db";
import { z } from "astro:schema";

export const loadProductsFromCart= defineAction({
        accept:'json',
        //input:z.object({}),
        handler:async(_,{cookies})=>{
            const cart = JSON.parse(cookies.get('cart')?.value ?? '[]') as CartItem[];
            if(cart.length ===0) return [];
            const productId = cart.map((item)=>item.productId);
            const dbProducts = await db.select().from(Product).innerJoin(ProductImage,eq(Product.id,ProductImage.productId)).where(inArray(Product.id,productId))

            //console.log('product Cart: ',dbProducts)

            return cart.map(item =>{
                const dbProduct = dbProducts.find(product=> product.Product.id === item.productId );
                if (!dbProduct) {
                    throw new Error(`ERROR: el producto con id: ${item.productId} no fue encontrado !!!`);
                    
                }

                const {title,price,slug} = dbProduct.Product
                const  image = dbProduct.ProductImage.image;

                return {
                    productId:item.productId,
                    title:title,
                    sizes:  item.size,
                    quantity:item.quantity,
                    price:price,
                    slug:slug,
                    image: image.startsWith('http') ? image : `${import.meta.env.PUBLIC_URL}/images/products/${image}`
                }

            }) ;
        }
    })
