

import { defineAction } from "astro:actions";
import { Category, count, db, Product, ProductImage, sql } from "astro:db";
import { z } from "astro:schema";
import type {ProductWithImages} from '../../interfaces/products-with-images.interface'

export const getProductsByPage= defineAction({
        accept:'json',
        input:z.object({
            page:z.number().optional().default(1),
            limit:z.number().optional().default(6),
        }),
        handler:async({page,limit})=>{
            page = page <= 0 ? 1 : page;
            const [totalRecords] = await db.select({count: count()}).from(Product);
            //console.log(`totalRecords : ${totalRecords[0]}`)
            const totalPages  = Math.ceil(totalRecords.count/limit);
            //console.log(`total pages: ${totalPages}`)
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
                ) as images,
                (select name from ${Category} where id = a.categoryId) as categoryName
                from ${Product} a
                LIMIT ${limit} OFFSET ${(page-1)*limit};

            `
            const {rows} = await db.run(productQuery);

            const products = rows.map(product =>{
                return{
                    ...product,
                    images: product.images ? product.images : 'no-image.png'
                }
            }) as unknown as ProductWithImages[]

            return {
                products: products, //rows as unknown as ProductWithImages[],
                totalPages: totalPages,

            } ;
        }
    })
