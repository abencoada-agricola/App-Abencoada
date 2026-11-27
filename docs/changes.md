## 2026-11-27 — Erros em português e leituras anteriores

A API v1 deixa de exibir mensagens técnicas recebidas do servidor. Códigos conhecidos e falhas desconhecidas usam textos controlados em português, tanto no envio em primeiro plano quanto no serviço Android. A fila antiga é traduzida na apresentação, sem reescrever seus comandos. Conflitos novos preservam código, campos e referências numéricas para orientar a correção. A rejeição de Frente de Trabalho recebe orientação própria; a API pública ainda retorna 422 para data.work_front.

O catálogo inicial não inclui os últimos medidores salvos. A sessão agora consulta operações de abastecimento aceitas e ativas, busca os detalhes mais recentes disponíveis por medidor e guarda as leituras no cache offline da conta. Leituras de metadados do GMAIS não são usadas como substitutas. Operadores veem apenas o histórico autorizado pela API, com indicação dessa limitação. Falha de atualização preserva leituras anteriores da mesma conta/conexão e mostra aviso. Seleções abertas acompanham a sessão atualizada.

Alterar local/frente durante a correção de um abastecimento retorna ao próprio formulário, preservando identificação do envio, leituras e litros. O comando só é revisado ao confirmar a correção, sem excluir pendências.

Validação: testes de erros, histórico/cache e navegação; quatro operações em navegador com servidor sintético; compilação Android; testes nativos no Nothing Phone (1), Android 17. No aparelho, login online/offline, ocorrência salva sem internet e enviada após reconexão, rejeição de litros zero e exibição de KM 78.000/horímetro 29.000 foram conferidos. A API real confirmou conflito de leitura (409, KM de referência 51.000) e rejeição da extensão work_front (422). A câmera externa Nothing apresentou erros de sessão no Android 17; a captura passou a usar a câmera interna do app, com prévia, cancelamento e liberação dos recursos. Captura de 960 × 1280 e envio da foto foram confirmados no aparelho. Galeria, sete respostas de checklist, QR da frota 1001, abastecimento pela registradora e transferência também foram enviados à API real. Atualização operacional exige APK com a assinatura original; cópias de teste usam pacotes separados e preservam o aplicativo instalado.

## 2026-11-26 — Ambiente oficial e documentação publicada

API v1 em https://gmaiserp-api.gmais-sistemas.com.br adotada para o site e o Android, com APP_ABENCOADA como banco definido pelo projeto e conexão SQL administrada pelo provedor. O README registra URL, login, CORS, builds e publicação. Site e APK 2.0.79 tiveram login e consultas verificados. CORS de https://localhost liberado. A homologação de gravações reais e do cadastro de frentes permanece pendente.
## 2026-11-26 — Publicação para teste da API

Suíte completa aprovada no checkout preparado sobre origin/main. Builds web e mobile concluídos. O preflight do GitHub Pages respondeu 204 com Access-Control-Allow-Origin correspondente. A origem Android https://localhost continua com 403. O teste autenticado de leitura anterior confirmou login e bootstrap. Publicação não homologa gravações reais nem o campo frente de trabalho no servidor externo.

## 2026-11-26 — URL pública da API para teste

Site e Android usam por padrão o cliente api-v1 com https://gmaiserp-api.gmais-sistemas.com.br. Variáveis explícitas continuam selecionando o backend para builds existentes. Os workflows têm o mesmo padrão, com possibilidade de substituição pelas variáveis do repositório.

A API publicada respondeu ao OpenAPI, mas o login de teste recebeu 401. Os preflights de https://abencoada-agricola.github.io, https://localhost e http://127.0.0.1:4173 receberam 403. A homologação autenticada depende de conta da API e de liberação CORS no provedor. O contrato publicado não lista /health/live, /health/ready nem work_front no abastecimento. A validação local com servidor sintético não comprova integração real.
# Change log

## 2026-11-26 — Frente de Trabalho no abastecimento

O contexto de abastecimento agora oferece `Frente de Trabalho`, texto livre opcional com até 120 caracteres, e usa o rótulo `Local do Material`. A frente fica salva por conta no aparelho, é copiada para cada abastecimento e pode ser alterada pelo botão `ALTERAR LOCAL / FRENTE`. A seleção existente recebe o novo campo no próximo abastecimento. Transferências e ocorrências não exigem frente. Correções mantêm a frente original do registro pendente; filas e comandos já congelados não são reescritos.

Adicionada a coluna opcional `app.records.work_front` ao esquema/manifesto SQL Server e uma migração aditiva idempotente (`node sqlserver/migrate-work-front.mjs`), também chamada pelo instalador. A API aceita APKs antigos sem o campo, valida textos novos e preserva o primeiro valor aceito nos reenvios. Detalhes, CSV e impressão do painel incluem a frente. A migração histórica adicional `supabase/work-front.sql` permite testar a mesma regra na cadeia PostgreSQL, sem modificar migrações anteriores nem acessar o Supabase em produção.

No cliente opcional API v1, a frente preenchida é enviada como `data.work_front`, inclusive no comando offline congelado. Isso é uma extensão nova: `docs/api-v1/work-front-extension.json` registra o acréscimo sem alterar a cópia original do contrato do Luiz. O servidor externo precisa implementar/homologar esse campo; seu código não está neste projeto.

