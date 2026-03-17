

# Plano: Corrigir Sidebar Contextual, Navegação Hierárquica e GCs por Distrito/Congregação

## Resumo

Há 3 grandes frentes de trabalho:

1. **Sidebar contextual completa** para Distrito e Congregação (com links para Visitantes, Discípulos, Relatórios)
2. **Rotas contextuais** — criar rotas `/app/distrito/:id/visitantes`, `/app/distrito/:id/discipulos`, etc., e equivalentes para congregação
3. **GCs vinculados a Distrito/Congregação** — adicionar `distrito_id` e `congregacao_id` à tabela `grupos_crescimento` e exibir contagem de GCs no dashboard

---

## 1. Sidebar Contextual (AppSidebar.tsx)

**Problema atual**: Ao entrar em Distrito ou Congregação, a sidebar mostra apenas "Visão Geral" e a lista de congregações. Faltam Visitantes, Discípulos e Relatórios.

**Solução**: Adicionar links contextuais na `DistritoSidebar` e `CongregacaoSidebar`:

```text
Distrito Sidebar:
  ← Dashboard Geral
  [Distrito X - Nome]
  • Visão Geral        → /app/distrito/:id
  • Visitantes          → /app/distrito/:id/visitantes
  • Discípulos          → /app/distrito/:id/discipulos
  • Relatórios          → /app/distrito/:id/relatorios
  ── Congregações ──
  • Cong A              → /app/congregacao/:id
  • Cong B              → /app/congregacao/:id

Congregação Sidebar:
  ← Distrito X
  [Nome Congregação]
  • Visão Geral        → /app/congregacao/:id
  • Visitantes          → /app/congregacao/:id/visitantes
  • Discípulos          → /app/congregacao/:id/discipulos
  • Relatórios          → /app/congregacao/:id/relatorios
```

Atualizar também o `BottomNav` mobile com os mesmos links contextuais.

---

## 2. Rotas Contextuais (App.tsx)

Adicionar novas rotas dentro do `AppLayout`:

```
/app/distrito/:distritoId/visitantes
/app/distrito/:distritoId/discipulos
/app/distrito/:distritoId/relatorios
/app/congregacao/:congId/visitantes
/app/congregacao/:congId/discipulos
/app/congregacao/:congId/relatorios
```

Cada rota renderiza o componente existente (`Visitantes`, `Discipulos`, `Relatorios`) mas passando o contexto de filtro (distritoId ou congId).

**Modificações nas páginas existentes** (`Visitantes.tsx`, `Discipulos.tsx`, `Relatorios.tsx`):
- Aceitar `useParams()` para `distritoId` ou `congId`
- Quando presentes, filtrar dados automaticamente por congregação ou distrito (buscar congregações do distrito e filtrar)
- Admin e lider_distrito podem adicionar/editar/excluir visitantes e discípulos nestes contextos

**Atualizar `useSidebarContext.ts`**:
- Expandir os regex para capturar `/app/distrito/:id/*` e `/app/congregacao/:id/*` como modo distrito/congregação

**Atualizar `usePermissions.ts`**:
- Permitir que `lider_distrito` acesse rotas de distrito (não apenas admin)
- Adicionar permissões para as novas sub-rotas

---

## 3. GCs vinculados a Distrito/Congregação

### 3a. Migração de banco de dados

Adicionar colunas à tabela `grupos_crescimento`:

```sql
ALTER TABLE public.grupos_crescimento
  ADD COLUMN distrito_id uuid REFERENCES public.distritos(id) ON DELETE SET NULL,
  ADD COLUMN congregacao_id uuid REFERENCES public.congregacoes(id) ON DELETE SET NULL;
```

### 3b. Formulário de GC (MapaGCs.tsx)

Adicionar dois selects ao formulário de cadastro/edição:
- **Distrito** (select) — ao selecionar, filtra as congregações disponíveis
- **Congregação** (select) — filtrada pelo distrito selecionado

Atualizar `emptyForm`, `openEdit`, `handleSave` para incluir `distrito_id` e `congregacao_id`.

### 3c. Dashboard Geral (DashboardGeral.tsx)

Alterar o card de cada distrito para exibir 4 métricas: **Congregações, GCs, Visitantes, Discípulos**.

Buscar GCs com `congregacao_id` e agregar por distrito.

---

## 4. Permissões do Líder Distrital

**Problema**: Líder distrital atualmente tem visão limitada e não pode navegar como admin dentro do seu distrito.

**Solução**:
- Quando `lider_distrito` acessa `/app/dashboard`, redireciona para `/app/distrito/:seuDistritoId`
- A sidebar mostra a mesma estrutura do admin para o distrito
- Pode acessar as sub-rotas de visitantes, discípulos e relatórios do seu distrito e congregações
- Pode adicionar/editar visitantes e discípulos (já garantido pelo RLS)

---

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Adicionar 6 novas rotas contextuais |
| `src/components/AppSidebar.tsx` | Sidebar distrito/congregação com links completos + bottom nav |
| `src/hooks/useSidebarContext.ts` | Regex expandido para sub-rotas |
| `src/hooks/usePermissions.ts` | Permissões para novas rotas e lider_distrito |
| `src/pages/Visitantes.tsx` | Aceitar filtro por distritoId/congId via params |
| `src/pages/Discipulos.tsx` | Aceitar filtro por distritoId/congId via params |
| `src/pages/Relatorios.tsx` | Aceitar filtro por distritoId/congId via params |
| `src/pages/MapaGCs.tsx` | Campos distrito/congregação no formulário |
| `src/components/DashboardGeral.tsx` | Adicionar contagem de GCs nos cards de distrito |
| `src/components/DashboardDistrito.tsx` | Remover botão voltar (sidebar já faz isso) |
| **Migração SQL** | Adicionar `distrito_id` e `congregacao_id` na tabela `grupos_crescimento` |

