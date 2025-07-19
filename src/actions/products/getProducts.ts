

import { defineAction } from "astro:actions";
import { count, db, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import type {ProductWithImages} from '../../interfaces/products-with-images.interface'

export const getProductsByPage= defineAction({
        accept:'json',
        input:z.object({
            page:z.number().optional().default(1),
            limit:z.number().optional().default(6),
        }),
        handler:async({page,limit})=>{
            page = page >= 0 ? 1 : page;
            const [totalRecords] = await db.select({count: count()}).from(Product);
            const totalPages  = Math.ceil(totalRecords.count/limit);

            if (page > totalPages) {
                return{
                    products: [] as ProductWithImages[],
                    totalPages:totalPages,
                }
            }

            // const products = await db.select().from(Product).limit(limit).offset((page-1)*12)

            const productQuery = sql`

                select a.*,
                (select GROUP_CONCAT(image,',') from
                    (select * from ${ProductImage} where productId = a.id limit 2)
                ) as images
                from ${Product} a
                LIMIT ${limit} OFFSET ${(page-1)*limit};

            `
            const {rows} = await db.run(productQuery);

            return {
                products: rows as unknown as ProductWithImages[],
                totalPages: totalPages,

            } ;
        }
    })
