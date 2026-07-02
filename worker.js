const MOVIE_SLUGS = {
  "1": "el-rey-dragon",
  "2": "oops-me-case-con-un-multimillonario",
  "3": "senorita-gu-y-tres-hermanos",
  "4": "levantarse-en-leon",
  "5": "dragon-inigualable",
  "6": "los-trillizos-buscamos-a-papa",
  "7": "tio-ceo-me-ama",
  "8": "princesa-por-obligaciones",
  "9": "mi-esposo-es-el-hombre-mas-rico",
  "10": "senoria-estupida-y-ceo-ciego",
  "11": "venganza-de-la-exesposa",
  "12": "el-ceo-y-su-secretaria-heredera",
  "13": "el-divorcio-del-principe-y-la-concubina",
  "14": "la-terca-esposa-del-sr-gu",
  "15": "matrimonio-relampago"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/movie" || url.pathname === "/movie.html") {
      const id = url.searchParams.get("id");
      if (id && MOVIE_SLUGS[id]) {
        return Response.redirect(`${url.origin}/pelicula/${MOVIE_SLUGS[id]}`, 301);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
