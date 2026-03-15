

# Adicionar Visitantes e Discípulos nos Dashboards de Distrito e Congregação

## Resumo
Adicionar botões "Novo Visitante" e "Novo Discípulo" nos dashboards de Distrito e Congregação, e remover qualquer botão de adição do Dashboard Geral (Admin).

## Mudanças

### `src/components/DashboardCongregacao.tsx`
- Importar `VisitanteFormDialog` e `NovoDiscipuloDialog`
- Adicionar estados `showVisitanteDialog` e `showDiscipuloDialog`
- Adicionar botões "+ Visitante" e "+ Discípulo" no header (ao lado do botão Exportar PDF)
- Renderizar os dialogs, passando `onSuccess={fetchAll}` para recarregar dados após cadastro
- O `VisitanteFormDialog` já usa `useCongregacoes` internamente, mas como o usuário está no contexto de uma congregação específica, o dialog vai funcionar normalmente

### `src/components/DashboardDistrito.tsx`
- Mesma lógica: importar os dialogs, adicionar botões "+ Visitante" e "+ Discípulo" no header
- Os dialogs já têm seletor de congregação interno, então o usuário escolhe a congregação ao cadastrar

### `src/components/DashboardGeral.tsx`
- Nenhuma mudança necessária — já não tem botões de adição (correto conforme solicitado)

### Nenhuma mudança de banco de dados
Os dialogs existentes já funcionam com as permissões RLS atuais.

