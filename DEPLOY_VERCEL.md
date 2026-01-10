# Guia de Deploy na Vercel

Este guia descreve os passos para implantar o projeto **Concurseiro Pro** na plataforma Vercel.

## Pré-requisitos

1.  Uma conta na [Vercel](https://vercel.com/).
2.  O código do projeto salvo em um repositório Git (GitHub, GitLab ou Bitbucket).

## Passos para o Deploy

1.  **Acesse o Dashboard da Vercel**:
    - Faça login em sua conta e clique em **"Add New..."** > **"Project"**.

2.  **Importe o Repositório**:
    - Encontre o repositório `concurseiro-pro` (ou o nome que você definiu) na lista e clique em **"Import"**.

3.  **Configurações do Projeto**:
    - **Framework Preset**: A Vercel deve detectar automaticamente como **Vite**. Se não, selecione "Vite" manualmente.
    - **Root Directory**: Mantenha como `./` (raiz), a menos que tenha movido os arquivos.
    - **Build Command**: `vite build` (ou `npm run build`). A detecção automática costuma acertar (`vite build` ou `npm run build`).
    - **Output Directory**: `dist` (Padrão do Vite).

4.  **Variáveis de Ambiente (Environment Variables)**:
    - Antes de clicar em "Deploy", expanda a seção **"Environment Variables"**.
    - Adicione as variáveis presentes no seu arquivo `.env`:

    | Key (Nome) | Value (Valor) |
    | :--- | :--- |
    | `VITE_SUPABASE_URL` | *Sua URL do Supabase* |
    | `VITE_SUPABASE_ANON_KEY` | *Sua Chave Anon/Public do Supabase* |

    > **Nota**: Se você estiver utilizando funcionalidades de IA que dependam da `GEMINI_API_KEY` (conforme visto no `vite.config.ts`), adicione-a também:
    > `GEMINI_API_KEY` = *Sua chave da API do Google Gemini*

5.  **Finalizar**:
    - Clique em **"Deploy"**.
    - Aguarde o processo de build terminar. Se tudo der certo, você verá a tela de "Congratulations!".

## Configurações Adcionais

- **Arquivo `vercel.json`**: Foi criado um arquivo na raiz do projeto para garantir que o roteamento (SPA) funcione corretamente (redirecionando todas as rotas para `index.html`), evitando erros de 404 ao atualizar a página em rotas internas.

## Webhooks e Edge Functions

Seu projeto utiliza Supabase Edge Functions (ex: `kiwify-webhook`).
- As Edge Functions rodam no Supabase, não na Vercel.
- Lembre-se de fazer o deploy delas separadamente via CLI do Supabase:
  ```bash
  supabase functions deploy kiwify-webhook
  ```
- No painel da Kiwify, a URL do webhook continuará apontando para o Supabase, não para o front-end na Vercel.
