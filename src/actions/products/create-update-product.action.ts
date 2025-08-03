

import { defineAction } from "astro:actions";
import { db, eq, Product } from "astro:db";
import { z } from "astro:schema";
import {v4 as UUID} from "uuid"
//import {getSession} from "auth-astro/server"

export const createUpdateProduct= defineAction({
        accept:'form',
        input:z.object({
            id: z.string().optional(),
            title: z.string(),
            description: z.string(),
            price: z.number(),
            sizes: z.string(),
            slug: z.string(),

            //TODO: imagen
        }),
        handler:async(form,{request})=>{
            //TODO: agregar authetication 
            // const session = await getSession(request);
            // const user = session?.user;
            // if (!user) {
            //     throw new Error("Unauthorized");
                
            // }
            // console.log('user',user)
            const {id =UUID(),...rest}= form
            rest.slug = rest.slug.toLowerCase().replace(' ','-').trim();
            const product = {
                id:id,
                ...rest,
            }
            if (!form.id) {
                await db.insert(Product).values(product);
            } else {
                await db.update(Product).set(product).where(eq(Product.id,id))
            }
            //console.log('producto: ',product)
            //crear
            //update
            //insert de imagenes
            return  product ;
        }
    })
