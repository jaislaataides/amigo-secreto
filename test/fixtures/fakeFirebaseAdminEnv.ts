/**
 * Credenciais FALSAS (geradas localmente, nunca associadas a nenhuma conta
 * ou projeto real) usadas só pra permitir importar api/_lib/firebaseAdmin.ts
 * durante os testes — ele inicializa o Admin SDK no carregamento do módulo,
 * então qualquer teste que (mesmo indiretamente) importe api/_lib/auth.ts
 * precisa de *algo* nessas env vars pra não quebrar o `import`.
 *
 * Nenhum teste deste projeto chama de verdade o Firebase/Google — essas
 * credenciais nunca autenticam nada. Isoladas aqui (em vez de dentro de
 * vitest.config.ts) só pra deixar claro, à primeira vista, que são lixo de
 * teste e não um segredo de verdade vazado no repositório.
 */
export const FAKE_FIREBASE_ADMIN_ENV = {
  FIREBASE_ADMIN_PROJECT_ID: "not-a-real-project",
  FIREBASE_ADMIN_CLIENT_EMAIL: "not-a-real-key@example.invalid",
  // Precisa ser um PEM/ASN.1 estruturalmente válido pro parser do Admin SDK
  // aceitar na inicialização — o conteúdo em si não protege nada real.
  FIREBASE_ADMIN_PRIVATE_KEY:
    "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtHuoeqUdIv32I\\nZ2ISnw8Re2XmGuTWl4MtlM1T8eItQR300brC6yE0EE+28FWb06FlzQliNvfHy3zO\\nmjt4yFSA9hCXHMAk8n8yRtf/VPyh2wgzRsfWPvvlZGw4QTSrKRNG8oT+rcq140b7\\nTZPigxBYDIuXqwM0NVnWfgeDauEghpjPTMVaeBoc5JQerbcbd4d18/qeYxwM67/c\\nUE/yaCxa1rCH5wr6CLDu6CJ80FYDI81LNopjcVvHiUQxI8NgmShHxKUYjFH/MxVf\\nQtxt+BizJ38/jQl8YRETdN1tpPc6FJaxaEueYXSgrxKHtU2Yfx2hybqbIW2nau4t\\nyOBlgE2zAgMBAAECggEAI06oxPQVO7sCKS2cjNuvwQr/rzxQ64sfD87HSZWNYVlk\\neKfFhTdbIDkraM3/R7aTtiVpAoTfZ/oSTDicZHfG9D47B/avIVnrox9bshFtLL11\\nILAQ1Zsm2JPwllCGI1pPOisAAMkFDK97rIkX3hyI2sxEM/yGvMEcv2gYtC66F13G\\nGlJdRsqsg73qom2p7+ZxqjFBD56uuNZBSu07R0JLJ7c2ZbHlID94cSaj2lKN92cZ\\n2xSSSA6zL6A3zGcZbMYWV/Mptb5bGA/3G6L1gzfTE4T7fENwpfDK8FNhY3eC3H4b\\ntP9l5INbyLlSe/PTw2gvRA4W5eHXymFQ8asuinx24QKBgQDcb+xlHKvNkrUGPhqt\\n8eKqHwc6sDRDmxvEGcA2R5PYuvZQ1KW0VDtpTOdsHGUhrcCxtxyOr199s5dz/b3s\\nw8iVUKTIuyiLpbK4+7EeU1CoJIia9tk/nmnpQimreB8H2yYh8P2IczA+5Ma/I3xN\\ns6Igkkhj78/1XTu2rQdN1dsrGwKBgQDJDNFZNZAr7uw0bP+93GMmzG4zVIDt1CAn\\n3bY/z5K9FMegOowFDYYEZMTSF4OtMLUsd9LIyFCgoOwxfIucivkyDNCwQc7c3Zla\\nNo7smrlmTbqbLAgVOiQIk51eCIF8OPOV07PBwMrGCB2WInu7/eqc1Le3DEuTtnRp\\nIP0FBrg5SQKBgAVomZxBf9Wja92jWHQ8IxuZd0vxVtbxz1SYbSbnyrDepXyGOyqZ\\nhnum72avq6uP39J8c67sjqM+7NBjwW01wI4pVGG4dd43SpNPWaEs2iXF/7QNqnbt\\nJBwdC3ixkdFXhy/+Abp/WQeyBU5bSIl/htLVxADvuWKDzxtEU5GNVbtRAoGBAI7C\\nk0UNS7pmhUMUwuRGQgGi1/2K26IFJnAodukIs+Gfh8C20gYkfC1SgI/OMqogFAXn\\nb70ywE3O9uiMz3XxGNH5V5ZQpFsg32u3ofVQSKXkO8VDltm71ypf5zaGQ6u5pP2W\\nveWuyE2mJZweEE6FFrsWMP3BtUjGHhMoYYHYK6hBAoGAN0yDoxAEdF/aS6UtAuYG\\nlKnYmtKU6yjwODxD2ycexmqiiKtsE63ziYqegARB/TDPpASu6ppkGjtXGVga22ad\\nAL4JJDSAJUtWFGMfD74LidYqT8shfySLiC62FGtQLuNtO2s0xzvbXK1+y+6ad0i0\\n000fARinPVMbI1J7+Uxzeaw=\\n-----END PRIVATE KEY-----\\n",
};
