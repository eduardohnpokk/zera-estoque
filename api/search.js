export default async function handler(req, res) {
    const { q } = req.query;

    try {
        // Pega as chaves do cofre da Vercel
        const ML_TOKEN = process.env.ML_ACCESS_TOKEN;
        const AMZ_ID = process.env.AMAZON_TRACKING_ID || "eduardohen00f-20";

        let resultados = [];

        // 1. Adiciona sempre o Card da Amazon (Garante que o site nunca fique vazio)
        resultados.push({
            title: `Ofertas de "${q}" na Amazon Brasil`,
            price: "VER PREÇO",
            image: "https://m.media-amazon.com/images/G/32/social_sharing/amazon_logo.jpg",
            link: `https://www.amazon.com.br/s?k=${q}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. Tenta buscar no Mercado Livre
        try {
            const resp = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${q}&limit=20`);
            const data = await resp.json();

            if (data.results) {
                const mlItems = data.results.map(item => ({
                    title: item.title,
                    price: item.price.toLocaleString('pt-br', {minimumFractionDigits: 2}),
                    image: item.thumbnail.replace("-I.jpg", "-V.jpg"),
                    link: item.permalink,
                    store: 'Mercado Livre',
                    // Filtro de Segurança: se for oficial ou bem avaliado ganha 5, senão 4
                    rating: (item.official_store_id || item.seller.seller_reputation?.level_id === '5_platinum') ? 5 : 4
                })).filter(prod => prod.rating >= 4); // Regra rigorosa: apenas 4 ou 5 estrelas

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) {
            console.log("Erro no ML, seguindo com Amazon...");
        }

        // Retorna tudo para a tela
        res.status(200).json(resultados);

    } catch (error) {
        res.status(200).json([{
            title: "Erro na conexão, mas você pode buscar direto aqui:",
            price: "---",
            image: "https://m.media-amazon.com/images/G/32/social_sharing/amazon_logo.jpg",
            link: `https://www.amazon.com.br/s?k=${q}`,
            store: 'Amazon',
            rating: 5
        }]);
    }
}
