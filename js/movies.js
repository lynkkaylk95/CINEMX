// Base de datos de películas y series de CineMax MX
const MOVIES = [
  {
    "id": 1,
    "title": "El Rey Dragón",
    "genre": "Acción",
    "year": 2026,
    "rating": 9.5,
    "duration": "2h 05min",
    "type": "Película",
    "yt": "Qb-2xKrPsP0",
    "emoji": "🎬",
    "desc": "Al salir de prisión, Chen Ping busca justicia por la traición de su ex pareja y el maltrato hacia su familia. Con la ayuda del Rey Dragón y sus nuevos aliados poderosos, enfrenta a quienes intentaron destruirlo.\n\nEl Rey Dragón | Peliculas Completas | Estreno 2025 Mejor Películas de Acción en español",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Acción",
      "Comedia",
      "Thriller"
    ],
    "thumb": "https://i3.ytimg.com/vi/Qb-2xKrPsP0/maxresdefault.jpg"
  },
  {
    "id": 2,
    "title": "Oops, Me Casé con un Multimillonario",
    "genre": "Drama",
    "year": 2026,
    "rating": 9,
    "duration": "1h 15min",
    "type": "Película",
    "yt": "JBVn1HhTxbA",
    "emoji": "🎬",
    "desc": "Una madre soltera busca empleo como niñera y termina casándose en una cita a ciegas apresurada. Junto a dos infantes y un cónyuge aparentemente humilde, enfrenta desafíos sociales y familiares mientras oculta identidades reales, desatando una serie de malentendidos y revelaciones sorprendentes sobre el estatus económico de su nueva familia.",
    "badge": "NUEVO",
    "episodes": [],
    "thumb": "https://i3.ytimg.com/vi/JBVn1HhTxbA/maxresdefault.jpg",
    "genres": [
      "Drama",
      "Romance"
    ]
  },
  {
    "id": 3,
    "title": "Señorita Gu y Tres Hermanos",
    "genre": "Romance",
    "year": 2025,
    "rating": 8.5,
    "duration": "2h 18min",
    "type": "Película",
    "yt": "ykplaD5YS9c&t=2s",
    "emoji": "🎬",
    "desc": "La chica que vendía tofu fue despreciada por su esposo, inesperadamente, 3 hermanos CEO la protegen\n\nLa Srta. Gu ocultó su verdadera identidad y trabajó como vendedora de tofu apestoso. Fue traicionada por su esposo y despreciada por su suegra durante 3 años. Sus 3 hermanos ricos aparecieron de repente y la llevaron a casa para mimarla. ¡Su exmarido y la amante deben pagar por eso!\n\nActrices: Yu Yin, Chen Zheng Yang\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre,",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Romance",
      "Thriller"
    ],
    "thumb": "https://i3.ytimg.com/vi/ykplaD5YS9c/maxresdefault.jpg"
  },
  {
    "id": 4,
    "title": "Levantarse en León",
    "genre": "Thriller",
    "year": 2025,
    "rating": 8.9,
    "duration": "2h 36min",
    "type": "Película",
    "yt": "kUazVTr93m8",
    "emoji": "🎬",
    "desc": "Pensaste que era un repartidor, ¡pero no esperabas que fuera el famoso Skylark Qingjun! ¡Una fuerte bofetada en la cara de la esposa que lo abandonó y de quienes lo despreciaron!\n\nActrices: Bai Fang Wen\nGénero: películas románticas, películas chinas,",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Thriller"
    ],
    "thumb": "https://i3.ytimg.com/vi/kUazVTr93m8/maxresdefault.jpg"
  },
  {
    "id": 5,
    "title": "Dragón Inigualable",
    "genre": "Romance",
    "year": 2026,
    "rating": 9.7,
    "duration": "2h 20min",
    "type": "Película",
    "yt": "qEjCvBvyhQQ&t=363s",
    "emoji": "🎬",
    "desc": "El Señor Dragón come fideos en la calle y mira a chicas, cuando unos gánsteres lo molestan y luego…\n\nActrices: Bai Fang Wen\nGénero: películas románticas, películas chinas, Pelicula de Accion de Artes Marciales, dramas coreanos en español, doramas en español latino completas, kdrama español completos, el gobernante ascendente, Identidad Misteriosa y Matrimonio Relámpago",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Romance",
      "Thriller"
    ],
    "thumb": "https://i3.ytimg.com/vi/qEjCvBvyhQQ/maxresdefault.jpg"
  },
  {
    "id": 6,
    "title": "Los Trillizos Buscamos a Papá",
    "genre": "Drama",
    "year": 2026,
    "rating": 8.9,
    "duration": "2h 10min",
    "type": "Película",
    "yt": "1VlVTlgwqvI",
    "emoji": "🎬",
    "desc": "Una joven que dio a luz a cuatrillizos busca a su cuarto hijo mientras lidia con conflictos laborales y malentendidos de identidad. Tienda de Peliculas presenta esta historia donde el destino y los secretos empresariales se entrelazan.\n\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, peliculas completas en español latino, dramas coreanos en español, el multimillonario oculta su identidad, Identidad Misteriosa y Matrimonio Relámpago, padre multimillonario drama chino, novelas coreanas en español",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Drama",
      "Thriller"
    ],
    "thumb": "https://www.youtube.com/watch?v=1VlVTlgwqvI"
  },
  {
    "id": 7,
    "title": "Tío CEO Me Ama",
    "genre": "Comedia",
    "year": 2026,
    "rating": 8.8,
    "duration": "1h 32min",
    "type": "Película",
    "yt": "gxGLEWWNYGA",
    "emoji": "🎬",
    "desc": "Después de ser drogado, mi madrastra me arrojó a la cama de un anciano. Escapé y tuve una aventura de una noche con un tío. ¡Inesperadamente, es un CEO multimillonario y quiere casarse conmigo a toda costa!\n\nActrices: Guo Yuxin, Zhou Yufei\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, peliculas completas en español latino, dramas coreanos en español, el multimillonario oculta su identidad, mi esposo es poderoso en español",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Comedia",
      "Romance"
    ],
    "thumb": "https://i3.ytimg.com/vi/gxGLEWWNYGA/maxresdefault.jpg"
  },
  {
    "id": 8,
    "title": "Princesa Por Obligaciones",
    "genre": "Romance",
    "year": 2026,
    "rating": 9.2,
    "duration": "3h 00min",
    "type": "Película",
    "yt": "gxzrCBXnteM",
    "emoji": "🎬",
    "desc": "Doctora se volvió princesa despreciada, pero su habilidad médica hizo que el príncipe la enamora\n\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, peliculas completas en español latino, sueños de divorcio de la princesa pesada",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Romance",
      "Series"
    ],
    "thumb": "https://i3.ytimg.com/vi/gxzrCBXnteM/maxresdefault.jpg"
  },
  {
    "id": 9,
    "title": "La Fiscalía",
    "genre": "Series",
    "year": 2026,
    "rating": 8.9,
    "duration": "52min/ep",
    "type": "Serie",
    "yt": "dQw4w9WgXcQ",
    "emoji": "⚖️",
    "desc": "Una fiscal incorruptible enfrenta a los poderes fácticos de la Ciudad de México en su búsqueda por justicia.",
    "badge": "NUEVO",
    "episodes": [
      "Episodio 1",
      "Episodio 2",
      "Episodio 3",
      "Episodio 4",
      "Episodio 5",
      "Episodio 6",
      "Episodio 7",
      "Episodio 8",
      "Episodio 9",
      "Episodio 10"
    ],
    "genres": [
      "Series"
    ]
  },
  {
    "id": 10,
    "title": "Neon Barrio",
    "genre": "Series",
    "year": 2025,
    "rating": 8.5,
    "duration": "38min/ep",
    "type": "Serie",
    "yt": "dQw4w9WgXcQ",
    "emoji": "🌆",
    "desc": "Jóvenes artistas en el México cyberpunk de 2060 luchan por sobrevivir y tạo ra nghệ thuật trong thế giới doanh nghiệp.",
    "badge": "",
    "episodes": [
      "Episodio 1",
      "Episodio 2",
      "Episodio 3",
      "Episodio 4",
      "Episodio 5",
      "Episodio 6"
    ],
    "genres": [
      "Series"
    ]
  },
  {
    "id": 11,
    "title": "Chefs de Guerra",
    "genre": "Series",
    "year": 2026,
    "rating": 8,
    "duration": "42min/ep",
    "type": "Serie",
    "yt": "dQw4w9WgXcQ",
    "emoji": "👨‍🍳",
    "desc": "Diez chefs mexicanos compiten por el título del mejor restaurante del país. Cada plato cuenta una historia.",
    "badge": "POPULAR",
    "episodes": [
      "Episodio 1",
      "Episodio 2",
      "Episodio 3",
      "Episodio 4",
      "Episodio 5",
      "Episodio 6",
      "Episodio 7",
      "Episodio 8"
    ],
    "genres": [
      "Series"
    ]
  },
  {
    "id": 12,
    "title": "Creen que es un mendigo común, pero es Dios de la Guerra que vence a mil; bella señorita se enamora",
    "genre": "Acción",
    "year": 2026,
    "rating": 9.2,
    "duration": "1h 55min",
    "type": "Película",
    "yt": "TooF1IQyoZQ",
    "thumb": "https://i3.ytimg.com/vi/TooF1IQyoZQ/maxresdefault.jpg",
    "desc": "El Maestro Supremo | Peliculas Completas | Estreno 2026 Mejor Películas de Acción en Español",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Acción"
    ]
  }
];
