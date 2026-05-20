## Diagnóstico

Toda vez que você abre o preview, o app cai em `/login` (a rota raiz `/` faz `Navigate` para `/login`). Como o login foi removido e a tela só tem um botão "Entrar" que leva para `/app/dashboard`, esse passo intermediário é hoje pura fricção — parece que "o preview não carrega", quando na verdade ele está esperando você clicar em **Entrar**.

Verificações feitas:
- Sem erros no console do preview.
- Dev server (Vite) subindo limpo, sem falhas de build.
- Rotas em `src/App.tsx`: `/` → redireciona para `/login`; `/login` renderiza a tela com o botão.
- `AppHeader.signOut` também manda de volta para `/login`, reforçando o loop visual.

## Plano

1. **`src/App.tsx`**
   - Trocar `<Navigate to="/login" replace />` na rota `/` por `<Navigate to="/app/dashboard" replace />`.
   - Manter a rota `/login` existindo (para não quebrar links antigos), mas ela passa a apenas redirecionar para `/app/dashboard`.

2. **`src/pages/Login.tsx`**
   - Substituir o conteúdo por um `<Navigate to="/app/dashboard" replace />` (componente passa a ser um redirect puro). Não há mais necessidade de tela intermediária.

3. **`src/components/AppHeader.tsx`**
   - O botão "Sair" hoje chama `signOut()` e navega para `/login`. Como não existe mais autenticação real e `/login` agora só redireciona, remover esse botão do header para evitar UX confusa (clicar em "Sair" e voltar imediatamente para o dashboard).

4. **Validação**
   - Abrir `/` no preview → deve cair direto em `/app/dashboard` sem flash da tela de login.
   - Abrir `/login` diretamente → também redireciona para `/app/dashboard`.
   - Conferir console e network para garantir que não há loop de redirect.

## Fora de escopo

- Não mexer em RLS, Supabase, nem nas rotas contextuais `/app/distrito/:id` e `/app/congregacao/:id` (já funcionam).
- Não restaurar autenticação — segue o modelo público atual.
