

## Problema

Quando um usuário aprovado (ex: `comunicacoesadcanoas@gmail.com` com acesso `rede`) chega em `/selecionar-acesso`, ele vê a mesma tela de novos usuários -- precisa selecionar um perfil e clicar "Entrar". Isso é confuso e desnecessário.

## Solução: Tela dividida em 2 cards

Para usuários aprovados, a tela será completamente diferente:

```text
┌─────────────────────────────────────┐
│  Bem-vindo, Admin Canoas            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ✅ SEU ACESSO ATUAL           │  │
│  │                               │  │
│  │  🌐 Acesso 03 — Rede         │  │
│  │  Gestão completa da rede     │  │
│  │                               │  │
│  │  [ Entrar no sistema →   ]   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 📋 SOLICITAR OUTRO ACESSO    │  │
│  │                               │  │
│  │  ○ Recepção                  │  │
│  │  ○ Discipulador              │  │
│  │                               │  │
│  │  [ Solicitar acesso ]        │  │
│  └───────────────────────────────┘  │
│                                     │
│        Sair                         │
└─────────────────────────────────────┘
```

Para usuários **sem perfil** (novos), a tela permanece como está hoje.

## Alterações em `src/pages/SelecionarAcesso.tsx`

1. **Renderização condicional**: Se `jaTemAcesso`, renderiza o layout de 2 cards. Senão, mantém o layout atual para novos usuários.

2. **Card 1 -- "Seu acesso atual"**:
   - Mostra o tipo de acesso atual do perfil (`profile.tipo_acesso`) com ícone e descrição.
   - Badge verde indicando "Ativo".
   - Botão primário destacado "Entrar no sistema" que navega direto para `/app`.

3. **Card 2 -- "Solicitar outro acesso"**:
   - Lista apenas os tipos de acesso que o usuário **ainda não tem**.
   - Seleção + botão "Solicitar acesso" (funcionalidade futura -- por enquanto exibe toast informativo de que a solicitação foi enviada, já que a tabela `users` só suporta um `tipo_acesso`).

4. **Saudação personalizada**: Exibe o nome do usuário no topo (ex: "Bem-vindo, Admin Canoas").

## Detalhes técnicos

- Filtrar `accessOptions` para separar o acesso atual dos demais usando `profile.tipo_acesso`.
- O botão "Entrar" no Card 1 não precisa de seleção -- navega direto.
- O Card 2 usa `toast.info()` para informar que a solicitação foi registrada (sem inserção real, pois o schema atual só permite um tipo por usuário).
- Manter o layout atual intacto para o caso `!jaTemAcesso` (novos usuários).

