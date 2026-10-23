# DASH Crypto Pulse

Painel de acompanhamento financeiro e criptomoedas com páginas públicas e APIs privadas protegidas por Supabase Auth. Next.js (App Router), TypeScript e Tailwind CSS.

## Executar localmente

Requer Node.js 22+.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Acesse `http://localhost:3000`: a página inicial abre o painel sem solicitar login; a rota `/login` redireciona para `/overview`. As APIs continuam exigindo sessão Supabase válida. A rota `/register` não cria novos usuários.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública/anon de autenticação |
| `COINGECKO_API_KEY` | Opcional; chave Demo do CoinGecko para limites de consulta |
| `COINBASE_API_KEY_NAME` | Nome da chave CDP API de leitura |
| `COINBASE_API_PRIVATE_KEY` | Chave privada PEM da API CDP, apenas servidor |
| `COINBASE_PORTFOLIO_UUID` | UUID do portfólio vinculado à chave |
| `COINBASE_ALLOWED_USER_ID` | UUID de Supabase Auth autorizado a consultar Coinbase |

A Coinbase permanece indisponível até que **todas** as variáveis da integração sejam configuradas e a API valide a chave. Crie uma chave com **View** habilitada e **Trade/Transfer** desabilitadas. Nunca coloque segredo em `NEXT_PUBLIC_*` ou arquivos versionados.

## Dados reais e limites

- O painel principal usa posições registradas manualmente, precificadas via CoinGecko por ID do ativo.
- Quando a cotação não está disponível, o ativo é marcado como indisponível e não entra nos indicadores de patrimônio/P&L. Não existem preços estimados nem gráficos fictícios.
- A Coinbase consulta permissões na API, gera JWT de curta duração por requisição e lê saldos paginados. O painel mostra esses saldos **separadamente**, sem misturar posições manuais e causar duplicidade.
- **Não há operações de compra, venda ou transferência**, mesmo em caso de credenciais privilegiadas: as chaves com tais permissões são recusadas.
- As páginas de visualização são acessíveis sem login; a autenticação continua impedindo usuários não logados de consultar APIs. Os endpoints de Coinbase exigem ainda `COINBASE_ALLOWED_USER_ID`.
- **Limitação atual:** posições manuais, alertas, watchlist, metas e histórico são mantidos no localStorage do navegador. Não há sincronização multiusuário com o banco. Não utilize navegadores compartilhados para dados financeiros privados.
- A tela de análise usa dados disponíveis e histórico salvo localmente, não um extrato contábil.
- Médias e bases de custo manuais não foram reconciliadas com extratos históricos da Coinbase. Esse trabalho exige importar e validar transações reais antes de apresentar valor contábil auditável.
- Os resultados de simulação são hipotéticos e não representam aconselhamento financeiro.

## Qualidade

```bash
npm run type-check
npm run lint
npm run build
```

O workflow `.github/workflows/ci.yml` executa essas verificações em push/PR. O workflow Datadog é opcional e só executa os testes quando as credenciais estiverem disponíveis.

## Segurança

Para uso em produção com mais de um usuário, primeiro implemente armazenamento por usuário em banco com políticas Supabase RLS, migrações e testes de isolamento, além de monitoramento, backup e verificações de acesso. Não vincule a integração Coinbase à conta de um usuário diferente do `COINBASE_ALLOWED_USER_ID`.
