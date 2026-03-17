

# Tela de Seleção de Papel no Primeiro Acesso

## Contexto
Atualmente, todo novo usuário é criado automaticamente como `lider_congregacao`. O pedido é que no primeiro login, o usuário possa escolher seu tipo de acesso entre os 3 papéis disponíveis: **Rede (Admin)**, **Líder de Distrito** e **Líder de Congregação**.

## Abordagem de UI
Em vez de 3 telas separadas, a melhor abordagem é uma **tela intermediária com 3 cards clicáveis** — limpa, clara e sem navegação extra. Aparece apenas no primeiro acesso (quando o perfil ainda não existe no banco).

```text
┌─────────────────────────────────────┐
│           Logo Makir                │
│        CRM Eclesiástico             │
│                                     │
│   Qual é o seu nível de acesso?     │
│                                     │
│  ┌───────────┐  ┌───────────────┐   │
│  │  🌐 Rede  │  │ 📍 Líder de   │   │
│  │  (Admin)  │  │   Distrito    │   │
│  └───────────┘  └───────────────┘   │
│        ┌───────────────────┐        │
│        │ ⛪ Líder de       │        │
│        │   Congregação     │        │
│        └───────────────────┘        │
│                                     │
│        [ Continuar → ]              │
└─────────────────────────────────────┘
```

## Fluxo
1. Usuário faz login com Google
2. `AuthContext` verifica se o perfil existe na tabela `users`
3. **Se não existe** → redireciona para `/app/selecionar-acesso`
4. Usuário escolhe o papel → perfil é criado com o `tipo_acesso` escolhido
5. Redireciona para `/app/dashboard`

## Mudanças

### 1. Nova página `src/pages/SelecionarAcesso.tsx`
- 3 cards com ícones (Globe, MapPin, Church) e descrição curta de cada papel
- Estado local para a seleção
- Botão "Continuar" que cria o perfil na tabela `users` com o papel escolhido
- Após sucesso, chama `refreshProfile()` e redireciona para `/app/dashboard`

### 2. `src/contexts/AuthContext.tsx`
- Alterar `fetchOrCreateProfile` para **apenas buscar** o perfil (não criar automaticamente)
- Renomear internamente para `fetchProfile`
- Adicionar flag `needsOnboarding` ao contexto: `true` quando há sessão mas perfil é `null` (e não é erro de rede)
- Expor `createProfile(tipoAcesso)` no contexto para a página de seleção usar

### 3. `src/components/ProtectedRoute.tsx`
- Se `needsOnboarding === true`, redirecionar para `/app/selecionar-acesso` em vez de mostrar erro
- A rota `/app/selecionar-acesso` fica acessível apenas para usuários autenticados sem perfil

### 4. `src/App.tsx`
- Adicionar rota `/app/selecionar-acesso` dentro do bloco protegido, mas com guard especial (requer sessão, não requer perfil)

### Sem mudanças no banco de dados
A tabela `users` já suporta os 3 valores de `tipo_acesso_enum`. Nenhuma migration necessária.

