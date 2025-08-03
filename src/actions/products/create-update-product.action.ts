

import { ImageUpload } from "@utils/image-upload";
import { defineAction } from "astro:actions";
import { db, eq, Product, ProductImage } from "astro:db";
import { z } from "astro:schema";
import {v4 as UUID} from "uuid"
//import {getSession} from "auth-astro/server"
const MAX_FILE_SIZE=5_000_000;// 5MB
const ACEPTED_IMAGE_TYPES=[
    'image/jpge',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/xvg+xml',
];
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
            imageFiles:z.array(
                z.instanceof(File).refine((file) =>file.size<=MAX_FILE_SIZE,'Max image size 5MB').refine((file) =>{if (file.size===0) return true; return ACEPTED_IMAGE_TYPES.includes(file.type);},`, ${ACEPTED_IMAGE_TYPES.join(',')}`)
            ).optional(),
        }),
        handler:async(form,{request})=>{
            //TODO: agregar authetication 
            // const session = await getSession(request);
            // const user = session?.user;
            // if (!user) {
            //     throw new Error("Unauthorized");
                
            // }
            // console.log('user',user)
            const {id =UUID(),imageFiles,...rest}= form
            rest.slug = rest.slug.toLowerCase().replace(' ','-').trim();
            const product = {
                id:id,
                ...rest,
            };

            const queries: any = []
            if (!form.id) {
                queries.push(db.insert(Product).values(product)) 
            } else {
                queries.push(db.update(Product).set(product).where(eq(Product.id,id)))
            }
            const secureUrls:string[]=[];
            if (form.imageFiles && form.imageFiles.length >0 && form.imageFiles[0].size>0) {
                const urls = await Promise.all(
                    form.imageFiles.map(file =>ImageUpload.upload(file))
                )
                secureUrls.push(...urls);
            }

            secureUrls.forEach(imageUrl=>{
                const imageObject ={
                    id:UUID(),
                    image:imageUrl,
                    productId:product.id,
                }
                queries.push(db.insert(ProductImage).values(imageObject));
            })
            //console.log('producto: ',product)
            //crear
            //update
            //insert de imagenes

            // console.log(imageFiles)
            // imageFiles?.forEach(async(imageFile) =>{
            //     if(imageFile.size===0) return;
            //  const url= await  ImageUpload.upload(imageFile)
            // })

            await db.batch(queries)
            return  product ;
        }
    })
