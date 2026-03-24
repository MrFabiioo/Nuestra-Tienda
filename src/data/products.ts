export interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    slug: string;
    category: string;
}

export const allProducts: Product[] = [
    // Salsas y Aderezos
    {
        id: "guacamole-tradicional",
        name: "Guacamole Tradicional",
        price: 10000,
        description: "Ricoguacamole fresco y natural",
        image: "/images/guacamole-caricatura.png",
        slug: "/guacamole",
        category: "Salsas y Aderezos"
    },
    {
        id: "guacamole-picante",
        name: "Guacamole Picante",
        price: 12000,
        description: "Con toque de chile habanero",
        image: "/images/guacamole-caricatura-partida.png",
        slug: "/guacamole",
        category: "Salsas y Aderezos"
    },
    {
        id: "guacamole-especial",
        name: "Guacamole Especial",
        price: 15000,
        description: "Receta secreta de la casa",
        image: "/images/guacamoleIA.png",
        slug: "/guacamole",
        category: "Salsas y Aderezos"
    },
    // Charcutería
    {
        id: "chorizo-artesanal",
        name: "Chorizo Artesanal",
        price: 18000,
        description: "Chorizo de cerdo premium",
        image: "/images/Chorizo-de-Cerdo.png",
        slug: "/tienda",
        category: "Charcutería"
    },
    {
        id: "chorizo-ahumado",
        name: "Chorizo Ahumado",
        price: 20000,
        description: "Con sabor ahumado tradicional",
        image: "/images/Chorizo-de-Cerdo.png",
        slug: "/tienda",
        category: "Charcutería"
    },
    {
        id: "chorizo-picante",
        name: "Chorizo Picante",
        price: 19000,
        description: "Para los amantes del picante",
        image: "/images/Chorizo-de-Cerdo.png",
        slug: "/tienda",
        category: "Charcutería"
    },
    // Postres
    {
        id: "galletas-avena",
        name: "Galletas de Avena",
        price: 8000,
        description: "Crujientes y saludables",
        image: "/images/galletas de avena.png",
        slug: "/tienda",
        category: "Postres"
    },
    {
        id: "galletas-chispas",
        name: "Galletas con Chispas",
        price: 9000,
        description: "Con chocolate belga",
        image: "/images/galletas de avena.png",
        slug: "/tienda",
        category: "Postres"
    },
    {
        id: "galletas-integrales",
        name: "Galletas Integrales",
        price: 9500,
        description: "Sin azúcar agregada",
        image: "/images/galletas de avena.png",
        slug: "/tienda",
        category: "Postres"
    }
];
