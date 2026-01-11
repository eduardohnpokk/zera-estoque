export default async function handler(req, res) {
    const { q } = req.query;
    const AMZ_ID = "eduardohen00f-20";

    if (!q) return res.status(400).json({ error: "Busca vazia" });

    try {
        let resultados = [];

        // 1. AMAZON (Padrão Ouro de Segurança)
        resultados.push({
            title: `Ver "${q}" na Amazon Brasil`,
            price: "CONSULTAR",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. MERCADO LIVRE (Filtro de Elite Calibrado)
        try {
            const resp = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=30`);
            const data = await resp.json();

            if (data.results) {
                const mlItems = data.results.map(item => {
                    const reputation = item.seller?.seller_reputation;
                    const level = reputation?.level_id; // 5_green, 4_light_green, etc.
                    const powerStatus = reputation?.power_seller_status; // platinum, gold, silver

                    let nota = 0;
                    
                    // LÓGICA VERDE: Se for Loja Oficial ou Nível 5 (Platinum)
                    if (item.official_store_id || level === '5_green' || powerStatus === 'platinum') {
                        nota = 5;
                    } 
                    // LÓGICA VERDE CLARO: Se for Nível 4 (Gold)
                    else if (level === '4_light_green' || powerStatus === 'gold') {
                        nota = 4;
                    }

                    return {
                        title: item.title,
                        price: item.price ? item.price.toLocaleString('pt-br', { minimumFractionDigits: 2 }) : "CONSULTAR",
                        image: item.thumbnail.replace("-I.jpg", "-V.jpg"),
                        link: item.permalink,
                        store: 'Mercado Livre',
                        rating: nota
                    };
                }).filter(prod => prod.rating >= 4); // MANTÉM O FILTRO APENAS NO ESPECTRO VERDE (4 e 5)

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) {
            console.error("Erro ML:", e);
        }

        // Cache de 1 hora para evitar limites de API
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).json(resultados);

    } catch (error) {
        res.status(500).json({ error: "Erro na busca" });
    }
}
