

# Sidebar Contextual: Dashboard dentro de Dashboard

## O que o Admin quer

Hoje, ao clicar num distrito, a sidebar continua mostrando os mesmos links globais. O Admin quer que a sidebar **mude de contexto** conforme navega:

```text
/app/dashboard         → Sidebar Global (Dashboard, Mapa GCs, Admin, Config)
/app/distrito/:id      → Sidebar Distrito (← Voltar, Visão Geral, Visitantes, Discípulos, Relatórios, lista de congregações)
/app/congregacao/:id   → Sidebar Congregação (← Voltar ao Distrito, Visão Geral, Visitantes, Discipulado, Relatórios)
```

## Como funciona

A `AppSidebar` detecta a rota atual via `useLocation()`:
- Se `pathname` começa com `/app/distrito/:id` → renderiza sidebar de distrito (busca nome do distrito + lista de congregações do DB)
- Se `pathname` começa com `/app/congregacao/:id` → renderiza sidebar de congregação (busca nome da congregação e link de volta ao distrito)
- Caso contrário → sidebar global atual

O botão "Voltar" no topo da sidebar contextual leva ao nível anterior (congregação → distrito → dashboard geral).

## Arquivos a modificar

### `src/components/AppSidebar.tsx`
Refatorar para ter 3 modos de renderização baseados na rota:

1. **Modo Global** (atual): Dashboard, Mapa GCs, Admin, Config
2. **Modo Distrito**: 
   - Header: "← Dashboard Geral" + nome do distrito
   - Links: Visão Geral (`/app/distrito/:id`), Visitantes (filtrado), Discípulos (filtrado), Relatórios
   - Seção: lista de congregações como sub-links clicáveis
3. **Modo Congregação**:
   - Header: "← Distrito X" + nome da congregação  
   - Links: Visão Geral (`/app/congregacao/:id`), Visitantes, Discipulado, Relatórios

Usar um hook `useSidebarContext()` que extrai `distritoId` ou `congId` da URL, busca os dados necessários (nome, congregações filhas) e retorna o modo + dados.

### `src/components/AppSidebar.tsx` (BottomNav)
Mesma lógica para mobile: mudar os 4 itens do bottom nav conforme o contexto.

### Nenhuma mudança de rotas ou banco
Tudo é puramente visual/navegação — a sidebar reage à URL atual.

## Detalhes Técnicos

- Criar hook `src/hooks/useSidebarContext.ts` que:
  - Usa `useLocation` + `useParams` (ou regex na URL) para detectar o nível
  - Faz query leve ao DB (nome do distrito/congregação, lista de congregações filhas)
  - Cacheia com `useState` para não re-fetch desnecessário
- A sidebar carrega os dados de forma assíncrona (skeleton enquanto carrega)
- Os links de Visitantes/Discípulos dentro do contexto distrito/congregação podem apontar para as mesmas páginas `/app/visitantes` e `/app/discipulos` com query params (`?distrito=X` ou `?congregacao=Y`) ou podem ser abas dentro do próprio dashboard

