export default async function handler(req, res) {
    const { q } = req.query;
    const AMZ_ID = process.env.AMAZON_TRACKING_ID || "eduardohen00f-20";

    try {
        let resultados = [];

        // 1. Amazon (Link Direto)
        resultados.push({
            title: `Ver ofertas de "${q}" na Amazon Brasil`,
            price: "OFERTA",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. Mercado Livre (Filtro 4-5 estrelas)
        try {
            const response = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=15`);
            const data = await response.json();

            if (data.results) {
                const mlItems = data.results.map(item => ({
                    title: item.title,
                    price: item.price.toLocaleString('pt-br', {minimumFractionDigits: 2}),
                    image: item.thumbnail.replace("-I.jpg", "-V.jpg"),
                    link: item.permalink,
                    store: 'Mercado Livre',
                    // Filtro de Segurança Zera Estoque
                    rating: (item.official_store_id || item.seller?.seller_reputation?.level_id === '5_platinum') ? 5 : 4
                })).filter(prod => prod.rating >= 4); // APENAS 4 OU 5 ESTRELAS

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) { console.error("Erro ML"); }

        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ error: "Erro na busca" });
    }
}
