

# Reestruturação de Perfis e Navegação Hierárquica

## Problema Atual
O sistema tem 3 papéis (`recepcao`, `discipulador`, `rede`) que não mapeiam para a estrutura organizacional real: **Admin**, **Líder de Distrito** e **Líder de Congregação**.

## Solução: Dashboard Hierárquico com 3 Níveis

A experiência de cada perfil é um "zoom" progressivo na mesma estrutura de dados:

```text
ADMIN (visão total)
├── Dashboard Geral (stats consolidados de todos os distritos)
├── Lista de Distritos (cards clicáveis)
│   └── Dashboard do Distrito (stats das congregações do distrito)
│       └── Dashboard da Congregação (visitantes, discipulado, relatórios)
├── Mapa de GCs (global)
└── Admin (usuários, distritos, congregações)

LÍDER DISTRITO (visão do seu distrito)
├── Dashboard do Distrito (mesma tela que Admin vê ao clicar num distrito)
│   └── Dashboard da Congregação (pode entrar em cada uma)
└── Relatórios (filtrados pelo distrito)

LÍDER CONGREGAÇÃO (visão da sua congregação)
├── Dashboard da Congregação (mesma tela, direto)
└── Relatórios (filtrados pela congregação)
```

Cada nível inferior é literalmente a mesma página/componente reutilizado, apenas com escopo diferente.

## Mudanças no Banco de Dados

1. **Novo enum** `tipo_acesso_enum`: adicionar valores `lider_distrito` e `lider_congregacao`, remover `recepcao` e `discipulador` (migração gradual)
2. **Nova coluna** `users.distrito_id` (FK para distritos) — para vincular Líderes de Distrito
3. **Atualizar RLS** para que `lider_distrito` veja dados de todas as congregações do seu distrito, e `lider_congregacao` veja apenas os da sua congregação

```sql
-- Adicionar novos valores ao enum
ALTER TYPE tipo_acesso_enum ADD VALUE 'lider_distrito';
ALTER TYPE tipo_acesso_enum ADD VALUE 'lider_congregacao';

-- Coluna para vincular líder ao distrito
ALTER TABLE users ADD COLUMN distrito_id uuid REFERENCES distritos(id);
```

## Mudanças na UI

### 1. Novos Componentes de Dashboard
- **`DashboardGeral.tsx`** — Stats consolidados + grid de cards por distrito (clicáveis). Só Admin vê.
- **`DashboardDistrito.tsx`** — Recebe `distrito_id`. Mostra stats do distrito + cards por congregação. Admin e Líder Distrito veem.
- **`DashboardCongregacao.tsx`** — Recebe `congregacao_id`. Mostra visitantes, discipulado, relatórios daquela congregação. Todos os perfis veem (cada um a sua).

### 2. Rotas
```text
/app/dashboard              → Admin: DashboardGeral / Líder Distrito: DashboardDistrito / Líder Congregação: DashboardCongregacao
/app/distrito/:distritoId   → DashboardDistrito (Admin navega aqui ao clicar num distrito)
/app/congregacao/:congId    → DashboardCongregacao (Admin/Líder Distrito navegam aqui)
```

### 3. Sidebar Adaptativa
A sidebar muda conforme o perfil:
- **Admin**: Dashboard, Distritos, Mapa GCs, Admin, Configurações
- **Líder Distrito**: Dashboard (do distrito), Congregações, Relatórios
- **Líder Congregação**: Dashboard (da congregação), Relatórios

### 4. Dashboard da Congregação (tela principal para Líder Congregação)
Contém tudo que o líder precisa numa única tela com abas internas:
- **Visão Geral** (stats, gráficos)
- **Visitantes** (lista + cadastro)
- **Discipulado** (discípulos + discipuladores)
- **Relatórios** (sessões de discipulado)

### 5. Admin — Gestão de Usuários
Atualizar o dropdown de tipo de acesso para incluir `Líder de Distrito` e `Líder de Congregação`, com campos para selecionar o distrito ou congregação correspondente.

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migração SQL | Novo enum values, coluna `distrito_id`, RLS atualizado |
| `src/components/DashboardGeral.tsx` | Criar — visão Admin com cards de distritos |
| `src/components/DashboardDistrito.tsx` | Criar — visão distrito com cards de congregações |
| `src/components/DashboardCongregacao.tsx` | Criar — visão congregação com abas internas |
| `src/pages/Dashboard.tsx` | Refatorar — renderiza o dashboard correto conforme perfil |
| `src/App.tsx` | Adicionar rotas `/app/distrito/:id` e `/app/congregacao/:id` |
| `src/components/AppSidebar.tsx` | Sidebar adaptativa por perfil |
| `src/hooks/usePermissions.ts` | Atualizar com novos perfis e permissões |
| `src/pages/Admin.tsx` | Atualizar gestão de usuários com novos tipos |
| `src/contexts/AuthContext.tsx` | Expor `distrito_id` no profile |

## Benefícios
- **Um sistema, três experiências**: cada perfil vê exatamente o que precisa
- **Componentes reutilizados**: DashboardCongregacao é a mesma tela para todos, só muda o escopo
- **Navegação intuitiva**: Admin faz drill-down visual (Geral → Distrito → Congregação)
- **Escalável**: adicionar novas congregações/distritos não requer mudança de código

