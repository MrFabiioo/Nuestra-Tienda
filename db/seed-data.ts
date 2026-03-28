interface SeedProduct {
  categoryId?: string;
  description: string;
  images: string[];
  price: number;
  sizes: ValidSizes[];
  slug: string;
  title: string;
}

type ValidSizes = 'Pequeño' | 'Mediano' | 'Grande' | 'Extra-grande';

export const seedProducts: SeedProduct[] = [
  {
    categoryId: 'cat-salsas',
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'Rico',
    title: "Men's Chill Crew Neck Sweatshirt",
  },
  {
    categoryId: 'cat-salsas',
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'men_quilted_shirt_jacket',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    categoryId: 'cat-salsas',
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole',
    title: "Men's Chill Crew Neck Sweatshirt",
  },
  {
    categoryId: 'cat-salsas',
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_consebolla',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    categoryId: 'cat-salsas',
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají',
    title: "Men's Chill Crew Neck Sweatshirt",
  },
  {
    categoryId: 'cat-salsas',
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_ajo',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    categoryId: 'cat-salsas',
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_cilantro',
    title: "Men's Chill Crew Neck Sweatshirt",
  },
  {
    categoryId: 'cat-salsas',
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_tomate',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'men_quilted_shirt_jacket_2',
    title: "Men's Quilted Shirt Jacket 2",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_2',
    title: "Men's Chill Crew Neck Sweatshirt 2",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_consebolla_2',
    title: "Men's Quilted Shirt Jacket 2",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_2',
    title: "Men's Chill Crew Neck Sweatshirt 2",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_ajo_2',
    title: "Men's Quilted Shirt Jacket 2",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_cilantro_2',
    title: "Men's Chill Crew Neck Sweatshirt 2",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_tomate_2',
    title: "Men's Quilted Shirt Jacket 2",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_consebolla',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_ajo',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_cilantro',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rico_guacamole_con_ají_tomate',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'tomate',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'pistacho',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'tarro',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rrota',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'crespa',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'militar',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'envejcer',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'pomarola',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'mandarina',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'rosado',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'el_tipo',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'relacion',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'asjhguanda',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'revertraol',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'un_ocho',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'querida',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'moza',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'escolta',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'ridiculo',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'malestar',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'en_la_cultura',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'sigmung_freud',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'chili',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'chili_con_carne',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'mantequilla',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'resonancia',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'resultado',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'resolt',
    title: "Men's Quilted Shirt Jacket",
  },
  {
    description:
      'Disfruta de un delicioso tazón de guacamole fresco, preparado con los mejores ingredientes. Perfecto para compartir en reuniones o disfrutar solo.',
    images: ['guacamole-caricatura.png', 'guacamole-caricatura-partida.png'],
    price: 75,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'usain',
    title: "Men’s Chill Crew Neck Sweatshirt",
  },
    {
    description:
      "The Men's Quilted Shirt Jacket features a uniquely fit, quilted design for warmth and mobility in cold weather seasons. With an overall street-smart aesthetic, the jacket features subtle silicone injected Tesla logos below the back collar and on the right sleeve, as well as custom matte metal zipper pulls. Made from 87% nylon and 13% polyurethane.",
    images: ['guacamoleIA.png', 'guacamole-caricatura.png'],
    price: 200,
    sizes: ['Pequeño','Mediano','Grande','Extra-grande'],
    slug: 'super_sayayin',
    title: "Men's Quilted Shirt Jacket",
  },

]