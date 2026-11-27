## 2026-11-27 — Frente de Trabalho pelo cadastro do GMAIS

O usuário indicou como origem https://gmaisagro.gmais-sistemas.com.br/operacionais/agricola/prestacao-servicos/local-servico e informou que esses dados ficam no banco do site GMAIS, separado do APP_ABENCOADA, no mesmo servidor. O mapeamento da origem fica com o responsável pela API. Nome do banco, esquema, tabela/view e campos ainda precisam ser confirmados; o caminho da tela não comprova nomes SQL.

Fluxo requerido: banco GMAIS → consulta autorizada somente para leitura na API → catálogo de códigos e descrições no app → frente selecionada associada ao abastecimento no APP_ABENCOADA.

Requisitos:
- Confirmar banco, tabela/view, identificador, código, descrição, empresa/filial e situação dos cadastros.
- Fornecer catálogo autenticado na API, por rota documentada ou pelo bootstrap, respeitando o acesso de cada conta.
- Adaptar o app para selecionar código/descrição e manter catálogo offline, preservando pendências.
- Guardar a identificação externa e a descrição histórica no banco do app e retorná-las nos detalhes e relatórios.
- Manter compatibilidade com registros antigos, comandos de reenvio e recibos. A extensão textual work_front atual não define essa integração de catálogo.

Situação: consulta entre bancos, catálogo na API e seleção no app ainda não implementados nem homologados. Dependem do mapeamento e do código/processo de publicação da API hospedada. Nenhum banco GMAIS foi consultado ou alterado nesta definição.

## Situação atual — 26/11/2026

A API oficial é https://gmaiserp-api.gmais-sistemas.com.br, no modo api-v1. O banco definido é APP_ABENCOADA e a conexão SQL é responsabilidade do provedor. O site e o APK oficial 2.0.79 tiveram autenticação e consultas verificadas. As origens do site e https://localhost responderam com CORS autorizado. Consulte o README da raiz para a configuração atual. Os relatos de preparação e bloqueios abaixo registram estados anteriores.
# Integração com a API do Luiz — preparação de 24/11/2026

O cliente Android e o painel têm um modo `api-v1`, preparado a partir do OpenAPI embutido em `apresentacao-devs.html`. A URL de homologação e o código do Luiz ainda não foram fornecidos. Isto é preparação do cliente, não homologação da API real nem liberação para produção.

`openapi-luiz.json` é a cópia extraída da apresentação, sem executar seus comandos. A apresentação lista 33 endpoints; o JSON contém 35 operações em 30 caminhos. Confirmar com Luiz qual contrato corresponde ao commit que será hospedado.

## O que está preparado

- Login Bearer, senha temporária e troca obrigatória; dispositivo com credencial própria.
- Bootstrap validado por conta e por endereço da API, quatro permissões e modelos históricos de checklist.
- Quatro operações com comando persistido antes da rede, decimais enviados como strings e identidade do autor definida pelo servidor.
- Recibo separado do ID local; reconciliação por `GET /api/v1/submissions/{submission_id}` após tentativa incerta, sem descartar a captura.
- `Retry-After`, bloqueios de acesso, revisão de validações e conflito de idempotência sem edição automática.
- Fila nativa cifrada, HTTP fora do lock, confirmação nativa durável e remoção da fila JS junto com a gravação do recibo em uma transação IndexedDB.
- Painel: histórico, operações, fotos, exclusão/restauração, cadastros de frotas, permissões, senha temporária e versões de checklist. As listagens resumidas da API são complementadas pelos detalhes antes de mostrar volumes.
- Proteção da atualização: fila ou recibos de outro backend/endereço bloqueiam a migração; pendências de outra conta bloqueiam o login. Nenhuma captura antiga é convertida automaticamente.

## Ativação quando o Luiz enviar os dados

1. Receber o repositório/commit, OpenAPI atualizado, URL HTTPS da homologação, contas sintéticas e origens CORS autorizadas. Não enviar credenciais SQL para o app.
2. Comparar o contrato e verificar saúde (somente leitura):

   ```powershell
   node scripts/check-api-v1.mjs --contract C:/caminho/openapi-recebido.json
   node scripts/check-api-v1.mjs https://ENDERECO-DA-API
   ```

3. Preparar builds com a URL **base**, sem acrescentar `/api/v1`:

   ```powershell
   $env:APP_BACKEND='api-v1'
   $env:API_V1_URL='https://ENDERECO-DA-API'
   $env:REQUIRE_HTTPS='true'
   npm test
   npm run build
   npm run android:sync
   ```

4. Validar login, troca de senha, câmera/QR, quatro operações, fotos, permissões, concorrência WebView/Worker, expiração, perda de resposta, rede externa e preservação da atualização com APK assinado. Conferir os efeitos no banco **do app** com o responsável pela API. Não escrever no GMAIS.
5. Só depois configurar as variáveis de repositório `APP_BACKEND=api-v1` e `API_V1_URL` para publicação. Sem essa seleção, os workflows continuam no modo SQL anterior. A URL de teste local não é aceita nos builds de produção.

Se um celular tiver pendências antigas, enviá-las e reconciliá-las pela versão e pelo backend originais antes da troca. Se isso não for possível, resolver com o responsável sem apagar dados, desinstalar o aplicativo ou limpar o navegador. Credenciais iguais não provam que duas APIs compartilham os mesmos registros.

## Pontos para alinhar com Luiz

- `FleetSummary` não define as leituras atuais de KM/horímetros. O cliente sinaliza **VALIDADO NO ENVIO** e não inventa referências a partir de `gmais_readings`. O servidor valida as leituras; para restabelecer a exibição anterior, precisamos de campos documentados no bootstrap.
- O contrato não define edição de username nem regra global para desligar checklist. O botão de editar username fica oculto no modo v1. A conferência de medidores é obrigatória no servidor e seu controle no painel fica desabilitado.
- `UserSummary` não inclui email. O painel identifica membros pelo UUID; não apresenta UUID como email.
- Detalhes não definem assinatura, leituras anteriores ou autor/data da remoção. O painel usa “Operador autenticado”, mostra apenas leituras presentes e deixa campos não fornecidos sem valor. Não tratar ausência como zero ou como primeiro registro.
- Medidores retornados como strings mantêm a precisão no comando congelado; a interface atual usa números para entrada/exibição. O uso operacional com precisão acima das casas da interface deve ser alinhado antes da produção.
- Carregar detalhes de cada operação é necessário para o painel atual. Medir o volume e considerar uma rota de relatório documentada se o histórico for grande.

## Verificações reproduzíveis

```powershell
node tests/api-v1.mjs
node tests/api-v1-browser.mjs
node scripts/check-api-v1.mjs --contract docs/api-v1/openapi-luiz.json
```

O primeiro teste usa HTTP local sintético; o segundo cria builds e um Chrome isolado com dados sintéticos para as quatro operações, retomada após resposta incerta, senha temporária e histórico administrativo. `PLAYWRIGHT_MODULE` permite indicar a instalação local do Playwright. Capturas ficam em `output/api-v1/`; não são dados operacionais.

Testes Android usam `ApiV1SyncTest`, um namespace de preferências exclusivo para testes e a variante separada `.sqlserver` do emulador. Com JDK 21 e SDK Android configurados:

```powershell
./android/gradlew.bat -p android '-Pandroid.overridePathCheck=true' '-PtestBuildType=sqlEmulator' connectedSqlEmulatorAndroidTest
```

O build `sqlEmulator` permite HTTP apenas nos hosts locais de teste. O APK de produção mantém HTTPS obrigatório. Os APKs e builds locais de teste não devem ser distribuídos como release final.
