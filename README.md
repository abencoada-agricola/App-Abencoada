# App Abençoada

Aplicativo Android para abastecimentos, transferências, ocorrências e checklists, com painel web de gestão.

- [Painel web](https://abencoada-agricola.github.io/App-Abencoada/)
- [Baixar APK Android](https://github.com/abencoada-agricola/App-Abencoada/releases/latest/download/abencoada.apk)
- [Documentação da API](https://gmaiserp-api.gmais-sistemas.com.br/docs)

## Ambiente oficial

| Configuração | Valor |
| --- | --- |
| Backend do site e do Android | API REST v1 |
| URL base | https://gmaiserp-api.gmais-sistemas.com.br |
| Prefixo das rotas | /api/v1 |
| Banco SQL Server definido para o aplicativo | APP_ABENCOADA |
| Hospedagem e conexão ao SQL Server | Administradas pelo provedor da API |
| Repositório | abencoada-agricola/App-Abencoada |

O fluxo de acesso é **Android ou site → API HTTPS → APP_ABENCOADA**. A API é responsável pela autenticação, pelas permissões e pela persistência dos dados. A configuração da conexão SQL fica com o provedor.

O ambiente adotado para as próximas versões é a API acima. Os arquivos de Supabase e do backend SQL local permanecem como histórico e suporte aos testes existentes. A configuração pública atual seleciona api-v1. As bases anteriores aguardam a conclusão da migração e a decisão de desativação do responsável.

## Login e permissões

O aplicativo e o painel usam POST /api/v1/auth/login com o usuário e a senha cadastrados na API. O serviço devolve o token da sessão e o perfil do usuário. O bootstrap carrega frotas, locais, materiais, regras e modelos de checklist.

A equipe responsável pela API administra os acessos. Credenciais SQL e credenciais do aplicativo têm funções distintas. Senhas, tokens, chaves de assinatura e arquivos de conexão protegida devem permanecer fora do repositório.

## CORS

As seguintes origens foram verificadas em 26/11/2026 com preflight autorizado para login e bootstrap.

| Cliente | Origem |
| --- | --- |
| Site publicado | https://abencoada-agricola.github.io |
| Android de produção, com Capacitor | https://localhost |

O CORS usa a origem, composta de protocolo, domínio e porta, sem o caminho /App-Abencoada/. O provedor precisa permitir os métodos usados pelo contrato e os cabeçalhos Authorization e Content-Type.

O endereço local http://127.0.0.1:4173 depende de liberação própria para testar a API pelo navegador. A variante sqlEmulator usa http://localhost e depende de uma liberação diferente. O APK publicado usa https://localhost.

## Build local

Use Node.js 22 ou posterior. Para Android, configure JDK 21 e o Android SDK.

Execute os comandos na raiz do repositório.

```powershell
npm ci
$env:APP_BACKEND='api-v1'
$env:API_V1_URL='https://gmaiserp-api.gmais-sistemas.com.br'
$env:REQUIRE_HTTPS='true'
npm test
npm run build
npm run android:sync
```

O site é gerado em dist e a interface embarcada do Android em mobile-dist. A URL base é informada sem /docs e sem /api/v1. Os scripts acrescentam os caminhos de cada rota.

Para compilar localmente no caminho com acento, execute na pasta android.

```powershell
./gradlew.bat assembleDebug '-Pandroid.overridePathCheck=true'
```

As versões de distribuição são geradas pelo workflow assinado do GitHub. A numeração é definida por app-version.json e scripts/app-version.mjs. O nome exibido e o versionCode devem crescer sem usar os dígitos 1 ou 3.

## Publicação

O push na branch main executa a suíte de testes e publica o site pelo workflow pages.yml. Alterações de código do Android e dos arquivos monitorados executam android.yml, que gera o APK assinado e publica o download em Releases.

Os workflows adotam api-v1 e a URL pública por padrão. Caso existam variáveis do repositório, APP_BACKEND deve ser api-v1 e API_V1_URL deve apontar para a URL base oficial. REQUIRE_HTTPS é ativado nos builds publicados.

Uma atualização somente de documentação mantém o APK já publicado quando nenhum dos arquivos monitorados pelo workflow Android é alterado.

## Verificações realizadas

Em 26/11/2026, o site publicado efetuou login e carregou o painel pela API. O APK oficial 2.0.79 foi instalado como atualização no emulador, efetuou login e exibiu CONECTADO. Os testes preservaram os dados locais. A suíte completa do cliente passou antes da publicação.

A validação confirmou autenticação e consultas. O aceite de gravações reais, a equivalência completa com a base anterior e a integração dos cadastros do GMAIS continuam dependendo de homologação específica.

Frente de Trabalho já está preparada no cliente. A documentação pública recebida ainda precisa incorporar a consulta de frentes por código e nome e confirmar o suporte ao campo no envio de abastecimentos.

## Preservação de registros offline

Mantenha rascunhos, registros pendentes e recibos ao atualizar o aplicativo. A troca de backend verifica a origem dos dados e pode bloquear o acesso para preservar uma fila antiga. Conclua a sincronização pelo ambiente original ou trate a pendência com o responsável antes de continuar.

## Documentação técnica

- [Integração API v1](docs/api-v1/README.md)
- [Histórico de mudanças](docs/changes.md)
- [Desenvolvimento e validações](docs/development.md)
