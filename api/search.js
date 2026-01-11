export default async function handler(req, res) {
    const { q } = req.query;
    const AMZ_ID = process.env.AMAZON_TRACKING_ID || "eduardohen00f-20";

    try {
        let resultados = [];

        // 1. Card Amazon (Garante que você ganhe comissão)
        resultados.push({
            title: `Consultar preço atual de "${q}" na Amazon Brasil`,
            price: "VER PREÇO",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. Busca Mercado Livre (Ajuste para funcionar sem Token público)
        try {
            const responseML = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=20`);
            const dataML = await responseML.json();

            if (dataML.results) {
                const mlItems = dataML.results.map(item => {
                    // Lógica de Reputação: Apenas 4 ou 5 estrelas
                    // Se for loja oficial ou platinum/gold, damos nota 5 ou 4.
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
                }).filter(prod => prod.rating >= 4); // REGRA: NUNCA MOSTRA NOTA 3

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) {
            console.error("Erro ao buscar no Mercado Livre");
        }

        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ error: "Erro interno no servidor de busca" });
    }
}
