

# Limpeza de Roles: Manter Apenas 3 Perfis

## Contexto
O sistema atualmente tem 5 roles no enum `tipo_acesso_enum`: `rede`, `lider_distrito`, `lider_congregacao`, `recepcao`, `discipulador`. O usuário quer manter apenas 3: **rede** (Admin), **lider_distrito**, **lider_congregacao**.

## Mudanças

### 1. Migração de Banco de Dados
- Atualizar qualquer usuário existente com `tipo_acesso = 'recepcao'` ou `'discipulador'` para `'lider_congregacao'` (fallback seguro)
- Atualizar todas as políticas RLS que referenciam `recepcao` ou `discipulador` para remover esses valores
- Nota: não é possível remover valores de um enum PostgreSQL sem recriar, mas podemos simplesmente parar de usá-los no código e nas políticas

**Políticas RLS a atualizar:**
- `visitantes` (SELECT, INSERT, UPDATE, DELETE) — remover branches `recepcao` e `discipulador`
- `discipulos` (SELECT, INSERT, UPDATE) — remover branch `discipulador`, ajustar INSERT
- `relatorios` (SELECT, INSERT, UPDATE) — remover branch `discipulador`
- `licoes` (SELECT, INSERT, UPDATE) — remover branch `discipulador`
- `frequencia_gc` — remover `discipulador` da lista
- `gc_select` — remover `discipulador` da lista
- `membros_gc_select` — remover `discipulador` da lista
- `users` SELECT — remover branches `discipulador`/`recepcao`

### 2. Código — Arquivos a Modificar

**`src/hooks/usePermissions.ts`**
- Remover `recepcao` e `discipulador` de `routePermissions` e `editPermissions`
- Remover rota `/app/discipuladores` (página dedicada não faz mais sentido com apenas 3 roles)
- Simplificar permissões: todas as rotas ficam acessíveis por `rede`, `lider_distrito`, `lider_congregacao`

**`src/components/AppSidebar.tsx`**
- Remover link "Discipuladores" da sidebar

**`src/components/AppHeader.tsx`**
- Remover `recepcao` e `discipulador` do `roleLabels`

**`src/pages/Admin.tsx`**
- Remover opções "Recepção" e "Discipulador" do Select de tipo de acesso
- Manter apenas Admin, Líder Distrito, Líder Congregação

**`src/components/DiscipuloDetailDialog.tsx`**
- Alterar `canEdit` de `userRole === "discipulador" || userRole === "rede"` para todos os 3 roles poderem editar

**`src/pages/Visitantes.tsx`**
- `canAssumir`: remover check `userRole === "discipulador"`, todos podem assumir
- Filtro de congregação: mostrar para `lider_distrito` também (não só admin)

**`src/pages/Discipulos.tsx`**
- Filtro de congregação: mostrar para `lider_distrito` também

**`src/components/AssumirDiscipuladoDialog.tsx`**
- Ajustar query de discipuladores (lista de usuários para atribuir): buscar todos os users aprovados, não filtrar por `tipo_acesso`

**`src/components/NovoDiscipuladorDialog.tsx`**
- Remover `tipo_acesso: "discipulador"` do insert — alterar para `lider_congregacao` ou remover essa funcionalidade (discipuladores agora são simplesmente usuários do sistema)

**`src/pages/Discipuladores.tsx`**
- Ajustar query: não filtrar por `tipo_acesso` "discipulador", listar todos os usuários aprovados que têm discípulos

**`src/hooks/useBadgeCounts.ts`**
- Remover branch especial para `discipulador` na query de discípulos vermelhos

**`src/components/NovoDiscipuloDialog.tsx`**
- Ajustar query de discipuladores

**`src/App.tsx`**
- Manter rota `/app/discipuladores` (página ainda é útil para ver quem está discipulando)

**`src/contexts/AuthContext.tsx`**
- No `fetchProfile`, alterar fallback de `tipo_acesso` para `"lider_congregacao"` ao invés de `"rede"` para novos usuários (segurança)

### 3. Resumo da Simplificação

| Antes | Depois |
|-------|--------|
| 5 roles | 3 roles |
| `recepcao` vê só o que cadastrou | Removido |
| `discipulador` vê só seus discípulos | Removido |
| RLS complexo com 5 branches | RLS simples com 3 branches |
| Sidebar com items condicionais | Sidebar mais limpa |

### Ordem de Execução
1. Migração SQL (atualizar users existentes + reescrever RLS)
2. Atualizar `usePermissions.ts`
3. Atualizar componentes UI (Admin, Sidebar, Header, formulários)
4. Atualizar queries (AssumirDiscipulado, NovoDiscipulador, BadgeCounts)
5. Atualizar AuthContext (fallback para novos usuários)

