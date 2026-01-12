export default async function handler(req, res) {
    const { q } = req.query;

    // Puxando as chaves exatamente como nomeadas na imagem image_bba565.png
    const ML_TOKEN = process.env.ML_ACCESS_TOKEN; 
    const AMZ_ID = process.env.AMAZON_TRACKING_ID; 

    if (!q) return res.status(400).json({ error: "Busca vazia" });

    try {
        let resultados = [];

        // 1. AMAZON (Link Direto de Afiliado)
        resultados.push({
            title: `Ver "${q}" na Amazon Brasil`,
            price: "CONSULTAR",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. MERCADO LIVRE (Com seu Access Token autenticado)
        try {
            const resp = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=30`, {
                headers: {
                    'Authorization': `Bearer ${ML_TOKEN}`,
                    'User-Agent': 'ZeraEstoque/1.0',
                    'Content-Type': 'application/json'
                }
            });

            if (!resp.ok) {
                console.error(`Erro específico na busca do Mercado Livre: Erro na API ML: ${resp.status}`);
                throw new Error(`ML Status ${resp.status}`);
            }

            const data = await resp.json();

            if (data.results) {
                const mlItems = data.results.map(item => {
                    const reputation = item.seller?.seller_reputation;
                    const level = reputation?.level_id;
                    const powerStatus = reputation?.power_seller_status;

                    let nota = 0;
                    // Lógica de Elite: Verde Escuro ou Platinum/Gold
                    if (item.official_store_id || level === '5_green' || powerStatus === 'platinum') {
                        nota = 5;
                    } else if (level === '4_light_green' || powerStatus === 'gold') {
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
                }).filter(prod => prod.rating >= 4); // Regra Zera Estoque

                resultados = [...resultados, ...mlItems];
            }
        } catch (mlError) {
            console.error("Falha autenticada no ML:", mlError.message);
        }

        // Configuração de Cache para performance
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).json(resultados);

    } catch (error) {
        console.error("Erro Geral na API:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
}
