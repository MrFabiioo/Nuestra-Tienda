

import { ImageUpload } from "@utils/image-upload";
import { defineAction } from "astro:actions";
import { db, eq, ProductImage } from "astro:db";
import { z } from "astro:schema";

export const deleteProductImage= defineAction({
        accept:'json',
        input:z.string(),
        handler:async(imageId)=>{
            
            const [productImage] = await db.select().from(ProductImage).where(eq(ProductImage.id,imageId))

            if (!productImage) {
                throw new Error(`image with id ${imageId} not found`);    
            }

            const deleted = await db.delete(ProductImage).where(eq(ProductImage.id,imageId));

            if(productImage.image.includes('http')){
                await ImageUpload.delete(productImage.image);
            }
            
            return {ok: true} ;
        }
    })