Validação: 33 suítes Node aprovadas, incluindo migração PostgreSQL com preservação dos dados anteriores, campos ausentes/vazios, validação, permissões, reenvio idempotente e entrega por dispositivo. Teste em Chrome isolado aprovado para captura sem rede, fechamento/reabertura da página, leitura da fila persistida, envio da frente e exibição nos detalhes do painel, usando HTTP sintético. Builds web/móvel aprovados. Graphify atualizado em modo determinístico (sem chamadas de modelos). Após atualização da credencial protegida fornecida pelo usuário, a migração foi aplicada no APP_ABENCOADA remoto. Coluna opcional confirmada, reexecução idempotente aprovada e os 20 abastecimentos anteriores conferidos por campo sem alterações. Gravação/leitura de frente com acentos e valor nulo aprovadas em transação revertida, sem deixar dados de teste. A suíte geral SQL encontrou divergência anterior ao novo campo: `private.valid_feature_access` no banco exige quatro permissões, incluindo `occurrence`, enquanto o fixture de teste envia três; a transação foi revertida. Essa regra do banco não foi alterada nesta tarefa. Nenhum dado GMAIS foi acessado/alterado; sem publicação ou novo APK nesta etapa.

## 2026-11-24 — Cliente preparado para a API v1 do Luiz

Adicionado modo opcional `api-v1` com contrato extraído do HTML fornecido pelo usuário (`docs/api-v1/openapi-luiz.json`). Login Bearer, senha temporária, bootstrap por conta/origem, quatro operações, comando congelado antes da rede, recibo com ID remoto separado e reconciliação após tentativa incerta. A mudança preserva filas/rascunhos e bloqueia a troca quando existem pendências/acks do backend anterior ou de outra conta.

O Worker v1 usa a fila cifrada existente, libera o lock durante HTTP e faz merge no estado atual. Recibos nativos ficam duráveis antes da confirmação JS; a fila JS só é removida junto com a persistência do recibo em uma transação. Painel adaptado para rotas REST, paginação/detalhes, fotos, cadastros, permissões, senha temporária e checklists. Leituras ausentes e recursos não definidos pelo contrato não são inventados. `docs/api-v1/README.md` registra as diferenças e a sequência de ativação.

Builds selecionam `APP_BACKEND=api-v1` com `API_V1_URL`; workflows mantêm SQL como padrão até configurar explicitamente a opção nova. Nenhuma publicação, migração SQL ou alteração no GMAIS foi executada. O código/commit do Luiz e a URL real ainda não foram recebidos; os testes locais não homologam o servidor dele.

Validação: 32 suítes Node aprovadas, teste de contrato/HTTP sintético com perda de resposta pós-commit e Retry-After, navegador Chrome isolado cobrindo quatro operações/troca de senha/histórico, build Android aprovado e três testes instrumentados no emulador Android 17. Os testes nativos usam preferências exclusivas de teste e verificam recibos, comparação estrutural, preservação de estado cifrado e captura concorrente durante HTTP. Graphify atualizado em modo determinístico, sem serviços de modelos. Restam validação com a API real, CORS/HTTPS, aparelho físico e atualização assinada antes da distribuição.

## 2026-11-06 — Banco único e retirada posterior das bases antigas

Usuário definiu APP_ABENCOADA em 177.234.159.74 como único destino do aplicativo novo e pediu explicação histórica no GitHub. Publicado somente docs/historico-supabase.md na branch docs/historico-supabase-2026-11-06, commit 2f37ad4, sem alterar main ou disparar publicação do aplicativo. Configuração nova bloqueia SQL_PROFILE=local e qualquer outro servidor/banco; não há fallback para localhost. Builds exigem SQL_API_URL e recusam outro backend.

Backup local de teste criado e verificado com CHECKSUM em app_abencoada_teste_antes_exclusao_20261106_090103.bak na pasta Backup da instância local. Revisão automática rejeitou encerrar a API antiga do emulador e excluir o banco local; essas ações não foram executadas. Depois de informado sobre a interrupção do site/APK antigos, o usuário escolheu explicitamente aguardar a API HTTPS antes de excluir. Não excluir o Supabase nem o banco local nesta etapa. Uma instância antiga da API do emulador ainda pode precisar ser reiniciada na troca final; não confundir a configuração nova com processos antigos já carregados.

Pendência: provedor hospedar API HTTPS; validar site/novo APK; reconciliar os lançamentos surgidos após a fotografia importada; confirmar a troca e então executar o desligamento/exclusão com backup atualizado. Preservar filas e rascunhos offline. Acesso da API principal e igualdade da fotografia no destino remoto foram conferidos.


## 2026-11-06 — Preparação da saída do Supabase no site/APK

Usuário decidiu deixar Supabase e informou que o provedor do servidor pode hospedar a API, mas ainda não tem domínio HTTPS nem acesso de publicação. Preparado pacote de API Windows/Node/PowerShell sem credenciais, dados ou backups e mensagem para encaminhar ao provedor. O pacote inclui instalação de dependência fixada, configuração DPAPI e serviço/proxy/origens documentados.

Builds com SQL_API_URL agora usam uma entrada exclusiva SQL Server; artefatos web/móvel não incluem SDK ou endpoints do Supabase. Workflows de site e APK exigem APP_BACKEND=sqlserver e uma API HTTPS real em vars.SQL_API_URL; não há fallback silencioso ao Supabase nas próximas publicações. Mantido o código/migrações históricos para testes e manutenção. Nenhuma publicação foi realizada com localhost ou domínio inventado.

Validação: regras de release e HTTPS, inspeção dos artefatos sem SDK/endpoints Supabase, builds web/móvel locais e painel SQL em navegador isolado aprovados. A API local segue usando o banco remoto. Publicação externa e APK definitivo dependem da URL e instalação pelo provedor; o sistema público instalado não deve ser desligado antes da troca validada.


