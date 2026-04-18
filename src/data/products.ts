import { createBrandedPlaceholderImage } from '@utils/product-images';

export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    slug: string;
    category: string;
}

const salsaImage = createBrandedPlaceholderImage('Guacamole tradicional');
const picanteImage = createBrandedPlaceholderImage('Guacamole picante', {
    accentColor: '#D86A1F',
    subtitle: 'Placeholder temporal para catálogo demo.',
});
const especialImage = createBrandedPlaceholderImage('Guacamole especial', {
    accentColor: '#5C8C2B',
    subtitle: 'Placeholder temporal para catálogo demo.',
});
const charcuteriaImage = createBrandedPlaceholderImage('Charcutería artesanal', {
    accentColor: '#914B2D',
    subtitle: 'Placeholder temporal para catálogo demo.',
});
const postreImage = createBrandedPlaceholderImage('Postres artesanales', {
    accentColor: '#B46A8F',
    subtitle: 'Placeholder temporal para catálogo demo.',
});

export const allProducts: Product[] = [
    // Salsas y Aderezos
    {
        id: "guacamole-tradicional",
        name: "Guacamole Tradicional",
        price: 10000,
        description: "Ricoguacamole fresco y natural",
        image: salsaImage,
        slug: "/tienda",
        category: "Salsas y Aderezos"
    },
    {
        id: "guacamole-picante",
        name: "Guacamole Picante",
        price: 12000,
        description: "Con toque de chile habanero",
        image: picanteImage,
        slug: "/tienda",
        category: "Salsas y Aderezos"
    },
    {
        id: "guacamole-especial",
        name: "Guacamole Especial",
        price: 15000,
        description: "Receta secreta de la casa",
        image: especialImage,
        slug: "/tienda",
        category: "Salsas y Aderezos"
    },
    // Charcutería
    {
        id: "chorizo-artesanal",
        name: "Chorizo Artesanal",
        price: 18000,
        description: "Chorizo de cerdo premium",
        image: charcuteriaImage,
        slug: "/tienda",
        category: "Charcutería"
    },
    {
        id: "chorizo-ahumado",
        name: "Chorizo Ahumado",
        price: 20000,
        description: "Con sabor ahumado tradicional",
        image: charcuteriaImage,
        slug: "/tienda",
        category: "Charcutería"
    },
    {
        id: "chorizo-picante",
        name: "Chorizo Picante",
        price: 19000,
        description: "Para los amantes del picante",
        image: charcuteriaImage,
        slug: "/tienda",
        category: "Charcutería"
    },
    // Postres
    {
        id: "galletas-avena",
        name: "Galletas de Avena",
        price: 8000,
        description: "Crujientes y saludables",
        image: postreImage,
        slug: "/tienda",
        category: "Postres"
    },
    {
        id: "galletas-chispas",
        name: "Galletas con Chispas",
        price: 9000,
        description: "Con chocolate belga",
        image: postreImage,
        slug: "/tienda",
        category: "Postres"
    },
    {
        id: "galletas-integrales",
        name: "Galletas Integrales",
        price: 9500,
        description: "Sin azúcar agregada",
        image: postreImage,
        slug: "/tienda",
        category: "Postres"
    }
];
