# Painel Pix — PropixBR

Um único `index.html` (admin + página do cliente, dependendo se a URL
tem `?id=...` ou não) + uma function (`netlify/functions/create-pix.js`)
que fala com a API da PropixBR no servidor.

## Por que precisa da function desta vez

A API da PropixBR não libera chamadas feitas direto do navegador
(sem CORS) — por isso travava em "Gerando..." pra sempre. A function
resolve isso porque a chamada sai do servidor da Netlify, não do
navegador da pessoa.

## Por que não dá pra usar o Netlify Drop

O Netlify Drop (arrastar e soltar em app.netlify.com/drop) só publica
arquivos estáticos — ele não empacota a pasta `netlify/functions`.
Por isso, mesmo colocando a function na pasta, ela não vai pro ar.

O jeito mais simples **sem usar terminal** é conectar o projeto a um
repositório no GitHub — a Netlify builda e detecta a function sozinha.

## Passo a passo (GitHub, sem terminal)

1. Crie uma conta gratuita em [github.com](https://github.com) se
   ainda não tiver.
2. Clique em **New repository**, dê um nome (ex: `painel-pix`), deixe
   como **Private**, e clique em **Create repository**.
3. Na página do repositório vazio, clique em **uploading an existing
   file** (ou "Add file → Upload files").
4. Arraste todos os arquivos desta pasta (`index.html`, `netlify.toml`,
   `.gitignore`, e a pasta `netlify` inteira com o arquivo dentro de
   `netlify/functions/create-pix.js`) e clique em **Commit changes**.

   > Atenção: o GitHub às vezes não deixa arrastar uma pasta vazia de
   > forma direta — se a pasta `netlify/functions` não aparecer
   > inteira, arraste o arquivo `create-pix.js` e o GitHub cria o
   > caminho `netlify/functions/create-pix.js` sozinho.

5. Vá em [app.netlify.com](https://app.netlify.com) → **Add new site
   → Import an existing project → Deploy with GitHub**, autorize o
   acesso e escolha o repositório `painel-pix`.
6. Configurações de build: pode deixar **Build command em branco** e
   **Publish directory** como `.` (ponto). Clique em **Deploy**.
7. Depois do primeiro deploy, vá em **Site configuration →
   Environment variables** e adicione:

   | Key | Value |
   |---|---|
   | `PROPIXBR_API_URL` | `https://api.propixbr.com` |
   | `PROPIXBR_CLIENT_ID` | Seu client ID (`live_...`) |
   | `PROPIXBR_CLIENT_SECRET` | Seu client secret (`sk_...`) |

8. Vá em **Deploys → Trigger deploy → Deploy site** para as variáveis
   entrarem em vigor.
9. Confira se a function subiu: no menu lateral do site deve aparecer
   uma seção **Functions** listando `create-pix`. Se aparecer, é sinal
   de que foi publicada de verdade (diferente do que aconteceu com o
   Netlify Drop).
10. Abra o site, preencha o formulário e clique em **Gerar Pix**.

Para desenvolvimento local, configure as credenciais no arquivo `.env`
(ele é ignorado pelo Git). No site publicado, cadastre os valores como
variáveis de ambiente da Netlify; o `.env` local não é enviado no deploy.
Nunca coloque credenciais no `index.html` nem as envie ao repositório.

## Atualizações depois

Sempre que eu (ou você) editar `index.html` ou `create-pix.js`, é só
subir o arquivo atualizado de novo no GitHub (Add file → Upload files
→ substitui o existente) — a Netlify redeploya sozinha a cada commit.

## Cuidado

O domínio `propixbr.com` é muito novo (poucos meses de registro) e
sem histórico público. Antes de processar pagamentos reais e CPFs de
clientes por essa API, vale confirmar que é um provedor de pagamento
Pix legítimo e autorizado.
