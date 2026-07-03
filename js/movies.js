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
    "thumb": "https://i3.ytimg.com/vi/Qb-2xKrPsP0/maxresdefault.jpg",
    "slug": "el-rey-dragon"
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
    ],
    "slug": "oops-me-case-con-un-multimillonario"
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
    "thumb": "https://i3.ytimg.com/vi/ykplaD5YS9c/maxresdefault.jpg",
    "slug": "senorita-gu-y-tres-hermanos"
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
    "thumb": "https://i3.ytimg.com/vi/kUazVTr93m8/maxresdefault.jpg",
    "slug": "levantarse-en-leon"
  },
  {
    "id": 5,
    "title": "Buscar un Esposo para Mamá",
    "genre": "Romance",
    "year": 2024,
    "rating": 8.9,
    "duration": "2h 48min",
    "type": "Película",
    "yt": "6LBxSop300I",
    "emoji": "🎬",
    "desc": "La Cenicienta fue engañada por su hermana y tuvo dos hijos, inesperadamente, cuyo padre resultó ser un CEO.\n\nTienda de Peliculas presenta el regreso de una diseñadora de joyas tras cinco años en el extranjero. Enfrentada a falsas acusaciones de robo en una fiesta de élite, busca proteger a su familia mientras un poderoso ejecutivo comienza a sospechar la verdad sobre la conexión entre sus hijos y él.\n\nActrices: Chen Zheng Yang\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, peliculas completas en español latino, dramas coreanos en español",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Romance",
      "Thriller"
    ],
    "thumb": "https://i3.ytimg.com/vi/6LBxSop300I/hqdefault.jpg",
    "slug": "buscar-un-esposo-para-mama"
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
    "thumb": "https://www.youtube.com/watch?v=1VlVTlgwqvI",
    "slug": "los-trillizos-buscamos-a-papa"
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
    "thumb": "https://i3.ytimg.com/vi/gxGLEWWNYGA/maxresdefault.jpg",
    "slug": "tio-ceo-me-ama"
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
    "thumb": "https://i3.ytimg.com/vi/gxzrCBXnteM/maxresdefault.jpg",
    "slug": "princesa-por-obligaciones"
  },
  {
    "id": 9,
    "title": "¿¡Mi esposo es el Hombre más Rico!?",
    "genre": "Romance",
    "year": 2025,
    "rating": 8.3,
    "duration": "2h 39min",
    "type": "Serie",
    "yt": "Sea7albCPWc",
    "emoji": "🎬",
    "desc": "La chica, al conocer al trabajador pobre, inmediatamente le pide pasar la noche juntos, sin darse cuenta de que él es en realidad el CEO oculto\n Ahora deben navegar la convivencia y sus verdaderas identidades mientras intentan mantener su unión en secreto ante sus familias.\n\nActrices: Chen Zheng Yang, Lu Lin Feng\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, peliculas completas en español latino, La Amada Esposa del CEO, Matrimonio de Conveniencia, kdrama español completos",
    "badge": "SERIE",
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
      "Romance",
      "Series"
    ],
    "slug": "mi-esposo-es-el-hombre-mas-rico",
    "thumb": "https://i3.ytimg.com/vi/Sea7albCPWc/hqdefault.jpg"
  },
  {
    "id": 10,
    "title": "Señoria Estúpida y CEO Ciego",
    "genre": "Romance",
    "year": 2024,
    "rating": 8.3,
    "duration": "3h 04min",
    "type": "Serie",
    "yt": "CtBBh5xuk6U",
    "emoji": "🎬",
    "desc": "Se casó con un CEO ciego en lugar de su hermana, pero él solo fingía estar ciego y la mimaba mucho\n\n\nActrices: Bai Fang Wen (白方文) Jia Yixuan (贾翼瑄)\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, La Amada Esposa del CEO, Matrimonio de Conveniencia, kdrama español completos",
    "badge": "SERIE",
    "episodes": [
      "Episodio 1",
      "Episodio 2",
      "Episodio 3",
      "Episodio 4",
      "Episodio 5",
      "Episodio 6"
    ],
    "genres": [
      "Romance",
      "Series"
    ],
    "slug": "senoria-estupida-y-ceo-ciego",
    "thumb": "https://i3.ytimg.com/vi/CtBBh5xuk6U/hqdefault.jpg"
  },
  {
    "id": 11,
    "title": "Venganza de la Exesposa",
    "genre": "Thriller",
    "year": 2024,
    "rating": 8.1,
    "duration": "2h 24min",
    "type": "Serie",
    "yt": "s6JzNvkrQ2o",
    "emoji": "🎬",
    "desc": "Ignorada 5 años como ama de casa de CEO, ella se va, cuando él la ve de nuevo, ya es multimillonaria\n\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, Arrepentimiento después del divorcio, presidente disfrazado de pobre, Identidad Misteriosa y Matrimonio Relámpago, venganza al esposo tras renacer, tener hijo con CEO",
    "badge": "SERIE",
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
      "Thriller",
      "Series"
    ],
    "slug": "venganza-de-la-exesposa",
    "thumb": "https://i3.ytimg.com/vi/s6JzNvkrQ2o/hqdefault.jpg"
  },
  {
    "id": 12,
    "title": "El CEO y Su Secretaria Heredera",
    "genre": "Romance",
    "year": 2025,
    "rating": 9.5,
    "duration": "2h 34min",
    "type": "Película",
    "yt": "O3BWvBpS2g0",
    "thumb": "https://i3.ytimg.com/vi/O3BWvBpS2g0/hqdefault.jpg",
    "desc": "¡El CEO la ignoró durante cinco años! Pero cuando la vio con otro hombre… se volvió loco de celos\n\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, Arrepentimiento después del divorcio, presidente disfrazado de pobre, Identidad Misteriosa y Matrimonio Relámpago, Hija de hombre más rico, tener hijo con CEO",
    "badge": "NUEVO",
    "episodes": [],
    "genres": [
      "Romance",
      "Thriller"
    ],
    "slug": "el-ceo-y-su-secretaria-heredera",
    "emoji": "🎬"
  },
  {
    "title": "El Divorcio del Príncipe y la Concubina",
    "slug": "el-divorcio-del-principe-y-la-concubina",
    "genre": "De época",
    "genres": [
      "De época",
      "Intrigas palaciegas"
    ],
    "type": "Película",
    "year": 2023,
    "rating": 8.6,
    "duration": "2h 23min",
    "emoji": "🎬",
    "yt": "4rM8lYyN75A",
    "thumb": "https://i3.ytimg.com/vi/4rM8lYyN75A/hqdefault.jpg",
    "desc": "Hermosa doctora de convierte accidentalmente a una princesa deshonrada. Usando su conocimiento moderno, la chica castiga a sus acosadores y decide divorciarse del príncipe, pero él se enamora profundamente de ella.\n\n\nActrices: Bai Fang Wen, Meng Na\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, peliculas completas en español latino",
    "badge": "NUEVO",
    "episodes": [],
    "id": 13
  },
  {
    "title": "La terca esposa del Sr. Gu",
    "slug": "la-terca-esposa-del-sr-gu",
    "genre": "Comedia",
    "genres": [
      "Comedia",
      "Romance"
    ],
    "type": "Película",
    "year": 2024,
    "rating": 9.2,
    "duration": "2h 36min",
    "emoji": "🎬",
    "yt": "mONA5x8dREM",
    "thumb": "https://i3.ytimg.com/vi/mONA5x8dREM/hqdefault.jpg",
    "desc": "El CEO traicionó a Cenicienta para cuidar de su Amante, pero después del divorcio, ¡la persiguió!\n\n\nActrices: Bai Fang Wen, Meng Na\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, Arrepentimiento después del divorcio, presidente disfrazado de pobre, Identidad Misteriosa y Matrimonio Relámpago, Hija de hombre más rico, tener hijo con CEO",
    "badge": "NUEVO",
    "episodes": [],
    "id": 14
  },
  {
    "title": "Matrimonio Relámpago",
    "slug": "matrimonio-relampago",
    "genre": "Romance",
    "genres": [
      "Romance",
      "Thriller"
    ],
    "type": "Película",
    "year": 2025,
    "rating": 8.5,
    "duration": "2h 45min",
    "emoji": "🎬",
    "yt": "AZCSQi2zWyc",
    "thumb": "https://i3.ytimg.com/vi/AZCSQi2zWyc/hqdefault.jpg",
    "desc": "Para evitar un matrimonio arreglado con un rico CEO, la chica, que oculta su identidad como multimillonaria, se casa rápidamente con un conductor pobre, sin saber que él es el jefe oculto y también el esposo del que ha huido\n\nActrices:\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, peliculas completas en español latino, La Amada Esposa del CEO, Matrimonio de Conveniencia, kdrama español completos",
    "badge": "NUEVO",
    "episodes": [],
    "id": 15
  },
  {
    "title": "Señorita Tonta y CEO Discapacitado",
    "slug": "senorita-tonta-y-ceo-discapacitado",
    "genre": "Acción",
    "genres": [
      "Acción",
      "Drama"
    ],
    "type": "Película",
    "year": 2025,
    "rating": 8.5,
    "duration": "1h 34min",
    "emoji": "🎬",
    "yt": "mUY3QnlL8lc",
    "thumb": "https://i3.ytimg.com/vi/mUY3QnlL8lc/hqdefault.jpg",
    "desc": "Una joven finge ser tonta para infiltrarse en la mansión Lu y buscar un tesoro familiar perdido. Allí descubre secretos sobre su esposo discapacitado y se enfrenta a los peligros de una familia política hostil.\n\nActrices: Xu Yi Zhen\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, la tonta y el discapacitado,",
    "badge": "NUEVO",
    "episodes": [],
    "id": 16
  },
  {
    "title": "Amor Predestinado",
    "slug": "amor-predestinado",
    "genre": "Thriller",
    "genres": [
      "Thriller"
    ],
    "type": "Película",
    "year": 2025,
    "rating": 8.6,
    "duration": "1h 45min",
    "emoji": "🎬",
    "yt": "W4-Su_aZEl8",
    "thumb": "https://i3.ytimg.com/vi/W4-Su_aZEl8/hqdefault.jpg",
    "desc": "Tienda de Peliculas presenta el conflicto de una persona que busca recuperar su carrera profesional como diseñadora tras años de matrimonio. Enfrentando el desdén de su expareja y un entorno laboral hostil, demuestra su talento cerrando un negocio desafiante.\n\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, Arrepentimiento después del divorcio, presidente disfrazado de pobre, Identidad Misteriosa y Matrimonio Relámpago,",
    "badge": "NUEVO",
    "episodes": [],
    "id": 17
  },
  {
    "title": "Renacer del Abismo",
    "slug": "renacer-del-abismo",
    "genre": "Drama",
    "genres": [
      "Drama"
    ],
    "type": "Película",
    "year": 2025,
    "rating": 8.9,
    "duration": "2h 54min",
    "emoji": "🎬",
    "yt": "OrZ60Bk7lcs",
    "thumb": "https://i3.ytimg.com/vi/OrZ60Bk7lcs/hqdefault.jpg",
    "desc": "Ye Fan lucha por mantener a su prometida y la familia codiciosa de ella. En su boda, su futura familia lo humilla y rompe el compromiso. Una chica amable se casa rápidamente con él, y resulta que Ye Fan es el hijo perdido del billonario más rico del mundo. ¡Todos los que lo despreciaron lo pagarán!\nActrices: Bai Fang Wen\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, La Amada Esposa del CEO, Matrimonio de Conveniencia, kdrama español completos, el gobernante ascendente, fortunas reveladas mi esposo es poderoso",
    "badge": "NUEVO",
    "episodes": [],
    "id": 18
  },
  {
    "title": "Destino de una Noche Equivocada",
    "slug": "destino-de-una-noche-equivocada",
    "genre": "Comedia",
    "genres": [
      "Comedia",
      "Romance"
    ],
    "type": "Película",
    "year": 2025,
    "rating": 8.8,
    "duration": "2h 34min",
    "emoji": "🎬",
    "yt": "dx3bzbKf88U",
    "thumb": "https://i3.ytimg.com/vi/dx3bzbKf88U/hqdefault.jpg",
    "desc": "Destino de una Noche Equivocada - Doramas en español latino completas\n\nActrices: Bai Fang Wen\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, presidente disfrazado de pobre, Identidad Misteriosa y Matrimonio Relámpago, tener hijo con CEO, Casarse primero amar después, tras una noche de pasion con el ceo",
    "badge": "NUEVO",
    "episodes": [],
    "id": 19
  },
  {
    "title": "Dios de Guerra del Norte",
    "slug": "dios-de-guerra-del-norte",
    "genre": "Acción",
    "genres": [
      "Acción",
      "Viajes en el tiempo"
    ],
    "type": "Película",
    "year": 2025,
    "rating": 9.2,
    "duration": "1h 36min",
    "emoji": "🎬",
    "yt": "Z4fDcafzaUE",
    "thumb": "https://i3.ytimg.com/vi/Z4fDcafzaUE/hqdefault.jpg",
    "desc": "La arrogante CEO burla de mendigo pero él es Dios de Guerra, y termina rogando perdón con millones\nGénero: películas románticas, películas chinas, Película de acción de artes marciales y kungfu, dramas coreanos en español, doramas en español latino completas, kdrama español completos, el gobernante ascendente, Identidad Misteriosa y Matrimonio Relámpago, el señor dragon oculto,",
    "badge": "NUEVO",
    "episodes": [],
    "id": 20
  },
  {
    "title": "Mis Padres son Agentes Secretos",
    "slug": "mis-padres-son-agentes-secretos",
    "genre": "Romance",
    "genres": [
      "Romance",
      "Thriller"
    ],
    "type": "Película",
    "year": 2026,
    "rating": 8.9,
    "duration": "2h 00min",
    "emoji": "🎬",
    "yt": "BBYJ45RiQng",
    "thumb": "https://i3.ytimg.com/vi/BBYJ45RiQng/hqdefault.jpg",
    "desc": "Una hermosa agente fue drogada y tuvo un rollo de una noche con un CEO oculto. 5 años después, se casó rápidamente con un profesor pobre. Inesperadamente, él también era un agente secreto y el padre biológico de su hijo.\n\n\nActrices: Shu Tong, Sun Lulu\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, peliculas completas en español latino, La Amada Esposa del CEO, Matrimonio de Conveniencia, kdrama español completos",
    "badge": "NUEVO",
    "episodes": [],
    "id": 21
  },
  {
    "title": "Encantador prometido",
    "slug": "encantador-prometido",
    "genre": "Romance",
    "genres": [
      "Romance",
      "Thriller"
    ],
    "type": "Película",
    "year": 2026,
    "rating": 9.1,
    "duration": "2h 45min",
    "emoji": "🎬",
    "yt": "5hA60YXKToE",
    "thumb": "https://i3.ytimg.com/vi/5hA60YXKToE/hqdefault.jpg",
    "desc": "Tienda de Peliculas presenta cómo una joven busca a su madre biológica tras salir de un orfanato, enfrentando maltratos familiares y engaños. En su camino, intenta proteger a un camarero, ignorando su verdadera identidad millonaria mientras busca cumplir una promesa de infancia.\nActrices: Bai Fang Wen, Zhu Mo Yan\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, el gobernante ascendente, chica se casa con chico pobre pero es rico, mi esposo es poderoso en español, Se casa a toda prisa",
    "badge": "NUEVO",
    "episodes": [],
    "id": 22
  },
  {
    "title": "La Señorita Perdida",
    "slug": "la-senorita-perdida",
    "genre": "Drama",
    "genres": [
      "Drama",
      "Thriller"
    ],
    "type": "Película",
    "year": 2026,
    "rating": 9.6,
    "duration": "1h 33min",
    "emoji": "🎬",
    "yt": "i5rBJqwYLsQ",
    "thumb": "https://i3.ytimg.com/vi/i5rBJqwYLsQ/hqdefault.jpg",
    "desc": "Una joven criada en un pueblo pesquero se ve envuelta en un conflicto inmobiliario cuando una poderosa familia intenta demoler su hogar. La búsqueda del pasado por parte de un magnate amenaza con destruir la vida que conoce.\n\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, La Amada Esposa del CEO, kdrama español completos, el gobernante ascendente,",
    "badge": "NUEVO",
    "episodes": [],
    "id": 23
  },
  {
    "title": "Matrimonio Predestinado",
    "slug": "matrimonio-predestinado",
    "genre": "Comedia",
    "genres": [
      "Comedia",
      "Romance"
    ],
    "type": "Película",
    "year": 2026,
    "rating": 9.5,
    "duration": "2h 07min",
    "emoji": "🎬",
    "yt": "Er7nuEBTiI8",
    "thumb": "https://i3.ytimg.com/vi/Er7nuEBTiI8/hqdefault.jpg",
    "desc": "Chanjunni se ve obligada a casarse con el heredero de la familia Fu para pagar una deuda. Mientras navega por un entorno familiar hostil y lleno de intrigas, Chanjunni intenta descubrir los secretos de su nuevo esposo y proteger su propia identidad oculta bajo una falsa apariencia de campesina.\n\nActrices: Zhen Ziqi, Jia Yixuan\nGénero: películas románticas, películas chinas, Multimillonario se hace pasar por pobre, dramas coreanos en español, doramas en español latino completas, kdrama español completos, identidad misteriosa y matrimonio relámpago, cenicienta se casa con un tio guapo, chica se casa con chico pobre pero es rico, peliculas completas en español latino, presidente disfrazado de pobre para poner a prueba",
    "badge": "NUEVO",
    "episodes": [],
    "id": 24
  }
];
