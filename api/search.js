export default async function handler(req, res) {
    const { q } = req.query;

    // Puxando as chaves EXATAS do seu print image_bbb52a.png
    const ML_TOKEN = process.env.ML_ACCESS_TOKEN; 
    const AMZ_ID = process.env.AMAZON_TRACKING_ID; 

    if (!q) return res.status(400).json({ error: "Busca vazia" });

    try {
        let resultados = [];

        // 1. AMAZON (Utilizando seu Tracking ID oficial)
        resultados.push({
            title: `Ver "${q}" na Amazon Brasil`,
            price: "CONSULTAR",
            image: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            link: `https://www.amazon.com.br/s?k=${encodeURIComponent(q)}&tag=${AMZ_ID}`,
            store: 'Amazon',
            rating: 5
        });

        // 2. MERCADO LIVRE (Autenticado com seu Access Token)
        try {
            const resp = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=30`, {
                headers: {
                    'Authorization': `Bearer ${ML_TOKEN}`,
                    'User-Agent': 'ZeraEstoque/1.0'
                }
            });

            if (!resp.ok) throw new Error(`Erro API ML: ${resp.status}`);

            const data = await resp.json();

            if (data.results) {
                const mlItems = data.results.map(item => {
                    const rep = item.seller?.seller_reputation;
                    let nota = 0;
                    
                    // Lógica de Elite: Verde ou Platinum/Gold
                    if (item.official_store_id || rep?.level_id === '5_green' || rep?.power_seller_status === 'platinum') {
                        nota = 5;
                    } else if (rep?.level_id === '4_light_green' || rep?.power_seller_status === 'gold') {
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
                }).filter(prod => prod.rating >= 4);

                resultados = [...resultados, ...mlItems];
            }
        } catch (e) {
            console.error("Erro na integração ML:", e.message);
        }

        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).json(resultados);

    } catch (error) {
        res.status(500).json({ error: "Falha no servidor" });
    }
}
