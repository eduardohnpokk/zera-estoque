import fetch from 'node-fetch';

export default async function handler(req, res) {
    const { q } = req.query;

    try {
        const ML_TOKEN = process.env.ML_ACCESS_TOKEN;
        const AMZ_ID = process.env.AMAZON_TRACKING_ID || "eduardohen00f-20";

        let resultados = [];

        // 1. Card da Amazon (Garante resultado imediato com seu ID)
        resultados.push({
            title: `Ofertas de "${q}" na Amazon Brasil`,
            price: "VER PREÇO",
            image: "https://m.media-amazon.com/images/G/32/social_sharing/amazon_logo.jpg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. Busca no Mercado Livre com filtro de segurança
        try {
            const resp = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=20`);
            const data = await resp.json();

            if (data.results) {
                const mlItems = data.results.map(item => ({
                    title: item.title,
                    price: item.price.toLocaleString('pt-br', {minimumFractionDigits: 2}),
                    image: item.thumbnail.replace("-I.jpg", "-V.jpg"),
                    link: item.permalink,
                    store: 'Mercado Livre',
                    // Regra: Lojas oficiais ou Platinum são nota 5, outros verificados nota 4
                    rating: (item.official_store_id || item.seller?.seller_reputation?.level_id === '5_platinum') ? 5 : 4
                })).filter(prod => prod.rating >= 4); // Filtro rigoroso: Apenas 4 ou 5 estrelas

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) {
            console.error("Erro ML:", e);
        }

        res.status(200).json(resultados);

    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor de busca" });
    }
}
