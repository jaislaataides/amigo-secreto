# Runbook — Amigo Secreto

Guia operacional: setup inicial, segredos, deploy e manutenção.

## 1. Pré-requisitos

- Node 20+
- Uma conta Google pra criar o projeto Firebase (fica no plano **Spark**, gratuito — nunca precisa virar Blaze)
- Uma conta Vercel (plano Hobby, gratuito)
- Uma conta [Resend](https://resend.com) (free tier)

## 2. Criar o projeto Firebase

1. [console.firebase.google.com](https://console.firebase.google.com) → criar projeto novo.
2. **Authentication** → Sign-in method → ativar **Google**.
3. **Firestore Database** → criar banco (modo produção, escolha a região mais próxima dos usuários).
4. Em **Project settings → General**, copie `projectId`, e em **Web apps** registre um app web pra pegar o resto da config (`apiKey`, `authDomain`, `appId`, `messagingSenderId`) — isso vai nas variáveis `VITE_FIREBASE_*`.
5. Em **Project settings → Service accounts**, clique em "Generate new private key" — baixa um JSON com `project_id`, `client_email` e `private_key`. Esses três valores vão em `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` e `FIREBASE_ADMIN_PRIVATE_KEY` (mantenha os `\n` literais da private key — o código já faz o replace pra quebra de linha real).

**Nota sobre o Firebase Storage**: o Google passou a exigir o plano pago Blaze pra usar o Storage, mesmo gratuitamente — por isso este app **não usa Firebase Storage**. A imagem de capa da party é comprimida no navegador e guardada como um thumbnail pequeno (data URI) direto no documento da party no Firestore (ver `api/_lib/image.ts`), sem precisar de nenhum serviço extra nem cartão de crédito.

## 3. Gerar os segredos do app

```bash
# KEK mestra (envelope encryption)
openssl rand -base64 32   # -> MASTER_KEK_BASE64

# Segredo dos endpoints de cron
openssl rand -hex 32      # -> CRON_SECRET
```

Guarde os dois com cuidado — principalmente a KEK: perdê-la torna **todos** os sorteios já realizados irrecuperáveis (não há como decifrar nenhum assignment sem ela).

## 4. Resend

1. Crie uma conta em resend.com e gere uma API key → `RESEND_API_KEY`.
2. Sem domínio verificado, o Resend funciona em **modo sandbox**: só envia e-mails para o endereço da sua própria conta — suficiente pra testar o fluxo inteiro sozinho antes de convidar qualquer um.
3. Pra produção, ver seção 8.

## 5. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha tudo. As mesmas variáveis precisam existir no painel da Vercel (**Project Settings → Environment Variables**) — marque `FIREBASE_ADMIN_PRIVATE_KEY`, `MASTER_KEK_BASE64`, `RESEND_API_KEY` e `CRON_SECRET` como **Sensitive**.

`APP_BASE_URL` é a URL pública do deploy (ex: `https://seu-app.vercel.app`) — usada só pra montar os links dos e-mails.

## 6. Publicar as regras do Firestore

Mais simples direto pelo console, sem precisar instalar nada:

1. No Firebase Console → **Firestore Database → Regras**, cole o conteúdo de `firestore.rules` e clique em **Publicar**.
2. (Opcional, via CLI, se preferir): `npm install -g firebase-tools && firebase login && firebase use --add && firebase deploy --only firestore:rules,firestore:indexes`.

## 7. Popular dados iniciais

```bash
npm run seed-categories
```

Cria as 5 categorias base (`livre`, `acessorios`, `vestimentas`, `objetos`, `decoracoes`) em `platformCategories`.

## 8. Deploy na Vercel

1. Conecte o repositório no painel da Vercel (ou rode `vercel` localmente).
2. Confirme que as env vars da seção 5 estão todas configuradas lá.
3. Deploy. O `vercel.json` já declara os 3 cron jobs (lembretes, retry de e-mail, limpeza de parties antigas) — todos 1x/dia, respeitando o limite do plano Hobby.
4. No **Firebase Console → Authentication → Settings → Authorized domains**, adicione o domínio de produção da Vercel. Sem isso o login com Google falha.

## 9. Virar o primeiro admin

1. Acesse o app com a conta Google que você quer que seja admin, e faça login pelo menos uma vez (basta logar, não precisa fazer mais nada).
2. Rode localmente, apontando para o projeto certo (`.env.local` preenchido):
   ```bash
   npm run bootstrap-admin -- seu-email@gmail.com
   ```
3. Peça pra essa pessoa recarregar a página — o painel `/admin` já deve aparecer.
4. Dali em diante, owners são aprovados pelo próprio painel `/admin` (sem precisar deste script de novo).

## 10. Configurar domínio no Resend (produção)

Enquanto isso não é feito, o Resend só envia pro e-mail da sua própria conta (modo sandbox) — ok pra testar, não pra convidar participantes de verdade.

1. No painel do Resend, adicione um **subdomínio dedicado** (ex: `mail.seudominio.com`) — não o domínio raiz, pra isolar a reputação de envio.
2. Adicione os registros DNS que o Resend indicar: **SPF** (`TXT`) e **DKIM** (`CNAME`, geralmente 3 registros).
3. Aguarde o status "Verified" no painel.
4. Adicione um registro **DMARC** (`TXT` em `_dmarc.mail.seudominio.com`), política inicial `p=quarantine`.
5. Atualize `MAIL_FROM` para usar o domínio verificado (ex: `Amigo Secreto <convites@mail.seudominio.com>`).

## 11. Rodando localmente

```bash
npm run dev
```

Isso sobe só o front-end (Vite). Pra testar as API routes (`/api/...`) localmente também, use a CLI da Vercel:

```bash
npm install -g vercel
vercel dev
```

(`vite.config.ts` já faz proxy de `/api/*` pra `http://localhost:3000`, onde o `vercel dev` roda por padrão — então `npm run dev` sozinho também funciona pra telas que não chamam a API.)

Pra testar Auth/Firestore sem tocar no projeto real, rode o Firebase Emulator Suite (`firebase emulators:start`) e defina `VITE_USE_FIREBASE_EMULATORS=true` no `.env.local`.

## 12. Rotação da KEK (manutenção, raramente necessário)

A KEK mestra nunca deveria precisar rotacionar no uso normal. Se precisar (ex: suspeita de vazamento):

1. Gere uma nova KEK (`openssl rand -base64 32`).
2. Escreva um script local (fora do fluxo da aplicação) que, pra cada party: lê `dekMeta/current`, desembrulha a DEK com a KEK **antiga**, reembrulha com a KEK **nova**, grava de volta.
3. Só depois de reembrulhar todas as parties existentes, troque `MASTER_KEK_BASE64` na Vercel e remova a KEK antiga de qualquer lugar que a guarde.

## 13. Nota sobre `npm audit`

`npm audit` reporta algumas vulnerabilidades (`tar`, `tinypool`) que vêm de dependências de **desenvolvimento** (Vitest/esbuild) — nunca entram no bundle do front-end nem no runtime das API routes na Vercel. As dependências de produção (`firebase`, `firebase-admin`, `resend`, `cheerio`, etc.) são mantidas sem vulnerabilidades altas/críticas conhecidas (ver `package.json` → campo `overrides` pra o pin do `@grpc/grpc-js`).
