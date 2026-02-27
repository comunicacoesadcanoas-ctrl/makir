
Objetivo imediato: eliminar de forma definitiva a tela errada para usuários já liberados e fechar os furos do fluxo de acesso, depois elevar UX/UI/animações/código sem quebrar regras atuais.

1) Correção crítica do fluxo de acesso (primeiro bloco)
- Em `src/pages/SelecionarAcesso.tsx`:
  - Bloquear renderização enquanto `loading` do auth estiver `true` (spinner/skeleton).
  - Se não houver sessão: redirecionar para `/login`.
  - Se `profile?.status === "aprovado"`: sempre renderizar layout de 2 cards.
  - Se `profile?.status === "pendente"`: redirecionar `/aguardando-aprovacao`.
  - Se `profile?.status === "rejeitado"`: redirecionar `/acesso-negado`.
  - Se `profile` for `null` após loading: renderizar layout “novo usuário”.
- Em `src/contexts/AuthContext.tsx`:
  - Fortalecer sincronização de perfil no login (evitar estado transitório que mostra tela errada).
  - Adicionar refresh de perfil em foco da aba/retorno à app para refletir aprovações administrativas em tempo real de uso.
- Em `src/App.tsx`:
  - Garantir que `/selecionar-acesso` passe por guarda de sessão (usuário logado obrigatório).

2) Fechar “furo” de solicitação de outro acesso (hoje é só toast)
- Criar migração no banco (Lovable Cloud):
  - Nova tabela `solicitacoes_acesso`:
    - `id`, `user_id`, `acesso_atual`, `acesso_solicitado`, `status` (`pendente|aprovado|rejeitado`), `observacao`, `criado_em`, `avaliado_em`, `avaliado_por`.
  - Regras de segurança:
    - Usuário autenticado cria solicitação própria.
    - Usuário vê apenas suas solicitações.
    - Perfil `rede` vê/atualiza todas.
  - Índice único para impedir duplicadas pendentes (`user_id + acesso_solicitado + status='pendente'`).
- Em `SelecionarAcesso.tsx`:
  - Trocar `handleRequestOther` fake por insert real.
  - Exibir estado do pedido (pendente/aprovado/rejeitado) e desabilitar botão quando já houver pendência para o mesmo acesso.

3) Administração completa dessas solicitações
- Em `src/pages/Admin.tsx`:
  - Adicionar aba “Solicitações de Acesso”.
  - Listar pedidos pendentes com ações Aprovar/Rejeitar.
  - Ao aprovar:
    - Atualizar `users.tipo_acesso` (modelo atual de acesso único).
    - Marcar solicitação como aprovada.
  - Ao rejeitar:
    - Marcar solicitação como rejeitada com motivo opcional.
  - Recarregar dados com feedback visual.

4) UX/UI (alto impacto, baixo risco)
- Hierarquia visual clara em `SelecionarAcesso`:
  - Card “Seu acesso atual” sempre primeiro, com badge e CTA principal.
  - Card “Solicitar outro acesso” com labels de status e estados vazios.
- Acessibilidade:
  - Estados de foco visíveis, `aria-pressed` nos cards selecionáveis, mensagens de erro/sucesso consistentes.
- Feedback:
  - Toasters padronizados para sucesso/erro/carregando.
  - Skeleton de carregamento no lugar de “piscar” de layout incorreto.

5) Animações (discretas e funcionais)
- Entrada dos cards com `framer-motion` (`fade + slight slide`).
- Transições de seleção dos cards (border/background) com duração curta (150–220ms).
- Evitar animações pesadas para não degradar percepção de performance.

6) Código/arquitetura (sem furo)
- Extrair regra de decisão de rota para utilitário único (ex.: `resolveUserLandingRoute(profile)`), reutilizado em `Login`, `ProtectedRoute`, `SelecionarAcesso`.
- Extrair `AccessOptionCard` reutilizável para reduzir duplicação.
- Criar hook dedicado (`useAccessRequests`) para queries/mutations de solicitações.
- Garantir tipagem forte dos status e acessos (sem strings soltas espalhadas).

7) Validação end-to-end obrigatória (antes de concluir)
- Cenários:
  - Usuário novo sem perfil.
  - Usuário pendente.
  - Usuário rejeitado.
  - Usuário aprovado (`recepcao`, `discipulador`, `rede`).
  - Usuário aprovado solicitando troca/acesso adicional.
  - Admin aprovando/rejeitando solicitação.
- Validar desktop + mobile e recarga de página em `/selecionar-acesso` sem regressão.

Detalhes técnicos (objetivos)
- Sintoma atual: código do layout de 2 cards existe, porém o fluxo ainda permite cair na versão de “novo usuário” em cenários reais.
- Estratégia de robustez: proteger render por estado de autenticação carregado + centralizar decisão de rota + persistir solicitação “outro acesso” no backend.
- Resultado esperado: usuário já liberado nunca mais vê tela de solicitação inicial; fluxo administrativo e de troca de acesso passa a ser real, auditável e consistente.
