export default async function handler(req, res) {
    const { q } = req.query;
    const AMZ_ID = "eduardohen00f-20";

    // Proteção contra buscas vazias
    if (!q) {
        return res.status(400).json({ error: "Termo de busca não fornecido" });
    }

    console.log(`Iniciando busca por: ${q}`);

    try {
        let resultados = [];

        // 1. Porto Seguro: Amazon (Card Estático com seu ID de Afiliado)
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
            const mlUrl = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=20`;
            const resp = await fetch(mlUrl);
            
            if (!resp.ok) throw new Error(`Erro na API ML: ${resp.status}`);
            
            const data = await resp.json();

            if (data.results && data.results.length > 0) {
                console.log(`ML retornou ${data.results.length} itens. Filtrando por reputação...`);

                const mlItems = data.results.map(item => {
                    const level = item.seller?.seller_reputation?.level_id;
                    let nota = 0;
                    
                    // Lógica de Notas Zera Estoque
                    if (item.official_store_id || level === '5_green') nota = 5;
                    else if (level === '4_light_green') nota = 4;

                    return {
                        title: item.title,
                        price: item.price.toLocaleString('pt-br', { minimumFractionDigits: 2 }),
                        image: item.thumbnail.replace("-I.jpg", "-V.jpg"), // Imagem com melhor qualidade
                        link: item.permalink,
                        store: 'Mercado Livre',
                        rating: nota
                    };
                }).filter(prod => prod.rating >= 4); // REGRA ZERA ESTOQUE: APENAS ELITE

                console.log(`${mlItems.length} itens passaram no filtro de elite.`);
                resultados = [...resultados, ...mlItems];
            } else {
                console.log("Nenhum resultado encontrado no Mercado Livre.");
            }
        } catch (mlError) {
            console.error("Erro específico na busca do Mercado Livre:", mlError.message);
        }

        // Configuração de Cache para performance (1 hora)
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        res.status(200).json(resultados);

    } catch (error) {
        console.error("Erro fatal na API:", error);
        res.status(500).json({ error: "Falha interna na busca" });
    }
}
