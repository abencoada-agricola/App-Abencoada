# API Abençoada — solicitação ao provedor

O banco APP_ABENCOADA já foi migrado e validado no servidor 177.234.159.74 (SQL Server 2019). Precisamos hospedar a API deste pacote para que o site e o aplicativo Android deixem de usar Supabase.

Antes de iniciar esta versão da API, com a conexão protegida configurada, execute `node sqlserver/migrate-work-front.mjs`. A migração aditiva inclui a coluna opcional `app.records.work_front` e preserva os abastecimentos existentes. Não basta trocar somente os arquivos da API: a coluna deve existir no banco.

## Ambiente necessário para este pacote

- Windows com Node.js 22 ou posterior e Windows PowerShell 5.1/.NET Framework.
- Conta de serviço com acesso de leitura à pasta e execução do Node/PowerShell.
- Conectividade de saída para SQL Server 177.234.159.74, banco APP_ABENCOADA. O código restringe a conexão ao banco configurado.
- Endereço HTTPS estável, certificado válido e proxy reverso para http://127.0.0.1:4780. Não exponha a porta interna diretamente.
- Serviço com início automático e reinício após falha (IIS/proxy e gerenciador de serviço adotado pelo provedor).

Se a hospedagem só aceitar Linux, PHP ou ASP.NET sem execução de Node/PowerShell, informe antes de instalar: esta versão do pacote depende de Windows e deve ser adaptada ao ambiente disponível.

## Instalação

1. Extraia o pacote em uma pasta de aplicação. Ele não contém senhas, hashes de usuários, dados de negócio ou o arquivo de credencial desta estação.
2. Execute `npm ci --omit=dev --ignore-scripts` na pasta do pacote.
3. Com a mesma conta Windows que executará o serviço, rode `powershell -File configure.ps1 -PublicApiOrigin https://ENDERECO-REAL-DA-API -SqlUser USUARIO-SQL`. Digite a senha somente no prompt protegido. O arquivo de credencial usa DPAPI e não é transferível entre contas/máquinas.
4. Configure um serviço para executar `powershell -NoProfile -File start.ps1`. Configure o proxy HTTPS para a porta interna 4780. Mantenha a conta/pasta protegidas.
5. Confira `https://ENDERECO-REAL-DA-API/health`: deve informar `ok:true` e `database:APP_ABENCOADA`. Teste login real, permissões, consultas e envio idempotente de um registro controlado.
6. Devolva o endereço HTTPS definitivo e o meio de publicação/manutenção. Só então o site e o APK serão gerados e publicados com essa URL.

O arquivo allowed-origins.local.txt contém as origens permitidas. Os padrões incluem a origem da API, https://abencoada-agricola.github.io e https://localhost (Capacitor Android). Altere apenas conforme os domínios reais autorizados. A conexão SQL usa TLS e confiança no certificado do servidor explicitamente autorizada pelo cliente; um certificado SQL validável é preferível quando disponível.

## Limites do pacote

O pacote não modifica a estrutura do banco, não cria usuários SQL e não importa dados: isso já foi feito. Ele usa consultas parametrizadas, sessões locais, hashes de senha, limite de login e validações da API. Não é uma réplica do serviço Supabase. Não exclua o projeto antigo antes da validação e troca do site/APK; a base não tem sincronização automática nem dual-write. Backups e recuperação do SQL Server ficam sob a política do provedor.

A implementação atual serializa operações e carrega tabelas para validar regras. Valide o volume e a concorrência esperados antes de produção e ajuste o desempenho se necessário. Mantenha logs sem senhas/tokens e monitore disponibilidade, erros e backups.
