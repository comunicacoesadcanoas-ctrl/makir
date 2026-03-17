

# Aprovação Obrigatória pelo Admin para Novos Usuários

## Situação Atual
A tabela `users` já possui o campo `status` com enum `pendente | aprovado | rejeitado`, mas o default é `'aprovado'` — ou seja, novos usuários entram direto sem aprovação. O Admin já tem uma aba "Pendentes" na página `/app/admin` para aprovar/rejeitar.

## Plano

### 1. Migration: Alterar default do status para `'pendente'`
```sql
ALTER TABLE public.users ALTER COLUMN status SET DEFAULT 'pendente';
```
Isso garante que todo novo perfil criado via `createProfile()` nasce como pendente.

### 2. Criar página `AguardandoAprovacao.tsx`
Tela simples exibida quando o perfil existe mas `status !== 'aprovado'`:
- Logo Makir + mensagem "Seu cadastro está aguardando aprovação do administrador"
- Se `status === 'rejeitado'`, mostrar mensagem diferente ("Seu acesso foi negado")
- Botão de logout
- Botão "Verificar novamente" que chama `refreshProfile()`

### 3. Atualizar `ProtectedRoute.tsx`
Adicionar check entre os passos 3 e 4 atuais:
- Se `profile.status === 'pendente'` ou `'rejeitado'`, redirecionar para `/app/aguardando-aprovacao`
- A rota `/app/aguardando-aprovacao` fica acessível para qualquer usuário autenticado com perfil

### 4. Atualizar `App.tsx`
Registrar rota `/app/aguardando-aprovacao` (fora do AppLayout, como a tela de seleção de acesso).

### 5. Notificação ao Admin (opcional mas recomendado)
No `createProfile()`, após inserir o perfil, inserir uma notificação na tabela `notificacoes` para todos os usuários com `tipo_acesso = 'rede'`, avisando que há um novo usuário aguardando aprovação.

### Sem mudanças no painel Admin
A aba "Pendentes" já existe e funciona — o admin já pode aprovar/rejeitar usuários por ali.

### Fluxo resultante
```text
Login Google → Selecionar Acesso → Perfil criado (status=pendente)
  → Tela "Aguardando Aprovação"
  → Admin aprova no painel
  → Usuário clica "Verificar" ou recarrega → Dashboard
```

