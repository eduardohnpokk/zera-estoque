export default async function handler(req, res) {
    const { q } = req.query;
    const AMZ_ID = "eduardohen00f-20";

    try {
        let resultados = [];

        // 1. Porto Seguro: Amazon
        resultados.push({
            title: `Ver preço de "${q}" na Amazon Brasil`,
            price: "CONSULTAR",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. Mercado Livre (Filtro 4-5 estrelas)
        try {
            const resp = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=15`);
            const data = await resp.json();

            if (data.results) {
                const mlItems = data.results.map(item => {
                    const level = item.seller?.seller_reputation?.level_id;
                    let nota = 0;
                    if (item.official_store_id || level === '5_green') nota = 5;
                    else if (level === '4_light_green') nota = 4;

                    return {
                        title: item.title,
                        price: item.price.toLocaleString('pt-br', {minimumFractionDigits: 2}),
                        image: item.thumbnail.replace("-I.jpg", "-V.jpg"),
                        link: item.permalink,
                        store: 'Mercado Livre',
                        rating: nota
                    };
                }).filter(prod => prod.rating >= 4); // REGRA ZERA ESTOQUE: APENAS ELITE

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) { }

        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ error: "Falha na API" });
    }
}
