# 🎁 Amigo Secreto

App de amigo secreto: organizadores aprovados criam parties (regras, categorias,
faixa de valor, itens proibidos), convidam participantes, que confirmam presença,
escolhem categorias de presente e adicionam links de referência. O sorteio
respeita exclusões (pares/grupos que não podem se tirar) e o resultado de cada
pessoa fica cifrado — só ela consegue ver quem tirou, através de um link pessoal
com duas provas de identidade.

## Stack

- **Front-end**: React + Vite + TypeScript, hospedado na Vercel.
- **Backend**: Vercel Serverless Functions (`api/`) — não Firebase Cloud
  Functions, de propósito: isso mantém o Firebase inteiro no plano gratuito
  Spark (Auth + Firestore + Storage), sem precisar de cartão de crédito.
- **Criptografia**: envelope encryption (AES-256-GCM) para o resultado do
  sorteio, com a chave mestra guardada como variável de ambiente da Vercel.
- **E-mail**: Resend, com templates em React Email.
- **Retenção**: parties sorteadas são excluídas automaticamente 15 dias depois
  (Firestore + Storage), via cron job diário.

Detalhes completos da arquitetura e das decisões de design estão no plano
original da implementação.

## Setup

Veja [`docs/RUNBOOK.md`](docs/RUNBOOK.md) para o passo a passo completo
(criar o projeto Firebase, gerar segredos, configurar a Vercel e o Resend,
virar o primeiro admin).

## Desenvolvimento

```bash
npm install
npm run dev          # front-end (Vite)
npm run typecheck
npm run test
```

Para rodar as API routes localmente também, use `vercel dev` (ver RUNBOOK).

## Estrutura

```
src/        front-end React (rotas, auth, features por papel)
api/        Vercel Serverless Functions (lógica de servidor)
shared/     tipos TypeScript compartilhados entre front-end e API
scripts/    scripts locais (bootstrap do primeiro admin, seed de categorias)
docs/       runbook operacional
```
