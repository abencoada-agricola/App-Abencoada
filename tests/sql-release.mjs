import assert from 'node:assert/strict';
import {validateSqlRelease} from '../scripts/sql-release-config.mjs';
import {readFile} from 'node:fs/promises';
assert.throws(()=>validateSqlRelease({APP_BACKEND:'sqlserver'}),/SQL_API_URL/);
assert.throws(()=>validateSqlRelease({APP_BACKEND:'sqlserver',REQUIRE_HTTPS:'true',SQL_API_URL:'http://127.0.0.1:4780'}),/HTTPS/);
assert.throws(()=>validateSqlRelease({APP_BACKEND:'sqlserver',REQUIRE_HTTPS:'true',SQL_API_URL:'https://localhost'}),/HTTPS/);
assert.throws(()=>validateSqlRelease({SQL_API_URL:'https://user:secret@example.com'}),/inválido/);
assert.equal(validateSqlRelease({APP_BACKEND:'sqlserver',REQUIRE_HTTPS:'true',SQL_API_URL:'https://api.example.com/'}),'https://api.example.com');
assert.equal(validateSqlRelease({SQL_API_URL:'http://10.0.2.2:4782'}),'http://10.0.2.2:4782');
for(const path of ['.github/workflows/pages.yml','.github/workflows/android.yml']){const workflow=await readFile(path,'utf8');assert(workflow.includes("vars.APP_BACKEND || 'api-v1'"));assert(workflow.includes('API_V1_URL:'));assert(!workflow.includes('SUPABASE_'))}
console.log('SQL-only release guard, HTTPS validation, secret-free URL and workflow selection passed.');
