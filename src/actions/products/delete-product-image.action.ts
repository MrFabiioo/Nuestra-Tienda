

import { ImageUpload } from "@utils/image-upload";
import { defineAction } from "astro:actions";
import { db, eq, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import { requireAdminAccess } from "../../firebase/guards";
import { ensureImageMetaColumnsExist } from "@utils/product-db";

export const deleteProductImage= defineAction({
        accept:'json',
        input:z.string(),
        handler:async(imageId, context)=>{
            requireAdminAccess(context, 'gestionar imágenes de productos');
            await ensureImageMetaColumnsExist();

            const { rows } = await db.run(sql`SELECT id, image FROM ${ProductImage} WHERE id = ${imageId} LIMIT 1`);
            const rawProductImage = rows[0] as unknown;
            const productImage = rawProductImage as { id: string; image: string } | undefined;

            if (!productImage) {
                throw new Error(`image with id ${imageId} not found`);    
            }

            await db.run(sql`DELETE FROM ${ProductImage} WHERE id = ${imageId}`);

            if(productImage.image.includes('http')){
                await ImageUpload.delete(productImage.image);
            }
            
            return {ok: true} ;
        }
    })