## 2026-11-06 — Destino remoto APP_ABENCOADA

Destino confirmado pelo usuário: 177.234.159.74, banco APP_ABENCOADA, login SQL informado na sessão. O endereço inicialmente digitado com final .97 não foi adotado. Após autorização explícita, a conexão usa TLS criptografado com confiança no certificado do servidor. Credencial armazenada por DPAPI em sqlserver/credentials.local.xml e configuração em connection.local.json, ambos ignorados pelo Git; nenhuma senha fica no código, argumentos de processo, site ou APK.

Criada a estrutura no banco remoto que estava vazio, com compatibilidade SQL Server 2019 (remoção do argumento OBJECT em ISJSON e substituição de IS DISTINCT FROM). Colunas de texto usam collation binária para preservar comparações da origem. Instalador remoto não acessa master nem cria bancos; a camada de conexão recusa nomes de bancos diferentes do destino configurado. Nenhum outro banco do servidor foi consultado ou alterado pela migração.

Copiada a base local já validada: 15 tabelas de domínio, 125 colunas, 76 linhas e três identidades/hashes de senha. Aplicadas as 31 traduções de CHECK e cinco regras de gatilhos. Comparação de todos os valores após gravar aprovada. API local reiniciada apontando para o destino remoto. A base local anterior foi preservada; SQL_PROFILE=local permite acesso explícito a ela para manutenção.

Validação no SQL Server 2019 remoto: simulação com rollback, importação confirmada, conferência por coluna/valor, 28 verificações de integração, 33 comparações com as funções exportadas do PostgreSQL, testes HTTP de autenticação/origem/catálogo e painel em Chrome isolado. Testes de configuração verificam TLS por padrão, isolamento de perfis e bloqueio de outros bancos. Nenhum registro de teste permaneceu. O site público e APK já distribuído ainda não foram republicados; a API continua restrita a 127.0.0.1 nesta máquina.


## 2026-11-06 — Banco novo sem dados de teste e Android SQL local

Resultado final da validação: suíte completa de testes do app aprovada; build `assembleSqlEmulator` aprovado com JDK 21; instalação e abertura do pacote separado confirmadas. A WebView Android recebeu HTTP 200 de `http://10.0.2.2:4782/health`, identificando `sqlserver` e `app_abencoada`, com origem `http://localhost`. Não foi efetuado login nem criado registro operacional no teste manual.

O destino planejado é um banco próprio do app no SQL Server, ao lado do GMAIS, com somente estrutura e regras equivalentes ao Supabase. Não migrar registros de teste. A cópia local histórica é preservada. Documentado fluxo Git entre computadores.

Adicionada variante Android sqlEmulator, pacote separado .sqlserver e API loopback na porta 4782, acessível pelo emulador em 10.0.2.2. A variante permite HTTP somente para o host do emulador/localhost e usa origem http://localhost. A versão oficial mantém sua configuração. Limite atual: worker nativo de segundo plano permanece restrito ao Supabase; SQL deve sincronizar em primeiro plano nesta etapa. Validação: saúde SQL local e 28 verificações de integração aprovadas, além dos testes HTTP de autenticação, sessão, registros e origens. Build Android e suíte do app conferidos nesta preparação; resultado final registrado abaixo.

## 2026-11-05 — Importação da cópia atual do Supabase

Após escolha explícita por manter SQL Server com dados e comportamento equivalentes, exportada uma fotografia somente leitura do projeto e preservado/verificado backup do banco local anterior. Importação transacional de 15 tabelas e 76 linhas, incluindo fotos, IDs de auditoria, dispositivos e tentativas de login. Substituída a conta provisória pelos três usuários da origem, preservando UUIDs, e-mails e hashes bcrypt. Adicionado suporte a bcrypt e alinhados limite de login (10 por usuário/60 por IP em cinco minutos), regras de usuário, permissões de teste e capacidades com a origem. Nenhuma alteração foi enviada ao Supabase nem ao GitHub.

As 125 colunas foram conferidas contra metadados atuais; todos os valores das 76 linhas foram comparados após gravar, incluindo precisão temporal, JSON e binários. Adicionadas 31 traduções de CHECK e cinco regras de gatilhos (quatro gatilhos SQL, com as duas regras de frota reunidas). Funções PL/pgSQL/RPC e controle por usuário continuam adaptados à API local, sem equivalência binária entre os bancos. O APK em uso permanece apontando ao Supabase. As cópias são independentes após a exportação.

Validação: simulação com rollback, igualdade persistida, 28 verificações de integração SQL Server, 33 verificações diferenciais contra as definições das funções exportadas do banco vivo, autenticação/origem/catálogo por HTTP, painel em Chrome isolado e suíte completa existente do projeto. Os testes não deixam dados operacionais na base. Material reservado da exportação e relatórios detalhados ficam em sqlserver/exports, ignorado pelo Git.


## 2026-11-05 — Cópia local com SQL Server

Adicionado backend local opcional, selecionado por SQL_API_URL no build, preservando o fluxo Supabase padrão. Banco app_abencoada, com 15 tabelas de domínio (125 colunas) e autenticação local em app_auth. O esquema PostgreSQL public corresponde a app. API local parametrizada, com scrypt, tokens armazenados como hash, limite de login e transações serializadas para regras de permissões, leituras, registradoras, checklists, fotos e recuperação de exclusões. Não houve publicação, importação de dados atuais nem distribuição de APK.

