import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { q } = req.query;
    const AMZ_ID = process.env.AMAZON_TRACKING_ID || "eduardohen00f-20";

    try {
        let resultados = [];

        // 1. Resultado Amazon (Link direto seguro)
        resultados.push({
            title: `Ofertas de "${q}" na Amazon Brasil`,
            price: "VER PREÇO",
            image: "https://m.media-amazon.com/images/G/31/social_sharing/amazon_logo.jpg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. Busca Mercado Livre (Sem necessidade de Token para busca pública)
        try {
            const respML = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=15`);
            const dataML = await respML.json();

            if (dataML.results) {
                const mlItems = dataML.results.map(item => ({
                    title: item.title,
                    price: item.price.toLocaleString('pt-br', {minimumFractionDigits: 2}),
                    image: item.thumbnail.replace("-I.jpg", "-V.jpg"),
                    link: item.permalink,
                    store: 'Mercado Livre',
                    // Filtro: Lojas oficiais ou reputação alta = 5, outros verificados = 4
                    rating: (item.official_store_id || item.seller?.seller_reputation?.level_id === '5_platinum') ? 5 : 4
                })).filter(prod => prod.rating >= 4); // REGRA: APENAS 4 OU 5 ESTRELAS

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) { console.error("Erro ML:", e); }

        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ error: "Erro na busca" });
    }
}
