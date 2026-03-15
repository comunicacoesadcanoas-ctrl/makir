

# Implementar Estrutura de Distritos e Congregações

## O que será feito

1. **Migração de banco de dados** — Criar tabelas `distritos` e `congregacoes`, adicionar coluna `congregacao_id` nas tabelas `users`, `visitantes` e `discipulos`, criar função auxiliar `get_user_congregacao_id()`, e atualizar RLS para filtrar por congregação (exceto rede que vê tudo).

2. **Popular dados iniciais** — Inserir os 11 distritos e 30 congregações conforme fornecido:
   - Distrito 1 (Mathias Velho): 6 congregações
   - Distrito 3 (Vila Cerne): 2 congregações
   - Distrito 4 (Getúlio Vargas): 1 congregação
   - Distrito 5 (Antena): 2 congregações
   - Distrito 6 (São Sepé): 2 congregações
   - Distrito 7 (Maria Isabel): 3 congregações
   - Distrito 8 (São Pedro): 3 congregações
   - Distrito 9 (Fátima): 3 congregações
   - Distrito 10 (Primavera): 2 congregações
   - Distrito 11 (Via do Parque): 2 congregações
   - Distrito 12 (Arambaré): 1 congregação

3. **Aba Admin "Distritos & Congregações"** — Nova aba no painel admin para visualizar, adicionar e editar distritos e congregações, e atribuir congregação a usuários.

4. **Atualizar formulários** — Visitantes e discípulos recebem `congregacao_id` automaticamente do usuário logado. Usuários "rede" podem escolher a congregação via dropdown.

5. **Atualizar RLS** — Recepcão e discipulador veem apenas dados da sua congregação. Rede continua vendo tudo. GCs ficam fora (sem alteração).

## Detalhes Técnicos

### Migração SQL
```sql
-- Tabelas novas
CREATE TABLE distritos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), numero int, nome text NOT NULL, criado_em timestamptz DEFAULT now());
CREATE TABLE congregacoes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), distrito_id uuid REFERENCES distritos(id), nome text NOT NULL, criado_em timestamptz DEFAULT now());

-- Colunas novas (nullable para não quebrar dados existentes)
ALTER TABLE users ADD COLUMN congregacao_id uuid REFERENCES congregacoes(id);
ALTER TABLE visitantes ADD COLUMN congregacao_id uuid REFERENCES congregacoes(id);
ALTER TABLE discipulos ADD COLUMN congregacao_id uuid REFERENCES congregacoes(id);

-- Função auxiliar SECURITY DEFINER
CREATE FUNCTION get_user_congregacao_id() RETURNS uuid ...

-- RLS nas novas tabelas e atualização das existentes
```

### Arquivos modificados
- `src/pages/Admin.tsx` — nova aba Distritos & Congregações
- `src/components/VisitanteFormDialog.tsx` — auto-preencher e dropdown congregação
- `src/components/NovoDiscipuloDialog.tsx` — idem
- `src/components/NovoDiscipuladorDialog.tsx` — campo congregação
- `src/pages/Visitantes.tsx` — filtro por congregação para rede
- `src/pages/Discipulos.tsx` — filtro por congregação para rede
- `src/contexts/AuthContext.tsx` — expor congregacao_id no profile