Validação: 28 verificações de integração real no SQL Server, com rollback de todos os dados de teste; login e painel em Chrome isolado; builds web e móvel; suíte existente do projeto. Adicionado LF explícito para testes no Windows. Exportador de migração somente leitura e importador JSON com simulação/reversão, recusa de destino com dados operacionais e reconciliação de contagens. Importação real ainda depende do backup e revisão de precisão decimal. A API usa leitura de tabelas em transação serializada e requer avaliação de volume antes de produção. Detalhes em sqlserver/README.md.


## 2026-10-29 — Orientação vertical fixa no Android

A atividade principal passa a declarar orientação portrait, mantendo login, menu e formulários em pé ao girar o aparelho. O leitor de QR já usa scanOrientation=1 (portrait). Adicionada a propriedade de compatibilidade do alvo Android 16/API 36 para respeitar a restrição também em telas grandes. Configuração conforme a [documentação oficial](https://developer.android.com/about/versions/16/behavior-changes-16#adaptive-layouts); o comportamento deve ser revisto antes de migrar para targetSdk 37, quando essa propriedade deixa de valer em telas grandes.

Validação: XML conferido e geração do APK pelo fluxo Android; verificação de rotação no simulador com a versão instalada. A mudança não altera autenticação, captura de registros, rascunhos ou fila offline.

## 2026-10-29 — Local/Material somente nos fluxos de combustível

O login volta a abrir diretamente no menu. A escolha de Local e Material é solicitada somente ao entrar em Abastecimento ou Transferência, quando ainda não há seleção na entrada atual; após confirmar, o usuário segue para a operação que escolheu. Checklist e Ocorrência não exigem essa etapa. É possível voltar ao menu sem escolher códigos. A seleção continua sendo reiniciada após sair/entrar novamente, e pendências mantêm os valores originais.

Validação: regressões de login/permissões/roteamento, falha de gravação e preservação de rascunhos/pendências; build móvel e navegador isolado em modo avião. Conferidos acesso direto ao menu e a Checklist/Ocorrência, cancelamento da seleção, continuidade em Abastecimento e Transferência, reutilização da seleção na mesma entrada e nova solicitação somente na primeira operação após reabrir. Transferência sem frota e cálculos de registradora seguem aprovados.

## 2026-10-29 — Remoção de documentação pública

Removidos o documento de especificação da futura integração e seu atalho no README, conforme solicitado. A alteração é documental e não modifica o aplicativo, a fila offline ou o código de integração. Validação: conferidos o diff e a ausência de referências ao arquivo removido.

## 2026-10-29 — Transferência sem campo de frota

Removido o campo FROTA (OPCIONAL) da tela de transferência. Novas transferências omitem o vínculo de frota, inclusive quando há valor antigo no rascunho/formulário. A correção de uma transferência pendente antiga mantém sua frota original, sem exigir que ainda esteja no catálogo, para preservar histórico e identidade de reenvio. Regras de local/material, destino e registradora continuam iguais.

Validação: regressões do formulário/payload, envio offline sem frota, descarte de valor antigo, preservação de vínculo legado e cálculos de registradora; testes de operações e RPC de frotas opcionais/segundo plano; build móvel. Navegador isolado salvou transferência sem frota com os códigos e volume corretos e preservou a fila após nova entrada, usando apenas dados fictícios.

## 2026-10-29 — Tela verde simplificada e contexto obrigatório em cada entrada

Fontes reforçadas, logo maior e afastada da borda esquerda, ícones maiores e deslocados para dentro dos botões. Removidos Ajustes/engrenagem, os modos claro/escuro, a ação ALTERAR do resumo e a data/hora abaixo da conexão. O app usa apenas a aparência verde e mantém o cabeçalho branco.

Após autenticar, inclusive offline e ao reabrir, o usuário precisa informar novamente Local e Material antes de acessar o menu. Defaults da entrada anterior não são reutilizados. A escolha é salva de forma atômica com o rascunho; erro de armazenamento mantém a etapa aberta. Rascunhos de operações e pendências, com seus códigos e autoria originais, são preservados. O resumo de Local/Material é somente informativo durante a entrada atual.

Avisos de envio ficam automáticos, sem opção de desligamento no app. A cada login, o cliente verifica a permissão nativa e a solicita quando necessário, ignorando preferências antigas de ativação. O Android continua controlando a permissão e o canal de notificações; recusá-los não impede salvar/enviar registros.

Validação: suíte completa, testes de login/contexto/permissões de acesso, persistência com falha, tema fixo e avisos automáticos. Navegador isolado em 320/360/390px verificou logo/ícones/fonte, ausência das opções removidas, nova escolha após sair e reiniciar offline, e fila byte a byte inalterada ao trocar de contexto. Apenas dados fictícios foram usados.

## 2026-10-29 — Barra superior branca e tela inicial verde escura

Removida a marca grande do centro da tela inicial. A logo pequena, o nome do usuário em negrito, a conexão/data e as ações de Ajustes, Ocorrência e Sair ficam reunidos na barra branca. O corpo volta ao verde escuro #193c2b. A primeira abertura deste layout restaura o tema escuro uma vez; escolhas posteriores em Ajustes continuam persistentes. A faixa branca do login e os campos centralizados são mantidos.

Barras nativas usam ícones escuros sobre o cabeçalho branco em Android/iOS; a navegação considera a cor do corpo e eventuais áreas nativas brancas reservadas. Nenhum dado de sessão, rascunho ou fila é removido pela atualização visual.

Validação: suíte automatizada, build móvel, regressões de cabeçalho/permissões/barras e migração de preferência; revisão em 320/360/390px, sem transbordamento e com alvos de toque de 48px. Navegador isolado validou logo pequena/nome/conexão dentro da barra, corpo verde, temas e entrada/reinício offline usando conta fictícia. Simulador Android aberto para revisão da tela.

## 2026-10-28 — Campos do login centralizados e em negrito

Os campos de usuário/senha agora centralizam tanto os rótulos quanto o texto digitado, com peso 700. O rótulo flutuante permanece centralizado ao receber foco ou conteúdo. A borda passa a ter 2px e cantos de 24px, com destaque na cor de foco do tema. O campo de senha usa espaçamento simétrico para manter a centralização com o botão de mostrar/ocultar à direita.

Validação: build móvel, regressão de login e revisão visual dos campos vazios/em foco nos dois temas; fluxo isolado de navegador com senha incorreta/correta, modo avião, contexto, pendências e reinício, além de telas estreitas e altura reduzida para teclado. Nenhuma credencial, fila ou regra de autenticação foi alterada.

## 2026-10-28 — Faixa branca do login e marca na tela inicial

Restaurada a faixa branca de largura total com a logo na tela de login. O botão Ajustes fica oculto e fora da navegação por teclado nessa tela, aparecendo novamente após entrar. O ícone de configuração agora usa uma engrenagem de oito dentes. Na tela inicial, a logo ocupa um bloco central maior e o nome do usuário aparece em negrito diretamente abaixo; as ações de status, Ajustes, Ocorrência e Sair continuam no topo.

O contraste da barra de status acompanha a faixa branca do login e o tema após autenticar. O fundo nativo do Android acompanha esse estado, considerando também a área branca reservada por WebViews antigos na navegação. O login inicia com o estado visual correto antes de carregar o JavaScript.

Validação: regressões de login/offline, permissões, contexto, barras do sistema nos dois temas e navegação antiga com inset; build móvel e revisão visual de login/menu. O fluxo isolado de navegador confirmou ausência de Ajustes no login, faixa branca nos dois temas, logo maior e nome em negrito abaixo dela, além de login e registros offline, troca de contexto, reinício e fila preservada. Telas estreitas e altura de teclado verificadas, usando apenas dados fictícios.

## 2026-10-28 — Alterar local e material na tela inicial

Após o login, o resumo de Local/Material na tela inicial passa a ser um botão com indicação ALTERAR. Abre uma janela Material com os códigos atuais, sugestões do catálogo local e ações Salvar alteração/Cancelar. A mudança é gravada no aparelho para o usuário antes de atualizar o resumo e vale para os próximos registros; funciona offline. As outras telas conservam o resumo da operação em andamento.

Cancelar não grava mudanças. Códigos são validados, falhas de armazenamento mantêm os valores anteriores e permitem nova tentativa, e salvamentos repetidos são bloqueados enquanto há gravação em andamento. Rascunhos e registros pendentes, incluindo seus códigos originais, não são regravados.

Validação: suíte completa, regressões do editor e da persistência, build móvel e fluxo de navegador isolado em modo avião: configuração inicial, editar/salvar/cancelar, fila idêntica antes/depois e novos códigos preservados após sair e reiniciar. Revisão visual da janela nos estilos Material. Apenas dados fictícios foram usados.

## 2026-10-28 — Material Design 3 no aplicativo

Padronizado o visual conforme a referência Material Design 3: botões preenchidos e contornados em cápsula, ações de ícone circulares com área de toque de 48px, campos com cantos de 12px, cartões de 16px e janelas de 28px. Estados de foco, toque e desabilitado compartilham estilos; menus, login, checklist, fotos, avisos e Ajustes usam o mesmo sistema. Mantidas a paleta do Abençoada e a escolha persistente de tema claro/escuro. CSS empacotado localmente, sem depender de fontes ou estilos de rede.

A camada `mobile/material.css` centraliza os estilos e é incluída no build móvel. Referências: [início do Material Design 3](https://m3.material.io/get-started), [botões Material](https://github.com/material-components/material-web/blob/main/docs/components/button.md) e [formas Material](https://github.com/material-components/material-components-android/blob/master/docs/theming/Shape.md).

Validação: suíte de regressão, build móvel, fluxo de navegador isolado com login e captura offline, persistência de tema/pendências e revisão visual nos dois temas. Conferidos raios dos botões, alvos de toque e ausência de transbordamento em 390×844, 360×640 e altura reduzida para teclado. Nenhum registro operacional foi criado ou alterado.

## 2026-10-28 — Aparência, carregamento e confirmações de envio

Paleta compartilhada com o site, temas claro/escuro persistentes e botão Ajustes ao lado de Ocorrências. Rótulos flutuantes no login, animação local de carregamento e bloqueio do botão durante a validação. Avisos distinguem gravação local de recebimento confirmado, com resumo da fila, data/hora da confirmação e retorno visual acessível.

Android possui canal de notificações de envio, permissão solicitada após login e opção de solicitar novamente em Ajustes. Confirmações do envio em primeiro ou segundo plano geram notificação nativa, inclusive com tela bloqueada quando permitido pelo sistema. Duplicatas são evitadas por identidade/registro em armazenamento nativo persistente. Erros de rede, recibos divergentes e simples gravação local não disparam confirmação. O agendamento de fundo depende do Android e de suas restrições de bateria/rede.

Validação: regressões de confirmação/recibo divergente, permissão recusada/repetida, deduplicação, login e acesso offline; suíte completa e builds. Fluxo de navegador isolado validou temas, persistência, saída/retorno/reinício offline e conservação de pendências com dados fictícios.

Validação nativa adicional: APK assinado instalado por atualização no emulador Android, sem limpar dados. Permissão recusada/permitida e notificação nativa com tela bloqueada verificadas usando identificador fictício, sem criar ou enviar registro operacional. Repetir a confirmação não publicou nova notificação. Corrigido o contraste de ícones das barras em cada tema e adicionada regressão Android/iOS; a data de confirmação permanece após atualização da sessão.

## 2026-10-28 — Desbloqueio offline com a senha do login

Primeiro acesso online habilita desbloqueio local com a mesma senha validada, sem armazenar senha legível. Catálogo/sessão passam a ser cifrados com AES-GCM e chave derivada por PBKDF2; filas e rascunhos são preservados. SAIR fecha a sessão visível preservando o acesso offline, rascunhos e pendências; trocar de usuário com registros pendentes é impedido. Prazo inicial de 30 dias renovado por validação de sessão online; token local expirado não equivale a revogação de acesso offline. Autenticação GMAIS permanece responsabilidade da futura conexão do servidor.

Campos de usuário e senha adaptados à referência de rótulo flutuante do Bencho, com CSS local e acessibilidade. Regras e limites documentados em `docs/offline-access.md`. Validação: testes criptográficos/estados, suíte existente, fluxo de navegador em modo avião com registro/reinício/bloqueio, revisão visual e builds web/móvel.

## 2026-10-28 — Barra de status e disposição das telas Android

Fixado o contraste da barra de status sobre o cabeçalho branco, inclusive no tema escuro do aparelho, usando SystemBars do Capacitor. O tema inicial e o fundo nativo acompanham a configuração; a navegação considera a área reservada por WebViews antigos e a área verde em edge-to-edge. Insets fornecidos pelo Capacitor passam a ser respeitados no CSS.

O formulário de login fica centralizado no espaço disponível abaixo da logo com teclado fechado e permanece rolável em áreas menores. A logo se adapta em telas baixas. Aumentado o intervalo entre os botões de abastecimento, transferência e checklist, mantendo botões acessíveis em telas menores.

Validação: suíte completa; build e sincronização Android; revisão visual em 390×844, 360×640, paisagem e altura reduzida por teclado; compilação assinada e conferência Android.

## 2026-10-28 — Preparação para catálogo dinâmico GMAIS

Adicionado contrato opcional e versionado de metadados por frota na resposta de sessão, com adaptação compartilhada entre web e Android. A unidade e a finalidade confirmada do medidor adicional definem os campos exigidos; capacidade desconhecida não vira estimativa. Catálogos locais, leituras existentes, rascunhos e pendências são preservados. Nenhum catálogo real foi incluído/importado e nenhuma conexão GMAIS foi ativada.

Registrado o mapeamento esperado para a futura conexão do Luiz e as adaptações ainda necessárias no servidor (identidade, validação de envios, histórico e fonte de leituras). Validação: testes de contrato e sessão RPC, suíte completa, builds web/Android e atualização do mapa de arquitetura.

## 2026-10-28 — Administração na raiz do site

Administração e login passam a abrir diretamente em `https://abencoada-agricola.github.io/abencoada/`, sem redirecionar para `admin.html`. O endereço anterior redireciona à raiz para preservar favoritos. Saída da conta, abertura do aplicativo web instalado e links atuais acompanham o endereço simplificado. Armazenamento e sessão existentes permanecem no mesmo domínio e banco local.

Validação: testes completos, build de produção e verificação no navegador da raiz e do redirecionamento legado.

## 2026-10-28 — Nome técnico em minúsculas

Repositório renomeado de `Abencoada` para `abencoada`, conforme solicitado. Links atuais de documentação, downloads e GitHub Pages atualizados para `https://abencoada-agricola.github.io/abencoada/admin.html`. Nome público do aplicativo continua Abençoada. Validação: nome confirmado pela API do GitHub e publicação do Pages acompanhada.

## 2026-10-28 — Abençoada: nome e ícone

Nome público unificado para Abençoada no Android, títulos web, manifesto, documentação e releases. Ícone fornecido em `icone-app.png` aplicado ao launcher Android (adaptativo e legado), abertura do app, favicon e instalação web. Pacote npm e APK passam a `abencoada` e `abencoada.apk`. Repositório passa a `Abencoada` (GitHub não aceita ç/acentos no nome técnico), com a marca Abençoada no README e descrição. Links de administração atualizados para `https://abencoada-agricola.github.io/Abencoada/admin.html`.

Identidade Android, assinatura, armazenamento offline, chaves de sincronização e contratos de QR/login permanecem compatíveis com instalações existentes. Ícones e manifesto agora participam da versão do cache web.

Validação: testes completos, builds web/Android e atualização do mapa de arquitetura.

## 2026-10-19 — Nome do repositório

Repositório renomeado para `app-abencoada`, apresentado como APP Abençoada. Atualizados os links de administração, downloads e documentação. O endereço da administração passa a ser `https://abencoada-agricola.github.io/app-abencoada/admin.html`. Identificadores do Android, banco e fila offline foram preservados.


Record material changes here with the request, resulting behavior, affected areas and validation. Git history contains the full diff and authorship.

## 2026-10-16 — Per-user feature access

- Request: configure each login as an operator or administrator and allow any combination of refueling, transfer and checklist.
- Added a member permission editor and new-account choices, filtered Android menus, cached access and current-permission checks at server submission boundaries. Existing accounts keep their previous access by default.
- Added `user-access.sql` after `checklists.sql`, with role/feature validation, self-demotion protection and an administrator audit trail. Global Checklist availability remains independent.
- Revoked access preserves drafts and queued records. Previously accepted records can still be acknowledged; feature-level denials do not become network errors or stop unrelated queue items.
- Validation: access combinations, operator privilege escalation, native and legacy RPC enforcement, role promotion/demotion, restored access, duplicate receipts and audit permissions; full application suite; administration and mobile previews.

## 2026-10-16 — Simplify administration settings

- Request: remove the locations, materials and recorder-reading controls while the database contains fictitious trial data.
- Removed the settings card, its reading/cadastro dialogs and its settings-only data request. Existing database values and Android workflows are preserved.
- Renamed the rules card to Regras and removed the static mandatory-fields and decreasing-readings explanations. Validation behavior remains in place.
- Validation: production build and visual review of Configurações; architecture map updated. Standard deployment checks run in GitHub Actions.

## 2026-10-16 — Project architecture tracking

- Request: use Graphify to improve control of future project changes.
- Added a project-scoped skill, source map instructions, pinned local installation and a command wrapper.
- Added a local post-commit refresh and a GitHub workflow publishing architecture snapshots with the source commit and diagnostics.
- Code/SQL analysis runs locally without model calls or live database access. Generated maps and excluded files are not committed.
- Baseline: existing Android version 1.0.40 and checklist availability control, source commit `c9ffdd5`.
- Validation: first extraction and incremental refresh; focused login, offline queue and checklist queries; graph health inspection; local hook and GitHub workflow verification.
- Known limits: partial Gradle extraction, historical SQL definitions and some grouped graph relationships. See `docs/development.md`.

## 2026-10-16 — Remove the global checklist control

- Removed the Aplicativo Android settings card and its checklist toggle handler. Administrators manage each login through Equipe e acessos → Permissões.
- Existing operation settings, Android compatibility and pending records are preserved.
- Validation: production build and settings preview; deployment checks run in GitHub Actions.

## 2026-10-16 — Recoverable user removal

- Added administrator-only Remove and Restore actions under Equipe e acessos, with a confirmation dialog and self-removal protection.
- New member-removal.sql archives the membership and revokes device leases, retaining authentication identities and submitted history. Server authorization denies removed accounts even with existing sessions. Removed accounts require explicit restoration.
- Restoration recovers the previous role and permissions; username conflicts preserve the archive. Every removal/restoration is audited.
- Validation: database authorization, session/device revocation, history retention, restoration, conflicts and UI preview; standard build and deployment checks.

## 2026-10-16 — Type fleet codes in Checklist

- Replaced the fleet dropdowns in received checklists and question configuration with editable fleet-code fields and catalog suggestions. Received records filter as the user types; clearing the field shows all fleets.
- Question editing opens only for an existing catalog code.
- Validation: production build and browser checks for typed filters, clearing, catalog selection and unknown codes.

## 2026-10-16 — Compact overview controls

- Moved the overview period selector and CSV export below the final data card, with a compact inline layout. Preserved the 7/30/60/90-day choices and export scope.
- Kept 44px touch targets on smaller screens.
- Validation: production build and visual overview review; deployment runs the standard test suite.

## 2026-10-16 — Operation search filters

- Added independent employee-name and inclusive date-range filters to Occurrences and Transfers, with a Clear filters action. Employee search ignores case and accents; dates use São Paulo time.
- Periodic refresh updates results without replacing active filter fields. Existing detail, photo and recoverable deletion controls remain available.
- Added fleet-code filtering and optional fleet entry on Android occurrences/transfers after the user confirmed that capture approach. Legacy records remain unlinked; no association is inferred from locations. Apply operation-fleets.sql after member-removal.sql. Links are validated on server submission, retained offline and preserved on retries.
- Validation: production build and browser checks for employee/date combinations, local date boundaries, empty matches and independent tab filters. Deployment runs the full existing suite.

## 2026-10-16 — Branded report headers

- Added the Abençoada logo and issuance date/time in Brasília time to checklist PDFs, refueling printouts and QR-label printouts. Multi-page reports repeat the header with the same issuance timestamp. Capture/reception timestamps remain separate.
- Shared report header code waits for print images to load and prevents checklist downloads without the logo. Included the shared module in versioned assets and offline caching.
- Validation: multi-page checklist PDF rendering, embedded image and timestamp checks on every page, timezone boundary check, production build and print-layout preview.

## 2026-10-19 — Database documentation and smaller test workspace

- Documented the 15 application tables (9 public, 6 private), 125 columns, declared relationships, authentication, RPCs and offline synchronization in database-architecture.pt-BR.md. Managed Supabase Auth tables are counted separately.
- User confirmed clearing operational trial history while retaining 10 representative fleets, accounts and necessary configuration. Saved a private local snapshot of all 15 tables and a recovery script outside Git before changing the live test data.
- Added a one-time maintenance script with expected-inventory checks and a transaction. Reduced the live catalog from 250 to 10 fleets, retained 3 members, 2 locations and material 9, and cleared 15 refuelings, 7 transfer/occurrence events, 4 submitted checklists and 2 photos. Security/access audit and device credentials were preserved.
- Retained checklist versions for selected fleets and added basic questions where missing. Reset initial meter values for testing; known capacities remain and missing capacities have trial values. All selected fleets/locations are internally flagged as test data. Updated the bundled catalog to the same 10 fleet codes.
- Validation: restored the private snapshot into local PostgreSQL-compatible storage, rehearsed reset, tested refueling/transfer/occurrence/checklist submission, rejected a second reset and restored the original data successfully. Existing application test suite passed. Verified live result counts and reviewed the technical PDF.
- Offline queues on phones are preserved; phones must connect to refresh the reduced catalog. GMAIS was not modified.

## 2026-10-20 — Shared website and Android icons

- Replaced the Android menu PNGs with the website's SVG icons for refueling, transfers and checklists; occurrences use the same warning triangle. Both interfaces import one icon module with matching rounded strokes.
- Bundled SVGs work offline. Added the shared module to website asset versioning and service-worker caching.
- Validation: website/mobile production builds, existing application tests and mobile-size visual review.

## 2026-10-20 — Larger Android button labels

- Increased button font sizes by 20%, including main actions, menu, sign-out, photo actions and checklist choices.
- Kept flexible button heights and wrapped long labels at spaces; narrow menus use two columns so icons do not squeeze the larger labels.
- Validation: mobile build and visual checks at narrow phone, standard phone and tablet widths.

### Publication verification

- Full application suite passed, including permissions, offline submission, retries, photos and checklist revisions. Website and mobile production builds passed.
- Verified real login/menu, local/material selection, refueling methods and checklist screens in a browser using an isolated local backend fixture at 320, 360, 390 and 600px. Button overflow measurements were clear on these screens. Earlier visual review also covered long action labels and photo controls.
- Included shared icon changes in Android workflow triggers. No database migrations or offline-storage changes.

## 2026-10-21 — Quiet empty-queue refresh failures

- Opening/resuming the Android app also refreshes session/catalog data. Failed refreshes previously used upload wording even when no records were pending; Supabase status-zero abort responses could lose their error type and leak technical AbortError text.
- Normalize wrapped abort responses, keep idle network/server/rate-limit failures in the header, and reserve record-preservation/upload messages for nonempty queues. Session-expiry and authorization notices remain actionable. Clear the previous synchronization notice after recovery without erasing unrelated feedback.
- Validation: full application suite, web/mobile production builds, focused regressions for empty/pending queues, wrapped aborts, recovery, access statuses and matching receipts. Browser review with an isolated interrupted-request fixture confirmed the empty-queue menu has no upload error banner. No storage schema, pending-record deletion rules or GMAIS data changed.

## 2026-10-21 — Always-available authenticated occurrences

- Kept the occurrence toolbar action enabled on every authenticated screen, including initial local/material selection, checklist-only access and accounts with all three optional features disabled. Clicking it while already editing an occurrence focuses the current notes instead of resetting navigation or drafts.
- When no operational context is selected, the occurrence form collects its own required local/material codes. These codes are saved in its offline draft and payload without fixing or changing the refueling/transfer context. Initial context inputs now retain their draft when opening and returning from an occurrence.
- Verified all eight combinations of per-user feature permissions: disabled menu entries are absent, live session refresh hides/restores them without logout, restricted forms cannot remain open, offline sessions keep last received access and drafts/queues survive access changes. Occurrences remain authorized on the server when all optional permissions are false.
- Validation: full application suite with mobile-access-ui regressions, web/mobile production builds, and browser checks of live permission toggles, occurrence entry without context and draft retention. No schema migration or GMAIS changes.

## 2026-10-21 — General incident reports without operational codes

- Removed local, material and fleet inputs and the operational-context banner from the occurrence form. New reports contain the authenticated operator, capture time, text and/or optional photo. Existing queued occurrences retain their original links when corrected.
- Added general-occurrences.sql after operation-fleets.sql: occurrence context columns are nullable, transfer context remains required, and general submissions retain authentication, duplicate receipts, photo validation, atomic photo storage and removal/restoration. Other operation types continue through the existing validation chain. Dashboard lists/details omit absent metadata.
- Validation: full suite and builds, new migration/legacy/photo/device/idempotency tests, mobile context-free payload tests and dashboard rendering checks. Browser simulation saved a report offline, reopened it with the pending queue intact and confirmed delivery after reconnection.
- Applied the migration to the existing Supabase project after verifying the previous schema. A live transactional submission without codes and a duplicate retry succeeded, then were rolled back. Existing operation/photo counts remained 2/1. No GMAIS changes.

## 2026-10-29 — Vehicle loading animation

- Added seven monochrome currentColor SVGs: car, pickup, tractor, sugarcane harvester, truck, sugarcane and the brand silhouette based on Logo Abençoada2.png. Added a looping GIF preview in docs/assets/loading-abencoada.gif and usage documentation in docs/loading.md.
- App opening and login validation use the same sequence as scalable SVGs, changing every 450 ms inside a 36 px rotating ring. Reduced-motion preferences show a fixed brand symbol. The build includes the opening indicator before JavaScript starts. Android CI also watches the shared icon module.
- Validation: full application suite and mobile production build passed on the publication branch; browser checks cover the seven frames, reduced motion and login recovery. The GIF contains 63 frames at 20 fps, loops in 3.15 seconds and was visually reviewed. Updated the local architecture map.

## Avisos de envio e conexão no Android

- A confirmação de abastecimento informa o envio e o horário. O aviso de fila usa texto mais curto e a caixa centraliza o conteúdo com espaçamento adaptável.
- O cabeçalho mostra sem conexão ao receber o evento offline. Validação local com os testes de login offline, sincronização, interface móvel e avisos de entrega.
- A confirmação usa **Registro enviado** para abastecimentos, transferências, checklists e ocorrências, inclusive após envio em segundo plano.
