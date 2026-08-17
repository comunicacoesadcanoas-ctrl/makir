# Estabilização do Mapbox e revisão geral do MAKIR

## Diagnóstico confirmado

- **Mapbox desativa entre sessões:** o token público é solicitado ao usuário e salvo somente em `localStorage` (`MapaGCs.tsx` e `GCDetailDialog.tsx`). Preview, navegador novo, limpeza de dados ou outro dispositivo não possuem esse valor e voltam para “Configurar Mapbox”. Não há conexão Mapbox vinculada ao projeto.
- **Mapa tem ciclo de vida frágil:** mapa principal, mini mapa do formulário e mini mapa de detalhes repetem inicialização, token e limpeza. Há remoções concorrentes e listeners que não são sempre retirados, aumentando a chance de mapa vazio ao alternar abas e diálogos.
- **Chamadas repetidas em toda navegação:** `AppSidebar` e `BottomNav` chamam `useBadgeCounts` separadamente mesmo quando um deles está apenas oculto por CSS. O teste registrou repetição das mesmas três contagens em cada rota.
- **Autenticação removida de forma parcial:** o app usa um usuário administrador sintético, ainda consulta e encerra sessões reais no carregamento, mantém telas antigas de onboarding e conserva matrizes de permissão incompatíveis com o modelo público atual.
- **Acesso ao banco é totalmente público:** todas as tabelas principais permitem leitura, criação, edição e exclusão anônimas. Isso corresponde à decisão anterior de acesso livre, mas sete funções privilegiadas antigas continuam executáveis anonimamente e já não combinam com o fluxo atual.
- **Backend saudável:** banco, pool, memória, disco e consultas estão rápidos; a consulta mais lenta observada tem média abaixo de 4 ms. Não há motivo para aumentar infraestrutura ou criar índices agora.
- **Rotas principais funcionam:** dashboard, visitantes, discípulos, discipuladores, relatórios, mapa, administração e configurações renderizaram sem erro de console. O problema atual é estabilidade/arquitetura, não rota inexistente.

## Plano de implementação

### 1. Tornar o Mapbox permanente

- Vincular a conexão oficial do Mapbox ao projeto, com token público para o navegador.
- Substituir o token manual em `localStorage` pela variável pública injetada pela conexão.
- Remover a tela “Configurar Mapbox”, o campo de token e o botão “Trocar token”.
- Centralizar configuração, validação e mensagens de erro em um único módulo Mapbox.
- Criar um hook reutilizável para inicialização, resize e cleanup dos mapas; aplicar no mapa principal, formulário e detalhes.
- Tratar falhas de estilo/rede sem destruir o mapa durante o próprio evento de erro e mostrar uma ação de tentar novamente.
- Manter a geocodificação no navegador com o token público, validar `response.ok` e exibir falha clara quando o endereço não for encontrado.

### 2. Reduzir chamadas e renders duplicados

- Buscar os contadores uma vez no `AppLayout` e compartilhá-los entre sidebar desktop e navegação mobile.
- Trocar `select("*")` por colunas explícitas nas telas mais acessadas, sem mudar o comportamento.
- Corrigir hooks de contexto para cancelar/ignorar respostas antigas durante navegação rápida e sempre encerrar o estado de carregamento em erro.
- Remover reload completo em Relatórios e usar navegação interna, preservando estado e evitando reinicializar toda a aplicação.

### 3. Consolidar o modelo público de acesso

- Simplificar `AuthContext` para não consultar nem encerrar sessões no carregamento.
- Remover o `ProtectedRoute` passthrough, importações e páginas antigas de login/onboarding sem rota.
- Substituir a identidade “Visitante/Admin” por um contexto público explícito, mantendo as funcionalidades liberadas conforme solicitado.
- Ajustar notificações e campos de auditoria que ainda usam o UUID sintético para não fazer consultas ou gravações sem efeito.
- Manter `/` e `/login` redirecionando diretamente ao dashboard para compatibilidade com links antigos.

### 4. Limpar privilégios antigos do backend

- Preservar o acesso público às tabelas, conforme a decisão atual.
- Revogar de visitantes anônimos a execução das funções privilegiadas antigas ligadas a papéis e sessão, mantendo somente os acessos realmente necessários à rotina automática de atualização de status.
- Revisar a função automática antes da mudança para não interromper o processo diário.
- Rodar novamente o linter e validar CRUD público depois da migração.

### 5. Robustez e manutenção

- Dividir `MapaGCs.tsx` (945 linhas) em componentes focados: cards, mapa, formulário e painel lateral.
- Remover `any` e casts evitáveis nas áreas alteradas, usando os tipos gerados do banco.
- Padronizar mensagens de erro com o detalhe útil para diagnóstico, sem expor dados sensíveis.
- Remover importação duplicada do CSS do Mapbox e deixar uma única fonte.

## Validação final

- Testar todas as rotas principais em sequência e por URL direta, sem erros de console ou requisições duplicadas.
- Testar mapa em cards → mapa → formulário → detalhes → outra rota → retorno ao mapa.
- Confirmar que o mapa funciona em sessão limpa, sem `localStorage` e sem pedir token.
- Validar criação/edição de GC, geocodificação, marcadores e frequência.
- Comparar chamadas de rede antes/depois e confirmar uma única rodada de contadores por carregamento.
- Executar testes existentes e varredura de segurança após as mudanças.

## Observação de segurança

O acesso livre com edição e exclusão permite que qualquer visitante altere dados da igreja. O plano mantém essa decisão porque ela foi solicitada anteriormente; a correção limita apenas funções privilegiadas antigas e não restaura login.