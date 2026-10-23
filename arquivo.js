/* =====================================================================
 * GABOrg · arquivo.js — aplicação completa (front-end)
 * Secretaria de Estado de Educação de Mato Grosso · Decreto nº 2.236/2026
 * Arquivos do sistema: index.html (tela e estilos) + arquivo.js (este) + Codigo.gs (backend no Apps Script)
 * ===================================================================== */

/* ===================== APP INSTALÁVEL: ÍCONES E MANIFESTO GERADOS AQUI =====================
 * Nada de arquivos extras: os ícones são desenhados num canvas e o manifesto é montado em memória. */
(function prepararApp(){
  function icone(tam, cheio, margem){
    const c = document.createElement('canvas'); c.width = c.height = tam;
    const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, tam);
    gr.addColorStop(0, '#2563eb'); gr.addColorStop(1, '#0e7490'); g.fillStyle = gr;
    const r = cheio ? 0 : tam * .22;
    g.beginPath(); g.moveTo(r, 0); g.arcTo(tam, 0, tam, tam, r); g.arcTo(tam, tam, 0, tam, r); g.arcTo(0, tam, 0, 0, r); g.arcTo(0, 0, tam, 0, r); g.closePath(); g.fill();
    const u = tam * margem, o = (tam - u) / 2, X = v => o + v * u, Y = v => o + v * u;
    g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = Math.max(1.5, u * .045); g.lineCap = 'square';
    g.beginPath(); g.moveTo(X(.5), Y(.3)); g.lineTo(X(.5), Y(.47)); g.moveTo(X(.17), Y(.47)); g.lineTo(X(.83), Y(.47));
    [.17, .5, .83].forEach(x => { g.moveTo(X(x), Y(.47)); g.lineTo(X(x), Y(.62)); }); g.stroke();
    const caixa = (x0, y0, x1, y1) => { const rr = u * .05; g.beginPath(); g.moveTo(X(x0) + rr, Y(y0)); g.arcTo(X(x1), Y(y0), X(x1), Y(y1), rr); g.arcTo(X(x1), Y(y1), X(x0), Y(y1), rr); g.arcTo(X(x0), Y(y1), X(x0), Y(y0), rr); g.arcTo(X(x0), Y(y0), X(x1), Y(y0), rr); g.closePath(); g.fill(); };
    caixa(.30, .08, .70, .32); [.17, .5, .83].forEach(x => caixa(x - .15, .62, x + .15, .86));
    return c.toDataURL('image/png');
  }
  const link = (rel, href, extra) => { const l = document.createElement('link'); l.rel = rel; l.href = href; Object.assign(l, extra || {}); document.head.appendChild(l); };
  try {
    const i192 = icone(192, false, .78), i512 = icone(512, false, .78), iMask = icone(512, true, .62);
    link('icon', icone(32, false, .82), { type:'image/png' });
    link('apple-touch-icon', icone(180, true, .78));
    const base = location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
    const manifesto = {
      name:'GABOrg · Organização Institucional SEDUC-MT', short_name:'GABOrg',
      description:'Setores, hierarquias, valores, impactos e validações da SEDUC-MT, com mapa interativo da estrutura.',
      id:base, start_url:base, scope:base, display:'standalone', orientation:'any',
      background_color:'#0b1222', theme_color:'#0b1222', lang:'pt-BR',
      icons:[{ src:i192, sizes:'192x192', type:'image/png', purpose:'any' }, { src:i512, sizes:'512x512', type:'image/png', purpose:'any' }, { src:iMask, sizes:'512x512', type:'image/png', purpose:'maskable' }]
    };
    link('manifest', 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifesto)));
  } catch (e) {}
})();

'use strict';
/* =====================================================================
   GABOrg · Organização institucional da SEDUC-MT
   Front-end único. Backend: Google Apps Script + Google Sheets (Codigo.gs)
   ===================================================================== */
const VERSAO = '1.16.0';
const NW = 236, NH = 82, GX = 26, GY = 50, GV = 14, IND = 30;

const TIPOS = {
  'Gabinete':           { cor:'#1e3a8a', ic:'fa-landmark', estilo:'cheio' },
  'Superintendência':   { cor:'#2563eb', ic:'fa-sitemap', estilo:'tinto' },
  'Coordenadoria':      { cor:'#0891b2', ic:'fa-diagram-project' },
  'Gerência':           { cor:'#0d9488', ic:'fa-briefcase' },
  'Núcleo':             { cor:'#14b8a6', ic:'fa-circle-nodes' },
  'Unidade':            { cor:'#7c3aed', ic:'fa-cube' },
  'Conselho':           { cor:'#475569', ic:'fa-people-group', estilo:'tinto' },
  'Colegiado':          { cor:'#64748b', ic:'fa-users-rectangle' },
  'Câmara':             { cor:'#78716c', ic:'fa-scale-balanced' },
  'Secretaria':         { cor:'#a16207', ic:'fa-file-signature' },
  'Comissão':           { cor:'#db2777', ic:'fa-handshake' },
  'Ouvidoria':          { cor:'#e11d48', ic:'fa-comments' },
  'Diretoria':          { cor:'#ea580c', ic:'fa-building-columns', estilo:'tinto' },
  'Diretoria Adjunta':  { cor:'#f59e0b', ic:'fa-building' },
  'Núcleo Regional':    { cor:'#65a30d', ic:'fa-location-dot' },
  'Unidades Escolares': { cor:'#16a34a', ic:'fa-school' },
  'Outro':              { cor:'#475569', ic:'fa-shapes' }
};
const STATUS_SETOR = { 'Ativo':'#16a34a', 'Em revisão':'#d97706', 'Proposto':'#2563eb', 'Extinto':'#94a3b8' };
const STATUS_VAL = { 'Sem validação':'#94a3b8', 'Pendente':'#d97706', 'Aprovado':'#16a34a', 'Aprovado com ressalvas':'#0891b2', 'Reprovado':'#dc2626' };
const IMPACTO = [ ['Não avaliado','#94a3b8'], ['Muito baixo','#22c55e'], ['Baixo','#84cc16'], ['Médio','#eab308'], ['Alto','#f97316'], ['Crítico','#dc2626'] ];
const TIPOS_VINCULO = ['Apoio técnico','Supervisão','Fluxo de processos','Colaboração','Atuação regional','Vinculação administrativa'];
const PALETA_AREA = ['#1e3a8a','#0891b2','#7c3aed','#ea580c','#059669','#db2777','#ca8a04','#4f46e5','#0d9488','#9333ea','#64748b','#be123c'];

const CAMPOS = {
  setores: ['id','nome','sigla','tipo','paiId','ordem','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','layout','colunas','dx','dy','atualizadoEm','atualizadoPor','quantidade'],
  validacoes: ['id','setorId','validadorId','status','parecer','solicitadoEm','solicitadoPor','respondidoEm','respondidoPor'],
  vinculos: ['id','origemId','destinoId','tipo','descricao'],
  historico: ['id','setorId','data','usuario','acao'],
  rubricas: ['id','codigo','nome','categoria','valorMensal','encargos','meses','observacao','ativo','atualizadoEm','atualizadoPor','percEfetivo','fonte'],
  despesas: ['id','setorId','rubricaId','descricao','quantidade','valorUnitario','meses','cenario','observacao','atualizadoEm','atualizadoPor','vinculo'],
  propostas: ['id','nome','descricao','status','itens','criadoEm','criadoPor','atualizadoEm','atualizadoPor'],
  propSetores: ['id','propostaId','setorId','nome','sigla','tipo','paiId','ordem','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','layout','colunas','dx','dy','atualizadoEm','atualizadoPor','quantidade','excluido'],
  escolas: ['id','codigo','nome','dre','municipio','tipo','localidade','endereco','numero','cep','bairro','telefone','email','latitude','longitude','atualizadoEm','atualizadoPor']
};
const TABS_DB = ['setores','validacoes','vinculos','historico','rubricas','despesas','propostas','propSetores','escolas'];

/* ===================== ESTRUTURA DO DECRETO Nº 2.236/2026 =====================
   Hierarquia montada a partir do anexo (organograma). Cada nível = 2 espaços.
   [SIGLA] opcional · {h6} = filhos lado a lado em até 6 colunas · {v} = filhos em lista */
const SEED_TXT = `
Gabinete do Secretário de Estado de Educação [GS] {h8}
  Colégio Diretivo Estratégico
  Colégio de Avaliação das Estratégias
  Comitês Setoriais
  Conselho Estadual de Alimentação Escolar [CEAE]
  Conselho Estadual de Educação Indígena [CEEI]
  Núcleo de Gestão Estratégica para Resultados [NGER]
  Unidade de Desenvolvimento Organizacional
  Unidade de Comunicação da Educação
  Unidade Setorial PGE
  Ouvidoria Setorial
  Comissão de Ética
  Unidade Setorial de Correição
  Unidade Setorial de Controle Interno [UNISECI]
  Unidade de Apoio Estratégico
  Gabinete de Direção
  Unidade de Assessoria
  Conselho Estadual de Educação [CEE]
    Secretaria do Conselho
    Coordenadoria de Apoio às Câmaras
      Câmara de Educação Básica
      Câmara de Educação Profissional e Ensino Superior
    Coordenadoria de Suporte Operacional
  Gabinete do Secretário Adjunto Executivo [SAEX]
    Unidade de Coordenação do Programa
    Unidade de Cerimonial
    Unidade de Microplanejamento
    Unidade Executiva e de Negócios da Secretaria Adjunta Executiva
    Unidade de Normas da Secretaria Adjunta Executiva
    Unidade de Inteligência de Dados na Educação
    Superintendência de Tecnologia da Informação [STI]
      Coordenadoria de Desenvolvimento de Soluções de TI
        Núcleo de Análise e Desenvolvimento de Soluções de TI
        Núcleo de Inteligência de Negócios
        Núcleo de Tecnologias Educacionais
      Coordenadoria de Infraestrutura e Segurança da Informação
        Núcleo de Infraestrutura de TI
        Núcleo de Suporte Técnico de TI
        Núcleo de Serviços de TI
        Núcleo de Segurança da Informação e Proteção de Dados
    Superintendência de Escolas Estaduais Militares e Cívico-Militares
      Núcleo de Escolas Estaduais Militares
      Núcleo de Escolas Estaduais Cívico-Militares
  Gabinete do Secretário Adjunto de Gestão de Pessoas [SAGP]
    Unidade Executiva e de Negócio da Gestão de Pessoas
    Unidade de Normas da Gestão de Pessoas
    Unidade de Políticas de Formação Continuada
    Superintendência de Provimento e Movimentação
      Coordenadoria de Provimento
        Núcleo de Quadro de Pessoal
      Coordenadoria de Movimentação
      Coordenadoria de Recrutamento e Seleção
        Núcleo de Seletivos
    Superintendência de Desenvolvimento, Aplicação, Saúde e Segurança
      Coordenadoria de Saúde e Segurança
      Coordenadoria de Aplicação e Vida Funcional
        Núcleo de Progressão e Enquadramento Funcional
        Núcleo de Informação da Vida Funcional
      Coordenadoria de Desenvolvimento
        Núcleo de e-Formação e Mídia
        Núcleo de Monitoramento da Qualificação Profissional
        Núcleo de Estágio e Residência
        Núcleo de Logística de Formação
    Superintendência de Monitoramento e Folha de Pagamento
      Coordenadoria de Controle de Despesa e Conformidade da Folha
        Núcleo de Conformidade da Folha
        Núcleo de Controle de Despesas de Pessoal
        Núcleo de Impacto Pessoal
      Coordenadoria de Monitoramento de Pessoal
        Núcleo de Gestão da Assiduidade
  Gabinete do Secretário Adjunto de Infraestrutura e Patrimônio [SAIP]
    Unidade Executiva e de Negócio da Infraestrutura e Patrimônio
    Unidade de Normas da Infraestrutura e Patrimônio
    Superintendência de Patrimônio
      Coordenadoria de Patrimônio Imobiliário
        Núcleo de Patrimônio Imobiliário
      Coordenadoria de Patrimônio Mobiliário
        Núcleo de Patrimônio Mobiliário
    Superintendência de Obras
      Coordenadoria de Execução de Obras
        Núcleo de Fiscalização de Obras
      Coordenadoria de Projetos e Manutenção
        Núcleo de Desenvolvimento de Projetos
        Núcleo de Manutenção
        Núcleo de Infraestrutura
  Gabinete do Secretário Adjunto de Administração Sistêmica [SAAS]
    Unidade Executiva e de Negócio da Administração Sistêmica
    Unidade de Normas da Administração Sistêmica
    Superintendência de Aquisições e Contratos
      Coordenadoria de Gestão de Aquisições
      Coordenadoria de Gestão de Contratos
        Núcleo de Processo de Irregularidade Contratual
        Núcleo de Conformidade de Pagamentos de Contratos
    Superintendência de Finanças
      Coordenadoria de Orçamento
        Núcleo de Conformidade
      Coordenadoria Financeira
        Núcleo de Receita
    Superintendência Contábil
      Gerência de Informações Contábeis
      Gerência de Prestação e Conformidade
      Gerência de Sistema de Informação Orçamentário Público da Educação
    Superintendência Administrativa
      Coordenadoria Administrativa
        Gerência de Protocolo
        Gerência de Arquivo Central
        Núcleo de Serviços Gerais
      Núcleo de Frotas
    Superintendência de Convênios e Prestação de Contas
      Coordenadoria de Convênios e Prestação de Contas
        Núcleo de Convênios de Ingresso
        Núcleo de Convênios de Descentralização
        Núcleo de Análise de Projetos de Descentralização
        Núcleo de Prestação de Contas
        Núcleo de Prestação de Contas de Diárias
  Gabinete do Secretário Adjunto de Gestão Educacional [SAGE]
    Unidade Executiva e de Negócio da Gestão Educacional
    Unidade de Normas da Gestão Educacional
    Unidade de Cenários e Indicadores da Gestão Educacional
    Superintendência de Desenvolvimento Curricular
      Coordenadoria de Ensino Fundamental
      Coordenadoria de Ensino Médio
      Coordenadoria de Educação de Jovens e Adultos
      Coordenadoria de Educação Integrada e Inovação
      Núcleo de Currículo
      Núcleo do Sistema Estruturado de Ensino no Ensino Fundamental
      Núcleo do Sistema Estruturado de Ensino no Ensino Médio
    Superintendência de Equidade e Inclusão
      Coordenadoria de Educação Inclusiva
        Centro de Apoio e Suporte à Inclusão da Educação Especial [CASIES]
      Coordenadoria de Educação Escolar Indígena
      Coordenadoria de Educação Étnico-Racial e Ambiental
    Superintendência de Avaliação de Educação Básica
      Coordenadoria de Monitoramento e Avaliação Educacional
        Núcleo de Análise da Aprendizagem
      Coordenadoria de Gestão para Aprendizagem
        Núcleo de Recomposição das Aprendizagens
        Núcleo de Acompanhamento de Prioridades Pedagógicas
    Superintendência de Educação Profissional, Tecnológica e Tempo Integral
      Coordenadoria de Educação Profissional Tecnológica
      Coordenadoria de Educação em Tempo Integral
  Gabinete do Secretário Adjunto de Gestão Regional [SAGR] {h5}
    Unidade Executiva e de Negócio da Gestão Regional
    Unidade de Normas da Gestão Regional
    Unidade de Cenários da Gestão Regional
    Unidades Escolares
    Superintendência de Gestão Regional
      Núcleo de Monitoramento das DREs
    Superintendência de Gestão Escolar
      Coordenadoria de Gestão da Rede
        Núcleo de Estrutura e Funcionamento de Gestão Escolar
        Núcleo de Mediação Escolar
        Núcleo de Gestão de Repasses
        Núcleo de Escrituração
        Núcleo de Matrículas
        Núcleo de Bem-Estar Escolar
        Núcleo de Busca Ativa Escolar
      Coordenadoria de Alimentação Escolar
        Núcleo de Gestão das Aquisições da Alimentação Escolar
        Núcleo de Nutrição e Monitoramento
  Gabinete do Secretário Adjunto de Regime de Colaboração [SARC]
    Unidade Executiva e de Negócio do Regime de Colaboração
    Unidade de Normas do Regime de Colaboração
    Superintendência de Alfabetização em Regime de Colaboração
      Coordenadoria de Impacto Educacional
      Núcleo de Apoio e Desenvolvimento da Educação Infantil
      Núcleo de Apoio e Desenvolvimento da Alfabetização e Anos Iniciais
      Núcleo de Apoio e Desenvolvimento à Gestão Municipal
      Núcleo Educa-MT
      Núcleo de Análise e Monitoramento de Indicadores
    Superintendência de Políticas em Regime de Colaboração
      Coordenadoria de Transporte Escolar
      Núcleo de Informações Estatísticas
      Núcleo de Regime de Colaboração
`;
const DRES = [
  ['Rondonópolis', []], ['Sinop', ['Colíder','Lucas do Rio Verde']], ['Barra do Garças', ['Campinápolis','Canarana','Água Boa','Querência']],
  ['Cáceres', []], ['Confresa', ['Santa Terezinha','São Félix do Araguaia','São José do Xingu']], ['Diamantino', ['Nova Mutum']],
  ['Juína', ['Aripuanã','Cotriguaçu','Juara','Colniza']], ['Primavera do Leste', ['Paranatinga']], ['Tangará da Serra', []],
  ['Alta Floresta', ['Apiacás']], ['Matupá', []], ['Pontes e Lacerda', ['Rondolândia']]
];
const COORDS_DRE = ['Coordenadoria de Formação Continuada','Coordenadoria de Gestão Pedagógica','Coordenadoria de Gestão Escolar e de Rede','Coordenadoria Administrativa e Financeira','Coordenadoria de Gestão de Pessoas','Coordenadoria de Infraestrutura, Patrimônio e TI'];

function tipoPorNome(n){
  const t = norm(n);
  const r = [['gabinete','Gabinete'],['superintend','Superintendência'],['coordenadoria','Coordenadoria'],['nucleo regional','Núcleo Regional'],['nucleo','Núcleo'],['gerencia','Gerência'],['unidades escolares','Unidades Escolares'],['unidade','Unidade'],['centro','Unidade'],['conselho','Conselho'],['colegio','Colegiado'],['comite','Colegiado'],['camara','Câmara'],['secretaria','Secretaria'],['comissao','Comissão'],['ouvidoria','Ouvidoria'],['diretoria adjunta','Diretoria Adjunta'],['diretoria','Diretoria']];
  for (const [p,tp] of r) if (t.startsWith(p)) return tp;
  return 'Outro';
}
const ESCOLAS_PADRAO = '631';
const rotuloUnid = s => s.tipo === 'Unidades Escolares' ? 'escolas' : 'unidades';
function construirDecreto(){
  const L = [], V = []; let seq = 0;
  const add = (nome, pai, extra) => { const s = novoSetor(Object.assign({ id:'d'+String(++seq).padStart(3,'0'), nome, tipo:tipoPorNome(nome), paiId:pai||'', ordem:String(seq) }, extra||{})); L.push(s); return s.id; };
  const pilha = [], ref = {};
  SEED_TXT.split('\n').forEach(l => {
    if (!l.trim()) return;
    const m = l.match(/^( *)(.+?)(?: \[([^\]]+)\])?(?: \{([hv])(\d*)\})?\s*$/);
    const nivel = m[1].length / 2; pilha.length = nivel;
    const id = add(m[2], nivel ? pilha[nivel-1] : '', { sigla:m[3]||'', layout:m[4]||'', colunas:m[5]||'' });
    pilha[nivel] = id; ref[m[2]] = id;
  });
  const gr = ref['Gabinete do Secretário Adjunto de Gestão Regional'];
  const pol = ref['Superintendência de Políticas em Regime de Colaboração'];
  const met = add('Diretoria Metropolitana de Educação', gr, { sigla:'DME' });
  ['Conselho Deliberativo','Conselho Fiscal','Unidade de Assessoria'].forEach(n => add(n, met));
  const a1 = add('Diretoria Adjunta Metropolitana de Educação I', met); COORDS_DRE.forEach(n => add(n, a1));
  add('Diretoria Adjunta Metropolitana de Educação II', met);
  let nv = 0;
  DRES.forEach(([cid, nucs]) => {
    const d = add('Diretoria Regional de Educação de ' + cid, gr, { sigla:'DRE ' + cid });
    ['Conselho Deliberativo','Conselho Fiscal','Unidade de Assessoria'].forEach(n => add(n, d));
    const ad = add('Diretoria Adjunta Regional de ' + cid, d); COORDS_DRE.forEach(n => add(n, ad));
    nucs.forEach(n => add('Núcleo Regional de Educação de ' + n, d));
    const nrc = add('Núcleo de Regime de Colaboração da Diretoria Regional de ' + cid, pol);
    V.push(novoReg('vinculos', { id:'dv'+String(++nv).padStart(3,'0'), origemId:nrc, destinoId:d, tipo:'Atuação regional', descricao:'Atua junto à DRE de ' + cid + ' no regime de colaboração com os municípios.' }));
  });
  L.forEach(s => { if (s.tipo === 'Unidades Escolares' && !s.quantidade) s.quantidade = ESCOLAS_PADRAO; });
  return { setores:L, vinculos:V, validacoes:[], historico:[], rubricas:[], despesas:[], propostas:[], propSetores:[], escolas:[] };
}

/* ===================== UTILITÁRIOS ===================== */
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const num = v => { const n = Number(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
const arg = v => esc(JSON.stringify(String(v ?? '')));
const agora = () => new Date().toISOString();
const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const fmtN = v => num(v).toLocaleString('pt-BR');
const fmtR = v => num(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const fmtRc = v => { const n = num(v); if (n >= 1e9) return 'R$ ' + (n/1e9).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' bi'; if (n >= 1e6) return 'R$ ' + (n/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1}) + ' mi'; if (n >= 1e3) return 'R$ ' + (n/1e3).toLocaleString('pt-BR',{maximumFractionDigits:0}) + ' mil'; return fmtR(n); };
const fmtData = v => { const t = Date.parse(v); return isFinite(t) ? new Date(t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'; };
const iniciais = n => { const p = String(n||'').trim().split(/\s+/).filter(Boolean); return p.length ? (p[0][0] + (p.length > 1 ? p[p.length-1][0] : '')).toUpperCase() : '?'; };
function parseValor(v){
  let t = String(v ?? '').replace(/R\$|\s/g, '');
  if (!t) return '';
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t); return isFinite(n) ? String(n) : '';
}
const linhasDe = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
const store = {
  get(k, p){ try { const v = localStorage.getItem(k); return v === null ? p : JSON.parse(v); } catch(e){ return p; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
function novoReg(tab, o){ const r = {}; CAMPOS[tab].forEach(k => r[k] = ''); Object.assign(r, o || {}); Object.keys(r).forEach(k => r[k] = r[k] == null ? '' : String(r[k])); return r; }
function novoSetor(o){ return novoReg('setores', Object.assign({ status:'Ativo' }, o)); }
let toastT;
function toast(msg, tipo){
  const t = $('#toast'); t.querySelector('span').textContent = msg;
  t.querySelector('i').className = 'fa-solid ' + (tipo === 'erro' ? 'fa-circle-xmark' : tipo === 'aviso' ? 'fa-triangle-exclamation' : 'fa-circle-check');
  t.querySelector('i').style.color = tipo === 'erro' ? '#f87171' : tipo === 'aviso' ? '#fbbf24' : '#4ade80';
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}
function confirmar(titulo, texto, rotulo, perigo){
  return new Promise(ok => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="cx" role="dialog" aria-modal="true"><h3>${esc(titulo)}</h3><p>${texto}</p><div class="acoes"><button class="btn btn-s" data-r="0">Cancelar</button><button class="btn ${perigo ? 'btn-perigo' : 'btn-p'}" data-r="1">${esc(rotulo || 'Confirmar')}</button></div></div>`;
    m.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === m){ m.remove(); ok(!!(b && b.dataset.r === '1')); } });
    document.body.appendChild(m); m.querySelector('[data-r="1"]').focus();
  });
}

/* ===================== ESTADO ===================== */
let DB = { setores:[], validacoes:[], vinculos:[], historico:[], rubricas:[], despesas:[], propostas:[], propSetores:[], escolas:[] };
let backendVersao = '';
const URL_PADRAO = 'https://script.google.com/macros/s/AKfycbzZsM71FJARYYoqpRcFY4tHUAVBV-EdVW2NDL6eLaMId-iXY6Z-bnhuOkxA2nyfrdUz/exec';
let cfg = Object.assign({ url:URL_PADRAO, login:'', usuario:'', perfil:'', modo:'' }, store.get('gaborg_cfg', {}));
if (!cfg.url) cfg.url = URL_PADRAO;
delete cfg.chave;
// Token de sessão: localStorage com "Manter conectado", senão só nesta aba (sessionStorage)
const sessao = {
  get(){ try { return sessionStorage.getItem('gaborg_token') || localStorage.getItem('gaborg_token') || ''; } catch (e) { return ''; } },
  set(t, lembrar){ try { sessionStorage.removeItem('gaborg_token'); localStorage.removeItem('gaborg_token'); if (t) (lembrar ? localStorage : sessionStorage).setItem('gaborg_token', t); } catch (e) {} },
  lembrado(){ try { return !!localStorage.getItem('gaborg_token'); } catch (e) { return false; } }
};
cfg.token = sessao.get();
const ehAdmin = () => cfg.perfil === 'Administrador';
const somenteLeitura = () => cfg.perfil !== 'Administrador' && cfg.perfil !== 'Editor';
let porId = new Map(), filhos = new Map(), prof = new Map(), areaDe = new Map(), areas = [], valPorSetor = new Map();
let abertos = new Set(store.get('gaborg_abertos', []));
let listaAbertos = new Set(store.get('gaborg_lista_abertos', []));
let selId = '', abaPainel = 'dados', vistaAtual = 'mapa';

function indexar(){
  porId = new Map(DB.setores.map(s => [s.id, s]));
  filhos = new Map([['', []]]);
  DB.setores.forEach(s => { const p = porId.has(s.paiId) && s.paiId !== s.id ? s.paiId : ''; if (!filhos.has(p)) filhos.set(p, []); filhos.get(p).push(s); });
  filhos.forEach(l => l.sort((a, b) => num(a.ordem) - num(b.ordem) || a.nome.localeCompare(b.nome, 'pt-BR')));
  prof = new Map(); areaDe = new Map(); areas = [];
  const visit = (s, d, area) => {
    if (prof.has(s.id)) return;
    prof.set(s.id, d); areaDe.set(s.id, area);
    if (d === 1) areas.push(s.id);
    (filhos.get(s.id) || []).forEach(k => visit(k, d + 1, d === 0 ? k.id : area));
  };
  filhos.get('').forEach(r => visit(r, 0, r.id));
  // Ciclos criados por edição manual na planilha: ficam como raiz
  DB.setores.forEach(s => { if (!prof.has(s.id)) { s.paiId = ''; filhos.get('').push(s); visit(s, 0, s.id); } });
  valPorSetor = new Map();
  DB.validacoes.forEach(v => { if (!valPorSetor.has(v.setorId)) valPorSetor.set(v.setorId, []); valPorSetor.get(v.setorId).push(v); });
  atualizarBadgeVal();
}
const raizes = () => filhos.get('') || [];
const filhosDe = id => filhos.get(id) || [];
function descendentes(id, acc = new Set()){ filhosDe(id).forEach(k => { if (!acc.has(k.id)) { acc.add(k.id); descendentes(k.id, acc); } }); return acc; }
function caminho(id){ const r = []; let s = porId.get(id), g = 0; while (s && s.paiId && porId.has(s.paiId) && g++ < 60){ s = porId.get(s.paiId); r.unshift(s); } return r; }
function statusVal(id){
  const l = valPorSetor.get(id) || [];
  if (!l.length) return 'Sem validação';
  if (l.some(v => v.status === 'Reprovado')) return 'Reprovado';
  if (l.some(v => !v.status || v.status === 'Pendente')) return 'Pendente';
  if (l.some(v => v.status === 'Aprovado com ressalvas')) return 'Aprovado com ressalvas';
  return 'Aprovado';
}
const corTipo = t => (TIPOS[t] || TIPOS.Outro).cor;
const icTipo = t => (TIPOS[t] || TIPOS.Outro).ic;
function corArea(id){ const i = areas.indexOf(id); return i < 0 ? '#1e3a8a' : PALETA_AREA[i % PALETA_AREA.length]; }
function nomeCurto(s){ if (!s) return '—'; return s.sigla ? s.sigla : s.nome.replace(/^Gabinete do Secretário Adjunto (de |do )?/, 'SA ').replace(/^Gabinete do Secretário de Estado de Educação$/, 'Gabinete do Secretário'); }
function somaSub(id){
  const ids = [id, ...descendentes(id)]; const r = { servidores:0, comissionados:0, orcamento:0, custoMensal:0, setores:ids.length };
  ids.forEach(i => { const s = porId.get(i); if (!s || s.status === 'Extinto') return; ['servidores','comissionados','orcamento','custoMensal'].forEach(k => r[k] += num(s[k])); });
  return r;
}

/* ===================== PERSISTÊNCIA LOCAL ===================== */
let tLocal;
function salvarLocal(){ clearTimeout(tLocal); tLocal = setTimeout(() => store.set('gaborg_db', Object.assign({}, DB, { setores:setoresOficiais() })), 400); }
const salvarAbertos = () => { store.set('gaborg_abertos', [...abertos]); };

/* ===================== NUVEM (APPS SCRIPT) ===================== */
let fila = store.get('gaborg_fila', []);
let enviando = false, tFila, versaoNuvem = '', ultimoErro = '';
const online = () => cfg.modo === 'nuvem' && !!cfg.url && !!cfg.token;

async function chamar(body, ms = 45000){
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(cfg.url, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body:JSON.stringify(Object.assign({ token:cfg.token }, body)), redirect:'follow', signal:ctrl.signal });
    const txt = await r.text();
    if (txt.trim().startsWith('<')) throw new Error('O Google devolveu uma página de login. Publique o Apps Script com acesso "Qualquer pessoa".');
    const j = JSON.parse(txt);
    if (j.code === 'AUTH' && body.action !== 'login') sessaoEncerrada(j.message);
    else if (j.code === 'TROCAR_SENHA') setTimeout(() => modalTrocarSenha(true), 0);
    return j;
  } catch (e) { if (e.name === 'AbortError') throw new Error('A planilha demorou demais para responder.'); throw e; }
  finally { clearTimeout(t); }
}
async function lerNuvem(){
  const r = await chamar({ action:'read' }, 60000);
  const voltar = cenSwap; if (cenSwap) desaplicarCenario();
  if (r.status !== 'success') throw new Error(r.message || 'Falha ao ler a planilha.');
  if (r.usuario) aplicarUsuario(r.usuario);
  const d = r.dados || {};
  TABS_DB.forEach(t => { DB[t] = (d[t] || []).map(x => novoReg(t, x)); });
  versaoNuvem = String(r.versao || ''); backendVersao = String(r.backend || '');
  aplicarFilaNaMemoria();
  indexar(); salvarLocal();
  if (voltar && cenMapa) aplicarCenario();
}
function enfileirar(table, record, del){
  if (table === 'setores' && cenSwap) return salvarOverride(record, del);
  salvarLocal();
  if (!online()) return statusSync();
  fila.push({ op: del ? 'delete' : 'upsert', table, record: del ? { id:record.id } : Object.assign({}, record) });
  store.set('gaborg_fila', fila);
  clearTimeout(tFila); tFila = setTimeout(enviarFila, 700); statusSync();
}
function compactar(ops){
  const ult = new Map(); ops.forEach((o, i) => ult.set(o.table + '|' + o.record.id, i));
  return ops.filter((o, i) => ult.get(o.table + '|' + o.record.id) === i);
}
async function enviarFila(){
  if (enviando || !fila.length || !online()) return;
  enviando = true; statusSync();
  const n = Math.min(fila.length, 500);
  try {
    const r = await chamar({ action:'batch', ops:compactar(fila.slice(0, n)) });
    if (r.status !== 'success') throw new Error(r.message || 'A planilha recusou a gravação.');
    fila.splice(0, n); store.set('gaborg_fila', fila);
    if (r.versao) versaoNuvem = String(r.versao);
    ultimoErro = '';
  } catch (e) {
    ultimoErro = e.message || 'Sem conexão';
    setTimeout(enviarFila, 10000);
  }
  enviando = false; statusSync();
  if (fila.length && !ultimoErro) setTimeout(enviarFila, 200);
}
function aplicarFilaNaMemoria(){
  fila.forEach(o => {
    const l = DB[o.table]; if (!l) return;
    const i = l.findIndex(x => x.id === o.record.id);
    if (o.op === 'delete') { if (i >= 0) l.splice(i, 1); }
    else if (i >= 0) l[i] = Object.assign(l[i], o.record); else l.push(novoReg(o.table, o.record));
  });
}
function statusSync(){
  const el = $('#sync'); if (!el) return;
  let c, t;
  if (!online()) { c = 'local'; t = 'Desconectado'; }
  else if (ultimoErro) { c = 'erro'; t = 'Sem gravar: ' + ultimoErro; }
  else if (enviando || fila.length) { c = 'env'; t = `Enviando ${fila.length} alteração(ões)...`; }
  else { c = 'ok'; t = 'Planilha sincronizada'; }
  el.className = 'sync ' + c; el.querySelector('span').textContent = t; el.title = t;
}
// Alterações de outras pessoas: confere a versão a cada 20 s
setInterval(async () => {
  if (!online() || document.hidden || fila.length || enviando) return;
  try {
    const r = await chamar({ action:'version' }, 15000);
    if (r.status === 'success' && r.versao && String(r.versao) !== versaoNuvem && !document.querySelector('#painel :focus')) {
      await lerNuvem(); redesenharTudo(); toast('Estrutura atualizada com alterações de outra pessoa.');
    }
  } catch (e) {}
}, 20000);
window.addEventListener('beforeunload', e => { if (fila.length) { e.preventDefault(); e.returnValue = ''; } });

/* ===================== HISTÓRICO E ALTERAÇÕES ===================== */
function registrar(setorId, acao){
  if (cenSwap) return; // edições numa proposta não entram no histórico oficial
  const h = novoReg('historico', { id:novoId('h'), setorId, data:agora(), usuario:cfg.usuario || 'Usuário', acao });
  DB.historico.unshift(h); if (DB.historico.length > 3000) DB.historico.length = 3000;
  enfileirar('historico', h);
}
const ROTULOS = { quantidade:'Unidades representadas', nome:'Nome', sigla:'Sigla', tipo:'Tipo', paiId:'Setor superior', status:'Situação', responsavel:'Responsável', contato:'Contato', competencias:'Competências', entregas:'Entregas', orcamento:'Orçamento anual', custoMensal:'Custo mensal', servidores:'Servidores', comissionados:'Cargos comissionados', impacto:'Impacto', impactoDescricao:'Descrição do impacto', positivos:'Pontos positivos', negativos:'Pontos negativos', layout:'Disposição dos subordinados', colunas:'Colunas', ordem:'Ordem' };
const ESTRUTURAIS = ['paiId','layout','colunas','ordem','nome','tipo','status','dx','dy'];
function alterar(s, campo, valor, silencioso){
  valor = String(valor ?? '');
  if (s[campo] === valor) return;
  const antes = s[campo]; s[campo] = valor;
  s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || '';
  enfileirar('setores', s);
  if (!silencioso && ROTULOS[campo]) {
    let txt = ROTULOS[campo] + ' alterado';
    if (campo === 'paiId') txt = `Subordinado a ${porId.get(valor) ? porId.get(valor).nome : '(raiz)'}`;
    else if (['nome','sigla','tipo','status','responsavel','impacto','servidores','comissionados','orcamento','custoMensal'].includes(campo)) txt += `: ${antes || '—'} → ${valor || '—'}`;
    registrar(s.id, txt);
  }
  if (ESTRUTURAIS.includes(campo) || campo === 'impacto') indexar();
  atualizarVistaAtual();
}

/* ===================== LAYOUT DO MAPA ===================== */
let caixas = new Map(), modos = new Map(), pos = new Map(), visiveis = [], origemRaiz = new Map();
const temFilhos = id => filhosDe(id).length > 0;
const filhosVis = id => abertos.has(id) ? filhosDe(id) : [];
function modoDe(s, d){ return s.layout === 'h' || s.layout === 'v' ? s.layout : (d === 0 ? 'h' : 'v'); }
function medir(s, d){
  const ks = d > 40 ? [] : filhosVis(s.id), m = modoDe(s, d); modos.set(s.id, m);
  const b = { w:NW, h:NH, nx:0, rel:new Map() };
  if (ks.length) {
    ks.forEach(k => medir(k, d + 1));
    if (m === 'v') {
      let y = NH + GV + 6, w = NW;
      ks.forEach(k => { const c = caixas.get(k.id); b.rel.set(k.id, { x:IND, y }); y += c.h + GV + (abertos.has(k.id) && temFilhos(k.id) ? 6 : 0); w = Math.max(w, IND + c.w); });
      b.w = w; b.h = y - GV;
    } else {
      const folhas = ks.filter(k => !temFilhos(k.id)), ramos = ks.filter(k => temFilhos(k.id));
      const cf = Math.min(folhas.length, s.layout === 'h' && num(s.colunas) && !ramos.length ? num(s.colunas) : 4) || 1;
      const gw = folhas.length ? cf * NW + (cf - 1) * GX : 0;
      const maxC = Math.max(1, num(s.colunas) || 6);
      const linhas = []; for (let i = 0; i < ramos.length; i += maxC) linhas.push(ramos.slice(i, i + maxC));
      const lw = linhas.map(l => l.reduce((a, k) => a + caixas.get(k.id).w, 0) + (l.length - 1) * GX);
      b.w = Math.max(NW, gw, ...lw); b.nx = (b.w - NW) / 2;
      let y = NH + GY;
      if (folhas.length) {
        const x0 = (b.w - gw) / 2;
        folhas.forEach((k, i) => b.rel.set(k.id, { x:x0 + (i % cf) * (NW + GX) - caixas.get(k.id).nx, y:y + Math.floor(i / cf) * (NH + GV + 8) }));
        y += Math.ceil(folhas.length / cf) * (NH + GV + 8) - GV - 8 + GY;
      }
      linhas.forEach((l, i) => { let x = (b.w - lw[i]) / 2, hm = 0; l.forEach(k => { const c = caixas.get(k.id); b.rel.set(k.id, { x, y }); x += c.w + GX; hm = Math.max(hm, c.h); }); y += hm + GY + 10; });
      b.h = y - GY - 10;
    }
  }
  caixas.set(s.id, b); return b;
}
function posicionar(s, ox, oy){
  const b = caixas.get(s.id), dx = num(s.dx), dy = num(s.dy);
  pos.set(s.id, { x:ox + b.nx + dx, y:oy + dy }); visiveis.push(s);
  b.rel.forEach((r, kid) => posicionar(porId.get(kid), ox + dx + r.x, oy + dy + r.y));
}
function calcularLayout(){
  caixas = new Map(); modos = new Map(); origemRaiz = new Map();
  let x = 0;
  raizes().forEach(r => { medir(r, 0); origemRaiz.set(r.id, x); x += caixas.get(r.id).w + 140; });
  reposicionar();
}
function reposicionar(){
  pos = new Map(); visiveis = [];
  raizes().forEach(r => posicionar(r, origemRaiz.get(r.id) || 0, 0));
}

/* ===================== DESENHO DO MAPA ===================== */
let view = store.get('gaborg_view', { x:60, y:90, k:.8 });
const elNo = new Map();
function corDe(s){
  const m = $('#m-cor').value;
  if (m === 'area') return corArea(areaDe.get(s.id));
  if (m === 'validacao') return STATUS_VAL[statusVal(s.id)];
  if (m === 'impacto') return IMPACTO[num(s.impacto)] ? IMPACTO[num(s.impacto)][1] : IMPACTO[0][1];
  if (m === 'status') return STATUS_SETOR[s.status] || '#64748b';
  return corTipo(s.tipo);
}
function cardHTML(s){
  const p = pos.get(s.id), n = filhosDe(s.id).length, ab = abertos.has(s.id);
  const estilo = $('#m-cor').value === 'tipo' ? ((TIPOS[s.tipo] || {}).estilo || '') : (prof.get(s.id) === 0 ? 'cheio' : '');
  const sv = statusVal(s.id), imp = num(s.impacto);
  const ser = num(s.servidores);
  const mk = s._marcas && s._marcas.length ? [...new Set(s._marcas)] : [], qt = num(s.quantidade);
  return `<div class="no ${qt ? 'grupo' : ''} ${estilo} ${s.status === 'Extinto' ? 'extinto' : ''} ${modos.get(s.id) === 'v' ? 'v-mode' : ''} ${s.id === selId ? 'sel' : ''} ${multi.has(s.id) ? 'msel' : ''} ${mk.length ? 'cen-m cen-' + mk[0] : ''}" data-id="${esc(s.id)}" style="--c:${corDe(s)};--d:${Math.min(prof.get(s.id) || 0, 8)};transform:translate(${p.x}px,${p.y}px)" title="${esc(s.nome)}">
    <div class="no-tipo"><i class="fa-solid ${icTipo(s.tipo)}"></i>${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</div>
    <div class="no-nome">${esc(s.nome)}</div>
    ${qt ? `<span class="no-qt" title="${fmtN(qt)} ${rotuloUnid(s)} representadas neste cartão"><b>${fmtN(qt)}</b>${rotuloUnid(s)}</span>` : ''}
    <div class="no-pe"><span class="r">${qt ? '' : s.responsavel ? '<i class="fa-solid fa-user"></i> ' + esc(s.responsavel) : 'Sem responsável'}</span>${ser ? `<span><i class="fa-solid fa-users"></i> ${fmtN(ser)}</span>` : ''}${imp ? `<span class="p" style="background:${IMPACTO[imp][1]}" title="Impacto: ${IMPACTO[imp][0]}"></span>` : ''}${sv !== 'Sem validação' ? `<span class="p" style="background:${STATUS_VAL[sv]};border-radius:2px" title="Validação: ${sv}"></span>` : ''}</div>
    ${mk.length ? `<span class="cen-tags">${marcasHTML(s)}</span>` : ''}
    ${n ? `<button class="no-exp ${ab ? 'aberto' : ''}" data-exp title="${ab ? 'Recolher' : 'Mostrar'} ${n} subordinado(s)">${ab ? '<i class="fa-solid fa-minus"></i>' : n}</button>` : ''}
  </div>`;
}
function desenharMapa(){
  if (vistaAtual !== 'mapa') return;
  preencherCenarios();
  if (cenSwap) remarcarCenario();
  desenharMapaBase();
}
let primeiroDesenho = true;
function desenharMapaBase(){
  if (typeof terminarAnimMapa === 'function') terminarAnimMapa();
  const antes = new Map(pos), elsAntigos = new Map(elNo);
  calcularLayout();
  $('#nos').innerHTML = visiveis.map(cardHTML).join('');
  elNo.clear(); document.querySelectorAll('#nos .no').forEach(el => elNo.set(el.dataset.id, el));
  if (primeiroDesenho && typeof semMovimento === 'function' && !semMovimento()) { $('#nos').classList.add('entrando'); setTimeout(() => $('#nos').classList.remove('entrando'), 1400); }
  desenharArestas(); aplicarView(); desenharLegenda(); desenharMini(); atualizarBarraSel();
  if (!primeiroDesenho && typeof animarLayout === 'function') animarLayout(antes, elsAntigos);
  primeiroDesenho = false;
}
function caminhoAresta(p, c){
  const a = pos.get(p.id), b = pos.get(c.id);
  if (modos.get(p.id) === 'v') {
    const x1 = a.x + 16, y1 = a.y + NH, y2 = b.y + NH / 2, r = Math.min(10, Math.abs(y2 - y1) / 2);
    return `M${x1},${y1} V${y2 - r} Q${x1},${y2} ${x1 + r},${y2} H${b.x}`;
  }
  const x1 = a.x + NW / 2, y1 = a.y + NH, x2 = b.x + NW / 2, y2 = b.y, k = Math.max(26, Math.abs(y2 - y1) / 2);
  return `M${x1},${y1} C${x1},${y1 + k} ${x2},${y2 - k} ${x2},${y2}`;
}
function desenharArestas(){
  if (cenMapa && !desenharArestas.dentro) { desenharArestas.dentro = true; try { return emCenario(desenharArestas); } finally { desenharArestas.dentro = false; } }
  const ativos = new Set(selId ? [selId, ...caminho(selId).map(s => s.id)] : []);
  let h = '';
  visiveis.forEach(s => { filhosVis(s.id).forEach(k => { if (pos.has(k.id)) h += `<path d="${caminhoAresta(s, k)}" data-p="${esc(s.id)}" data-f="${esc(k.id)}" class="${ativos.has(k.id) ? 'ativa' : ''}${focoId && vpEl.classList.contains('focando') && elNo.get(k.id)?.classList.contains('rel') && elNo.get(s.id)?.classList.contains('rel') ? ' rel' : ''}"/>`; }); });
  DB.vinculos.forEach(v => {
    const a = pos.get(v.origemId), b = pos.get(v.destinoId); if (!a || !b) return;
    const x1 = a.x + NW / 2, y1 = a.y + NH / 2, x2 = b.x + NW / 2, y2 = b.y + NH / 2, my = Math.min(y1, y2) - 80;
    h += `<path d="M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}" class="vin ${v.origemId === selId || v.destinoId === selId ? 'ativa' : ''}"><title>${esc(v.tipo)}</title></path>`;
  });
  if (cenMapa) visiveis.forEach(s => { if (s._paiOrig && pos.has(s._paiOrig) && pos.has(s.id)) { const a = pos.get(s._paiOrig), b = pos.get(s.id); h += `<path d="M${a.x + NW / 2},${a.y + NH} C${a.x + NW / 2},${a.y + NH + 60} ${b.x + NW / 2},${b.y - 60} ${b.x + NW / 2},${b.y}" class="orig"><title>Subordinação anterior</title></path>`; } });
  $('#arestas').innerHTML = h;
}
function aplicarView(anim){
  const m = $('#mundo');
  if (anim) { m.classList.add('anim'); setTimeout(() => m.classList.remove('anim'), 480); }
  m.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.k})`;
  const vp = $('#vp'); const g = 22 * view.k;
  vp.style.backgroundSize = `${g}px ${g}px`; vp.style.backgroundPosition = `${view.x}px ${view.y}px`;
  $('#m-zv').textContent = Math.round(view.k * 100) + '%';
  store.set('gaborg_view', view);
  desenharMiniVisor();
}
function limites(){
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  pos.forEach(p => { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + NW); y1 = Math.max(y1, p.y + NH); });
  return isFinite(x0) ? { x0, y0, x1, y1 } : { x0:0, y0:0, x1:NW, y1:NH };
}
function ajustar(anim){
  const vp = $('#vp').getBoundingClientRect(), L = limites();
  const k = Math.max(.12, Math.min(1.1, Math.min((vp.width - 80) / (L.x1 - L.x0), (vp.height - 170) / (L.y1 - L.y0))));
  view = { k, x:(vp.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:90 - L.y0 * k + Math.max(0, (vp.height - 170 - (L.y1 - L.y0) * k) / 2) };
  if (vp.width < 820 && k < .42) {
    // celular: em vez de miniaturizar tudo, mostra o topo da estrutura legível, centrado na raiz
    const r = raizes()[0], p = r && pos.get(r.id), kk = .42;
    view = { k:kk, x:vp.width / 2 - ((p ? p.x : L.x0) + NW / 2) * kk, y:130 - L.y0 * kk };
  }
  aplicarView(anim);
}
function zoomPor(f, cx, cy){
  const vp = $('#vp').getBoundingClientRect();
  if (cx === undefined) { cx = vp.width / 2; cy = vp.height / 2; }
  const k = Math.max(.1, Math.min(2.5, view.k * f)); const r = k / view.k;
  view = { k, x:cx - (cx - view.x) * r, y:cy - (cy - view.y) * r }; aplicarView();
}
function centralizar(id, anim){
  const p = pos.get(id); if (!p) return;
  const vp = $('#vp').getBoundingClientRect(), pn = $('#painel').classList.contains('aberto') && window.innerWidth > 820 ? 460 : 0;
  const k = Math.max(view.k, .75);
  view = { k, x:(vp.width - pn) / 2 - (p.x + NW / 2) * k, y:vp.height / 2.6 - (p.y + NH / 2) * k };
  aplicarView(anim !== false);
}
function desenharLegenda(){
  const m = $('#m-cor').value; let it = [];
  if (m === 'tipo') { const usados = new Set(DB.setores.map(s => s.tipo)); it = Object.keys(TIPOS).filter(t => usados.has(t)).map(t => [t, TIPOS[t].cor]); }
  else if (m === 'area') it = areas.map(a => [nomeCurto(porId.get(a)), corArea(a)]);
  else if (m === 'validacao') it = Object.entries(STATUS_VAL);
  else if (m === 'impacto') it = IMPACTO.map(x => [x[0], x[1]]);
  else it = Object.entries(STATUS_SETOR);
  if (cenMapa) it = Object.values(ROT_MARCA).map(([n, c]) => [n + ' (proposta)', c]).concat(it);
  $('#m-leg').innerHTML = `<button class="leg-x" onclick="alternarMapaUI('leg')" title="Esconder a legenda (L)"><i class="fa-solid fa-xmark"></i></button>` + it.map(([n, c]) => `<span><i class="q" style="background:${c}"></i>${esc(n)}</span>`).join('')
    + `<span class="dica"><i class="fa-solid fa-hand"></i> Arraste o fundo para navegar · roda do mouse para zoom · arraste um setor para reposicionar (encaixa nas guias; <b>Alt</b> solta livre) · <b>Ctrl</b> + clique seleciona vários · <b>Ctrl</b> + arrastar o fundo seleciona uma área · setas movem a seleção · <b>Shift</b> + arrastar sobre outro setor para subordinar · duplo clique abre/fecha</span>`;
}
/* Minimapa */
function desenharMini(){
  if (cenMapa && !desenharMini.dentro) { desenharMini.dentro = true; try { return emCenario(desenharMini); } finally { desenharMini.dentro = false; } }
  const c = $('#mini'); if (!c || !c.offsetWidth) return;
  const W = c.width = c.offsetWidth * 2, H = c.height = c.offsetHeight * 2, L = limites();
  const s = Math.min((W - 16) / (L.x1 - L.x0), (H - 16) / (L.y1 - L.y0));
  c._esc = { s, ox:8 - L.x0 * s + ((W - 16) - (L.x1 - L.x0) * s) / 2, oy:8 - L.y0 * s + ((H - 16) - (L.y1 - L.y0) * s) / 2 };
  const g = c.getContext('2d'); g.clearRect(0, 0, W, H);
  visiveis.forEach(n => { const p = pos.get(n.id); g.fillStyle = corDe(n); g.fillRect(c._esc.ox + p.x * s, c._esc.oy + p.y * s, Math.max(2, NW * s), Math.max(2, NH * s)); });
  c._base = g.getImageData(0, 0, W, H); desenharMiniVisor();
}
function desenharMiniVisor(){
  const c = $('#mini'); if (!c || !c._base) return;
  const g = c.getContext('2d'); g.putImageData(c._base, 0, 0);
  const vp = $('#vp').getBoundingClientRect(), e = c._esc;
  const x = e.ox + (-view.x / view.k) * e.s, y = e.oy + (-view.y / view.k) * e.s, w = vp.width / view.k * e.s, h = vp.height / view.k * e.s;
  g.strokeStyle = '#2563eb'; g.lineWidth = 3; g.fillStyle = 'rgba(37,99,235,.08)'; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h);
}
$('#m-mini').addEventListener('pointerdown', e => {
  const c = $('#mini'), r = c.getBoundingClientRect(), es = c._esc; if (!es) return;
  const mx = (e.clientX - r.left) * 2, my = (e.clientY - r.top) * 2;
  const wx = (mx - es.ox) / es.s, wy = (my - es.oy) / es.s, vp = $('#vp').getBoundingClientRect();
  view.x = vp.width / 2 - wx * view.k; view.y = vp.height / 2 - wy * view.k; aplicarView(true);
});

/* Interação: arrastar, pan, zoom, pinça, seleção múltipla */
let drag = null; const ponteiros = new Map(); let pinca = null;
const vpEl = $('#vp');
let multi = new Set(), modoSel = false;
const SNAP = 8; // px de tela para encaixar nas guias
function aditivo(e){ return modoSel || e.ctrlKey || e.metaKey; }
// Quando um superior e um subordinado estão selecionados, só o superior é movido (o ramo o acompanha)
function raizesDoConjunto(ids){ const set = new Set(ids); return [...set].filter(id => porId.has(id) && !caminho(id).some(a => set.has(a.id))); }
function aParaMundo(cx, cy){ const r = vpEl.getBoundingClientRect(); return { x:(cx - r.left - view.x) / view.k, y:(cy - r.top - view.y) / view.k }; }
vpEl.addEventListener('pointerdown', e => {
  if (e.button === 2 || e.target.closest('[data-exp]')) return;
  ponteiros.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (ponteiros.size === 2) { const [a, b] = [...ponteiros.values()]; pinca = { d:Math.hypot(a.x - b.x, a.y - b.y), k:view.k }; drag = null; $('#laco').classList.add('hidden'); return; }
  const no = e.target.closest('.no');
  if (no) {
    const s = porId.get(no.dataset.id) || { id:no.dataset.id, dx:'', dy:'' };
    drag = { tipo:'no', s, x0:e.clientX, y0:e.clientY, moveu:false, alvo:null, adit:aditivo(e) };
  } else if (aditivo(e) && !somenteLeitura()) {
    drag = { tipo:'laco', x0:e.clientX, y0:e.clientY, base:new Set(multi), moveu:false };
  } else { drag = { tipo:'pan', x0:e.clientX, y0:e.clientY, vx:view.x, vy:view.y, moveu:false }; vpEl.classList.add('pan'); }
  vpEl.setPointerCapture(e.pointerId);
});
function iniciarArrasto(){
  // grupo: a seleção múltipla (se o setor arrastado faz parte dela) ou só o setor
  let ids = multi.size > 1 && multi.has(drag.s.id) ? raizesDoConjunto(multi) : [drag.s.id];
  if (!multi.has(drag.s.id) && multi.size) { limparMulti(true); }
  drag.grupo = ids.map(id => { const s = porId.get(id); return { s, dx0:num(s.dx), dy0:num(s.dy) }; });
  guardarPos(drag.grupo.map(g => g.s));
  drag.desc = new Set(); drag.grupo.forEach(g => { drag.desc.add(g.s.id); descendentes(g.s.id, drag.desc); });
  drag.grupo.forEach(g => elNo.get(g.s.id)?.classList.add('arrastando'));
  // referências para as guias: setores visíveis que não se movem
  drag.refs = visiveis.filter(n => !drag.desc.has(n.id)).map(n => pos.get(n.id));
}
function encaixe(p){
  const lim = SNAP / view.k; let bx = null, by = null, gx = null, gy = null;
  drag.refs.forEach(o => {
    const mesmaLinha = Math.abs(o.y - p.y) < NH * 1.5, mesmaColuna = Math.abs(o.x - p.x) < NW * 1.2;
    // alinhamento direto
    [[o.x, o.x], ...(mesmaLinha ? [[o.x + NW + GX, null], [o.x - NW - GX, null]] : [])].forEach(([cx, linha]) => {
      const d = cx - p.x; if (Math.abs(d) <= lim && (bx === null || Math.abs(d) < Math.abs(bx))) { bx = d; gx = linha === null ? null : cx; }
    });
    [[o.y, o.y], ...(mesmaColuna ? [[o.y + NH + GV, null], [o.y - NH - GV, null]] : [])].forEach(([cy, linha]) => {
      const d = cy - p.y; if (Math.abs(d) <= lim && (by === null || Math.abs(d) < Math.abs(by))) { by = d; gy = linha === null ? null : cy; }
    });
  });
  return { dx:bx || 0, dy:by || 0, gx, gy };
}
function desenharGuias(g, p){
  const el = $('#guias'); if (!g) { el.innerHTML = ''; return; }
  const L = limites(); let s = '';
  if (g.gx !== null) s += `<line x1="${g.gx}" y1="${L.y0 - 200}" x2="${g.gx}" y2="${L.y1 + 200}"/>`;
  if (g.gy !== null) s += `<line x1="${L.x0 - 200}" y1="${g.gy}" x2="${L.x1 + 200}" y2="${g.gy}"/>`;
  el.innerHTML = s;
}
function moverVisual(){
  reposicionar();
  visiveis.forEach(n => { const el = elNo.get(n.id), p = pos.get(n.id); if (el) el.style.transform = `translate(${p.x}px,${p.y}px)`; });
  desenharArestas();
}
vpEl.addEventListener('pointermove', e => {
  if (ponteiros.has(e.pointerId)) ponteiros.set(e.pointerId, { x:e.clientX, y:e.clientY });
  if (pinca && ponteiros.size === 2) {
    const [a, b] = [...ponteiros.values()], d = Math.hypot(a.x - b.x, a.y - b.y), r = vpEl.getBoundingClientRect();
    zoomPor((pinca.k * d / pinca.d) / view.k, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top); return;
  }
  if (!drag) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.moveu && Math.hypot(dx, dy) < 5) return;
  if (drag.tipo === 'pan') { drag.moveu = true; view.x = drag.vx + dx; view.y = drag.vy + dy; aplicarView(); return; }
  if (drag.tipo === 'laco') {
    drag.moveu = true;
    const r = vpEl.getBoundingClientRect(), lc = $('#laco');
    const x = Math.min(e.clientX, drag.x0) - r.left, y = Math.min(e.clientY, drag.y0) - r.top;
    Object.assign(lc.style, { left:x + 'px', top:y + 'px', width:Math.abs(dx) + 'px', height:Math.abs(dy) + 'px' }); lc.classList.remove('hidden');
    const a = aParaMundo(drag.x0, drag.y0), b = aParaMundo(e.clientX, e.clientY);
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x), y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    multi = new Set(drag.base);
    visiveis.forEach(n => { const p = pos.get(n.id); if (p.x < x1 && p.x + NW > x0 && p.y < y1 && p.y + NH > y0) multi.add(n.id); });
    elNo.forEach((el, id) => el.classList.toggle('msel', multi.has(id)));
    atualizarBarraSel(); return;
  }
  if (somenteLeitura()) return;
  if (!drag.moveu) { drag.moveu = true; iniciarArrasto(); }
  const ox = dx / view.k, oy = dy / view.k;
  drag.grupo.forEach(g => { g.s.dx = String(Math.round(g.dx0 + ox)); g.s.dy = String(Math.round(g.dy0 + oy)); });
  reposicionar();
  let gd = null;
  if (!e.altKey) {
    gd = encaixe(pos.get(drag.s.id));
    if (gd.dx || gd.dy) drag.grupo.forEach(g => { g.s.dx = String(Math.round(num(g.s.dx) + gd.dx)); g.s.dy = String(Math.round(num(g.s.dy) + gd.dy)); });
  }
  moverVisual(); desenharGuias(gd);
  if (drag.alvo) { elNo.get(drag.alvo)?.classList.remove('alvo'); drag.alvo = null; }
  if (e.shiftKey) {
    const sob = document.elementsFromPoint(e.clientX, e.clientY).map(x => x.closest && x.closest('.no')).find(x => x && !drag.desc.has(x.dataset.id));
    if (sob) { drag.alvo = sob.dataset.id; sob.classList.add('alvo'); }
  }
});
function fimDrag(e){
  ponteiros.delete(e.pointerId); if (ponteiros.size < 2) pinca = null;
  vpEl.classList.remove('pan');
  if (!drag) return;
  const d = drag; drag = null;
  desenharGuias(null);
  if (d.tipo === 'laco') { $('#laco').classList.add('hidden'); atualizarBarraSel(); if (d.moveu && multi.size) toast(`${multi.size} setor(es) selecionado(s).`); return; }
  if (d.tipo === 'pan') { if (!d.moveu && multi.size && !modoSel) limparMulti(); return; }
  if (!d.moveu) {
    if (d.adit && !somenteLeitura()) alternarMulti(d.s.id);
    else { if (multi.size) limparMulti(true); selecionar(d.s.id); }
    return;
  }
  d.grupo.forEach(g => elNo.get(g.s.id)?.classList.remove('arrastando'));
  if (d.alvo) {
    const alvo = porId.get(d.alvo); elNo.get(d.alvo)?.classList.remove('alvo');
    abertos.add(alvo.id); salvarAbertos();
    let ord = Math.max(0, ...filhosDe(alvo.id).map(k => num(k.ordem)));
    d.grupo.forEach(g => { g.s.dx = ''; g.s.dy = ''; g.s.ordem = String(++ord); alterar(g.s, 'paiId', alvo.id); });
    desfazerPilha.pop(); // subordinação tem histórico próprio
    toast(d.grupo.length > 1 ? `${d.grupo.length} setores agora são subordinados a ${alvo.nome}.` : `${d.s.nome} agora é subordinado a ${alvo.nome}.`);
  } else {
    d.grupo.forEach(g => { g.s.atualizadoEm = agora(); enfileirar('setores', g.s); });
    desenharMini();
  }
}
vpEl.addEventListener('pointerup', fimDrag);
vpEl.addEventListener('pointercancel', fimDrag);

/* Seleção múltipla */
function alternarMulti(id){
  if (!multi.size && selId && selId !== id && pos.has(selId)) multi.add(selId);
  multi.has(id) ? multi.delete(id) : multi.add(id);
  elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k)));
  atualizarBarraSel();
}
function limparMulti(silencioso){
  multi.clear(); elNo.forEach(el => el.classList.remove('msel')); atualizarBarraSel();
}
function alternarModoSel(forcar){
  modoSel = forcar !== undefined ? forcar : !modoSel;
  $('#m-modosel')?.classList.toggle('on', modoSel); vpEl.classList.toggle('modo-sel', modoSel);
  if (modoSel) toast('Modo seleção: arraste no fundo para marcar uma área ou toque nos setores.');
}
function atualizarBarraSel(){
  const b = $('#m-sel'); if (!b) return;
  [...multi].forEach(id => { if (!porId.has(id)) multi.delete(id); });
  $('#ms-n').textContent = multi.size;
  b.classList.toggle('hidden', multi.size < 1);
  const inp = $('#ms-esp'); if (inp && !inp.value) inp.value = store.get('gaborg_espaco', GX);
}
function selecionarIrmaos(){
  const base = multi.size ? [...multi] : (selId ? [selId] : []);
  if (!base.length) return;
  base.forEach(id => { const s = porId.get(id); filhosDe(s ? s.paiId : '').forEach(k => { if (pos.has(k.id)) multi.add(k.id); }); });
  elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k))); atualizarBarraSel();
}

/* Desfazer movimentações */
let desfazerPilha = [];
function guardarPos(lista){
  desfazerPilha.push(lista.map(s => ({ id:s.id, dx:s.dx, dy:s.dy })));
  if (desfazerPilha.length > 60) desfazerPilha.shift();
}
function desfazerPos(){
  if (somenteLeitura()) return;
  const ult = desfazerPilha.pop(); if (!ult) return toast('Nada para desfazer.');
  ult.forEach(o => { const s = porId.get(o.id); if (!s) return; s.dx = o.dx; s.dy = o.dy; s.atualizadoEm = agora(); enfileirar('setores', s); });
  desenharMapa(); toast('Movimentação desfeita.');
}

/* Alinhar, distribuir e espaçar a seleção */
function alinharSel(modo){
  if (somenteLeitura()) return;
  const ids = [...multi].filter(id => pos.has(id));
  if (modo === 'auto') {
    if (!ids.length) return;
    guardarPos(ids.map(id => porId.get(id)));
    ids.forEach(id => { const s = porId.get(id); s.dx = ''; s.dy = ''; s.atualizadoEm = agora(); enfileirar('setores', s); });
    desenharMapa(); return toast('Posição automática restaurada.');
  }
  if (ids.length < 2) return toast('Selecione pelo menos 2 setores (Ctrl + clique).', 'aviso');
  if ((modo === 'distH' || modo === 'distV') && ids.length < 3) return toast('Para distribuir, selecione pelo menos 3 setores.', 'aviso');
  let esp = Math.max(0, Math.min(600, Number($('#ms-esp').value)));
  if (!isFinite(esp)) esp = GX;
  store.set('gaborg_espaco', esp);
  const P = new Map(ids.map(id => [id, Object.assign({}, pos.get(id))]));
  const ys = ids.map(id => P.get(id).y), xs = ids.map(id => P.get(id).x);
  const porX = [...ids].sort((a, b) => P.get(a).x - P.get(b).x || P.get(a).y - P.get(b).y);
  const porY = [...ids].sort((a, b) => P.get(a).y - P.get(b).y || P.get(a).x - P.get(b).x);
  const alvo = new Map();
  // Mesma linha/coluna: se algum ficaria por cima de outro, enfileira com o espaço escolhido
  const sobrepoe = (lista, eixo, tam) => lista.some((id, i) => i && P.get(id)[eixo] - P.get(lista[i - 1])[eixo] < tam);
  let ajustou = false;
  if (modo === 'linha') { if (sobrepoe(porX, 'x', NW)) { modo = 'filaH'; ajustou = true; } else { const y = Math.min(...ys); ids.forEach(id => alvo.set(id, { y })); } }
  if (modo === 'coluna') { if (sobrepoe(porY, 'y', NH)) { modo = 'filaV'; ajustou = true; } else { const x = Math.min(...xs); ids.forEach(id => alvo.set(id, { x })); } }
  if (modo === 'distH') { const a = P.get(porX[0]).x, b = P.get(porX[porX.length - 1]).x, st = (b - a) / (porX.length - 1); porX.forEach((id, i) => alvo.set(id, { x:a + i * st })); }
  if (modo === 'distV') { const a = P.get(porY[0]).y, b = P.get(porY[porY.length - 1]).y, st = (b - a) / (porY.length - 1); porY.forEach((id, i) => alvo.set(id, { y:a + i * st })); }
  if (modo === 'filaH') { const y = Math.min(...ys), x0 = P.get(porX[0]).x; porX.forEach((id, i) => alvo.set(id, { x:x0 + i * (NW + esp), y })); }
  if (modo === 'filaV') { const x = Math.min(...xs), y0 = P.get(porY[0]).y; porY.forEach((id, i) => alvo.set(id, { x, y:y0 + i * (NH + esp) })); }
  guardarPos(ids.map(id => porId.get(id)));
  // superiores primeiro: ao mover um superior o ramo dele vem junto, e o subordinado é corrigido depois
  [...ids].sort((a, b) => (prof.get(a) || 0) - (prof.get(b) || 0)).forEach(id => {
    reposicionar();
    const s = porId.get(id), p = pos.get(id), t = alvo.get(id); if (!t) return;
    if (t.x !== undefined) s.dx = String(Math.round(num(s.dx) + t.x - p.x));
    if (t.y !== undefined) s.dy = String(Math.round(num(s.dy) + t.y - p.y));
  });
  ids.forEach(id => { const s = porId.get(id); s.atualizadoEm = agora(); enfileirar('setores', s); });
  desenharMapa();
  if (ajustou) return toast(`Alinhados e espaçados em ${esp} px para nenhum setor ficar por cima de outro.`);
  toast({ linha:'Alinhados na mesma linha.', coluna:'Alinhados na mesma coluna.', distH:'Distribuídos com espaço igual na horizontal.', distV:'Distribuídos com espaço igual na vertical.', filaH:`Em linha, com ${esp} px entre eles.`, filaV:`Em coluna, com ${esp} px entre eles.` }[modo]);
}

/* Teclado no mapa: setas movem a seleção (Shift = 10 px), Ctrl+Z desfaz, Esc limpa */
let ultimaSeta = 0;
document.addEventListener('keydown', e => {
  if (vistaAtual !== 'mapa' || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden') || e.target.closest('input,textarea,select,[contenteditable]')) return;
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); desfazerPos(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && !somenteLeitura()) { e.preventDefault(); visiveis.forEach(n => multi.add(n.id)); elNo.forEach((el, k) => el.classList.toggle('msel', multi.has(k))); atualizarBarraSel(); return; }
  if (e.key === 'Escape' && (multi.size || modoSel)) { limparMulti(); alternarModoSel(false); e.stopImmediatePropagation(); return; }
  const dir = { ArrowLeft:[-1, 0], ArrowRight:[1, 0], ArrowUp:[0, -1], ArrowDown:[0, 1] }[e.key];
  if (!dir || somenteLeitura()) return;
  const ids = multi.size ? raizesDoConjunto(multi) : (selId && pos.has(selId) ? [selId] : []);
  if (!ids.length) return;
  e.preventDefault();
  const passo = e.shiftKey ? 10 : 1, lista = ids.map(id => porId.get(id));
  if (Date.now() - ultimaSeta > 900) guardarPos(lista);
  ultimaSeta = Date.now();
  lista.forEach(s => { s.dx = String(num(s.dx) + dir[0] * passo); s.dy = String(num(s.dy) + dir[1] * passo); s.atualizadoEm = agora(); enfileirar('setores', s); });
  moverVisual();
}, true);
vpEl.addEventListener('wheel', e => { e.preventDefault(); const r = vpEl.getBoundingClientRect(); zoomPor(Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), e.clientX - r.left, e.clientY - r.top); }, { passive:false });
vpEl.addEventListener('click', e => { const b = e.target.closest('[data-exp]'); if (b) alternarAberto(b.closest('.no').dataset.id); });
vpEl.addEventListener('dblclick', e => { const no = e.target.closest('.no'); if (no && temFilhos(no.dataset.id)) alternarAberto(no.dataset.id); });
function alternarAberto(id, forcar){
  const abrir = forcar !== undefined ? forcar : !abertos.has(id);
  abrir ? abertos.add(id) : abertos.delete(id); salvarAbertos(); desenharMapa();
}
function expandirNivel(){
  const prox = visiveis.filter(s => temFilhos(s.id) && !abertos.has(s.id));
  if (!prox.length) return toast('Tudo já está aberto.');
  prox.forEach(s => abertos.add(s.id)); salvarAbertos(); desenharMapa(); ajustar(true);
}
function recolherTudo(){ abertos = new Set(raizes().map(r => r.id)); salvarAbertos(); desenharMapa(); ajustar(true); }
async function reorganizar(){
  const mexidos = DB.setores.filter(s => s.dx || s.dy);
  if (!mexidos.length) { ajustar(true); return toast('O mapa já está na disposição automática.'); }
  if (!await confirmar('Reorganizar o mapa', `${mexidos.length} setor(es) foram movidos manualmente. Voltar todos para a disposição automática?`, 'Reorganizar')) return;
  guardarPos(mexidos);
  mexidos.forEach(s => { s.dx = ''; s.dy = ''; enfileirar('setores', s); });
  desenharMapa(); ajustar(true);
}

/* Busca no mapa */
let resIdx = 0;
$('#m-busca').addEventListener('input', () => { resIdx = 0; renderBusca(); });
$('#m-busca').addEventListener('keydown', e => {
  const bs = [...document.querySelectorAll('#m-res button')]; if (!bs.length) return;
  if (e.key === 'ArrowDown') { resIdx = Math.min(bs.length - 1, resIdx + 1); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { resIdx = Math.max(0, resIdx - 1); e.preventDefault(); }
  else if (e.key === 'Enter') { bs[resIdx].click(); return; }
  else if (e.key === 'Escape') { $('#m-res').classList.add('hidden'); return; }
  bs.forEach((b, i) => b.classList.toggle('on', i === resIdx));
});
document.addEventListener('pointerdown', e => { if (!e.target.closest('.m-busca')) $('#m-res').classList.add('hidden'); });
function renderBusca(){
  const q = norm($('#m-busca').value), box = $('#m-res');
  if (!q) { box.classList.add('hidden'); return; }
  const r = DB.setores.filter(s => norm(s.nome + ' ' + s.sigla + ' ' + s.responsavel).includes(q)).slice(0, 12);
  box.innerHTML = r.length ? r.map((s, i) => `<button class="${i === resIdx ? 'on' : ''}" onclick="irPara(${arg(s.id)})"><span class="ic" style="color:${corTipo(s.tipo)}"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span style="min-width:0"><span class="t">${esc(s.nome)}</span><br><span class="s">${esc(caminho(s.id).map(nomeCurto).join(' › ') || 'Raiz')}</span></span></button>`).join('') : '<div class="vazio">Nenhum setor encontrado.</div>';
  box.classList.remove('hidden');
}
function irPara(id){
  $('#m-res').classList.add('hidden'); $('#m-busca').value = '';
  if (vistaAtual !== 'mapa') trocarVista('mapa');
  caminho(id).forEach(a => abertos.add(a.id)); salvarAbertos();
  selId = id; desenharMapa(); renderPainel(); setTimeout(() => { centralizar(id); setTimeout(() => pulsar(id), 380); }, 30);
}

/* ===================== SELEÇÃO E PAINEL LATERAL ===================== */
function selecionar(id){
  selId = id;
  document.querySelectorAll('#nos .no.sel').forEach(x => x.classList.remove('sel'));
  elNo.get(id)?.classList.add('sel');
  if (vistaAtual === 'mapa') { desenharArestas(); pulsar(id); }
  if (vistaAtual === 'lista') renderLista();
  renderPainel();
}
function fecharPainel(){ selId = ''; $('#painel').classList.remove('aberto'); document.querySelectorAll('.no.sel').forEach(x => x.classList.remove('sel')); if (vistaAtual === 'mapa') desenharArestas(); if (vistaAtual === 'lista') renderLista(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !document.querySelector('.modal') && !e.target.closest('input,textarea,select')) fecharPainel();
  if (e.key === '/' && vistaAtual === 'mapa' && !e.target.closest('input,textarea,select')) { e.preventDefault(); $('#m-busca').focus(); }
});

const ABAS = [['dados','Dados','fa-id-card'],['valores','Valores','fa-coins'],['analise','Análise','fa-scale-unbalanced'],['validacoes','Validações','fa-stamp'],['vinculos','Vínculos','fa-link'],['historico','Histórico','fa-clock-rotate-left']];
function renderPainel(){
  const s = porId.get(selId), p = $('#painel');
  if (!s) { p.classList.remove('aberto'); return; }
  const cor = corTipo(s.tipo), cam = caminho(s.id), sv = statusVal(s.id);
  const contagem = { validacoes:(valPorSetor.get(s.id) || []).length, vinculos:DB.vinculos.filter(v => v.origemId === s.id || v.destinoId === s.id).length, historico:DB.historico.filter(h => h.setorId === s.id).length, analise:linhasDe(s.positivos).length + linhasDe(s.negativos).length };
  p.style.setProperty('--c', cor);
  p.innerHTML = `
    <div class="pn-topo">
      <button class="btn btn-g btn-i fechar" onclick="fecharPainel()" title="Fechar (Esc)"><i class="fa-solid fa-xmark"></i></button>
      <div class="pn-cam">${cam.length ? cam.map(a => `<button onclick="irPara(${arg(a.id)})" title="${esc(a.nome)}">${esc(nomeCurto(a))}</button><i class="fa-solid fa-chevron-right"></i>`).join('') : '<span>Nível mais alto da estrutura</span>'}</div>
      <div class="pn-tit"><span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><div style="min-width:0"><h2 id="pn-nome">${esc(s.nome)}</h2>
        <div class="tags"><span class="chip sem" style="--c:${cor}">${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</span><span class="chip" style="--c:${STATUS_SETOR[s.status] || '#64748b'}">${esc(s.status || 'Ativo')}</span><span class="chip" style="--c:${STATUS_VAL[sv]}">${sv}</span></div></div></div>
      <div class="pn-acoes">
        <button class="btn btn-s btn-sm" onclick="irPara(${arg(s.id)})"><i class="fa-solid fa-location-crosshairs"></i>Mostrar no mapa</button>
        <button class="btn btn-s btn-sm so-edit" onclick="novoSetorEm(${arg(s.id)})"><i class="fa-solid fa-plus"></i>Subordinado</button>
        ${temFilhos(s.id) ? `<button class="btn btn-s btn-sm" onclick="abrirRamo(${arg(s.id)})"><i class="fa-solid fa-angles-down"></i>Abrir ramo</button>` : ''}
        <button class="btn btn-s btn-sm so-edit" onclick="duplicarSetor(${arg(s.id)})" title="Duplicar setor"><i class="fa-regular fa-copy"></i></button>
        <button class="btn btn-perigo btn-sm so-edit" onclick="excluirSetor(${arg(s.id)})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <div class="pn-abas" role="tablist">${ABAS.filter(a => !cenSwap || !['validacoes','vinculos'].includes(a[0])).map(([k, n, ic]) => `<button class="${abaPainel === k ? 'on' : ''}" onclick="abaPainel='${k}';renderPainel()" role="tab"><i class="fa-solid ${ic}"></i>${n}${contagem[k] ? `<span class="n">${contagem[k]}</span>` : ''}</button>`).join('')}</div>
    </div>
    <div class="pn-corpo" id="pn-corpo">${CORPO[cenSwap && CORPO_ABAS_CEN.includes(abaPainel) ? (abaPainel = 'dados') : abaPainel](s)}</div>`;
  p.classList.add('aberto');
}
function opcoesSetores(excluir, valor, vazio){
  const ex = excluir || new Set(); let h = vazio !== undefined ? `<option value="">${esc(vazio)}</option>` : '';
  const visit = (s, d) => { if (ex.has(s.id)) return; h += `<option value="${esc(s.id)}" ${s.id === valor ? 'selected' : ''}>${'\u00a0\u00a0'.repeat(d)}${d ? '└ ' : ''}${esc(s.nome)}</option>`; filhosDe(s.id).forEach(k => visit(k, d + 1)); };
  raizes().forEach(r => visit(r, 0)); return h;
}
const sel = (campo, opcoes, valor) => `<select class="campo" data-campo="${campo}">${opcoes.map(o => `<option ${o === valor ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
const CORPO_ABAS_CEN = ['validacoes','vinculos'];
const CORPO = {
  dados(s){
    const irmaos = filhosDe(s.paiId && porId.has(s.paiId) ? s.paiId : ''), i = irmaos.indexOf(s);
    return `
      <label><span class="rot">Nome do setor</span><input class="campo" data-campo="nome" value="${esc(s.nome)}" maxlength="200"></label>
      <div class="g2">
        <label><span class="rot">Sigla</span><input class="campo" data-campo="sigla" value="${esc(s.sigla)}" maxlength="30"></label>
        <label><span class="rot">Tipo</span>${sel('tipo', Object.keys(TIPOS), s.tipo)}</label>
      </div>
      <label><span class="rot">Setor superior <small>a quem responde</small></span><select class="campo" data-campo="paiId">${opcoesSetores(new Set([s.id, ...descendentes(s.id)]), s.paiId, '— Nenhum (nível mais alto) —')}</select></label>
      <div class="g2">
        <label><span class="rot">Situação</span>${sel('status', Object.keys(STATUS_SETOR), s.status || 'Ativo')}</label>
        <div><span class="rot">Posição entre os pares</span><div style="display:flex;gap:6px"><button class="btn btn-s btn-sm" ${i <= 0 ? 'disabled' : ''} onclick="moverOrdem(${arg(s.id)},-1)"><i class="fa-solid fa-arrow-up"></i>Antes</button><button class="btn btn-s btn-sm" ${i < 0 || i >= irmaos.length - 1 ? 'disabled' : ''} onclick="moverOrdem(${arg(s.id)},1)"><i class="fa-solid fa-arrow-down"></i>Depois</button></div></div>
      </div>
      ${s.tipo === 'Unidades Escolares' || num(s.quantidade) ? `<label><span class="rot">Quantidade de ${rotuloUnid(s)} <small>representadas por este cartão, sem desenhar uma a uma</small></span><input class="campo" data-campo="quantidade" data-num inputmode="numeric" value="${esc(s.quantidade)}" placeholder="ex.: 631"></label>` : ''}
      <div class="g2">
        <label><span class="rot">Responsável</span><input class="campo" data-campo="responsavel" value="${esc(s.responsavel)}" placeholder="Nome do titular"></label>
        <label><span class="rot">Contato</span><input class="campo" data-campo="contato" value="${esc(s.contato)}" placeholder="E-mail ou ramal"></label>
      </div>
      <label><span class="rot">Competências e funções <small>uma por linha</small></span><textarea class="campo" data-campo="competencias" rows="6" placeholder="O que o setor faz, conforme o decreto ou regimento">${esc(s.competencias)}</textarea></label>
      <label><span class="rot">Principais entregas e produtos</span><textarea class="campo" data-campo="entregas" rows="3" placeholder="Serviços, documentos, programas que o setor entrega">${esc(s.entregas)}</textarea></label>
      ${temFilhos(s.id) ? `<div class="g2">
        <label><span class="rot">Subordinados no mapa</span><select class="campo" data-campo="layout"><option value="" ${!s.layout ? 'selected' : ''}>Automático</option><option value="h" ${s.layout === 'h' ? 'selected' : ''}>Lado a lado</option><option value="v" ${s.layout === 'v' ? 'selected' : ''}>Em lista</option></select></label>
        <label><span class="rot">Colunas <small>lado a lado</small></span><input class="campo" data-campo="colunas" type="number" min="1" max="20" value="${esc(s.colunas)}" placeholder="6"></label>
      </div>` : ''}
      <p style="margin:0;font-size:11.5px;color:var(--mut)">${s.atualizadoEm ? `Última alteração em ${fmtData(s.atualizadoEm)}${s.atualizadoPor ? ' por ' + esc(s.atualizadoPor) : ''}.` : 'Estrutura original do Decreto nº 2.236/2026.'}</p>`;
  },
  valores(s){
    return `
      <div class="sec-t"><i class="fa-solid fa-coins"></i>Valores do próprio setor</div>
      <div class="g2">
        <label><span class="rot">Orçamento anual (R$)</span><input class="campo" data-campo="orcamento" data-num value="${s.orcamento ? esc(num(s.orcamento).toLocaleString('pt-BR')) : ''}" inputmode="decimal" placeholder="0"></label>
        <label><span class="rot">Custo mensal de pessoal (R$)</span><input class="campo" data-campo="custoMensal" data-num value="${s.custoMensal ? esc(num(s.custoMensal).toLocaleString('pt-BR')) : ''}" inputmode="decimal" placeholder="0"></label>
        <label><span class="rot">Servidores</span><input class="campo" data-campo="servidores" data-num value="${esc(s.servidores)}" inputmode="numeric" placeholder="0"></label>
        <label><span class="rot">Cargos comissionados</span><input class="campo" data-campo="comissionados" data-num value="${esc(s.comissionados)}" inputmode="numeric" placeholder="0"></label>
      </div>
      <div id="pn-soma">${blocoSoma(s)}</div>
      ${cenSwap ? '<p class="s" style="margin-top:14px;font-size:12.5px"><i class="fa-solid fa-lightbulb"></i> Os custos (DGA, bolsas e despesas) desta proposta ficam em <b>Propostas › Alterações</b>.</p>' : blocoFinSetor(s)}`;
  },
  analise(s){
    const imp = num(s.impacto), pos_ = linhasDe(s.positivos), neg = linhasDe(s.negativos), tot = pos_.length + neg.length;
    const lista = (campo, itens, ic, cor) => `<div class="lista-i" style="--c:${cor}">${itens.map((t, i) => `<div class="it"><i class="m fa-solid ${ic}"></i><span>${esc(t)}</span><button onclick="rmItem(${arg(s.id)},'${campo}',${i})" title="Remover"><i class="fa-solid fa-xmark"></i></button></div>`).join('') || `<div style="font-size:12.5px;color:var(--mut2)">Nenhum item.</div>`}
      <form class="add-i" onsubmit="event.preventDefault();addItem(${arg(s.id)},'${campo}',this.t)"><input name="t" class="campo" placeholder="Adicionar e tecle Enter" maxlength="300"><button class="btn btn-s btn-i" title="Adicionar"><i class="fa-solid fa-plus"></i></button></form></div>`;
    return `
      <div class="sec-t"><i class="fa-solid fa-bolt"></i>Impacto do setor na Secretaria</div>
      <div class="imp">${[1,2,3,4,5].map(n => `<button class="${imp === n ? 'on' : ''}" style="--c:${IMPACTO[n][1]}" onclick="alterar(porId.get(${arg(s.id)}),'impacto','${imp === n ? '' : n}');renderPainel()"><b>${n}</b>${IMPACTO[n][0]}</button>`).join('')}</div>
      <label><span class="rot">Descrição do impacto <small>o que muda se o setor parar</small></span><textarea class="campo" data-campo="impactoDescricao" rows="3">${esc(s.impactoDescricao)}</textarea></label>
      ${tot ? `<div><div class="balanco"><span style="width:${pos_.length * 100 / tot}%;background:#16a34a"></span><span style="width:${neg.length * 100 / tot}%;background:#dc2626"></span></div><div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--mut);margin-top:4px"><span>${pos_.length} positivo(s)</span><span>${neg.length} negativo(s)</span></div></div>` : ''}
      <div class="sec-t" style="--c:#16a34a"><i class="fa-solid fa-circle-plus"></i>Pontos positivos</div>${lista('positivos', pos_, 'fa-check', '#16a34a')}
      <div class="sec-t" style="--c:#dc2626"><i class="fa-solid fa-circle-minus"></i>Pontos negativos</div>${lista('negativos', neg, 'fa-xmark', '#dc2626')}`;
  },
  validacoes(s){
    const minhas = (valPorSetor.get(s.id) || []), deles = DB.validacoes.filter(v => v.validadorId === s.id);
    const item = (v, mostrar) => { const o = porId.get(mostrar === 'validador' ? v.validadorId : v.setorId); return `<div class="val-it">
      <div class="l1"><i class="fa-solid ${mostrar === 'validador' ? 'fa-user-check' : 'fa-inbox'}" style="color:var(--mut)"></i><b title="${esc(o ? o.nome : '')}">${esc(o ? o.nome : '(setor removido)')}</b><span class="chip" style="--c:${STATUS_VAL[v.status || 'Pendente']}">${esc(v.status || 'Pendente')}</span><button class="btn btn-g btn-i btn-sm" onclick="rmValidacao(${arg(v.id)})" title="Remover"><i class="fa-solid fa-trash-can"></i></button></div>
      <select class="campo" data-val="${esc(v.id)}" data-vcampo="status">${Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(x => `<option ${x === (v.status || 'Pendente') ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <textarea class="campo" data-val="${esc(v.id)}" data-vcampo="parecer" rows="2" placeholder="Parecer do setor validador">${esc(v.parecer)}</textarea>
      <span style="font-size:11px;color:var(--mut)">Solicitada em ${fmtData(v.solicitadoEm)}${v.solicitadoPor ? ' por ' + esc(v.solicitadoPor) : ''}${v.respondidoEm ? ` · respondida em ${fmtData(v.respondidoEm)}${v.respondidoPor ? ' por ' + esc(v.respondidoPor) : ''}` : ''}</span></div>`; };
    return `
      <div class="sec-t"><i class="fa-solid fa-paper-plane"></i>Pedir validação a outro setor</div>
      <div style="display:flex;gap:6px"><select id="val-novo" class="campo">${opcoesSetores(new Set([s.id]), '', 'Escolha o setor validador')}</select><button class="btn btn-p" onclick="solicitarValidacao(${arg(s.id)})"><i class="fa-solid fa-plus"></i>Pedir</button></div>
      <div class="sec-t"><i class="fa-solid fa-stamp"></i>Validações deste setor <span class="chip" style="--c:${STATUS_VAL[statusVal(s.id)]}">${statusVal(s.id)}</span></div>
      ${minhas.map(v => item(v, 'validador')).join('') || '<div class="vazio"><i class="fa-regular fa-folder-open"></i>Nenhuma validação pedida.</div>'}
      ${deles.length ? `<div class="sec-t"><i class="fa-solid fa-inbox"></i>Este setor deve validar</div>${deles.map(v => item(v, 'setor')).join('')}` : ''}`;
  },
  vinculos(s){
    const l = DB.vinculos.filter(v => v.origemId === s.id || v.destinoId === s.id);
    return `
      <p style="margin:0;font-size:12.5px;color:var(--mut);line-height:1.5">Relações fora da linha hierárquica (apoio, fluxos, atuação regional). Aparecem no mapa como linhas tracejadas roxas.</p>
      <div class="sec-t"><i class="fa-solid fa-plus"></i>Novo vínculo</div>
      <select id="vin-dest" class="campo">${opcoesSetores(new Set([s.id]), '', 'Setor relacionado')}</select>
      <div style="display:flex;gap:6px"><select id="vin-tipo" class="campo">${TIPOS_VINCULO.map(t => `<option>${t}</option>`).join('')}</select><button class="btn btn-p" onclick="addVinculo(${arg(s.id)})"><i class="fa-solid fa-link"></i>Vincular</button></div>
      <input id="vin-desc" class="campo" placeholder="Descrição (opcional)">
      <div class="sec-t"><i class="fa-solid fa-link"></i>Vínculos existentes</div>
      ${l.map(v => { const outro = porId.get(v.origemId === s.id ? v.destinoId : v.origemId); return `<div class="val-it"><div class="l1"><i class="fa-solid ${v.origemId === s.id ? 'fa-arrow-right' : 'fa-arrow-left'}" style="color:#8b5cf6"></i><b>${esc(outro ? outro.nome : '(removido)')}</b><span class="chip sem" style="--c:#8b5cf6">${esc(v.tipo)}</span><button class="btn btn-g btn-i btn-sm" onclick="rmVinculo(${arg(v.id)})"><i class="fa-solid fa-trash-can"></i></button></div>${v.descricao ? `<span style="font-size:12.5px;color:var(--txt2)">${esc(v.descricao)}</span>` : ''}</div>`; }).join('') || '<div class="vazio"><i class="fa-solid fa-link-slash"></i>Sem vínculos.</div>'}`;
  },
  historico(s){
    const l = DB.historico.filter(h => h.setorId === s.id).sort((a, b) => Date.parse(b.data) - Date.parse(a.data)).slice(0, 100);
    return l.length ? `<div class="hist">${l.map(h => `<div><i class="fa-solid fa-circle"></i><span>${esc(h.acao)}<small>${fmtData(h.data)} · ${esc(h.usuario)}</small></span></div>`).join('')}</div>` : '<div class="vazio"><i class="fa-regular fa-clock"></i>Nenhuma alteração registrada.</div>';
  }
};
function blocoSoma(s){
  const t = somaSub(s.id), g = somaSub(raizes()[0] ? raizes()[0].id : s.id);
  const pct = (a, b) => b ? ` · ${Math.round(a * 100 / b)}% do total` : '';
  return `<div class="sec-t"><i class="fa-solid fa-layer-group"></i>Somando ${t.setores > 1 ? `os ${t.setores - 1} subordinados` : 'só este setor'}</div>
    <div class="soma">
      <div><b>${fmtRc(t.orcamento)}</b><span>Orçamento anual${pct(t.orcamento, g.orcamento)}</span></div>
      <div><b>${fmtRc(t.custoMensal)}</b><span>Custo mensal${pct(t.custoMensal, g.custoMensal)}</span></div>
      <div><b>${fmtN(t.servidores)}</b><span>Servidores${pct(t.servidores, g.servidores)}</span></div>
      <div><b>${fmtN(t.comissionados)}</b><span>Comissionados${pct(t.comissionados, g.comissionados)}</span></div>
    </div>`;
}
// Campos do painel: grava ao sair do campo (sem redesenhar o painel, para não perder o foco)
$('#painel').addEventListener('change', e => {
  const el = e.target, s = porId.get(selId); if (!s) return;
  if (el.dataset.val) { editarValidacao(el.dataset.val, el.dataset.vcampo, el.value); return; }
  const c = el.dataset.campo; if (!c) return;
  let v = el.value;
  if (el.hasAttribute('data-num')) { v = parseValor(v); if (v && ['orcamento','custoMensal'].includes(c)) el.value = num(v).toLocaleString('pt-BR'); }
  if (c === 'nome' && !v.trim()) { el.value = s.nome; return toast('O nome não pode ficar vazio.', 'aviso'); }
  if (c === 'nome' && !s.tipo) s.tipo = tipoPorNome(v);
  if (c === 'paiId') { s.dx = ''; s.dy = ''; if (v) { abertos.add(v); salvarAbertos(); } }
  alterar(s, c, c === 'nome' ? v.trim() : v);
  if (c === 'nome') $('#pn-nome').textContent = s.nome;
  if (['tipo','status','paiId','layout'].includes(c)) renderPainel();
  if (c === 'quantidade' && vistaAtual === 'mapa') desenharMapa();
  if (['orcamento','custoMensal','servidores','comissionados'].includes(c)) $('#pn-soma').innerHTML = blocoSoma(s);
});

/* Ações sobre setores */
function novoSetorEm(paiId){
  const pai = porId.get(paiId);
  const tipoSug = pai ? ({ 'Gabinete':'Superintendência','Superintendência':'Coordenadoria','Coordenadoria':'Núcleo','Diretoria':'Coordenadoria','Diretoria Adjunta':'Coordenadoria' }[pai.tipo] || 'Unidade') : 'Gabinete';
  const s = novoSetor({ id:novoId('s'), nome:'Novo setor', tipo:tipoSug, paiId:pai ? pai.id : '', ordem:String(Math.max(0, ...filhosDe(pai ? pai.id : '').map(k => num(k.ordem))) + 1), status:'Proposto', atualizadoEm:agora(), atualizadoPor:cfg.usuario });
  DB.setores.push(s); indexar(); enfileirar('setores', s); registrar(s.id, 'Setor criado' + (pai ? ' em ' + pai.nome : ''));
  if (pai) { abertos.add(pai.id); salvarAbertos(); }
  selId = s.id; abaPainel = 'dados';
  atualizarVistaAtual(); renderPainel();
  if (vistaAtual === 'mapa') setTimeout(() => centralizar(s.id), 40);
  setTimeout(() => { const i = document.querySelector('#painel [data-campo="nome"]'); if (i) { i.focus(); i.select(); } }, 80);
}
function duplicarSetor(id){
  const o = porId.get(id); if (!o) return;
  const s = novoSetor(Object.assign({}, o, { id:novoId('s'), nome:o.nome + ' (cópia)', dx:String(num(o.dx) + 30), dy:String(num(o.dy) + 30), ordem:String(num(o.ordem) + .5), atualizadoEm:agora(), atualizadoPor:cfg.usuario }));
  DB.setores.push(s); indexar(); enfileirar('setores', s); registrar(s.id, 'Criado a partir de ' + o.nome);
  selId = s.id; atualizarVistaAtual(); renderPainel(); toast('Setor duplicado (sem os subordinados).');
}
async function excluirSetor(id){
  const s = porId.get(id); if (!s) return;
  const desc = descendentes(id);
  if (cenSwap) {
    if (!await confirmar('Excluir nesta proposta', `Excluir <b>${esc(s.nome)}</b>${desc.size ? ` e os <b>${desc.size}</b> subordinados` : ''} <b>somente nesta proposta</b>? A estrutura atual não muda. Setores existentes aparecem como extintos no mapa da proposta; setores criados na proposta são removidos.`, 'Excluir na proposta', true)) return;
    const ofic = new Set(setoresOficiais().map(x => x.id));
    [id, ...desc].forEach(i => { const x = porId.get(i); if (!x) return; if (ofic.has(i)) { x.status = 'Extinto'; enfileirar('setores', x, true); } else { DB.setores = DB.setores.filter(y => y.id !== i); enfileirar('setores', x, true); } });
    indexar(); fecharPainel(); atualizarVistaAtual(); toast('Excluído nesta proposta.'); return;
  }
  if (!await confirmar('Excluir setor', `Excluir <b>${esc(s.nome)}</b>${desc.size ? ` e os <b>${desc.size}</b> setores subordinados a ele` : ''}? As validações e vínculos ligados a eles também serão removidos. Para manter o histórico, prefira mudar a situação para <b>Extinto</b>.`, 'Excluir', true)) return;
  const ids = new Set([id, ...desc]);
  DB.setores.filter(x => ids.has(x.id)).forEach(x => enfileirar('setores', x, true));
  DB.validacoes.filter(v => ids.has(v.setorId) || ids.has(v.validadorId)).forEach(v => enfileirar('validacoes', v, true));
  DB.vinculos.filter(v => ids.has(v.origemId) || ids.has(v.destinoId)).forEach(v => enfileirar('vinculos', v, true));
  DB.setores = DB.setores.filter(x => !ids.has(x.id));
  DB.validacoes = DB.validacoes.filter(v => !ids.has(v.setorId) && !ids.has(v.validadorId));
  DB.vinculos = DB.vinculos.filter(v => !ids.has(v.origemId) && !ids.has(v.destinoId));
  if (s.paiId) registrar(s.paiId, `Subordinado excluído: ${s.nome}${desc.size ? ` (com ${desc.size} setores)` : ''}`);
  indexar(); fecharPainel(); atualizarVistaAtual(); toast('Setor excluído.');
}
function moverOrdem(id, d){
  const s = porId.get(id), irm = filhosDe(s.paiId && porId.has(s.paiId) ? s.paiId : '');
  irm.forEach((x, i) => { if (x.ordem !== String(i + 1)) { x.ordem = String(i + 1); enfileirar('setores', x); } });
  const i = irm.indexOf(s), j = i + d; if (j < 0 || j >= irm.length) return;
  const o = irm[j], t = s.ordem; s.ordem = o.ordem; o.ordem = t; enfileirar('setores', o);
  alterar(s, 'ordem', s.ordem, true); renderPainel();
}
function abrirRamo(id){ [id, ...descendentes(id)].forEach(i => { if (temFilhos(i)) abertos.add(i); }); caminho(id).forEach(a => abertos.add(a.id)); salvarAbertos(); if (vistaAtual !== 'mapa') trocarVista('mapa'); desenharMapa(); setTimeout(() => centralizar(id), 30); }
function addItem(id, campo, input){
  const t = input.value.trim(); if (!t) return;
  const s = porId.get(id); alterar(s, campo, linhasDe(s[campo]).concat(t.replace(/\n/g, ' ')).join('\n'), true);
  registrar(id, `${campo === 'positivos' ? 'Ponto positivo' : 'Ponto negativo'} incluído: ${t}`); renderPainel();
  setTimeout(() => { const f = document.querySelectorAll('#pn-corpo .add-i input')[campo === 'positivos' ? 0 : 1]; if (f) f.focus(); }, 20);
}
function rmItem(id, campo, i){ const s = porId.get(id), l = linhasDe(s[campo]); const t = l.splice(i, 1)[0]; alterar(s, campo, l.join('\n'), true); registrar(id, `${campo === 'positivos' ? 'Ponto positivo' : 'Ponto negativo'} removido: ${t}`); renderPainel(); }

/* Validações */
function solicitarValidacao(id){
  const vid = $('#val-novo').value; if (!vid) return toast('Escolha o setor que vai validar.', 'aviso');
  if ((valPorSetor.get(id) || []).some(v => v.validadorId === vid)) return toast('Esse setor já foi chamado a validar.', 'aviso');
  const v = novoReg('validacoes', { id:novoId('val'), setorId:id, validadorId:vid, status:'Pendente', solicitadoEm:agora(), solicitadoPor:cfg.usuario });
  DB.validacoes.push(v); enfileirar('validacoes', v); registrar(id, 'Validação pedida a ' + porId.get(vid).nome);
  indexar(); renderPainel(); atualizarVistaAtual();
}
function editarValidacao(vid, campo, valor){
  const v = DB.validacoes.find(x => x.id === vid); if (!v || v[campo] === valor) return;
  v[campo] = valor; v.respondidoEm = agora(); v.respondidoPor = cfg.usuario;
  enfileirar('validacoes', v);
  if (campo === 'status') registrar(v.setorId, `Validação de ${(porId.get(v.validadorId) || {}).nome || '?'}: ${valor}`);
  indexar(); if (vistaAtual === 'validacoes') renderValidacoes(); else if (selId) renderPainel();
  if (vistaAtual === 'mapa') desenharMapa();
}
async function rmValidacao(vid){
  if (!await confirmar('Remover validação', 'Remover este pedido de validação?', 'Remover', true)) return;
  const v = DB.validacoes.find(x => x.id === vid); if (!v) return;
  DB.validacoes = DB.validacoes.filter(x => x.id !== vid); enfileirar('validacoes', v, true);
  indexar(); renderPainel(); atualizarVistaAtual();
}
/* Vínculos */
function addVinculo(id){
  const d = $('#vin-dest').value; if (!d) return toast('Escolha o setor relacionado.', 'aviso');
  const v = novoReg('vinculos', { id:novoId('v'), origemId:id, destinoId:d, tipo:$('#vin-tipo').value, descricao:$('#vin-desc').value.trim() });
  DB.vinculos.push(v); enfileirar('vinculos', v); registrar(id, `Vínculo (${v.tipo}) com ${porId.get(d).nome}`);
  renderPainel(); if (vistaAtual === 'mapa') desenharArestas();
}
function rmVinculo(vid){ const v = DB.vinculos.find(x => x.id === vid); if (!v) return; DB.vinculos = DB.vinculos.filter(x => x.id !== vid); enfileirar('vinculos', v, true); renderPainel(); if (vistaAtual === 'mapa') desenharArestas(); }

/* ===================== VISTAS ===================== */
document.querySelectorAll('.nav-b').forEach(b => { b.title = b.querySelector('span').textContent; b.addEventListener('click', () => b.dataset.acao === 'tv' ? abrirModoTV() : trocarVista(b.dataset.vista)); });
function trocarVista(v){
  vistaAtual = v;
  if (cenMapa) { if (VISTAS_CEN.includes(v)) { if (!cenSwap) aplicarCenario(); } else if (cenSwap) desaplicarCenario(); }
  if (typeof atualizarBarraCen === 'function') atualizarBarraCen();
  document.querySelectorAll('.nav-b').forEach(b => b.classList.toggle('on', b.dataset.vista === v));
  document.querySelectorAll('.vista').forEach(s => s.classList.toggle('fora', s.id !== 'v-' + v));
  atualizarVistaAtual();
}
function atualizarVistaAtual(){
  if (vistaAtual === 'mapa') desenharMapa();
  else if (vistaAtual === 'lista') renderLista();
  else if (vistaAtual === 'painel') renderPainelInd();
  else if (vistaAtual === 'validacoes') renderValidacoes();
  else if (vistaAtual === 'config') renderConfig();
  else if (vistaAtual === 'usuarios') renderUsuarios();
  else if (vistaAtual === 'financeiro') renderFinanceiro();
  else if (vistaAtual === 'propostas') renderPropostas();
  else if (vistaAtual === 'escolas') renderEscolas();
}
function redesenharTudo(){ indexar(); atualizarVistaAtual(); if (selId && porId.has(selId)) renderPainel(); else fecharPainel(); }
function atualizarBadgeVal(){ const n = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').length, b = $('#nav-val'); if (!b) return; b.textContent = n; b.classList.toggle('hidden', !n); }
function opcoesFiltro(id, rotulo, valores){
  const el = $(id); const atual = el.value;
  el.innerHTML = `<option value="">${rotulo}</option>` + valores.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('');
  el.value = valores.some(x => x[0] === atual) ? atual : '';
}

/* Lista hierárquica */
function renderLista(){
  opcoesFiltro('#l-tipo', 'Todos os tipos', Object.keys(TIPOS).filter(t => DB.setores.some(s => s.tipo === t)).map(t => [t, t]));
  opcoesFiltro('#l-area', 'Todas as áreas', areas.map(a => [a, nomeCurto(porId.get(a))]));
  opcoesFiltro('#l-val', 'Toda validação', Object.keys(STATUS_VAL).map(t => [t, t]));
  const q = norm($('#l-busca').value), ft = $('#l-tipo').value, fa = $('#l-area').value, fv = $('#l-val').value;
  const filtro = q || ft || fa || fv;
  const casa = s => (!q || norm([s.nome, s.sigla, s.responsavel, s.competencias].join(' ')).includes(q)) && (!ft || s.tipo === ft) && (!fa || areaDe.get(s.id) === fa) && (!fv || statusVal(s.id) === fv);
  let mostrar = null, nCasa = 0;
  if (filtro) { mostrar = new Set(); DB.setores.forEach(s => { if (!casa(s)) return; nCasa++; let x = s, g = 0; while (x && !mostrar.has(x.id) && g++ < 60) { mostrar.add(x.id); x = porId.get(x.paiId); } }); }
  if (!listaAbertos.size && !filtro) raizes().forEach(r => listaAbertos.add(r.id));
  const linhas = [];
  const visit = (s, d) => { if (mostrar && !mostrar.has(s.id)) return; linhas.push([s, d]); if (filtro || listaAbertos.has(s.id)) filhosDe(s.id).forEach(k => visit(k, d + 1)); };
  raizes().forEach(r => visit(r, 0));
  $('#l-resumo').textContent = filtro ? `${nCasa} setor(es) encontrados de ${DB.setores.length}` : `${DB.setores.length} setores na estrutura`;
  $('#l-corpo').innerHTML = linhas.map(([s, d]) => {
    const n = filhosDe(s.id).length, ab = filtro || listaAbertos.has(s.id), sv = statusVal(s.id), imp = num(s.impacto), casaQ = filtro && casa(s);
    return `<tr class="${s.id === selId ? 'sel' : ''}" onclick="selecionar(${arg(s.id)})">
      <td><div class="arv" style="padding-left:${d * 20}px;--c:${corTipo(s.tipo)}">${n ? `<button class="tg" onclick="event.stopPropagation();listaAlternar(${arg(s.id)})" title="${ab ? 'Recolher' : 'Abrir'}"><i class="fa-solid fa-chevron-${ab ? 'down' : 'right'}"></i></button>` : '<span style="width:20px"></span>'}<span class="ic"><i class="fa-solid ${icTipo(s.tipo)}"></i></span><span class="nm" style="${filtro && !casaQ ? 'opacity:.55' : ''}">${esc(s.nome)}${num(s.quantidade) ? ` <span class="chip" style="--c:#16a34a">${fmtN(s.quantidade)} ${rotuloUnid(s)}</span>` : ''}</span>${s.sigla ? `<span class="sg">${esc(s.sigla)}</span>` : ''}${n ? `<span class="sg">· ${n}</span>` : ''}</div></td>
      <td>${esc(s.tipo)}</td><td>${esc(s.responsavel) || '<span style="color:var(--mut2)">—</span>'}</td>
      <td class="n">${s.servidores ? fmtN(s.servidores) : '—'}</td><td class="n">${s.orcamento ? fmtRc(s.orcamento) : '—'}</td>
      <td>${imp ? `<span class="chip" style="--c:${IMPACTO[imp][1]}">${IMPACTO[imp][0]}</span>` : '<span style="color:var(--mut2)">—</span>'}</td>
      <td><span class="chip" style="--c:${STATUS_VAL[sv]}">${sv}</span></td><td><span class="chip" style="--c:${STATUS_SETOR[s.status] || '#64748b'}">${esc(s.status || 'Ativo')}</span></td></tr>`;
  }).join('') || `<tr><td colspan="8"><div class="vazio"><i class="fa-solid fa-magnifying-glass"></i>Nenhum setor com esses filtros.</div></td></tr>`;
}
function listaAlternar(id){ listaAbertos.has(id) ? listaAbertos.delete(id) : listaAbertos.add(id); store.set('gaborg_lista_abertos', [...listaAbertos]); renderLista(); }
function listaAbrirTudo(abrir){ listaAbertos = abrir ? new Set(DB.setores.filter(s => temFilhos(s.id)).map(s => s.id)) : new Set(raizes().map(r => r.id)); store.set('gaborg_lista_abertos', [...listaAbertos]); renderLista(); }
function limparFiltrosLista(){ ['#l-busca','#l-tipo','#l-area','#l-val'].forEach(i => $(i).value = ''); renderLista(); }

/* Indicadores */
function renderPainelInd(){
  opcoesFiltro('#p-area', 'Toda a Secretaria', areas.map(a => [a, nomeCurto(porId.get(a))]));
  const fa = $('#p-area').value;
  const base = DB.setores.filter(s => s.status !== 'Extinto' && (!fa || areaDe.get(s.id) === fa));
  const ids = new Set(base.map(s => s.id));
  const soma = k => base.reduce((a, s) => a + num(s[k]), 0);
  const vals = DB.validacoes.filter(v => ids.has(v.setorId));
  const pend = vals.filter(v => !v.status || v.status === 'Pendente').length;
  const comResp = base.filter(s => s.responsavel).length, comComp = base.filter(s => s.competencias).length, comImp = base.filter(s => num(s.impacto)).length;
  const compl = base.length ? Math.round((comResp + comComp + comImp) * 100 / (base.length * 3)) : 0;
  const kpi = (c, ic, r, v, s) => `<div class="cartao kpi" style="--c:${c}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const barras = (pares, cor, fmt) => { const mx = Math.max(1, ...pares.map(p => p[1])); return pares.map(([n, v, c, id]) => `<div class="barra-l" ${id ? `style="cursor:pointer" onclick="irPara(${arg(id)})"` : ''}><span class="n" title="${esc(n)}">${esc(n)}</span><span class="t"><span style="width:${v * 100 / mx}%;background:${c || cor}"></span></span><b>${fmt ? fmt(v) : fmtN(v)}</b></div>`).join('') || '<div class="vazio">Sem dados.</div>'; };
  const porTipo = Object.keys(TIPOS).map(t => [t, base.filter(s => s.tipo === t).length, TIPOS[t].cor]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
  const porArea = areas.filter(a => !fa || a === fa).map(a => { const sub = base.filter(s => areaDe.get(s.id) === a); return { a, n:sub.length, ser:sub.reduce((x, s) => x + num(s.servidores), 0), orc:sub.reduce((x, s) => x + num(s.orcamento), 0) }; });
  const impDist = [5,4,3,2,1,0].map(n => [IMPACTO[n][0], base.filter(s => num(s.impacto) === n).length, IMPACTO[n][1]]);
  const valDist = Object.keys(STATUS_VAL).map(k => [k, base.filter(s => statusVal(s.id) === k).length, STATUS_VAL[k]]);
  const topImp = base.filter(s => num(s.impacto) >= 4).sort((a, b) => num(b.impacto) - num(a.impacto) || num(b.servidores) - num(a.servidores)).slice(0, 10);
  const semResp = base.filter(s => !s.responsavel && ['Gabinete','Superintendência','Diretoria','Coordenadoria'].includes(s.tipo)).slice(0, 12);
  const saldo = base.map(s => [s, linhasDe(s.positivos).length - linhasDe(s.negativos).length, linhasDe(s.negativos).length]).filter(x => x[2]).sort((a, b) => a[1] - b[1]).slice(0, 8);
  $('#p-corpo').innerHTML = `
    <div class="kpis">
      ${kpi('#1e3a8a','fa-sitemap','Setores ativos', fmtN(base.length), `${porTipo.length} tipos · ${DB.setores.filter(s => s.status === 'Extinto' && (!fa || areaDe.get(s.id) === fa)).length} extintos`)}
      ${kpi('#0891b2','fa-users','Servidores', fmtN(soma('servidores')), `${fmtN(soma('comissionados'))} em cargos comissionados`)}
      ${(() => { const esc_ = base.filter(s => s.tipo === 'Unidades Escolares').reduce((t, s) => t + num(s.quantidade), 0); return esc_ ? kpi('#16a34a','fa-school','Unidades escolares', fmtN(esc_), 'representadas no mapa por um cartão') : ''; })()}
      ${kpi('#16a34a','fa-coins','Orçamento anual', fmtRc(soma('orcamento')), `custo mensal ${fmtRc(soma('custoMensal'))}`)}
      ${kpi('#d97706','fa-stamp','Validações pendentes', fmtN(pend), `${vals.length} pedidas no total`)}
      ${kpi('#7c3aed','fa-list-check','Cadastro completo', compl + '%', `${comResp} com responsável · ${comComp} com competências`)}
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#1e3a8a"><h3><i class="fa-solid fa-building-columns"></i>Por secretaria adjunta</h3><p class="s">Quantidade de setores em cada área (clique para abrir no mapa)</p>${barras(porArea.map(x => [nomeCurto(porId.get(x.a)), x.n, corArea(x.a), x.a]))}</div>
      <div class="cartao bl" style="--c:#2563eb"><h3><i class="fa-solid fa-shapes"></i>Por tipo de setor</h3><p class="s">Como a estrutura se distribui</p>${barras(porTipo)}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#0891b2"><h3><i class="fa-solid fa-users"></i>Servidores por área</h3><p class="s">Soma do campo Servidores</p>${porArea.some(x => x.ser) ? barras(porArea.map(x => [nomeCurto(porId.get(x.a)), x.ser, corArea(x.a), x.a])) : '<div class="vazio"><i class="fa-solid fa-users-slash"></i>Preencha os valores dos setores (aba Valores) para ver esta distribuição.</div>'}</div>
      <div class="cartao bl" style="--c:#16a34a"><h3><i class="fa-solid fa-coins"></i>Orçamento por área</h3><p class="s">Soma do orçamento anual</p>${porArea.some(x => x.orc) ? barras(porArea.map(x => [nomeCurto(porId.get(x.a)), x.orc, corArea(x.a), x.a]), null, fmtRc) : '<div class="vazio"><i class="fa-solid fa-coins"></i>Sem orçamento informado ainda.</div>'}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#f97316"><h3><i class="fa-solid fa-bolt"></i>Impacto</h3><p class="s">Classificação de impacto dos setores</p>${barras(impDist)}</div>
      <div class="cartao bl" style="--c:#d97706"><h3><i class="fa-solid fa-stamp"></i>Situação das validações</h3><p class="s">Por setor</p>${barras(valDist)}</div>
    </div>
    <div class="grade2">
      <div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-triangle-exclamation"></i>Setores de impacto alto ou crítico</h3><p class="s">Prioridade para acompanhamento</p><div class="pend">${topImp.map(s => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]}</span><span>${esc(s.nome)}</span><small style="color:var(--mut)">${esc(nomeCurto(porId.get(areaDe.get(s.id))))}</small></button>`).join('') || '<div class="vazio">Nenhum setor classificado como alto ou crítico.</div>'}</div></div>
      <div class="cartao bl" style="--c:#7c3aed"><h3><i class="fa-solid fa-user-xmark"></i>Chefias sem responsável</h3><p class="s">Gabinetes, superintendências, diretorias e coordenadorias</p><div class="pend">${semResp.map(s => `<button onclick="irPara(${arg(s.id)})"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)};width:16px"></i><span>${esc(s.nome)}</span></button>`).join('') || '<div class="vazio">Todas têm responsável.</div>'}</div></div>
    </div>
    ${saldo.length ? `<div class="cartao bl" style="--c:#dc2626"><h3><i class="fa-solid fa-scale-unbalanced"></i>Mais pontos negativos que positivos</h3><p class="s">Setores com pontos de atenção registrados</p><div class="pend">${saldo.map(([s, d, n]) => `<button onclick="irPara(${arg(s.id)})"><span class="chip" style="--c:${d < 0 ? '#dc2626' : '#d97706'}">${n} negativo(s)</span><span>${esc(s.nome)}</span></button>`).join('')}</div></div>` : ''}`;
}

/* Validações (todas) */
function renderValidacoes(){
  opcoesFiltro('#v-status', 'Todas as situações', Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(t => [t, t]));
  const usados = [...new Set(DB.validacoes.map(v => v.validadorId))].filter(i => porId.has(i)).sort((a, b) => porId.get(a).nome.localeCompare(porId.get(b).nome, 'pt-BR'));
  opcoesFiltro('#v-validador', 'Todos os validadores', usados.map(i => [i, porId.get(i).nome]));
  const q = norm($('#v-busca').value), fs = $('#v-status').value, fv = $('#v-validador').value;
  const l = DB.validacoes.filter(v => (!fs || (v.status || 'Pendente') === fs) && (!fv || v.validadorId === fv) && (!q || norm([(porId.get(v.setorId) || {}).nome, (porId.get(v.validadorId) || {}).nome, v.parecer].join(' ')).includes(q)))
    .sort((a, b) => ((a.status || 'Pendente') === 'Pendente' ? 0 : 1) - ((b.status || 'Pendente') === 'Pendente' ? 0 : 1) || Date.parse(b.solicitadoEm || 0) - Date.parse(a.solicitadoEm || 0));
  $('#v-corpo').innerHTML = l.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th>Setor avaliado</th><th>Setor validador</th><th>Situação</th><th>Parecer</th><th>Pedida em</th></tr></thead><tbody>${l.map(v => { const s = porId.get(v.setorId), o = porId.get(v.validadorId); return `<tr>
    <td onclick="irPara(${arg(v.setorId)})"><b>${esc(s ? s.nome : '?')}</b></td><td>${esc(o ? o.nome : '?')}</td>
    <td onclick="event.stopPropagation()"><select class="campo" style="height:32px;min-width:190px" onchange="editarValidacao(${arg(v.id)},'status',this.value)">${Object.keys(STATUS_VAL).filter(x => x !== 'Sem validação').map(x => `<option ${x === (v.status || 'Pendente') ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
    <td onclick="event.stopPropagation()" style="white-space:normal;min-width:240px"><input class="campo" style="height:32px" value="${esc(v.parecer)}" placeholder="Parecer" onchange="editarValidacao(${arg(v.id)},'parecer',this.value)"></td>
    <td>${fmtData(v.solicitadoEm)}</td></tr>`; }).join('')}</tbody></table></div>`
    : `<div class="cartao vazio" style="padding:40px"><i class="fa-solid fa-stamp"></i>Nenhuma validação ${DB.validacoes.length ? 'com esses filtros' : 'pedida ainda'}.<br><span style="font-size:12.5px">Abra um setor no mapa e use a aba <b>Validações</b> para pedir a outro setor que valide sua estrutura.</span></div>`;
}

/* Configurações */
function renderConfig(){
  $('#c-corpo').innerHTML = `
    <div class="cartao bl"><h3><i class="fa-solid fa-cloud"></i>Conexão com a planilha</h3>
      <p class="s">Situação: <b>${online() ? 'conectado ao Apps Script' : 'desconectado'}</b>${online() && fila.length ? ` · ${fila.length} alteração(ões) aguardando envio` : ''}${ultimoErro ? ` · <span style="color:var(--perigo)">${esc(ultimoErro)}</span>` : ''}</p>
      <p class="s">Conectado como <b>${esc(cfg.usuario)}</b> (${esc(cfg.login)}) · perfil <b>${esc(cfg.perfil || '—')}</b>${sessao.lembrado() ? ' · sessão mantida neste computador' : ''}</p>
      <label><span class="rot">Endereço do Apps Script (Web App)</span><input id="c-url" class="campo" value="${esc(cfg.url)}" ${ehAdmin() ? '' : 'readonly'} placeholder="https://script.google.com/macros/s/.../exec"></label>
      <div class="acoes"><button class="btn btn-s" onclick="testarConexao()"><i class="fa-solid fa-signal"></i>Testar</button>${ehAdmin() ? `<button class="btn btn-s" onclick="salvarUrl()"><i class="fa-solid fa-floppy-disk"></i>Salvar endereço</button>` : ''}${online() ? `<button class="btn btn-s" onclick="recarregarNuvem()"><i class="fa-solid fa-cloud-arrow-down"></i>Baixar da planilha</button>${ehAdmin() ? `<button class="btn btn-s" onclick="enviarTudo()"><i class="fa-solid fa-cloud-arrow-up"></i>Enviar tudo para a planilha</button>` : ''}` : ''}<button class="btn btn-s" onclick="modalTrocarSenha(false)"><i class="fa-solid fa-key"></i>Alterar minha senha</button></div>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-mobile-screen-button"></i>GABOrg como aplicativo</h3>
      <p class="s">${rodandoComoApp() ? 'Você está usando o GABOrg instalado como app.' : 'Instale o GABOrg no computador ou no celular: ele ganha ícone próprio e abre em tela cheia, sem a barra do navegador. Os dados continuam na planilha.'}</p>
      ${rodandoComoApp() ? '' : `<div class="acoes"><button class="btn btn-p" onclick="instalarApp()"><i class="fa-solid fa-download"></i>Instalar o GABOrg</button></div>
      <p class="s" style="font-size:12px">Android/Chrome/Edge: botão acima ou menu do navegador › <b>Instalar app</b>. iPhone/iPad: Safari › <b>Compartilhar</b> › <b>Adicionar à Tela de Início</b>. É preciso abrir pelo endereço publicado (GitHub Pages), não pelo arquivo.</p>`}
    </div>
    <div class="cartao bl so-adm"><h3><i class="fa-solid fa-file-code"></i>Como instalar ou atualizar o backend</h3>
      <ol class="passos">
        <li>Na planilha, abra <b>Extensões › Apps Script</b>, apague o conteúdo e cole o arquivo <code>Codigo.gs</code>. Salve.</li>
        <li>Execute a função <code>configurarGABOrg</code> uma vez e autorize. Ela cria as abas e o usuário <b>admin</b> com uma <b>senha provisória</b> (mostrada na planilha).</li>
        <li><b>Implantar › Nova implantação › App da Web</b>, executar como <b>Eu</b> e acesso <b>Qualquer pessoa</b>. Para atualizar sem mudar o endereço: <b>Gerenciar implantações › Editar › Nova versão</b>.</li>
        <li>Entre com <b>admin</b> e a senha provisória, defina a sua senha e cadastre as outras pessoas em <b>Usuários</b>.</li>
        <li>Esqueceu a senha do único administrador? Na planilha, use o menu <b>GABOrg › Redefinir senha de um usuário</b>.</li>
      </ol>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-box-archive"></i>Cópias e restauração</h3>
      <p class="s">${DB.setores.length} setores · ${DB.validacoes.length} validações · ${DB.vinculos.length} vínculos · ${DB.historico.length} registros de histórico</p>
      <div class="acoes">
        <button class="btn btn-s" onclick="exportarJSON()"><i class="fa-solid fa-download"></i>Exportar cópia (JSON)</button>
        <label class="btn btn-s so-adm"><i class="fa-solid fa-upload"></i>Importar cópia<input type="file" accept=".json,application/json" class="sr" onchange="importarJSON(this.files[0])"></label>
        <button class="btn btn-s" onclick="exportarCSV()"><i class="fa-solid fa-file-csv"></i>Exportar setores (CSV)</button>
        <button class="btn btn-perigo so-adm" onclick="restaurarDecreto()"><i class="fa-solid fa-rotate-left"></i>Restaurar estrutura do decreto</button>
      </div>
    </div>
    <p style="font-size:11.5px;color:var(--mut)">GABOrg v${VERSAO} · estrutura de referência: Decreto nº 2.236, de 27 de agosto de 2026 (vigência 01/09/2026). A hierarquia foi lida do organograma anexo: confira as subordinações e ajuste no mapa quando necessário.</p>`;
}
async function salvarUrl(){
  const url = $('#c-url').value.trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) return toast('Informe o endereço do Web App do Apps Script.', 'aviso');
  if (url === cfg.url) return toast('O endereço não mudou.');
  if (!await confirmar('Trocar endereço', 'Ao trocar o endereço do Apps Script, você precisará entrar de novo com usuário e senha cadastrados naquela planilha.', 'Trocar e sair')) return;
  cfg.url = url; salvarCfg(); sessao.set(''); cfg.token = ''; location.reload();
}
async function testarConexao(){
  const url = ($('#c-url') && $('#c-url').value.trim()) || cfg.url; if (!url) return toast('Informe o endereço.', 'aviso');
  const t0 = performance.now();
  try { const r = await fetch(url + (url.includes('?') ? '&' : '?') + 'action=ping').then(x => x.text()).then(JSON.parse); toast(`Apps Script respondeu em ${Math.round(performance.now() - t0)} ms (GABOrg backend v${r.versao || '?'}).`); }
  catch (e) { toast('Não foi possível falar com o Apps Script.', 'erro'); }
}
async function recarregarNuvem(){
  if (fila.length && !await confirmar('Baixar da planilha', `${fila.length} alteração(ões) ainda não foram enviadas. Elas continuam guardadas e serão reaplicadas.`, 'Baixar')) return;
  try { await lerNuvem(); redesenharTudo(); toast('Dados atualizados.'); } catch (e) { toast(e.message, 'erro'); }
}
async function enviarTudo(){
  if (!await confirmar('Enviar tudo para a planilha', 'A planilha será substituída pelos dados desta tela (setores, validações, vínculos e histórico). Continuar?', 'Substituir planilha', true)) return;
  try { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); fila = []; store.set('gaborg_fila', fila); versaoNuvem = String(r.versao || ''); toast('Planilha substituída.'); } catch (e) { toast(e.message, 'erro'); }
  statusSync(); renderConfig();
}
function baixarArquivo(nome, conteudo, tipo){ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([conteudo], { type:tipo })); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
function exportarJSON(){ if (cenSwap) { desaplicarCenario(); setTimeout(aplicarCenario, 0); } baixarArquivo(`gaborg_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ sistema:'GABOrg', versao:VERSAO, exportadoEm:agora(), dados:DB }, null, 1), 'application/json'); }
async function importarJSON(f){
  if (cenMapa) sairCenario();
  if (!f) return;
  try {
    const j = JSON.parse(await f.text()), d = j.dados || j;
    if (!Array.isArray(d.setores)) throw new Error('Arquivo sem a lista de setores.');
    if (!await confirmar('Importar cópia', `Substituir a estrutura atual pelos <b>${d.setores.length}</b> setores do arquivo?${online() ? ' A planilha também será substituída.' : ''}`, 'Importar', true)) return;
    TABS_DB.forEach(t => DB[t] = (d[t] || []).map(x => novoReg(t, x)));
    redesenharTudo(); salvarLocal();
    if (online()) { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); versaoNuvem = String(r.versao || ''); }
    toast('Cópia importada.');
  } catch (e) { toast('Falha ao importar: ' + e.message, 'erro'); }
}
function exportarCSV(){
  const q = v => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' | ')}"`;
  const cab = ['ID','Nome','Sigla','Tipo','Setor superior','Caminho','Área','Situação','Responsável','Contato','Competências','Entregas','Orçamento anual','Custo mensal','Servidores','Comissionados','Impacto','Descrição do impacto','Pontos positivos','Pontos negativos','Validação'];
  const ordenados = []; const visit = s => { ordenados.push(s); filhosDe(s.id).forEach(visit); }; raizes().forEach(visit);
  const linhas = ordenados.map(s => [s.id, s.nome, s.sigla, s.tipo, (porId.get(s.paiId) || {}).nome || '', caminho(s.id).map(a => a.nome).concat(s.nome).join(' > '), nomeCurto(porId.get(areaDe.get(s.id))), s.status, s.responsavel, s.contato, s.competencias, s.entregas, s.orcamento, s.custoMensal, s.servidores, s.comissionados, num(s.impacto) ? IMPACTO[num(s.impacto)][0] : '', s.impactoDescricao, s.positivos, s.negativos, statusVal(s.id)].map(q).join(';'));
  baixarArquivo(`gaborg_setores_${new Date().toISOString().slice(0, 10)}.csv`, '\uFEFF' + [cab.map(q).join(';')].concat(linhas).join('\r\n'), 'text/csv;charset=utf-8');
  toast(`${ordenados.length} setores exportados.`);
}
async function restaurarDecreto(){
  if (cenMapa) sairCenario();
  if (!await confirmar('Restaurar estrutura do decreto', 'Todos os setores, valores, validações e vínculos atuais serão substituídos pela estrutura original do Decreto nº 2.236/2026. Exporte uma cópia antes, se precisar.', 'Restaurar', true)) return;
  DB = Object.assign(construirDecreto(), { historico:DB.historico, rubricas:DB.rubricas || [], despesas:DB.despesas || [], propostas:DB.propostas || [], propSetores:DB.propSetores || [], escolas:DB.escolas || [] });
  indexar();abertos = new Set(raizes().map(r => r.id)); salvarAbertos();
  salvarLocal();
  if (online()) { try { const r = await chamar({ action:'replace_all', dados:DB }, 120000); if (r.status !== 'success') throw new Error(r.message); versaoNuvem = String(r.versao || ''); } catch (e) { toast(e.message, 'erro'); } }
  fecharPainel(); trocarVista('mapa'); setTimeout(() => ajustar(true), 50); toast('Estrutura do decreto restaurada.');
}

/* ===================== TEMA, LOGIN E INÍCIO ===================== */
function alternarTema(){ setTimeout(() => { if (mt.mapa && ['claro','escuro'].includes(mt.base)) trocarBaseMT(document.documentElement.dataset.tema === 'escuro' ? 'escuro' : 'claro'); else if (mt.mapa) desenharMalhaMT(); }, 0); const e = document.documentElement.dataset.tema === 'escuro'; if (e) delete document.documentElement.dataset.tema; else document.documentElement.dataset.tema = 'escuro'; store.set('gaborg_tema', e ? 'claro' : 'escuro'); try { localStorage.setItem('gaborg_tema', e ? 'claro' : 'escuro'); } catch (x) {} desenharMini(); }
function preencherUsuario(){
  $('#u-nome').textContent = cfg.usuario || cfg.login || 'Usuário'; $('#u-av').textContent = iniciais(cfg.usuario || cfg.login);
  $('#u-perfil').textContent = cfg.perfil || '';
  document.body.classList.toggle('ro', somenteLeitura());
  document.body.classList.toggle('adm', ehAdmin());
}
function salvarCfg(){ const c = Object.assign({}, cfg); delete c.token; store.set('gaborg_cfg', c); }
function aplicarUsuario(u){ Object.assign(cfg, { usuario:u.nome || u.login, login:u.login, perfil:u.perfil, modo:'nuvem' }); salvarCfg(); preencherUsuario(); }
function verSenha(b){ const i = b.parentNode.querySelector('input'); const v = i.type === 'password'; i.type = v ? 'text' : 'password'; b.innerHTML = `<i class="fa-solid ${v ? 'fa-eye-slash' : 'fa-eye'}"></i>`; b.title = v ? 'Ocultar senha' : 'Mostrar senha'; }
function mostrarLogin(msg){
  $('#app').classList.add('hidden'); $('#login').classList.remove('hidden');
  $('#lg-login').value = cfg.login || ''; $('#lg-url').value = cfg.url || URL_PADRAO; $('#lg-senha').value = '';
  const a = $('#lg-aviso'); if (msg) { a.textContent = msg; a.classList.remove('hidden'); } else a.classList.add('hidden');
  setTimeout(() => (cfg.login ? $('#lg-senha') : $('#lg-login')).focus(), 50);
}
let encerrando = false;
function sessaoEncerrada(msg){
  if (encerrando) return; encerrando = true;
  cfg.token = ''; sessao.set(''); document.querySelectorAll('.modal').forEach(m => m.remove());
  mostrarLogin(msg || 'Sua sessão terminou. Entre novamente.');
  setTimeout(() => { encerrando = false; }, 1000);
}
async function carregarNuvem(){
  await lerNuvem();
  if (!DB.setores.length && ehAdmin()) {
    if (await confirmar('Planilha vazia', 'A planilha ainda não tem setores. Enviar a estrutura do <b>Decreto nº 2.236/2026</b> para começar?', 'Enviar estrutura')) {
      DB = construirDecreto(); indexar(); abertos = new Set(raizes().map(r => r.id)); salvarAbertos();
      const rr = await chamar({ action:'replace_all', dados:DB }, 120000); if (rr.status !== 'success') throw new Error(rr.message);
      versaoNuvem = String(rr.versao || '');
    }
  }
  salvarLocal();
}
$('#f-login').addEventListener('submit', async e => {
  e.preventDefault();
  const login = $('#lg-login').value.trim(), senha = $('#lg-senha').value, lembrar = $('#lg-lembrar').checked, url = $('#lg-url').value.trim() || cfg.url;
  const aviso = m => { const a = $('#lg-aviso'); a.textContent = m; a.classList.remove('hidden'); };
  if (!login || !senha) return aviso('Informe usuário e senha.');
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) { $('#lg-adv').open = true; return aviso('Informe o endereço do Apps Script.'); }
  const b = $('#lg-btn'); b.disabled = true; b.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Entrando...';
  try {
    if (url !== cfg.url) { cfg.url = url; fila = []; store.set('gaborg_fila', fila); store.set('gaborg_db', null); }
    if (login.toLowerCase() !== String(cfg.login || '').toLowerCase()) { fila = []; store.set('gaborg_fila', fila); }
    cfg.token = '';
    const r = await chamar({ action:'login', login, senha, lembrar }, 30000);
    if (r.status !== 'success') throw new Error(r.message || 'Não foi possível entrar.');
    cfg.token = r.token; sessao.set(r.token, lembrar); aplicarUsuario(r.usuario);
    $('#lg-senha').value = ''; $('#lg-aviso').classList.add('hidden');
    if (r.usuario.trocarSenha === 'Sim') { const ok = await modalTrocarSenha(true, senha); if (!ok) throw new Error('Defina uma nova senha para continuar.'); }
    await carregarNuvem(); abrirApp();
  } catch (err) { aviso(err.message || 'Não foi possível conectar.'); }
  b.disabled = false; b.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i>Entrar';
});
function sair(){
  if (fila.length && !confirm(`${fila.length} alteração(ões) ainda não chegaram à planilha. Elas ficam guardadas neste navegador e serão enviadas quando você entrar de novo. Sair mesmo assim?`)) return;
  cfg.token = ''; sessao.set(''); location.reload();
}
function migrarEscolas(){
  if (somenteLeitura()) return;
  DB.setores.filter(s => s.tipo === 'Unidades Escolares' && s.quantidade === '' && s.status !== 'Extinto').forEach(s => { s.quantidade = ESCOLAS_PADRAO; enfileirar('setores', s); });
}
function abrirApp(){
  indexar(); migrarEscolas();
  if (!store.get('gaborg_abertos', null)) { abertos = new Set(raizes().map(r => r.id)); salvarAbertos(); }
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  preencherUsuario(); statusSync();
  { const hv = location.hash.slice(1); if (['mapa','lista','painel','validacoes','config'].includes(hv)) vistaAtual = hv; }
  trocarVista(vistaAtual === 'usuarios' && !ehAdmin() ? 'mapa' : (vistaAtual || 'mapa'));
  if (!store.get('gaborg_view_ok', false)) { setTimeout(() => ajustar(true), 60); store.set('gaborg_view_ok', true); }
  if (fila.length && !somenteLeitura()) enviarFila(); else if (somenteLeitura() && fila.length) { fila = []; store.set('gaborg_fila', fila); }
}

/* ===================== SENHA E USUÁRIOS ===================== */
function abrirModal({ titulo, html, rotulo, perigo, semCancelar, largura, aoConfirmar }){
  return new Promise(ok => {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<form class="cx" role="dialog" aria-modal="true" style="${largura ? 'max-width:' + largura + 'px' : ''}"><h3>${esc(titulo)}</h3>${html}<div class="lg-aviso hidden" data-aviso></div><div class="acoes">${semCancelar ? '' : '<button type="button" class="btn btn-s" data-r="0">Cancelar</button>'}<button type="submit" class="btn ${perigo ? 'btn-perigo' : 'btn-p'}" data-ok>${esc(rotulo || 'Confirmar')}</button></div></form>`;
    const fechar = v => { m.remove(); ok(v); };
    m.addEventListener('click', e => { if (e.target.closest('[data-r="0"]') || (e.target === m && !semCancelar)) fechar(false); });
    m.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const bt = m.querySelector('[data-ok]'), av = m.querySelector('[data-aviso]'), txt = bt.innerHTML;
      bt.disabled = true; bt.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>Aguarde...'; av.classList.add('hidden');
      try { const r = aoConfirmar ? await aoConfirmar(m) : true; if (r !== false) fechar(r === undefined ? true : r); }
      catch (err) { av.textContent = err.message || String(err); av.classList.remove('hidden'); }
      bt.disabled = false; bt.innerHTML = txt;
    });
    document.body.appendChild(m);
    const f = m.querySelector('input:not([type=hidden]):not([readonly]),select'); (f || m.querySelector('[data-ok]')).focus();
  });
}
const campoSenha = (id, rot, ac) => `<label><span class="rot">${rot}</span><span class="senha-cx"><input id="${id}" class="campo" type="password" autocomplete="${ac}" required><button type="button" class="ver" title="Mostrar senha" onclick="verSenha(this)"><i class="fa-solid fa-eye"></i></button></span></label>`;
let trocandoSenha = null;
function modalTrocarSenha(obrigatorio, atualConhecida){
  if (trocandoSenha) return trocandoSenha;
  trocandoSenha = abrirModal({
    titulo: obrigatorio ? 'Defina a sua senha' : 'Alterar minha senha',
    html: `<p>${obrigatorio ? 'Você entrou com uma senha provisória. Escolha agora uma senha pessoal.' : 'A nova senha passa a valer em todos os seus acessos.'} Use pelo menos <b>8 caracteres</b>, com letras e números.</p>
      ${atualConhecida ? '' : campoSenha('ts-atual', obrigatorio ? 'Senha provisória' : 'Senha atual', 'current-password')}
      ${campoSenha('ts-nova', 'Nova senha', 'new-password')}${campoSenha('ts-conf', 'Repita a nova senha', 'new-password')}`,
    rotulo: 'Salvar senha', semCancelar: obrigatorio,
    aoConfirmar: async m => {
      const atual = atualConhecida || m.querySelector('#ts-atual').value, nova = m.querySelector('#ts-nova').value, conf = m.querySelector('#ts-conf').value;
      if (nova.length < 8 || !/[A-Za-zÀ-ú]/.test(nova) || !/\d/.test(nova)) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
      if (nova !== conf) throw new Error('As duas senhas não são iguais.');
      const r = await chamar({ action:'change_password', senhaAtual:atual, novaSenha:nova }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      cfg.token = r.token; sessao.set(r.token, sessao.lembrado()); aplicarUsuario(r.usuario);
      toast('Senha alterada.'); return true;
    }
  }).finally(() => { trocandoSenha = null; });
  return trocandoSenha;
}

let usuarios = [], acessos = [], abaAdmAtual = 'usuarios';
const COR_PERFIL = { Administrador:'#dc2626', Editor:'#2563eb', Leitor:'#64748b' };
const COR_EVENTO = { 'Login':'#16a34a', 'Senha incorreta':'#d97706', 'Login recusado':'#dc2626', 'Bloqueado por tentativas':'#dc2626', 'Usuário criado':'#2563eb', 'Usuário alterado':'#0891b2', 'Usuário desativado':'#64748b', 'Usuário excluído':'#dc2626', 'Usuário desbloqueado':'#16a34a', 'Senha alterada pelo usuário':'#7c3aed', 'Senha definida pelo administrador':'#7c3aed', 'Senha provisória gerada':'#7c3aed', 'Sessões encerradas':'#475569' };
function situacaoUsuario(u){
  if (u.ativo !== 'Sim') return ['Desativado', '#94a3b8'];
  if (u.bloqueado) return ['Bloqueado', '#dc2626'];
  if (u.trocarSenha === 'Sim') return [u.ultimoAcesso ? 'Deve trocar a senha' : 'Aguardando 1º acesso', '#d97706'];
  return ['Ativo', '#16a34a'];
}
function abaAdm(a){
  abaAdmAtual = a;
  document.querySelectorAll('.adm-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a));
  renderUsuarios();
}
async function renderUsuarios(recarregar){
  const c = $('#u-corpo'); if (!c) return;
  if (!ehAdmin()) { c.innerHTML = '<div class="cartao vazio">Apenas administradores acessam esta área.</div>'; return; }
  if (abaAdmAtual === 'perfis') return renderPerfis();
  if (abaAdmAtual === 'acessos') return renderAcessos(recarregar);
  if (!usuarios.length) c.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando usuários...</div>';
  try { const r = await chamar({ action:'users_list' }, 30000); if (r.status !== 'success') throw new Error(r.message); usuarios = r.usuarios || []; }
  catch (e) { c.innerHTML = `<div class="cartao vazio" style="color:var(--perigo)">${esc(e.message)}</div>`; return; }
  if (abaAdmAtual !== 'usuarios') return;
  const ativos = usuarios.filter(u => u.ativo === 'Sim');
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const f = { q:($('#ua-q') || {}).value || '', perfil:($('#ua-perfil') || {}).value || '', sit:($('#ua-sit') || {}).value || '' };
  c.innerHTML = `<div class="kpis">
      ${kpi('#2563eb', 'fa-users', 'Usuários', usuarios.length, `${ativos.length} ativo(s)`)}
      ${kpi('#dc2626', 'fa-user-shield', 'Administradores', ativos.filter(u => u.perfil === 'Administrador').length, 'ativos')}
      ${kpi('#d97706', 'fa-hourglass-half', 'Aguardando senha', ativos.filter(u => u.trocarSenha === 'Sim').length, 'precisam definir a senha')}
      ${kpi('#7f1d1d', 'fa-lock', 'Bloqueados', usuarios.filter(u => u.bloqueado).length, 'por senhas erradas')}
    </div>
    <div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="ua-q" class="campo" placeholder="Buscar nome, login ou e-mail" value="${esc(f.q)}" oninput="filtrarUsuarios()"></div>
      <select id="ua-perfil" class="campo" onchange="filtrarUsuarios()"><option value="">Todos os perfis</option>${['Administrador','Editor','Leitor'].map(p => `<option ${f.perfil === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      <select id="ua-sit" class="campo" onchange="filtrarUsuarios()"><option value="">Todas as situações</option>${['Ativo','Aguardando 1º acesso','Deve trocar a senha','Bloqueado','Desativado'].map(s => `<option ${f.sit === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    </div>
    <div id="ua-lista"></div>
    <p style="font-size:12px;color:var(--mut);margin-top:10px"><i class="fa-solid fa-shield-halved"></i> Senhas nunca aparecem aqui: o sistema guarda só uma versão cifrada. Você pode <b>definir uma senha</b> para a pessoa ou <b>gerar uma provisória</b>; em ambos os casos pode exigir que ela crie a própria no próximo acesso.</p>`;
  filtrarUsuarios();
}
function filtrarUsuarios(){
  const el = $('#ua-lista'); if (!el) return;
  const q = norm($('#ua-q').value), pf = $('#ua-perfil').value, st = $('#ua-sit').value;
  const lista = usuarios.filter(u => (!q || norm(u.nome + ' ' + u.login + ' ' + (u.email || '')).includes(q)) && (!pf || u.perfil === pf) && (!st || situacaoUsuario(u)[0] === st))
    .sort((a, b) => (a.ativo === b.ativo ? 0 : a.ativo === 'Sim' ? -1 : 1) || a.nome.localeCompare(b.nome, 'pt-BR'));
  if (!lista.length) { el.innerHTML = '<div class="cartao vazio">Nenhum usuário com esses filtros.</div>'; return; }
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Nome</th><th>Login</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Último acesso</th><th></th></tr></thead><tbody>${lista.map(u => { const [s, cs] = situacaoUsuario(u); return `<tr>
    <td><span class="u-nome"><span class="u-av" style="background:${COR_PERFIL[u.perfil] || '#64748b'}">${esc(iniciais(u.nome))}</span><span><b>${esc(u.nome)}</b>${u.login === cfg.login ? ' <span class="chip" style="--c:#2563eb">você</span>' : ''}<small>criado ${u.criadoEm ? fmtData(u.criadoEm) : '—'}${u.criadoPor ? ' por ' + esc(u.criadoPor) : ''}</small></span></span></td>
    <td><code>${esc(u.login)}</code></td><td>${esc(u.email || '—')}</td>
    <td><span class="chip" style="--c:${COR_PERFIL[u.perfil] || '#64748b'}">${esc(u.perfil)}</span></td>
    <td><span class="chip" style="--c:${cs}">${s}</span>${Number(u.tentativas) && !u.bloqueado ? `<small style="display:block;color:var(--alerta);font-size:11px;margin-top:3px">${u.tentativas} senha(s) errada(s)</small>` : ''}</td>
    <td>${u.ultimoAcesso ? fmtData(u.ultimoAcesso) : '<span style="color:var(--mut)">nunca</span>'}</td>
    <td><div class="u-acoes"><button class="btn btn-s btn-sm" onclick="formUsuario(${arg(u.id)})"><i class="fa-solid fa-pen"></i>Editar</button><button class="btn btn-p btn-sm" onclick="acoesUsuario(${arg(u.id)})"><i class="fa-solid fa-key"></i>Senha e acesso</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
}

// Painel de ações de um usuário (senha, bloqueio, sessões, situação, exclusão)
function acoesUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const proprio = u.login === cfg.login, [s, cs] = situacaoUsuario(u);
  const it = (a, ic, t, d, cls) => `<button type="button" data-a="${a}" class="${cls || ''}"><i class="fa-solid ${ic}"></i><span><b>${t}</b><small>${d}</small></span></button>`;
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="cx" role="dialog" aria-modal="true" style="max-width:460px">
    <div class="u-nome" style="margin-bottom:4px"><span class="u-av" style="width:42px;height:42px;font-size:14px;background:${COR_PERFIL[u.perfil] || '#64748b'}">${esc(iniciais(u.nome))}</span><span><b style="font-size:15px">${esc(u.nome)}</b><small><code>${esc(u.login)}</code> · ${esc(u.perfil)} · <span style="color:${cs};font-weight:700">${s}</span></small></span></div>
    <div class="sheet-acoes">
      ${it('definir', 'fa-key', 'Definir nova senha', 'Você escolhe a senha e informa à pessoa. Pode exigir que ela troque no próximo acesso.')}
      ${it('provisoria', 'fa-wand-magic-sparkles', 'Gerar senha provisória', 'O sistema cria uma senha aleatória; a pessoa define a própria ao entrar.')}
      ${u.bloqueado || Number(u.tentativas) ? it('desbloquear', 'fa-lock-open', 'Desbloquear', u.bloqueado ? 'Libera o login agora, sem esperar os 15 minutos.' : 'Zera o contador de senhas erradas.') : ''}
      ${proprio ? '' : it('sessoes', 'fa-right-from-bracket', 'Encerrar sessões abertas', 'Desconecta a pessoa de todos os computadores e celulares. A senha não muda.')}
      ${proprio ? '' : it('situacao', u.ativo === 'Sim' ? 'fa-user-slash' : 'fa-user-check', u.ativo === 'Sim' ? 'Desativar acesso' : 'Reativar acesso', u.ativo === 'Sim' ? 'Bloqueia o login sem apagar o usuário. Pode ser reativado depois.' : 'Volta a permitir o login com a senha atual.')}
      ${it('historico', 'fa-clock-rotate-left', 'Ver registro de acessos', 'Logins, tentativas e alterações desta pessoa.')}
      ${proprio ? '' : it('excluir', 'fa-trash-can', 'Excluir usuário', 'Remove o acesso de vez. O histórico de alterações é mantido.', 'perigo')}
    </div>
    <div class="acoes"><button type="button" class="btn btn-s" data-a="fechar">Fechar</button></div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b && e.target !== m) return;
    m.remove(); const a = b && b.dataset.a;
    if (a === 'definir') definirSenhaUsuario(id);
    if (a === 'provisoria') resetarSenha(id);
    if (a === 'desbloquear') acaoSimples(id, 'user_unlock', 'Usuário desbloqueado.');
    if (a === 'sessoes') confirmar('Encerrar sessões', `Desconectar <b>${esc(u.nome)}</b> de todos os aparelhos? Ela precisará entrar de novo com a senha atual.`, 'Encerrar sessões').then(ok => ok && acaoSimples(id, 'user_logout', 'Sessões encerradas.'));
    if (a === 'situacao') alternarAtivo(id);
    if (a === 'historico') { abaAdm('acessos'); setTimeout(() => { const q = $('#ac-q'); if (q) { q.value = u.login; filtrarAcessos(); } }, 400); }
    if (a === 'excluir') excluirUsuario(id);
  });
  document.body.appendChild(m);
}
async function acaoSimples(id, action, msg){
  try { const r = await chamar({ action, id }, 30000); if (r.status !== 'success') throw new Error(r.message); toast(msg); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
async function alternarAtivo(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const ativar = u.ativo !== 'Sim';
  if (!ativar && !await confirmar('Desativar acesso', `<b>${esc(u.nome)}</b> não conseguirá mais entrar e as sessões abertas serão encerradas. Você pode reativar depois.`, 'Desativar', true)) return;
  try { const r = await chamar({ action:'user_save', usuario:{ id:u.id, nome:u.nome, login:u.login, email:u.email, perfil:u.perfil, ativo: ativar ? 'Sim' : 'Não' } }, 30000); if (r.status !== 'success') throw new Error(r.message); toast(ativar ? 'Acesso reativado.' : 'Acesso desativado.'); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
function sugerirSenha(){
  const L = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz', N = '23456789', T = L + N + '@#$%&*';
  const r = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  let s = L[r(L.length)] + N[r(N.length)]; while (s.length < 12) s += T[r(T.length)];
  return s.split('').sort(() => r(3) - 1).join('');
}
function forcaSenha(s){
  let p = 0; if (s.length >= 8) p++; if (s.length >= 12) p++; if (/[a-z]/.test(s) && /[A-Z]/.test(s)) p++; if (/\d/.test(s)) p++; if (/[^A-Za-z0-9]/.test(s)) p++;
  return [['Muito fraca', '#dc2626', 15], ['Fraca', '#dc2626', 30], ['Razoável', '#d97706', 55], ['Boa', '#16a34a', 78], ['Forte', '#16a34a', 100], ['Forte', '#16a34a', 100]][p];
}
function medirSenha(inp){
  const [t, c, w] = forcaSenha(inp.value), cx = inp.closest('form').querySelector('[data-forca]');
  if (!cx) return; cx.querySelector('i').style.cssText = `width:${inp.value ? w : 0}%;background:${c}`; cx.nextElementSibling.textContent = inp.value ? 'Força: ' + t : '';
}
function definirSenhaUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  const proprio = u.login === cfg.login;
  let senhaFinal = '';
  abrirModal({ titulo:'Definir nova senha', rotulo:'Salvar senha', largura:460,
    html:`<p>Nova senha de <b>${esc(u.nome)}</b> (<code>${esc(u.login)}</code>). As sessões abertas dessa pessoa serão encerradas.</p>
      <label><span class="rot">Nova senha</span><span class="senha-cx"><input id="ds-senha" class="campo" type="password" autocomplete="new-password" required oninput="medirSenha(this)"><button type="button" class="ver" title="Mostrar senha" onclick="verSenha(this)"><i class="fa-solid fa-eye"></i></button></span></label>
      <div class="forca" data-forca><i></i></div><small style="font-size:11.5px;color:var(--mut)"></small>
      <button type="button" class="btn btn-s btn-sm" style="align-self:flex-start" onclick="const i=this.closest('form').querySelector('#ds-senha');i.value=sugerirSenha();i.type='text';medirSenha(i)"><i class="fa-solid fa-dice"></i>Sugerir senha forte</button>
      <label class="chk"><input type="checkbox" id="ds-trocar" ${proprio ? '' : 'checked'}><span>Exigir que a pessoa crie a própria senha no próximo acesso <small style="display:block;color:var(--mut)">Recomendado: assim só ela conhecerá a senha definitiva.</small></span></label>
      <p style="font-size:12px">Mínimo de <b>8 caracteres</b>, com letras e números.</p>`,
    aoConfirmar: async m => {
      const s = m.querySelector('#ds-senha').value, troca = m.querySelector('#ds-trocar').checked;
      if (s.length < 8 || !/[A-Za-zÀ-ú]/.test(s) || !/\d/.test(s)) throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
      const r = await chamar({ action:'user_set_password', id, senha:s, exigirTroca:troca }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      senhaFinal = s; return r;
    }
  }).then(async r => {
    if (!r) return;
    if (proprio) { sessaoEncerrada('Sua senha foi alterada. Entre com a nova senha.'); return; }
    await abrirModal({ titulo:'Senha definida', rotulo:'Pronto', semCancelar:true,
      html:`<p>Passe estes dados a <b>${esc(u.nome)}</b>${r.usuario.trocarSenha === 'Sim' ? '. No próximo acesso o GABOrg pedirá uma senha pessoal' : ''}.</p>
        <p><span class="rot">Usuário</span><code style="font-size:14px">${esc(u.login)}</code></p>
        <div><span class="rot">Senha</span><div class="senha-prov">${esc(senhaFinal)}</div></div>
        <button type="button" class="btn btn-s" onclick="navigator.clipboard && navigator.clipboard.writeText(${arg('Endereço: ' + location.href.split('#')[0] + '\nUsuário: ' + u.login + '\nSenha: ' + senhaFinal)}).then(() => toast('Copiado.'))"><i class="fa-regular fa-copy"></i>Copiar usuário e senha</button>` });
    renderUsuarios();
  });
}

/* Registro de acessos */
async function renderAcessos(recarregar){
  const c = $('#u-corpo');
  if (!acessos.length || recarregar !== false) {
    if (!acessos.length) c.innerHTML = '<div class="cartao vazio"><i class="fa-solid fa-circle-notch fa-spin"></i>Carregando registro...</div>';
    try { const r = await chamar({ action:'access_log', limite:1000 }, 30000); if (r.status !== 'success') throw new Error(r.message); acessos = r.acessos || []; }
    catch (e) { c.innerHTML = `<div class="cartao vazio" style="color:var(--perigo)">${esc(e.message)}${/desconhecida/i.test(e.message) ? '<br><small>Atualize o Codigo.gs no Apps Script e publique uma nova versão.</small>' : ''}</div>`; return; }
  }
  if (abaAdmAtual !== 'acessos') return;
  const hoje = new Date().toISOString().slice(0, 10);
  const deHoje = acessos.filter(a => (a.data || '').slice(0, 10) === hoje);
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  const eventos = [...new Set(acessos.map(a => a.evento))].sort();
  c.innerHTML = `<div class="kpis">
      ${kpi('#16a34a', 'fa-right-to-bracket', 'Logins hoje', deHoje.filter(a => a.evento === 'Login').length, `${new Set(deHoje.filter(a => a.evento === 'Login').map(a => a.login)).size} pessoa(s)`)}
      ${kpi('#d97706', 'fa-triangle-exclamation', 'Falhas hoje', deHoje.filter(a => /incorreta|recusado|Bloqueado/.test(a.evento)).length, 'senhas erradas e recusas')}
      ${kpi('#7c3aed', 'fa-key', 'Mudanças de senha', acessos.filter(a => /Senha/.test(a.evento)).length, 'no período carregado')}
      ${kpi('#475569', 'fa-list', 'Registros', acessos.length, acessos.length ? 'desde ' + fmtData(acessos[acessos.length - 1].data) : '—')}
    </div>
    <div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="ac-q" class="campo" placeholder="Buscar usuário ou detalhe" oninput="filtrarAcessos()"></div>
      <select id="ac-ev" class="campo" onchange="filtrarAcessos()"><option value="">Todos os eventos</option><option value="__falhas">Só falhas e bloqueios</option>${eventos.map(e => `<option>${esc(e)}</option>`).join('')}</select>
      <button class="btn btn-s" onclick="exportarAcessos()"><i class="fa-solid fa-file-csv"></i>Exportar CSV</button>
    </div>
    <div id="ac-lista"></div>`;
  filtrarAcessos();
}
function acessosFiltrados(){
  const q = norm(($('#ac-q') || {}).value || ''), ev = ($('#ac-ev') || {}).value || '';
  return acessos.filter(a => (!q || norm(a.login + ' ' + a.nome + ' ' + a.detalhe + ' ' + a.autor).includes(q)) && (!ev || (ev === '__falhas' ? /incorreta|recusado|Bloqueado/.test(a.evento) : a.evento === ev)));
}
function filtrarAcessos(){
  const el = $('#ac-lista'); if (!el) return;
  const l = acessosFiltrados();
  if (!l.length) { el.innerHTML = '<div class="cartao vazio">Nenhum registro.</div>'; return; }
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Data</th><th>Usuário</th><th>Evento</th><th>Detalhe</th><th>Feito por</th></tr></thead><tbody>${l.slice(0, 500).map(a => `<tr>
    <td style="white-space:nowrap">${fmtData(a.data)}</td>
    <td class="ev"><b>${esc(a.nome || '—')}</b><br><small><code>${esc(a.login)}</code></small></td>
    <td><span class="chip" style="--c:${COR_EVENTO[a.evento] || '#64748b'}">${esc(a.evento)}</span></td>
    <td class="ev">${esc(a.detalhe || '')}</td>
    <td class="ev">${esc(a.autor || (a.evento === 'Login' || /incorreta|recusado|Bloqueado/.test(a.evento) ? '' : 'a própria pessoa'))}</td></tr>`).join('')}</tbody></table></div>
    ${l.length > 500 ? `<p style="font-size:12px;color:var(--mut)">Mostrando os 500 mais recentes de ${l.length}. Use a busca ou exporte o CSV para ver todos.</p>` : ''}`;
}
function exportarAcessos(){
  const l = acessosFiltrados(), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = '﻿' + ['Data;Login;Nome;Evento;Detalhe;Feito por', ...l.map(a => [fmtData(a.data), a.login, a.nome, a.evento, a.detalhe, a.autor].map(q).join(';'))].join('\r\n');
  const b = new Blob([csv], { type:'text/csv;charset=utf-8' }), u = URL.createObjectURL(b), lk = document.createElement('a');
  lk.href = u; lk.download = 'gaborg-acessos-' + new Date().toISOString().slice(0, 10) + '.csv'; lk.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
}

/* Perfis */
function renderPerfis(){
  const linhas = [
    ['Ver o mapa, a lista e os indicadores', 1, 1, 1], ['Exportar CSV e cópia JSON', 1, 1, 1],
    ['Criar, alterar, mover e excluir setores', 0, 1, 1], ['Valores, análise, validações e vínculos', 0, 1, 1], ['Alinhar e organizar o mapa', 0, 1, 1],
    ['Restaurar a estrutura do decreto / importar cópia', 0, 0, 1], ['Gerenciar usuários, senhas e acessos', 0, 0, 1]
  ];
  const ok = v => v ? '<i class="fa-solid fa-check" style="color:var(--ok)"></i>' : '<span style="color:var(--mut2)">—</span>';
  const n = p => usuarios.filter(u => u.perfil === p && u.ativo === 'Sim').length;
  $('#u-corpo').innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Permissão</th><th style="text-align:center">Leitor (${n('Leitor')})</th><th style="text-align:center">Editor (${n('Editor')})</th><th style="text-align:center">Administrador (${n('Administrador')})</th></tr></thead>
    <tbody>${linhas.map(([t, a, b, c]) => `<tr><td>${t}</td><td style="text-align:center">${ok(a)}</td><td style="text-align:center">${ok(b)}</td><td style="text-align:center">${ok(c)}</td></tr>`).join('')}</tbody></table></div>
    <div class="cartao bl" style="margin-top:14px"><h3><i class="fa-solid fa-shield-halved"></i>Regras de segurança</h3>
      <p class="s" style="line-height:1.7">• Senhas com no mínimo 8 caracteres, letras e números, guardadas só de forma cifrada.<br>• 5 senhas erradas seguidas bloqueiam o login por 15 minutos (o administrador pode desbloquear antes).<br>• Sessão de 12 horas, ou 30 dias com "Manter conectado".<br>• Trocar, definir ou redefinir a senha encerra as sessões abertas da pessoa.<br>• Sempre fica pelo menos um administrador ativo.<br>• Perdeu o acesso de administrador? Na planilha: menu 🏛️ GABOrg › Redefinir senha de um usuário.</p></div>`;
}
function mostrarSenhaProvisoria(u, senha, nova){
  return abrirModal({ titulo: nova ? 'Usuário criado' : 'Senha redefinida', rotulo:'Pronto', semCancelar:true,
    html:`<p>Passe estes dados a <b>${esc(u.nome)}</b>. A senha provisória aparece só agora; no primeiro acesso o GABOrg pede uma senha pessoal.</p>
      <p><span class="rot">Usuário</span><code style="font-size:14px">${esc(u.login)}</code></p>
      <div><span class="rot">Senha provisória</span><div class="senha-prov">${esc(senha)}</div></div>
      <button type="button" class="btn btn-s" onclick="navigator.clipboard && navigator.clipboard.writeText(${arg('Endereço: ' + location.href.split('#')[0] + '\nUsuário: ' + u.login + '\nSenha provisória: ' + senha)}).then(() => toast('Copiado.'))"><i class="fa-regular fa-copy"></i>Copiar usuário e senha</button>` });
}
function formUsuario(id){
  const u = usuarios.find(x => x.id === id) || { login:'', nome:'', email:'', perfil:'Editor', ativo:'Sim' };
  const proprio = u.login && u.login === cfg.login;
  abrirModal({ titulo: id ? 'Editar usuário' : 'Novo usuário', rotulo: id ? 'Salvar' : 'Criar usuário', largura:500,
    html:`<label><span class="rot">Nome completo</span><input id="fu-nome" class="campo" required value="${esc(u.nome)}" placeholder="Como aparecerá no histórico"></label>
      <div class="g2"><label><span class="rot">Login</span><input id="fu-login" class="campo" required autocapitalize="none" spellcheck="false" value="${esc(u.login)}" placeholder="maria.silva"></label>
      <label><span class="rot">E-mail <span style="font-weight:500;color:var(--mut)">(opcional, também serve para entrar)</span></span><input id="fu-email" class="campo" type="email" value="${esc(u.email)}"></label></div>
      <div class="g2"><label><span class="rot">Perfil</span><select id="fu-perfil" class="campo" ${proprio ? 'disabled' : ''}>${['Administrador','Editor','Leitor'].map(p => `<option ${p === u.perfil ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
      <label><span class="rot">Situação</span><select id="fu-ativo" class="campo" ${proprio ? 'disabled' : ''}><option value="Sim" ${u.ativo === 'Sim' ? 'selected' : ''}>Ativo</option><option value="Não" ${u.ativo !== 'Sim' ? 'selected' : ''}>Desativado</option></select></label></div>
      ${id ? '' : '<p style="font-size:12.5px">O sistema gera uma <b>senha provisória</b> e a mostra na próxima tela.</p>'}`,
    aoConfirmar: async m => {
      const dados = { id: id || '', nome:m.querySelector('#fu-nome').value.trim(), login:m.querySelector('#fu-login').value.trim().toLowerCase(), email:m.querySelector('#fu-email').value.trim(), perfil:m.querySelector('#fu-perfil').value, ativo:m.querySelector('#fu-ativo').value };
      if (!/^[a-z0-9._@-]{3,60}$/.test(dados.login)) throw new Error('Login: use de 3 a 60 letras minúsculas, números, ponto, hífen ou @ (sem espaços e acentos).');
      const r = await chamar({ action:'user_save', usuario:dados }, 30000);
      if (r.status !== 'success') throw new Error(r.message);
      if (proprio) aplicarUsuario(r.usuario);
      return r;
    }
  }).then(async r => { if (!r) return; if (r.senhaProvisoria) await mostrarSenhaProvisoria(r.usuario, r.senhaProvisoria, true); else toast('Usuário salvo.'); renderUsuarios(); });
}
async function resetarSenha(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  if (!await confirmar('Redefinir senha', `Gerar uma senha provisória para <b>${esc(u.nome)}</b>? A senha atual deixa de funcionar e as sessões abertas dessa pessoa são encerradas.`, 'Gerar senha provisória')) return;
  try { const r = await chamar({ action:'user_reset', id }, 30000); if (r.status !== 'success') throw new Error(r.message); if (u.login === cfg.login) { sessaoEncerrada('Sua senha foi redefinida. Entre com a senha provisória.'); } await mostrarSenhaProvisoria(r.usuario, r.senhaProvisoria, false); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}
async function excluirUsuario(id){
  const u = usuarios.find(x => x.id === id); if (!u) return;
  if (!await confirmar('Excluir usuário', `Excluir <b>${esc(u.nome)}</b> (${esc(u.login)})? Ele perde o acesso imediatamente. O histórico de alterações dessa pessoa é mantido. Para suspender sem excluir, edite e marque como desativado.`, 'Excluir', true)) return;
  try { const r = await chamar({ action:'user_delete', id }, 30000); if (r.status !== 'success') throw new Error(r.message); toast('Usuário excluído.'); renderUsuarios(); }
  catch (e) { toast(e.message, 'erro'); }
}

/* Perfil Leitor: bloqueia qualquer alteração, mesmo que um botão escape da interface */
['alterar','novoSetorEm','duplicarSetor','excluirSetor','moverOrdem','addItem','rmItem','solicitarValidacao','editarValidacao','rmValidacao','addVinculo','rmVinculo','reorganizar','restaurarDecreto','importarJSON','enviarTudo'].forEach(n => {
  const f = window[n]; if (typeof f !== 'function') return;
  const admin = ['restaurarDecreto','importarJSON','enviarTudo'].includes(n);
  window[n] = function(){
    if (admin ? !ehAdmin() : somenteLeitura()) { toast(admin ? 'Apenas administradores podem fazer isso.' : 'Seu perfil é somente leitura.', 'aviso'); if (n === 'alterar' && selId) setTimeout(renderPainel, 0); return; }
    return f.apply(this, arguments);
  };
});
function travarLeitura(raiz){
  if (!somenteLeitura() || !raiz) return;
  raiz.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = true; });
  raiz.querySelectorAll('button').forEach(b => { const oc = b.getAttribute('onclick') || ''; if (!/irPara|abaPainel|selecionar|fecharPainel|abrirRamo/.test(oc)) b.disabled = true; });
}
['renderPainel','renderValidacoes'].forEach(n => {
  const f = window[n];
  window[n] = function(){ const r = f.apply(this, arguments); travarLeitura(n === 'renderPainel' ? $('#pn-corpo') : $('#v-corpo')); if (n === 'renderPainel' && somenteLeitura() && $('#pn-corpo') && !$('#pn-corpo .ro-aviso')) $('#pn-corpo').insertAdjacentHTML('afterbegin', '<div class="ro-aviso"><i class="fa-solid fa-eye"></i>Perfil Leitor: você pode consultar, mas não alterar.</div>'); return r; };
});
window.addEventListener('resize', () => { if (vistaAtual === 'mapa') desenharMini(); });

/* ===================== FINANCEIRO ===================== */
const CATEG_FIN = {
  'Cargo em comissão (DGA)':['#dc2626','fa-user-tie'], 'Função gratificada':['#ea580c','fa-award'], 'Bolsa':['#7c3aed','fa-graduation-cap'],
  'Pessoal efetivo':['#2563eb','fa-id-card'], 'Terceirizado / contrato':['#0891b2','fa-file-contract'], 'Custeio':['#16a34a','fa-receipt'],
  'Diárias e passagens':['#ca8a04','fa-plane'], 'Outro':['#64748b','fa-ellipsis']
};
const CENARIOS = ['Atual', 'Proposto'];
/* Subsídio dos cargos em comissão do Poder Executivo de MT (inclui a SEDUC-MT):
 * Anexo V da LC nº 266/2006, na redação da LC nº 755, de 12/01/2023 (D.O. 13/01/2023).
 * % efetivo = percentual do subsídio pago como gratificação ao servidor efetivo/de carreira nomeado no cargo. */
const DGA_FONTE = 'LC 755/2023 (Anexo V da LC 266/2006)';
const DGA_OFICIAL = [['DGA-1',25096.81,70],['DGA-2',12891.56,70],['DGA-3',9436.62,70],['DGA-4',7700.56,70],['DGA-5',5534.78,70],['DGA-6',4273.12,70],['DGA-7',3217.73,85],['DGA-8',3032.10,85],['DGA-9',1794.51,85],['DGA-10',1344.16,85]];
function carregarDGA(sobrescrever){
  let novos = 0, atualizados = 0;
  DGA_OFICIAL.forEach(([cod, val, pe]) => {
    let r = DB.rubricas.find(x => String(x.codigo).trim().toUpperCase().replace(/\s+/g, '') === cod);
    const dados = { valorMensal:String(val), percEfetivo:String(pe), fonte:DGA_FONTE, categoria:'Cargo em comissão (DGA)' };
    if (!r) {
      r = novoReg('rubricas', Object.assign({ id:novoId('rb'), codigo:cod, nome:'Cargo em comissão – símbolo ' + cod, encargos:'', meses:'12', ativo:'Sim', observacao:'Subsídio do comissionado; servidor efetivo recebe ' + pe + '% como gratificação' }, dados, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }));
      DB.rubricas.push(r); enfileirar('rubricas', r); novos++;
    } else if (sobrescrever || !numBR(r.valorMensal) || r.percEfetivo === '') {
      if (!sobrescrever && numBR(r.valorMensal)) delete dados.valorMensal;
      Object.assign(r, dados, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); enfileirar('rubricas', r); atualizados++;
    }
  });
  salvarLocal();
  return { novos, atualizados };
}
async function atualizarDGAOficial(){
  if (somenteLeitura()) return;
  if (!await confirmar('Tabela oficial DGA', `Gravar os valores de <b>DGA-1 a DGA-10</b> da ${DGA_FONTE}? Os valores que você editou nesses símbolos serão substituídos. Os lançamentos que usam esses itens são recalculados.`, 'Atualizar valores')) return;
  const r = carregarDGA(true); toast(`Tabela DGA: ${r.novos} incluído(s), ${r.atualizados} atualizado(s).`); renderFinanceiro();
}
function reajusteTabela(){
  if (somenteLeitura()) return;
  const cats = Object.keys(CATEG_FIN);
  abrirModal({ titulo:'Aplicar reajuste', rotulo:'Aplicar', largura:460,
    html:`<p>Aplica um percentual (ex.: revisão geral anual) sobre o valor mensal dos itens escolhidos. Arredonda em centavos e registra na observação.</p>
      <div class="g2"><label><span class="rot">Percentual (%)</span><input id="rj-p" class="campo" type="number" step="0.01" required placeholder="ex.: 4,83"></label>
      <label><span class="rot">Aplicar em</span><select id="rj-c" class="campo"><option value="Cargo em comissão (DGA)">Cargos em comissão (DGA)</option><option value="">Todos os itens</option>${cats.filter(c => c !== 'Cargo em comissão (DGA)').map(c => `<option>${c}</option>`).join('')}</select></label></div>
      <label><span class="rot">Referência <small>opcional</small></span><input id="rj-r" class="campo" placeholder="ex.: RGA 2025 – Lei nº 12.793/2025"></label>`,
    aoConfirmar: async m => {
      const pct = numBR(m.querySelector('#rj-p').value), cat = m.querySelector('#rj-c').value, ref = m.querySelector('#rj-r').value.trim();
      if (!pct) throw new Error('Informe o percentual.');
      const alvo = DB.rubricas.filter(r => (!cat || r.categoria === cat) && numBR(r.valorMensal));
      if (!alvo.length) throw new Error('Nenhum item com valor nessa categoria.');
      alvo.forEach(r => { r.valorMensal = String(Math.round(numBR(r.valorMensal) * (1 + pct / 100) * 100) / 100); r.observacao = ((r.observacao ? r.observacao + ' · ' : '') + `Reajuste de ${pct.toLocaleString('pt-BR')}%${ref ? ' (' + ref + ')' : ''} em ${new Date().toLocaleDateString('pt-BR')}`).slice(0, 500); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || ''; enfileirar('rubricas', r); });
      salvarLocal(); toast(`Reajuste de ${pct.toLocaleString('pt-BR')}% aplicado em ${alvo.length} item(ns).`); return true;
    }
  }).then(ok => { if (ok) renderFinanceiro(); });
}
const numBR = v => { let s = String(v ?? '').trim(); if (!s) return 0; if (/,\d{1,2}$/.test(s) || /^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/[^\d.-]/g, ''); const n = Number(s); return isFinite(n) ? n : 0; };
const fmtM = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const fmtM0 = v => numBR(v).toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
let abaFinAtual = 'resumo', calcLinhas = [];
const rubricaDe = id => DB.rubricas.find(r => r.id === id);
function calcDesp(d){
  const r = rubricaDe(d.rubricaId) || {};
  const pe = d.vinculo === 'Efetivo' && r.percEfetivo !== undefined && r.percEfetivo !== '' ? numBR(r.percEfetivo) / 100 : 1;
  const unit = d.valorUnitario !== '' ? numBR(d.valorUnitario) : numBR(r.valorMensal) * pe;
  const enc = numBR(r.encargos), qtd = d.quantidade === '' ? 1 : numBR(d.quantidade);
  const mensal = qtd * unit * (1 + enc / 100);
  const meses = d.meses !== '' ? numBR(d.meses) : (r.meses !== '' && r.meses != null ? numBR(r.meses) : 12);
  return { r, unit, enc, qtd, mensal, meses, anual: mensal * meses, categoria: r.categoria || 'Outro', efetivo: pe !== 1 };
}
function backendSemFinanceiro(){ return online() && backendVersao && backendVersao.localeCompare('1.4.0', undefined, { numeric:true }) < 0; }
function despesasFiltradas(area){
  return DB.despesas.filter(d => !area || areaDe.get(d.setorId) === area || d.setorId === area);
}
function totaisFin(lista){
  const t = { Atual:{ m:0, a:0, n:0 }, Proposto:{ m:0, a:0, n:0 } };
  lista.forEach(d => { const c = calcDesp(d), k = d.cenario === 'Proposto' ? 'Proposto' : 'Atual'; t[k].m += c.mensal; t[k].a += c.anual; t[k].n++; });
  return t;
}
function custoSetorFin(id, comSub){
  const ids = new Set([id, ...(comSub ? descendentes(id) : [])]);
  return totaisFin(DB.despesas.filter(d => ids.has(d.setorId)));
}
function abaFin(a){ abaFinAtual = a; document.querySelectorAll('.fin-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a)); renderFinanceiro(); }
/* Cargos padrão das chefias (titulares), no cenário Atual:
 * Secretário(a) de Estado = DGA-1 · Secretários Adjuntos = DGA-2 · Superintendentes = DGA-3 · Coordenadores = DGA-5 */
const CHEFIAS_PADRAO = [
  { cod:'DGA-1', titulo:'Secretário(a) de Estado de Educação', teste:s => !s.paiId || !porId.has(s.paiId) },
  { cod:'DGA-2', titulo:'Secretário(a) Adjunto(a)', teste:s => s.tipo === 'Gabinete' && /^Gabinete d[oa] Secret[aá]ri[oa] Adjunt/i.test(s.nome) },
  { cod:'DGA-3', titulo:'Superintendente', teste:s => s.tipo === 'Superintendência' },
  { cod:'DGA-5', titulo:'Coordenador(a)', teste:s => s.tipo === 'Coordenadoria' }
];
const MARCA_CHEFIA = 'Cargo padrão da chefia', MARCA_HIST = 'Financeiro: cargos padrão das chefias aplicados';
function aplicarCargosChefia(){
  if (somenteLeitura()) return 0;
  carregarDGA(false);
  const rub = cod => DB.rubricas.find(r => String(r.codigo).trim().toUpperCase() === cod);
  let n = 0;
  DB.setores.filter(s => s.status !== 'Extinto').forEach(s => {
    const regra = CHEFIAS_PADRAO.find(c => c.teste(s)); if (!regra) return;
    const r = rub(regra.cod); if (!r) return;
    const ja = DB.despesas.some(d => d.setorId === s.id && d.observacao === MARCA_CHEFIA && (d.cenario || 'Atual') === 'Atual');
    if (ja) return;
    const d = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:r.id, descricao:regra.titulo, quantidade:'1', meses:'', cenario:'Atual', vinculo:'Comissionado', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
    DB.despesas.push(d); enfileirar('despesas', d); n++;
  });
  if (n) { const raiz = raizes()[0]; registrar(raiz ? raiz.id : '', `${MARCA_HIST} (${n} lançamento(s))`); salvarLocal(); }
  return n;
}
async function reaplicarCargosChefia(){
  if (somenteLeitura()) return;
  const n = aplicarCargosChefia();
  toast(n ? `${n} cargo(s) de chefia lançado(s) no cenário Atual.` : 'Todas as chefias já têm o cargo padrão lançado.');
  renderFinanceiro();
}
function renderFinanceiro(){
  if (!somenteLeitura() && !DB.rubricas.some(r => /^DGA-?\d+$/i.test(String(r.codigo).trim()))) { const r = carregarDGA(false); if (r.novos) toast('Tabela DGA-1 a DGA-10 carregada (' + DGA_FONTE + '). Os valores podem ser editados.'); }
  if (!somenteLeitura() && !DB.historico.some(x => String(x.acao).startsWith(MARCA_HIST)) && !DB.despesas.some(d => d.observacao === MARCA_CHEFIA)) {
    const n = aplicarCargosChefia(); if (n) setTimeout(() => toast(`Cargos das chefias lançados: ${n} (Secretário DGA-1, Adjuntos DGA-2, Superintendentes DGA-3, Coordenadores DGA-5).`), 900);
  }
  const sel = $('#f-area'), va = sel.value;
  sel.innerHTML = '<option value="">Toda a Secretaria</option>' + areas.map(a => `<option value="${esc(a)}" ${a === va ? 'selected' : ''}>${esc(nomeCurto(porId.get(a)))}</option>`).join('');
  const c = $('#f-corpo');
  const aviso = backendSemFinanceiro() ? `<div class="cartao bl" style="border-color:#f59e0b;margin-bottom:14px"><h3 style="color:#b45309"><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend</h3><p class="s">A planilha está com o Codigo.gs v${esc(backendVersao)}. Para gravar o Financeiro na planilha, cole o Codigo.gs novo no Apps Script e publique uma nova versão. Até lá, os lançamentos ficam só neste navegador.</p></div>` : '';
  if (abaFinAtual === 'resumo') c.innerHTML = aviso + finResumo(sel.value);
  if (abaFinAtual === 'lancamentos') { c.innerHTML = aviso + finLancamentosCasca(); filtrarLancamentos(); }
  if (abaFinAtual === 'tabela') c.innerHTML = aviso + finTabela();
  if (abaFinAtual === 'calc') c.innerHTML = aviso + finCalc();
}
function barrasFin(itens, max){
  return `<div class="fin-barras">${itens.map(([n, cor, ic, a, p]) => `<div class="fin-barra" style="--c:${cor}"><span class="n" title="${esc(n)}"><i class="fa-solid ${ic}"></i>${esc(n)}</span><span class="t"><span style="width:${max ? a / max * 100 : 0}%"></span><span class="p" style="width:${max ? p / max * 100 : 0}%"></span></span><span class="v">${fmtM0(a)}<small>proposto ${fmtM0(p)}</small></span></div>`).join('')}</div>`;
}
function finResumo(area){
  const lista = despesasFiltradas(area), t = totaisFin(lista);
  const setoresArea = DB.setores.filter(s => s.status !== 'Extinto' && (!area || areaDe.get(s.id) === area || s.id === area));
  const orc = setoresArea.reduce((a, s) => a + numBR(s.orcamento), 0);
  const dif = t.Proposto.a - t.Atual.a;
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v" style="font-size:22px">${v}</div><div class="s">${s}</div></div>`;
  if (!DB.rubricas.length && !DB.despesas.length) return `<div class="cartao bl"><h3><i class="fa-solid fa-sack-dollar"></i>Comece pela tabela de valores</h3><p class="s">Cadastre os valores mensais dos cargos em comissão (DGA), funções gratificadas, bolsas e demais despesas em <b>Tabela de valores</b>. Depois faça os <b>lançamentos</b> em cada setor (quantidade × valor), no cenário <b>Atual</b> e no <b>Proposto</b>. O resumo, o painel do setor e o Modo TV passam a mostrar os totais.</p><div class="acoes"><button class="btn btn-p so-edit" onclick="abaFin('tabela')"><i class="fa-solid fa-table"></i>Abrir a tabela de valores</button></div></div>`;
  // por categoria
  const porCat = {}; lista.forEach(d => { const c = calcDesp(d), k = c.categoria; porCat[k] = porCat[k] || [0, 0]; porCat[k][d.cenario === 'Proposto' ? 1 : 0] += c.anual; });
  const cats = Object.keys(porCat).sort((a, b) => porCat[b][0] - porCat[a][0]);
  const maxC = Math.max(1, ...cats.map(k => Math.max(...porCat[k])));
  // por área ou setor
  const grupo = id => area ? id : areaDe.get(id);
  const porG = new Map(); lista.forEach(d => { const g = grupo(d.setorId) || '—', c = calcDesp(d); const o = porG.get(g) || [0, 0]; o[d.cenario === 'Proposto' ? 1 : 0] += c.anual; porG.set(g, o); });
  const gs = [...porG.entries()].sort((a, b) => b[1][0] - a[1][0]).slice(0, 12), maxG = Math.max(1, ...gs.map(g => Math.max(...g[1])));
  // quadro por item (DGA, bolsas...)
  const porItem = new Map();
  lista.forEach(d => { const c = calcDesp(d), k = d.rubricaId || '__' + (d.descricao || 'Valor próprio'); const o = porItem.get(k) || { r:c.r, nome:c.r.codigo || d.descricao || 'Valor próprio', cat:c.categoria, qa:0, qp:0, ma:0, mp:0 }; if (d.cenario === 'Proposto') { o.qp += c.qtd; o.mp += c.mensal; } else { o.qa += c.qtd; o.ma += c.mensal; } porItem.set(k, o); });
  const itens = [...porItem.values()].sort((a, b) => a.cat.localeCompare(b.cat) || String(a.nome).localeCompare(String(b.nome), 'pt-BR', { numeric:true }));
  const tot = itens.reduce((a, o) => ({ qa:a.qa + o.qa, qp:a.qp + o.qp, ma:a.ma + o.ma, mp:a.mp + o.mp }), { qa:0, qp:0, ma:0, mp:0 });
  const d0 = (a, b) => { const x = b - a; return x ? `<span class="${x > 0 ? 'fin-pos' : 'fin-neg'}">${x > 0 ? '+' : ''}${typeof a === 'number' && Math.abs(x) >= 100 ? fmtM0(x) : x.toLocaleString('pt-BR')}</span>` : '<span style="color:var(--mut2)">—</span>'; };
  return `<div class="kpis">
      ${kpi('#2563eb', 'fa-calendar-day', 'Custo mensal · atual', fmtM0(t.Atual.m), `${t.Atual.n} lançamento(s)`)}
      ${kpi('#0e7490', 'fa-calendar', 'Custo anual · atual', fmtM0(t.Atual.a), orc ? `${(t.Atual.a / orc * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}% do orçamento declarado` : 'sem orçamento declarado nos setores')}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo anual · proposto', fmtM0(t.Proposto.a), `${t.Proposto.n} lançamento(s)`)}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença anual', (dif > 0 ? '+' : '') + fmtM0(dif), t.Atual.a ? `${(dif / t.Atual.a * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}% em relação ao atual` : 'proposto − atual')}
      ${kpi('#16a34a', 'fa-landmark', 'Orçamento declarado', fmtM0(orc), 'soma do campo orçamento dos setores')}
    </div>
    <div class="grade2">
      <div class="cartao bl"><h3><i class="fa-solid fa-layer-group"></i>Custo anual por tipo de despesa</h3><div class="fin-leg"><span><i></i>Atual</span><span><i class="p"></i>Proposto</span></div>
        ${cats.length ? barrasFin(cats.map(k => [k, (CATEG_FIN[k] || CATEG_FIN.Outro)[0], (CATEG_FIN[k] || CATEG_FIN.Outro)[1], porCat[k][0], porCat[k][1]]), maxC) : '<p class="s">Sem lançamentos.</p>'}</div>
      <div class="cartao bl"><h3><i class="fa-solid fa-sitemap"></i>Custo anual por ${area ? 'setor' : 'secretaria adjunta'}</h3><div class="fin-leg"><span><i></i>Atual</span><span><i class="p"></i>Proposto</span></div>
        ${gs.length ? barrasFin(gs.map(([g, v]) => [nomeCurto(porId.get(g)) || 'Sem setor', area ? corTipo((porId.get(g) || {}).tipo) : corArea(g), 'fa-building', v[0], v[1]]), maxG) : '<p class="s">Sem lançamentos.</p>'}</div>
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-table-list"></i>Quadro por item (DGA, funções, bolsas e demais)</h3><p class="s">Quantidades e custo mensal com encargos, atual × proposto.</p>
      <div class="tab-wrap" style="margin-top:10px"><table class="tab"><thead><tr><th>Item</th><th>Tipo</th><th class="fin-num">Valor unitário</th><th class="fin-num">Qtd atual</th><th class="fin-num">Qtd proposta</th><th class="fin-num">Δ qtd</th><th class="fin-num">Mensal atual</th><th class="fin-num">Mensal proposto</th><th class="fin-num">Δ mensal</th></tr></thead>
      <tbody>${itens.map(o => `<tr><td><b>${esc(o.nome)}</b>${o.r && o.r.nome ? `<br><small style="color:var(--mut)">${esc(o.r.nome)}</small>` : ''}</td><td><span class="chip" style="--c:${(CATEG_FIN[o.cat] || CATEG_FIN.Outro)[0]}">${esc(o.cat)}</span></td><td class="fin-num">${o.r && o.r.id ? fmtM(o.r.valorMensal) : '—'}</td><td class="fin-num">${o.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${o.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${d0(o.qa, o.qp)}</td><td class="fin-num">${fmtM(o.ma)}</td><td class="fin-num">${fmtM(o.mp)}</td><td class="fin-num">${d0(o.ma, o.mp)}</td></tr>`).join('')}
      <tr class="fin-tot"><td colspan="3">Total</td><td class="fin-num">${tot.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${tot.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${d0(tot.qa, tot.qp)}</td><td class="fin-num">${fmtM(tot.ma)}</td><td class="fin-num">${fmtM(tot.mp)}</td><td class="fin-num">${d0(tot.ma, tot.mp)}</td></tr></tbody></table></div></div>`;
}
function finLancamentosCasca(){
  const cats = Object.keys(CATEG_FIN);
  return `<div class="adm-filtros">
      <div class="busca"><i class="fa-solid fa-magnifying-glass"></i><input id="fl-q" class="campo" placeholder="Buscar setor, item ou descrição" oninput="filtrarLancamentos()"></div>
      <select id="fl-cat" class="campo" onchange="filtrarLancamentos()"><option value="">Todos os tipos</option>${cats.map(c => `<option>${c}</option>`).join('')}</select>
      <select id="fl-cen" class="campo" onchange="filtrarLancamentos()"><option value="">Atual e proposto</option>${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select>
      <button class="btn btn-s so-edit" onclick="reaplicarCargosChefia()" title="Lança o cargo do titular nas chefias que ainda não têm: Secretário DGA-1, Adjuntos DGA-2, Superintendentes DGA-3, Coordenadores DGA-5"><i class="fa-solid fa-user-tie"></i>Cargos das chefias</button>
    </div>
    <p style="font-size:12px;color:var(--mut);margin:-4px 0 10px"><i class="fa-solid fa-circle-info"></i> Titulares lançados automaticamente no cenário Atual: Secretário(a) de Estado <b>DGA-1</b>, Secretários Adjuntos <b>DGA-2</b>, Superintendentes <b>DGA-3</b>, Coordenadores <b>DGA-5</b> — como exclusivamente comissionados. Edite cada um para mudar o vínculo (servidor efetivo), o símbolo ou copiar para o Proposto.</p>
    <div id="fl-lista"></div>`;
}
function lancamentosFiltrados(){
  const q = norm(($('#fl-q') || {}).value || ''), cat = ($('#fl-cat') || {}).value || '', cen = ($('#fl-cen') || {}).value || '';
  return despesasFiltradas($('#f-area').value).map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }))
    .filter(o => (!cat || o.c.categoria === cat) && (!cen || (o.d.cenario || 'Atual') === cen) && (!q || norm(((o.s || {}).nome || '') + ' ' + ((o.s || {}).sigla || '') + ' ' + (o.c.r.codigo || '') + ' ' + (o.c.r.nome || '') + ' ' + o.d.descricao).includes(q)))
    .sort((a, b) => ((a.s || {}).nome || '').localeCompare((b.s || {}).nome || '', 'pt-BR') || (a.d.cenario || '').localeCompare(b.d.cenario || ''));
}
function filtrarLancamentos(){
  const el = $('#fl-lista'); if (!el) return;
  const l = lancamentosFiltrados();
  if (!l.length) { el.innerHTML = `<div class="cartao vazio">Nenhum lançamento${DB.despesas.length ? ' com esses filtros' : ''}. <button class="btn btn-p btn-sm so-edit" style="margin-left:8px" onclick="formDespesa()"><i class="fa-solid fa-plus"></i>Novo lançamento</button></div>`; return; }
  const t = totaisFin(l.map(o => o.d));
  el.innerHTML = `<div class="tab-wrap"><table class="tab"><thead><tr><th>Setor</th><th>Item</th><th class="fin-num">Qtd</th><th class="fin-num">Unitário</th><th class="fin-num">Encargos</th><th class="fin-num">Mensal</th><th class="fin-num">Meses</th><th class="fin-num">Anual</th><th>Cenário</th><th></th></tr></thead><tbody>
    ${l.map(({ d, c, s }) => `<tr><td>${s ? `<a href="#" style="color:var(--txt);text-decoration:none" onclick="event.preventDefault();irPara(${arg(s.id)})"><b>${esc(s.sigla ? s.sigla + ' · ' + s.nome : s.nome)}</b></a><br><small style="color:var(--mut)">${esc(caminho(s.id).slice(-2).map(nomeCurto).join(' › ') || 'Topo da estrutura')}</small>` : '<span style="color:var(--perigo)">setor removido</span>'}</td>
      <td><span class="chip" style="--c:${(CATEG_FIN[c.categoria] || CATEG_FIN.Outro)[0]}">${esc(c.r.codigo || c.categoria)}</span>${d.descricao ? `<br><small>${esc(d.descricao)}</small>` : (c.r.nome ? `<br><small style="color:var(--mut)">${esc(c.r.nome)}</small>` : '')}</td>
      <td class="fin-num">${c.qtd.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.unit)}${d.valorUnitario !== '' ? ' <small title="Valor próprio, diferente da tabela">*</small>' : ''}${c.efetivo ? `<br><small style="color:var(--mut)">efetivo · ${numBR(c.r.percEfetivo).toLocaleString('pt-BR')}%</small>` : ''}</td><td class="fin-num">${c.enc ? c.enc.toLocaleString('pt-BR') + '%' : '—'}</td>
      <td class="fin-num"><b>${fmtM(c.mensal)}</b></td><td class="fin-num">${c.meses.toLocaleString('pt-BR')}</td><td class="fin-num">${fmtM(c.anual)}</td>
      <td><span class="chip" style="--c:${d.cenario === 'Proposto' ? '#7c3aed' : '#2563eb'}">${esc(d.cenario || 'Atual')}</span></td>
      <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="Editar" onclick="formDespesa(${arg(d.id)})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-s btn-sm btn-i" title="Copiar para o outro cenário" onclick="copiarCenario(${arg(d.id)})"><i class="fa-regular fa-copy"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirDespesa(${arg(d.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`).join('')}
    <tr class="fin-tot"><td colspan="5">Atual (${t.Atual.n})</td><td class="fin-num">${fmtM(t.Atual.m)}</td><td></td><td class="fin-num">${fmtM(t.Atual.a)}</td><td colspan="2"></td></tr>
    <tr class="fin-tot"><td colspan="5">Proposto (${t.Proposto.n})</td><td class="fin-num">${fmtM(t.Proposto.m)}</td><td></td><td class="fin-num">${fmtM(t.Proposto.a)}</td><td colspan="2"></td></tr>
  </tbody></table></div><p style="font-size:12px;color:var(--mut);margin-top:8px">Mensal = quantidade × valor unitário × (1 + encargos). Anual = mensal × meses. * valor próprio do lançamento, diferente da tabela.</p>`;
}
function opcoesSetores(sel){
  const ord = []; const visit = (s, d) => { ord.push([s, d]); filhosDe(s.id).forEach(k => visit(k, d + 1)); }; raizes().forEach(r => visit(r, 0));
  return ord.map(([s, d]) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${'  '.repeat(Math.min(d, 6))}${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)}</option>`).join('');
}
function opcoesRubricas(sel){
  const g = {}; DB.rubricas.filter(r => r.ativo !== 'Não' || r.id === sel).forEach(r => (g[r.categoria || 'Outro'] = g[r.categoria || 'Outro'] || []).push(r));
  return `<option value="">— Sem item da tabela (valor próprio) —</option>` + Object.keys(g).map(c => `<optgroup label="${esc(c)}">${g[c].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true })).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(r.codigo || r.nome)} — ${esc(r.nome || '')} (${fmtM(r.valorMensal)})</option>`).join('')}</optgroup>`).join('');
}
function formDespesa(id, setorPadrao){
  if (somenteLeitura()) return toast('Seu perfil é somente leitura.', 'aviso');
  const d = DB.despesas.find(x => x.id === id) || novoReg('despesas', { setorId:setorPadrao || selId || '', quantidade:'1', cenario:'Atual' });
  const prev = m => {
    const o = { rubricaId:m.querySelector('#fd-rub').value, quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, vinculo:m.querySelector('#fd-vinc').value };
    const r = rubricaDe(o.rubricaId), temPe = !!(r && r.percEfetivo !== '');
    m.querySelector('#fd-vinc-cx').style.display = temPe ? '' : 'none'; if (!temPe) o.vinculo = '';
    m.querySelector('#fd-val').placeholder = r ? 'Tabela: ' + fmtM(numBR(r.valorMensal) * (o.vinculo === 'Efetivo' ? numBR(r.percEfetivo) / 100 : 1)) : 'Valor mensal';
    m.querySelector('#fd-mes').placeholder = r && r.meses ? r.meses : '12';
    const c = calcDesp(o); m.querySelector('#fd-prev').innerHTML = `<div>Total mensal${c.enc ? ` (com ${c.enc.toLocaleString('pt-BR')}% de encargos)` : ''}<b>${fmtM(c.mensal)}</b></div><div>Total anual (${c.meses.toLocaleString('pt-BR')} meses)<b>${fmtM(c.anual)}</b></div>`;
  };
  abrirModal({ titulo: id ? 'Editar lançamento' : 'Novo lançamento', rotulo: id ? 'Salvar' : 'Lançar', largura:540,
    html:`<label><span class="rot">Setor</span><select id="fd-set" class="campo" required>${d.setorId ? '' : '<option value="">Escolha o setor</option>'}${opcoesSetores(d.setorId)}</select></label>
      <label><span class="rot">Item da tabela de valores</span><select id="fd-rub" class="campo">${opcoesRubricas(d.rubricaId)}</select></label>
      <label><span class="rot">Descrição <small>opcional</small></span><input id="fd-desc" class="campo" value="${esc(d.descricao)}" placeholder="ex.: Coordenador, bolsistas do programa X"></label>
      <div class="g2"><label><span class="rot">Quantidade</span><input id="fd-qtd" class="campo" type="number" min="0" step="any" value="${esc(d.quantidade)}"></label>
      <label><span class="rot">Valor unitário mensal <small>vazio = tabela</small></span><input id="fd-val" class="campo" type="number" min="0" step="0.01" value="${esc(d.valorUnitario)}"></label></div>
      <div class="g2"><label><span class="rot">Meses no ano <small>vazio = tabela</small></span><input id="fd-mes" class="campo" type="number" min="0" max="13.34" step="any" value="${esc(d.meses)}"></label>
      <label><span class="rot">Cenário</span><select id="fd-cen" class="campo">${CENARIOS.map(c => `<option ${c === (d.cenario || 'Atual') ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div>
      <label id="fd-vinc-cx"><span class="rot">Ocupante do cargo</span><select id="fd-vinc" class="campo"><option value="Comissionado" ${d.vinculo !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100% do subsídio)</option><option value="Efetivo" ${d.vinculo === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (gratificação de % do subsídio)</option></select></label>
      <label><span class="rot">Observação</span><input id="fd-obs" class="campo" value="${esc(d.observacao)}"></label>
      <div class="fin-prev" id="fd-prev"></div>`,
    aoConfirmar: async m => {
      const v = { setorId:m.querySelector('#fd-set').value, rubricaId:m.querySelector('#fd-rub').value, descricao:m.querySelector('#fd-desc').value.trim(), quantidade:m.querySelector('#fd-qtd').value, valorUnitario:m.querySelector('#fd-val').value, meses:m.querySelector('#fd-mes').value, cenario:m.querySelector('#fd-cen').value, observacao:m.querySelector('#fd-obs').value.trim(), vinculo:'' };
      const rr = rubricaDe(v.rubricaId); if (rr && rr.percEfetivo !== '') v.vinculo = m.querySelector('#fd-vinc').value;
      if (!v.setorId) throw new Error('Escolha o setor.');
      if (!v.rubricaId && v.valorUnitario === '') throw new Error('Escolha um item da tabela ou informe o valor unitário.');
      if (!v.rubricaId && !v.descricao) throw new Error('Sem item da tabela, descreva a despesa.');
      Object.assign(d, v, { atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      if (!DB.despesas.includes(d)) { d.id = novoId('fd'); DB.despesas.push(d); }
      enfileirar('despesas', d);
      const c = calcDesp(d); registrar(d.setorId, `Financeiro: ${id ? 'alterou' : 'lançou'} ${c.r.codigo || d.descricao} × ${c.qtd.toLocaleString('pt-BR')} (${d.cenario}) = ${fmtM(c.mensal)}/mês`);
      return true;
    }
  }).then(ok => { if (ok) { toast('Lançamento salvo.'); posFinanceiro(); } });
  const m = document.querySelectorAll('.modal'); const mm = m[m.length - 1];
  mm.querySelectorAll('#fd-rub,#fd-qtd,#fd-val,#fd-mes,#fd-vinc').forEach(i => i.addEventListener('input', () => prev(mm))); prev(mm);
}
function posFinanceiro(){ salvarLocal(); if (vistaAtual === 'financeiro') renderFinanceiro(); if (selId && $('#painel').classList.contains('aberto')) renderPainel(); }
function copiarCenario(id){
  const d = DB.despesas.find(x => x.id === id); if (!d || somenteLeitura()) return;
  const n = novoReg('despesas', Object.assign({}, d, { id:novoId('fd'), cenario:d.cenario === 'Proposto' ? 'Atual' : 'Proposto', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }));
  DB.despesas.push(n); enfileirar('despesas', n); toast(`Copiado para o cenário ${n.cenario}.`); posFinanceiro();
}
async function excluirDespesa(id){
  const d = DB.despesas.find(x => x.id === id); if (!d || somenteLeitura()) return;
  if (!await confirmar('Excluir lançamento', 'Excluir este lançamento financeiro?', 'Excluir', true)) return;
  DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true);
  const c = calcDesp(d); registrar(d.setorId, `Financeiro: excluiu ${c.r.codigo || d.descricao} (${d.cenario})`);
  posFinanceiro();
}
/* Tabela de valores */
function finTabela(){
  const usos = id => DB.despesas.filter(d => d.rubricaId === id).length;
  const ro = somenteLeitura() ? 'disabled' : '';
  const lin = r => `<tr data-id="${esc(r.id)}" style="${r.ativo === 'Não' ? 'opacity:.55' : ''}">
    <td><input class="campo fin-edit" ${ro} value="${esc(r.codigo)}" onchange="alterarRubrica(${arg(r.id)},'codigo',this.value)" placeholder="DGA-1"></td>
    <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value)" placeholder="Descrição">${r.fonte ? `<small style="display:block;color:var(--mut);font-size:10.5px;margin-top:2px" title="Fonte / base legal"><i class="fa-solid fa-scale-balanced"></i> ${esc(r.fonte)}</small>` : ''}</td>
    <td><select class="campo fin-edit" ${ro} onchange="alterarRubrica(${arg(r.id)},'categoria',this.value)">${Object.keys(CATEG_FIN).map(c => `<option ${c === r.categoria ? 'selected' : ''}>${c}</option>`).join('')}</select></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value)" placeholder="0,00"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.encargos)}" onchange="alterarRubrica(${arg(r.id)},'encargos',this.value)" placeholder="0" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" onchange="alterarRubrica(${arg(r.id)},'meses',this.value)" placeholder="12" style="min-width:60px"></td>
    <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="100" step="0.01" value="${esc(r.percEfetivo)}" onchange="alterarRubrica(${arg(r.id)},'percEfetivo',this.value)" placeholder="—" style="min-width:60px" title="Percentual do valor pago quando o ocupante é servidor efetivo (gratificação)"></td>
    <td class="fin-num">${usos(r.id)}</td>
    <td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" title="${r.ativo === 'Não' ? 'Reativar' : 'Desativar (some da lista de lançamento)'}" onclick="alterarRubrica(${arg(r.id)},'ativo','${r.ativo === 'Não' ? 'Sim' : 'Não'}');renderFinanceiro()"><i class="fa-solid ${r.ativo === 'Não' ? 'fa-eye' : 'fa-eye-slash'}"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)})"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`;
  const ord = [...DB.rubricas].sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.categoria) - Object.keys(CATEG_FIN).indexOf(b.categoria) || String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true }));
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-table"></i>Tabela de valores</h3>
      <p class="s">Valores mensais usados nos cálculos: símbolos DGA dos cargos em comissão, funções gratificadas, bolsas e demais itens. <b>Encargos</b> soma um percentual ao valor (ex.: contribuição patronal). <b>Meses por ano</b>: 12 por padrão; use 13,33 para incluir 13º e 1/3 de férias. Mudar um valor aqui atualiza todos os lançamentos que usam o item.</p>
      <div class="acoes so-edit"><button class="btn btn-p" onclick="novaRubrica()"><i class="fa-solid fa-plus"></i>Novo item</button><button class="btn btn-s" onclick="atualizarDGAOficial()"><i class="fa-solid fa-scale-balanced"></i>Atualizar DGA pela LC 755/2023</button><button class="btn btn-s" onclick="reajusteTabela()"><i class="fa-solid fa-percent"></i>Aplicar reajuste (RGA)</button>${DB.rubricas.some(r => r.categoria !== 'Cargo em comissão (DGA)') ? '' : '<button class="btn btn-s" onclick="modeloRubricas()"><i class="fa-solid fa-wand-magic-sparkles"></i>Incluir modelos de função, bolsa e diária</button>'}</div>
      <p class="s" style="margin-top:10px;font-size:12px"><i class="fa-solid fa-circle-info"></i> DGA-1 a DGA-10: subsídio dos cargos em comissão do Executivo de MT, conforme o Anexo V da LC 266/2006 na redação da <b>LC nº 755, de 12/01/2023</b>. O servidor efetivo nomeado em cargo DGA recebe a gratificação de <b>70%</b> (DGA-1 a 6) ou <b>85%</b> (DGA-7 a 10) desse valor. Se houver reajuste posterior (revisão geral anual), use "Aplicar reajuste" ou edite os valores.</p></div>
    ${DB.rubricas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:100px">Código</th><th style="min-width:200px">Descrição</th><th style="min-width:170px">Tipo</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Encargos %</th><th class="fin-num">Meses/ano</th><th class="fin-num" title="Percentual pago ao servidor efetivo nomeado no cargo">% efetivo</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${ord.map(lin).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhum item cadastrado.</div>'}`;
}
function alterarRubrica(id, campo, valor){
  if (somenteLeitura()) return;
  const r = rubricaDe(id); if (!r || r[campo] === String(valor)) return;
  r[campo] = String(valor); r.atualizadoEm = agora(); r.atualizadoPor = cfg.usuario || '';
  if (campo === 'valorMensal' && r.fonte && !/editado/.test(r.fonte)) r.fonte += ' · valor editado em ' + new Date().toLocaleDateString('pt-BR');
  enfileirar('rubricas', r); salvarLocal();
}
function novaRubrica(){
  if (somenteLeitura()) return;
  const r = novoReg('rubricas', { id:novoId('rb'), codigo:'', nome:'', categoria:'Cargo em comissão (DGA)', valorMensal:'', encargos:'', meses:'12', ativo:'Sim', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
  DB.rubricas.push(r); enfileirar('rubricas', r); renderFinanceiro();
  setTimeout(() => { const i = document.querySelector(`tr[data-id="${r.id}"] input`); if (i) i.focus(); }, 50);
}
async function excluirRubrica(id){
  const r = rubricaDe(id); if (!r || somenteLeitura()) return;
  const n = DB.despesas.filter(d => d.rubricaId === id).length + (DB.propostas || []).reduce((t, p) => t + itensProp(p).filter(i => i.rubricaId === id).length, 0);
  if (n) return toast(`Este item é usado em ${n} lançamento(s) ou proposta(s). Desative-o em vez de excluir.`, 'aviso');
  if (!await confirmar('Excluir item', `Excluir <b>${esc(r.codigo || r.nome || 'item')}</b> da tabela de valores?`, 'Excluir', true)) return;
  DB.rubricas = DB.rubricas.filter(x => x !== r); enfileirar('rubricas', r, true); salvarLocal(); renderFinanceiro();
}
function modeloRubricas(){
  if (somenteLeitura()) return;
  carregarDGA(false);
  const base = [];
  base.push(['FG', 'Função gratificada', 'Função gratificada'], ['BOLSA', 'Bolsa (programa)', 'Bolsa'], ['EFETIVO', 'Servidor efetivo (média)', 'Pessoal efetivo'], ['DIÁRIA', 'Diária', 'Diárias e passagens']);
  base.filter(([codigo]) => !DB.rubricas.some(x => x.codigo === codigo)).forEach(([codigo, nome, categoria]) => { const r = novoReg('rubricas', { id:novoId('rb'), codigo, nome, categoria, valorMensal:'', encargos:'', meses:'12', ativo:'Sim', observacao:'Preencher com o valor vigente', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.rubricas.push(r); enfileirar('rubricas', r); });
  renderFinanceiro(); toast('Modelo criado: DGA-1 a DGA-10 com os valores da LC 755/2023 e itens de função, bolsa, efetivo e diária para preencher.');
}
/* Calculadora */
function finCalc(){
  if (!calcLinhas.length) calcLinhas = [{ rub:'', qtd:'1', meses:'', vinc:'Comissionado' }];
  return `<div class="cartao bl"><h3><i class="fa-solid fa-calculator"></i>Calculadora rápida</h3><p class="s">Simule combinações (ex.: 3 × DGA-2 + 10 bolsas) sem gravar nada. Se quiser, lance o resultado num setor.</p>
    <div id="calc-ls" style="margin-top:12px"></div>
    <div class="acoes" style="justify-content:space-between;flex-wrap:wrap"><button class="btn btn-s" onclick="calcLinhas.push({rub:'',qtd:'1',meses:'',vinc:'Comissionado'});desenharCalc()"><i class="fa-solid fa-plus"></i>Adicionar linha</button><div class="fin-prev" id="calc-tot" style="flex:1;max-width:420px"></div></div>
    <div class="acoes so-edit" style="margin-top:12px;flex-wrap:wrap"><select id="calc-set" class="campo" style="width:auto;max-width:100%"><option value="">Lançar em qual setor?</option>${opcoesSetores(selId)}</select><select id="calc-cen" class="campo" style="width:auto">${CENARIOS.map(c => `<option>${c}</option>`).join('')}</select><button class="btn btn-p" onclick="lancarCalc()"><i class="fa-solid fa-file-import"></i>Lançar no setor</button></div></div>`;
}
function desenharCalc(){
  const el = $('#calc-ls'); if (!el) return;
  el.innerHTML = calcLinhas.map((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses, vinculo:l.vinc }); const rr = rubricaDe(l.rub), temPe = !!(rr && rr.percEfetivo !== ''); return `<div class="calc-l"><select class="campo" onchange="calcLinhas[${i}].rub=this.value;desenharCalc()">${opcoesRubricas(l.rub).replace('— Sem item da tabela (valor próprio) —', 'Escolha um item')}</select><input class="campo" type="number" min="0" step="any" value="${esc(l.qtd)}" title="Quantidade" oninput="calcLinhas[${i}].qtd=this.value;desenharCalcTot(this,${i})"><input class="campo" type="number" min="0" step="any" value="${esc(l.meses)}" placeholder="${c.meses}" title="Meses" oninput="calcLinhas[${i}].meses=this.value;desenharCalcTot(this,${i})"><span class="v" data-i="${i}">${fmtM(c.mensal)}/mês</span>${temPe ? `<select class="campo" style="grid-column:1/-2;height:32px;font-size:12px" onchange="calcLinhas[${i}].vinc=this.value;desenharCalc()"><option value="Comissionado" ${l.vinc !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100%)</option><option value="Efetivo" ${l.vinc === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (${numBR(rr.percEfetivo).toLocaleString('pt-BR')}% do subsídio)</option></select>` : ''}<button class="btn btn-s btn-i" title="Remover" onclick="calcLinhas.splice(${i},1);desenharCalc()"><i class="fa-solid fa-xmark"></i></button></div>`; }).join('');
  desenharCalcTot();
}
function desenharCalcTot(){
  let m = 0, a = 0; calcLinhas.forEach((l, i) => { const c = calcDesp({ rubricaId:l.rub, quantidade:l.qtd, valorUnitario:'', meses:l.meses, vinculo:l.vinc }); m += c.mensal; a += c.anual; const v = document.querySelector(`.calc-l .v[data-i="${i}"]`); if (v) v.textContent = fmtM(c.mensal) + '/mês'; });
  const t = $('#calc-tot'); if (t) t.innerHTML = `<div>Total mensal<b>${fmtM(m)}</b></div><div>Total anual<b>${fmtM(a)}</b></div>`;
}
function lancarCalc(){
  if (somenteLeitura()) return;
  const sid = $('#calc-set').value, cen = $('#calc-cen').value; if (!sid) return toast('Escolha o setor.', 'aviso');
  const ok = calcLinhas.filter(l => l.rub && numBR(l.qtd)); if (!ok.length) return toast('Nenhuma linha com item e quantidade.', 'aviso');
  ok.forEach(l => { const rr = rubricaDe(l.rub); const d = novoReg('despesas', { id:novoId('fd'), setorId:sid, rubricaId:l.rub, quantidade:l.qtd, meses:l.meses, cenario:cen, vinculo:rr && rr.percEfetivo !== '' ? (l.vinc || 'Comissionado') : '', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); });
  registrar(sid, `Financeiro: ${ok.length} lançamento(s) pela calculadora (${cen})`);
  toast(`${ok.length} lançamento(s) feitos em ${nomeCurto(porId.get(sid))}.`); calcLinhas = []; abaFin('lancamentos');
}
function exportarFinanceiro(){
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = DB.despesas.map(d => ({ d, c:calcDesp(d), s:porId.get(d.setorId) }));
  const csv = '﻿' + ['Setor;Sigla;Área;Item;Tipo;Descrição;Ocupante;Quantidade;Valor unitário;Encargos %;Mensal;Meses;Anual;Cenário;Observação', ...l.map(({ d, c, s }) => [s ? s.nome : '(removido)', s ? s.sigla : '', nomeCurto(porId.get(areaDe.get(d.setorId))), c.r.codigo || '', c.categoria, d.descricao, d.vinculo === 'Efetivo' ? 'Servidor efetivo' : (d.vinculo ? 'Comissionado' : ''), c.qtd, n(c.unit), c.enc, n(c.mensal), c.meses, n(c.anual), d.cenario || 'Atual', d.observacao].map(q).join(';'))].join('\r\n');
  baixarArquivo('gaborg-financeiro-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
}
/* Bloco financeiro no painel do setor (aba Valores) */
function blocoFinSetor(s){
  const p = custoSetorFin(s.id, false), t = custoSetorFin(s.id, true), lst = DB.despesas.filter(d => d.setorId === s.id);
  const temSub = descendentes(s.id).size > 0;
  return `<div class="sec-t" style="margin-top:18px"><i class="fa-solid fa-sack-dollar"></i>Financeiro (lançamentos)</div>
    <div class="fin-prev"><div>Mensal atual<b>${fmtM0(p.Atual.m)}</b></div><div>Mensal proposto<b>${fmtM0(p.Proposto.m)}</b></div>${temSub ? `<div>Com subordinados · atual<b>${fmtM0(t.Atual.m)}</b></div><div>Com subordinados · proposto<b>${fmtM0(t.Proposto.m)}</b></div>` : ''}</div>
    ${lst.length ? `<div class="tab-wrap" style="margin-top:10px"><table class="tab"><tbody>${lst.map(d => { const c = calcDesp(d); return `<tr><td><b>${esc(c.r.codigo || d.descricao || c.categoria)}</b> × ${c.qtd.toLocaleString('pt-BR')}<br><small style="color:var(--mut)">${esc(d.cenario || 'Atual')}</small></td><td class="fin-num">${fmtM(c.mensal)}/mês</td><td><div class="u-acoes so-edit"><button class="btn btn-s btn-sm btn-i" onclick="formDespesa(${arg(d.id)})" title="Editar"><i class="fa-solid fa-pen"></i></button></div></td></tr>`; }).join('')}</tbody></table></div>` : '<p style="font-size:12.5px;color:var(--mut)">Nenhum lançamento financeiro neste setor.</p>'}
    <div class="acoes" style="margin-top:10px"><button class="btn btn-p btn-sm so-edit" onclick="formDespesa('', ${arg(s.id)})"><i class="fa-solid fa-plus"></i>Lançamento</button><button class="btn btn-s btn-sm" onclick="trocarVista('financeiro');abaFin('lancamentos');setTimeout(()=>{const q=$('#fl-q');if(q){q.value=${arg(s.sigla || s.nome)};filtrarLancamentos()}},50)"><i class="fa-solid fa-arrow-up-right-from-square"></i>Abrir no Financeiro</button></div>`;
}

/* ===================== PROPOSTAS (cenários de estrutura e valores) ===================== */
const STATUS_PROP = { 'Rascunho':'#64748b', 'Em análise':'#d97706', 'Aprovada':'#16a34a', 'Aplicada':'#2563eb', 'Arquivada':'#94a3b8' };
const TIPOS_ALT = {
  novo:['fa-square-plus', 'Criar setor', '#16a34a'], extinguir:['fa-square-minus', 'Extinguir setor', '#dc2626'], mover:['fa-arrows-up-down-left-right', 'Mudar subordinação', '#7c3aed'],
  renomear:['fa-pen', 'Renomear / mudar tipo', '#0891b2'], cargo:['fa-user-tie', 'Trocar cargo do titular', '#ea580c'], despesa:['fa-coins', 'Despesa ou bolsa', '#ca8a04']
};
let propSel = '', abaPropAtual = 'propostas';
const itensProp = p => { try { const a = JSON.parse(p.itens || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
function salvarItensProp(p, itens, msgHist){
  p.itens = JSON.stringify(itens); p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || '';
  enfileirar('propostas', p); salvarLocal();
}
function backendSemPropostas(){ return online() && backendVersao && backendVersao.localeCompare('1.8.0', undefined, { numeric:true }) < 0; }
/* Estrutura resultante da proposta (cópia virtual; nada muda na estrutura real) */
const CAMPOS_COMPARA = ['nome','sigla','tipo','paiId','status','responsavel','contato','competencias','entregas','orcamento','custoMensal','servidores','comissionados','impacto','impactoDescricao','positivos','negativos','quantidade'];
const CAMPOS_DADOS = CAMPOS_COMPARA.filter(c => !['nome','sigla','tipo','paiId','status'].includes(c));
function setoresOficiais(){ return cenSwap ? DBoficial : DB.setores; }
function overridesDe(pid){ return (DB.propSetores || []).filter(o => o.propostaId === pid); }
function deOverride(o){ const s = {}; CAMPOS.setores.forEach(k => s[k] = o[k] ?? ''); s.id = o.setorId; return novoReg('setores', s); }
function paraOverride(pid, s, excluido){ const o = { id:pid + '_' + s.id, propostaId:pid, setorId:s.id, excluido:excluido ? 'Sim' : '' }; CAMPOS.setores.forEach(k => { if (k !== 'id') o[k] = s[k] ?? ''; }); return novoReg('propSetores', o); }
function estruturaProposta(p){
  const oficiais = setoresOficiais(), ofMap = new Map(oficiais.map(s => [s.id, s]));
  const lista = oficiais.map(s => Object.assign({}, s, { _marcas:[] })), mapa = new Map(lista.map(s => [s.id, s]));
  const cargos = new Set();
  itensProp(p).forEach(it => {   // alterações registradas como itens (versão anterior)
    if (it.tipo === 'novo' && !mapa.has(it.novoId)) { const s = novoReg('setores', { id:it.novoId, nome:it.nome || 'Novo setor', sigla:it.sigla || '', tipo:it.tipoSetor || 'Coordenadoria', paiId:it.paiId || '', status:'Proposto', ordem:'999' }); s._marcas = []; lista.push(s); mapa.set(s.id, s); }
    const s = mapa.get(it.setorId); if (!s) return;
    if (it.tipo === 'extinguir') { const alvo = [s.id]; if (it.comSub) { const vis = id => lista.filter(x => x.paiId === id).forEach(x => { alvo.push(x.id); vis(x.id); }); vis(s.id); } alvo.forEach(id => { mapa.get(id).status = 'Extinto'; }); }
    if (it.tipo === 'mover' && it.paiId && it.paiId !== s.id) s.paiId = it.paiId;
    if (it.tipo === 'renomear') { if (it.nome) s.nome = it.nome; if (it.sigla) s.sigla = it.sigla; if (it.tipoSetor) s.tipo = it.tipoSetor; }
    if (it.tipo === 'cargo') cargos.add(s.id);
  });
  overridesDe(p.id).forEach(o => {   // edições feitas diretamente no mapa da proposta
    const s = Object.assign(deOverride(o), { _marcas:[] }); if (o.excluido === 'Sim') s.status = 'Extinto';
    const i = lista.findIndex(x => x.id === s.id); if (i >= 0) lista[i] = s; else lista.push(s); mapa.set(s.id, s);
  });
  lista.forEach(s => marcarSetor(s, ofMap.get(s.id), cargos.has(s.id)));
  return { lista, mapa };
}
function marcarSetor(s, of, cargo){
  const m = [];
  if (!of) m.push('novo');
  else {
    if (s.status === 'Extinto' && of.status !== 'Extinto') m.push('extinto');
    if ((s.paiId || '') !== (of.paiId || '')) { m.push('movido'); s._paiOrig = of.paiId || ''; } else delete s._paiOrig;
    if (s.nome !== of.nome || (s.sigla || '') !== (of.sigla || '') || s.tipo !== of.tipo) m.push('renomeado');
    if (CAMPOS_DADOS.some(c => String(s[c] ?? '') !== String(of[c] ?? ''))) m.push('editado');
  }
  if (cargo) m.push('cargo');
  s._marcas = m;
}
/* Linhas de custo da proposta: base atual − setores extintos ± trocas de cargo + novas despesas/bolsas */
function custoProposta(p){
  const E = estruturaProposta(p), extinto = id => { const s = E.mapa.get(id); return !s || s.status === 'Extinto'; };
  let linhas = DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual').map(d => Object.assign({}, d, { _orig:d.id }));
  itensProp(p).forEach(it => {
    if (it.tipo === 'novo' && it.rubricaId) linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.novoId, rubricaId:it.rubricaId, quantidade:'1', vinculo:it.vinculo || 'Comissionado', descricao:'Titular (novo setor)', observacao:MARCA_CHEFIA }));
    if (it.tipo === 'cargo' && it.setorId) {
      const l = linhas.find(x => x.setorId === it.setorId && x.observacao === MARCA_CHEFIA);
      if (it.rubricaId === '__remover') { if (l) linhas = linhas.filter(x => x !== l); }
      else if (l) { l.rubricaId = it.rubricaId; l.vinculo = it.vinculo || l.vinculo; l.valorUnitario = ''; }
      else linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.setorId, rubricaId:it.rubricaId, quantidade:'1', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA }));
    }
    if (it.tipo === 'despesa') linhas.push(novoReg('despesas', { id:'v' + it.id, setorId:it.setorId || '', rubricaId:it.rubricaId || '', quantidade:String(it.qtd ?? '1'), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '', descricao:it.descricao || '' }));
  });
  linhas = linhas.filter(l => !l.setorId || !extinto(l.setorId));
  let m = 0, a = 0; linhas.forEach(l => { const c = calcDesp(l); m += c.mensal; a += c.anual; });
  return { E, linhas, m, a };
}
function baseAtual(){ let m = 0, a = 0; DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual').forEach(d => { const c = calcDesp(d); m += c.mensal; a += c.anual; }); return { m, a }; }
function abaProp(a){ abaPropAtual = a; document.querySelectorAll('.prop-abas button').forEach(b => b.classList.toggle('on', b.dataset.aba === a)); renderPropostas(); }
function renderPropostas(){
  const c = $('#pr-corpo'); if (!c) return;
  const aviso = backendSemPropostas() ? `<div class="cartao bl" style="border-color:#f59e0b;margin-bottom:14px"><h3 style="color:#b45309"><i class="fa-solid fa-triangle-exclamation"></i>Atualize o backend</h3><p class="s">A planilha está com o Codigo.gs v${esc(backendVersao)}. Para gravar as propostas na planilha, cole o Codigo.gs novo no Apps Script e publique uma nova versão.</p></div>` : '';
  if (abaPropAtual === 'bolsas') { c.innerHTML = aviso + renderBolsas(); return; }
  if (propSel && !DB.propostas.some(p => p.id === propSel)) propSel = '';
  const base = baseAtual();
  const lista = [...DB.propostas].sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''));
  c.innerHTML = aviso + `<div class="prop-grade">
    <div class="prop-lista">
      <button class="btn btn-p so-edit" style="width:100%;margin-bottom:10px" onclick="novaProposta()"><i class="fa-solid fa-plus"></i>Nova proposta</button>
      ${lista.length ? lista.map(p => { const cp = custoProposta(p), dif = cp.m - base.m, n = itensProp(p).length; return `<button class="prop-card ${p.id === propSel ? 'on' : ''}" onclick="propSel=${esc(JSON.stringify(p.id))};renderPropostas()">
        <span class="chip" style="--c:${STATUS_PROP[p.status] || '#64748b'}">${esc(p.status || 'Rascunho')}</span>
        <b>${esc(p.nome || 'Sem nome')}</b><small>${n} alteração(ões) · ${p.atualizadoPor ? esc(p.atualizadoPor) + ' · ' : ''}${p.atualizadoEm ? new Date(p.atualizadoEm).toLocaleDateString('pt-BR') : ''}</small>
        <small>${overridesDe(p.id).length} setor(es) editado(s) no mapa</small><span class="prop-dif ${dif > 0 ? 'fin-pos' : dif < 0 ? 'fin-neg' : ''}">${dif ? (dif > 0 ? '+' : '−') + fmtM0(Math.abs(dif)) + '/mês' : 'sem impacto financeiro'}</span></button>`; }).join('') : '<div class="cartao vazio">Nenhuma proposta ainda.</div>'}
    </div>
    <div class="prop-det">${propSel ? detalheProposta(DB.propostas.find(p => p.id === propSel), base) : `<div class="cartao bl"><h3><i class="fa-solid fa-lightbulb"></i>Propostas de estrutura e valores</h3><p class="s" style="line-height:1.7">Monte cenários sem mexer na estrutura oficial: <b>crie, extinga, mova ou renomeie setores</b>, <b>troque o cargo DGA</b> dos titulares e <b>inclua despesas e bolsas</b> com custos próprios. Cada proposta mostra o custo mensal e anual comparado ao atual, a diferença por item (DGA e bolsas) e a estrutura resultante. Quando uma proposta for aprovada, um administrador pode <b>aplicá-la</b> à estrutura oficial.</p><div class="acoes so-edit"><button class="btn btn-p" onclick="novaProposta()"><i class="fa-solid fa-plus"></i>Criar a primeira proposta</button></div></div>`}</div>
  </div>`;
}
function novaProposta(copiaDe){
  if (somenteLeitura()) return toast('Seu perfil é somente leitura.', 'aviso');
  const o = copiaDe ? DB.propostas.find(p => p.id === copiaDe) : null;
  abrirModal({ titulo: o ? 'Duplicar proposta' : 'Nova proposta', rotulo: o ? 'Duplicar' : 'Criar', largura:480,
    html:`<label><span class="rot">Nome da proposta</span><input id="np-nome" class="campo" required value="${o ? esc(o.nome + ' (cópia)') : ''}" placeholder="ex.: Reestruturação da SAGP 2027"></label>
      <label><span class="rot">Descrição / justificativa</span><textarea id="np-desc" class="campo" rows="3">${o ? esc(o.descricao) : ''}</textarea></label>`,
    aoConfirmar: async m => {
      const nome = m.querySelector('#np-nome').value.trim(); if (!nome) throw new Error('Dê um nome à proposta.');
      const p = novoReg('propostas', { id:novoId('pp'), nome, descricao:m.querySelector('#np-desc').value.trim(), status:'Rascunho', itens:o ? o.itens : '[]', criadoEm:agora(), criadoPor:cfg.usuario || '', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.propostas.push(p); enfileirar('propostas', p);
      if (o) overridesDe(o.id).forEach(x => { const n = novoReg('propSetores', Object.assign({}, x, { id:p.id + '_' + x.setorId, propostaId:p.id })); DB.propSetores.push(n); enfileirar('propSetores', n); });
      salvarLocal(); propSel = p.id; return true;
    }
  }).then(ok => { if (ok) { abaProp('propostas'); } });
}
function nomeVirt(E, id){ const s = E.mapa.get(id); return s ? (s.sigla ? s.sigla + ' · ' : '') + s.nome : '(setor removido)'; }
function descreverAlt(it, E){
  const r = it.rubricaId && it.rubricaId !== '__remover' ? rubricaDe(it.rubricaId) : null, rn = r ? (r.codigo || r.nome) : '';
  if (it.tipo === 'novo') return `<b>${esc(it.nome)}</b>${it.sigla ? ' (' + esc(it.sigla) + ')' : ''} · ${esc(it.tipoSetor || '')} · subordinado a ${esc(nomeVirt(E, it.paiId))}${rn ? ` · titular <b>${esc(rn)}</b>${it.vinculo === 'Efetivo' ? ' (efetivo)' : ''}` : ''}`;
  if (it.tipo === 'extinguir') return `<b>${esc(nomeVirt(E, it.setorId))}</b>${it.comSub ? ' e todos os subordinados' : ' (subordinados ficam sem superior até serem movidos)'}`;
  if (it.tipo === 'mover') return `<b>${esc(nomeVirt(E, it.setorId))}</b> passa a responder a <b>${esc(nomeVirt(E, it.paiId))}</b>`;
  if (it.tipo === 'renomear') { const s = DB.setores.find(x => x.id === it.setorId); return `<b>${esc(s ? s.nome : nomeVirt(E, it.setorId))}</b> → ${esc(it.nome || '(mesmo nome)')}${it.tipoSetor ? ' · tipo ' + esc(it.tipoSetor) : ''}`; }
  if (it.tipo === 'cargo') return `<b>${esc(nomeVirt(E, it.setorId))}</b>: titular ${it.rubricaId === '__remover' ? '<b>sem cargo em comissão</b>' : `passa a <b>${esc(rn)}</b>${it.vinculo === 'Efetivo' ? ' (efetivo)' : ''}`}`;
  if (it.tipo === 'despesa') { const c = calcDesp({ rubricaId:it.rubricaId || '', quantidade:String(it.qtd ?? 1), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '' }); return `${esc(rn || it.descricao || 'Despesa')} × <b>${numBR(it.qtd).toLocaleString('pt-BR')}</b>${it.descricao && rn ? ' · ' + esc(it.descricao) : ''} em ${esc(nomeVirt(E, it.setorId))} · <b>${fmtM(c.mensal)}/mês</b>${c.meses !== 12 ? ` (${c.meses.toLocaleString('pt-BR')} meses)` : ''}`; }
  return '';
}
function detalheProposta(p, base){
  const cp = custoProposta(p), itens = itensProp(p), dif = cp.m - base.m, difA = cp.a - base.a, E = cp.E, ro = somenteLeitura();
  const novos = E.lista.filter(s => s._marcas.includes('novo')).length, ext = E.lista.filter(s => s._marcas.includes('extinto')).length;
  // comparativo por item
  const porItem = new Map(); const soma = (lst, k) => lst.forEach(l => { const c = calcDesp(l), key = l.rubricaId || '__' + (l.descricao || 'Valor próprio'); const o = porItem.get(key) || { nome:c.r.codigo || l.descricao || 'Valor próprio', cat:c.categoria, qa:0, qp:0, ma:0, mp:0 }; o['q' + k] += c.qtd; o['m' + k] += c.mensal; porItem.set(key, o); });
  soma(DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual'), 'a'); soma(cp.linhas, 'p');
  const linhasItem = [...porItem.values()].filter(o => o.qa || o.qp).sort((a, b) => Object.keys(CATEG_FIN).indexOf(a.cat) - Object.keys(CATEG_FIN).indexOf(b.cat) || String(a.nome).localeCompare(String(b.nome), 'pt-BR', { numeric:true }));
  const dv = (a, b, moeda) => { const x = b - a; return x ? `<span class="${x > 0 ? 'fin-pos' : 'fin-neg'}">${x > 0 ? '+' : '−'}${moeda ? fmtM(Math.abs(x)) : Math.abs(x).toLocaleString('pt-BR')}</span>` : '<span style="color:var(--mut2)">—</span>'; };
  const kpi = (cor, ic, r, v, s) => `<div class="cartao kpi" style="--c:${cor}"><div class="r"><i class="fa-solid ${ic}"></i>${r}</div><div class="v" style="font-size:21px">${v}</div><div class="s">${s}</div></div>`;
  return `<div class="cartao bl prop-cab">
      <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:220px"><input class="campo prop-nome" ${ro ? 'disabled' : ''} value="${esc(p.nome)}" onchange="editarProp(${arg(p.id)},'nome',this.value)">
          <textarea class="campo" ${ro ? 'disabled' : ''} rows="2" style="margin-top:6px" placeholder="Descrição / justificativa" onchange="editarProp(${arg(p.id)},'descricao',this.value)">${esc(p.descricao)}</textarea></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <select class="campo" style="width:auto" ${ro ? 'disabled' : ''} onchange="editarProp(${arg(p.id)},'status',this.value)">${Object.keys(STATUS_PROP).map(s => `<option ${s === (p.status || 'Rascunho') ? 'selected' : ''}>${s}</option>`).join('')}</select>
          <div class="u-acoes"><button class="btn btn-p btn-sm" onclick="verPropostaNoMapa(${arg(p.id)})" title="Ver a estrutura desta proposta no mapa"><i class="fa-solid fa-diagram-project"></i>Ver no mapa</button><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})" title="Comparar com a estrutura atual, lado a lado"><i class="fa-solid fa-code-compare"></i>Comparar</button><button class="btn btn-s btn-sm" onclick="exportarProposta(${arg(p.id)})" title="Exportar comparativo (CSV)"><i class="fa-solid fa-file-csv"></i>CSV</button><button class="btn btn-s btn-sm so-edit" onclick="novaProposta(${arg(p.id)})" title="Duplicar"><i class="fa-regular fa-copy"></i>Duplicar</button>${ehAdmin() && p.status !== 'Aplicada' ? `<button class="btn btn-s btn-sm" onclick="aplicarProposta(${arg(p.id)})" title="Aplicar à estrutura oficial"><i class="fa-solid fa-check-double"></i>Aplicar</button>` : ''}<button class="btn btn-perigo btn-sm btn-i so-edit" onclick="excluirProposta(${arg(p.id)})" title="Excluir"><i class="fa-solid fa-trash-can"></i></button></div>
        </div>
      </div></div>
    <div class="kpis">
      ${kpi('#2563eb', 'fa-calendar-day', 'Custo mensal · atual', fmtM0(base.m), 'lançamentos do cenário Atual')}
      ${kpi('#7c3aed', 'fa-lightbulb', 'Custo mensal · proposta', fmtM0(cp.m), fmtM0(cp.a) + ' por ano')}
      ${kpi(dif > 0 ? '#dc2626' : '#16a34a', dif > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down', 'Diferença', (dif > 0 ? '+' : dif < 0 ? '−' : '') + fmtM0(Math.abs(dif)) + '/mês', (difA > 0 ? '+' : difA < 0 ? '−' : '') + fmtM0(Math.abs(difA)) + ' por ano' + (base.m ? ` · ${(dif / base.m * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 })}%` : ''))}
      ${kpi('#0891b2', 'fa-sitemap', 'Estrutura', `+${novos} / −${ext}`, `setores criados / extintos · ${E.lista.filter(s => s._marcas.some(m => ['movido','renomeado','editado'].includes(m))).length} alterados`)}
    </div>
    <div class="cartao bl"><h3><i class="fa-solid fa-list-check"></i>Alterações da proposta</h3>
      <div class="prop-mapa"><div><b><i class="fa-solid fa-diagram-project"></i> Estrutura desta proposta</b><span>Abra o mapa da proposta e altere tudo como na estrutura atual: nomes, tipos, subordinação, impactos, valores, pontos positivos e negativos, criar e excluir setores e reposicionar. Nada muda na estrutura atual.</span></div><button class="btn btn-p" onclick="verPropostaNoMapa(${arg(p.id)})"><i class="fa-solid fa-pen-ruler"></i>${somenteLeitura() ? 'Ver no mapa' : 'Editar no mapa'}</button></div>
      <div class="prop-add so-edit"><span style="font-size:12px;color:var(--mut);align-self:center">Custos da proposta:</span>${Object.entries(TIPOS_ALT).filter(([k]) => ['cargo','despesa'].includes(k)).map(([k, [ic, n, cor]]) => `<button class="btn btn-s btn-sm" style="--c:${cor}" onclick="formAlteracao(${arg(p.id)},'','${k}')"><i class="fa-solid ${ic}" style="color:${cor}"></i>${n}</button>`).join('')}</div>
      ${itens.length ? `<div class="prop-itens">${itens.map((it, i) => `<div class="prop-it" style="--c:${TIPOS_ALT[it.tipo][2]}"><i class="fa-solid ${TIPOS_ALT[it.tipo][0]}"></i><div><small>${TIPOS_ALT[it.tipo][1]}</small><span>${descreverAlt(it, E)}</span></div>
        <div class="u-acoes so-edit">${i ? `<button class="btn btn-s btn-sm btn-i" title="Subir" onclick="moverAlt(${arg(p.id)},${i},-1)"><i class="fa-solid fa-arrow-up"></i></button>` : ''}<button class="btn btn-s btn-sm btn-i" title="Editar" onclick="formAlteracao(${arg(p.id)},${arg(it.id)},'${it.tipo}')"><i class="fa-solid fa-pen"></i></button><button class="btn btn-perigo btn-sm btn-i" title="Remover" onclick="removerAlt(${arg(p.id)},${arg(it.id)})"><i class="fa-solid fa-xmark"></i></button></div></div>`).join('')}</div>` : '<p class="s" style="margin-top:10px">Nenhum custo extra registrado. Para trocar o cargo DGA de um titular ou incluir despesas e bolsas, use os botões acima.</p>'}
    </div>
    <div class="grade2" style="margin-top:14px">
      <div class="cartao bl"><h3><i class="fa-solid fa-table-list"></i>Comparativo por item</h3>
        ${linhasItem.length ? `<div class="tab-wrap" style="margin-top:8px"><table class="tab"><thead><tr><th>Item</th><th class="fin-num">Qtd atual</th><th class="fin-num">Qtd proposta</th><th class="fin-num">Δ qtd</th><th class="fin-num">Δ mensal</th></tr></thead><tbody>${linhasItem.map(o => `<tr><td><span class="chip" style="--c:${(CATEG_FIN[o.cat] || CATEG_FIN.Outro)[0]}">${esc(o.nome)}</span></td><td class="fin-num">${o.qa.toLocaleString('pt-BR')}</td><td class="fin-num">${o.qp.toLocaleString('pt-BR')}</td><td class="fin-num">${dv(o.qa, o.qp)}</td><td class="fin-num">${dv(o.ma, o.mp, true)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="s">Sem lançamentos financeiros.</p>'}</div>
      <div class="cartao bl"><h3><i class="fa-solid fa-sitemap"></i>Estrutura resultante <small style="font-weight:500;color:var(--mut)">só setores afetados e seus superiores</small></h3>${arvoreProposta(E)}</div>
    </div>`;
}
function arvoreProposta(E){
  const afetados = E.lista.filter(s => s._marcas.length); if (!afetados.length) return '<p class="s">Nenhuma mudança de estrutura.</p>';
  const mostrar = new Set(); afetados.forEach(s => { let x = s, g = 0; while (x && g++ < 40) { mostrar.add(x.id); x = E.mapa.get(x.paiId); } });
  const filhos = id => E.lista.filter(s => (s.paiId || '') === id && mostrar.has(s.id));
  const ROT = { novo:['novo', '#16a34a'], extinto:['extinto', '#dc2626'], movido:['movido', '#7c3aed'], renomeado:['renomeado', '#0891b2'], editado:['editado', '#ca8a04'], cargo:['cargo', '#ea580c'] };
  const raizesV = E.lista.filter(s => (!s.paiId || !E.mapa.has(s.paiId)) && mostrar.has(s.id));
  const no = (s, d) => `<div class="prop-no" style="padding-left:${d * 18}px;${s.status === 'Extinto' ? 'opacity:.6;text-decoration:line-through' : ''}"><i class="fa-solid ${icTipo(s.tipo)}" style="color:${corTipo(s.tipo)}"></i>${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)} ${[...new Set(s._marcas)].map(m => `<span class="chip" style="--c:${ROT[m][1]};text-decoration:none">${ROT[m][0]}</span>`).join(' ')}</div>` + filhos(s.id).map(f => no(f, d + 1)).join('');
  return `<div class="prop-arvore">${raizesV.map(r => no(r, 0)).join('')}</div>`;
}
function editarProp(id, campo, valor){
  const p = DB.propostas.find(x => x.id === id); if (!p || somenteLeitura()) return;
  if (campo === 'status' && valor === 'Aplicada' && p.status !== 'Aplicada') { toast('Use o botão "Aplicar" para aplicar a proposta à estrutura.', 'aviso'); renderPropostas(); return; }
  p[campo] = String(valor); p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p); salvarLocal();
  if (campo !== 'descricao') renderPropostas();
}
async function excluirProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p || somenteLeitura()) return;
  if (!await confirmar('Excluir proposta', `Excluir a proposta <b>${esc(p.nome)}</b>? A estrutura oficial não é afetada.`, 'Excluir', true)) return;
  if (cenMapa === p.id) sairCenario();
  overridesDe(p.id).forEach(o => enfileirar('propSetores', o, true)); DB.propSetores = DB.propSetores.filter(o => o.propostaId !== p.id);
  DB.propostas = DB.propostas.filter(x => x !== p); enfileirar('propostas', p, true); salvarLocal(); propSel = ''; renderPropostas();
}
function moverAlt(pid, i, d){ const p = DB.propostas.find(x => x.id === pid); const a = itensProp(p); if (!a[i + d]) return; [a[i], a[i + d]] = [a[i + d], a[i]]; salvarItensProp(p, a); renderPropostas(); }
function removerAlt(pid, iid){
  const p = DB.propostas.find(x => x.id === pid); let a = itensProp(p); const it = a.find(x => x.id === iid);
  if (it && it.tipo === 'novo' && a.some(x => x !== it && (x.paiId === it.novoId || x.setorId === it.novoId))) return toast('Outras alterações dependem deste novo setor. Remova-as primeiro.', 'aviso');
  a = a.filter(x => x.id !== iid); salvarItensProp(p, a); renderPropostas();
}
function opcoesVirt(E, sel, excluir){
  const ord = []; const visit = (s, d) => { if (excluir && excluir.has(s.id)) return; ord.push([s, d]); E.lista.filter(x => x.paiId === s.id && x.status !== 'Extinto').forEach(k => visit(k, d + 1)); };
  E.lista.filter(s => (!s.paiId || !E.mapa.has(s.paiId)) && s.status !== 'Extinto').forEach(r => visit(r, 0));
  return ord.map(([s, d]) => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${'  '.repeat(Math.min(d, 6))}${s._marcas.includes('novo') ? '★ ' : ''}${esc(s.sigla ? s.sigla + ' · ' : '')}${esc(s.nome)}</option>`).join('');
}
function opcoesDGA(sel, comRemover){
  return (comRemover ? `<option value="__remover" ${sel === '__remover' ? 'selected' : ''}>— Sem cargo em comissão —</option>` : '<option value="">— Sem cargo em comissão —</option>') + DB.rubricas.filter(r => r.categoria === 'Cargo em comissão (DGA)' || r.categoria === 'Função gratificada').sort((a, b) => String(a.codigo).localeCompare(String(b.codigo), 'pt-BR', { numeric:true })).map(r => `<option value="${esc(r.id)}" ${r.id === sel ? 'selected' : ''}>${esc(r.codigo)} — ${fmtM(r.valorMensal)}</option>`).join('');
}
function formAlteracao(pid, iid, tipo){
  if (somenteLeitura()) return;
  const p = DB.propostas.find(x => x.id === pid); if (!p) return;
  const itens = itensProp(p), it = itens.find(x => x.id === iid) || { id:novoId('al'), tipo };
  // estrutura até antes deste item (para que o item possa referenciar setores criados antes dele)
  const idx = itens.indexOf(it), antes = Object.assign({}, p, { itens:JSON.stringify(idx >= 0 ? itens.slice(0, idx) : itens) }), E = estruturaProposta(antes);
  const tiposSetor = Object.keys(TIPOS);
  const vincSel = v => `<label><span class="rot">Ocupante do cargo</span><select id="fa-vinc" class="campo"><option value="Comissionado" ${v !== 'Efetivo' ? 'selected' : ''}>Exclusivamente comissionado (100%)</option><option value="Efetivo" ${v === 'Efetivo' ? 'selected' : ''}>Servidor efetivo (gratificação de %)</option></select></label>`;
  let html = '';
  if (tipo === 'novo') html = `<label><span class="rot">Nome do novo setor</span><input id="fa-nome" class="campo" required value="${esc(it.nome)}"></label>
    <div class="g2"><label><span class="rot">Sigla</span><input id="fa-sigla" class="campo" value="${esc(it.sigla)}"></label><label><span class="rot">Tipo</span><select id="fa-tipo" class="campo">${tiposSetor.map(t => `<option ${t === (it.tipoSetor || 'Coordenadoria') ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
    <label><span class="rot">Subordinado a</span><select id="fa-pai" class="campo">${opcoesVirt(E, it.paiId)}</select></label>
    <div class="g2"><label><span class="rot">Cargo do titular</span><select id="fa-rub" class="campo">${opcoesDGA(it.rubricaId)}</select></label>${vincSel(it.vinculo)}</div>`;
  if (tipo === 'extinguir') html = `<label><span class="rot">Setor a extinguir</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <label class="chk"><input type="checkbox" id="fa-sub" ${it.comSub !== false ? 'checked' : ''}><span>Extinguir também todos os subordinados <small style="display:block;color:var(--mut)">Desmarque se os subordinados forem movidos para outro setor nesta proposta.</small></span></label>
    <p style="font-size:12px">Os custos lançados nos setores extintos saem do total da proposta.</p>`;
  if (tipo === 'mover') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label><label><span class="rot">Passa a responder a</span><select id="fa-pai" class="campo">${opcoesVirt(E, it.paiId)}</select></label>`;
  if (tipo === 'renomear') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label><label><span class="rot">Novo nome <small>vazio = mantém</small></span><input id="fa-nome" class="campo" value="${esc(it.nome)}"></label>
    <div class="g2"><label><span class="rot">Nova sigla <small>vazio = mantém</small></span><input id="fa-sigla" class="campo" value="${esc(it.sigla)}"></label><label><span class="rot">Novo tipo</span><select id="fa-tipo" class="campo"><option value="">(mantém)</option>${tiposSetor.map(t => `<option ${t === it.tipoSetor ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>`;
  if (tipo === 'cargo') html = `<label><span class="rot">Setor (titular)</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <div class="g2"><label><span class="rot">Novo cargo</span><select id="fa-rub" class="campo">${opcoesDGA(it.rubricaId || '', true)}</select></label>${vincSel(it.vinculo)}</div>
    <p style="font-size:12px">Substitui o cargo padrão do titular desse setor nesta proposta (ex.: Coordenadoria de DGA-5 para DGA-4).</p>`;
  if (tipo === 'despesa') html = `<label><span class="rot">Setor</span><select id="fa-set" class="campo">${opcoesVirt(E, it.setorId)}</select></label>
    <label><span class="rot">Item da tabela (DGA, bolsa, função…)</span><select id="fa-rub" class="campo">${opcoesRubricas(it.rubricaId || '')}</select></label>
    <div class="acoes" style="margin-top:-4px"><button type="button" class="btn btn-s btn-sm" onclick="formBolsa('', true)"><i class="fa-solid fa-graduation-cap"></i>Cadastrar nova bolsa</button></div>
    <label><span class="rot">Descrição</span><input id="fa-desc" class="campo" value="${esc(it.descricao)}" placeholder="ex.: Bolsistas formadores do programa X"></label>
    <div class="g2"><label><span class="rot">Quantidade <small>negativa reduz</small></span><input id="fa-qtd" class="campo" type="number" step="any" value="${esc(it.qtd ?? '1')}"></label><label><span class="rot">Valor mensal próprio <small>vazio = tabela</small></span><input id="fa-val" class="campo" type="number" min="0" step="0.01" value="${esc(it.valor)}"></label></div>
    <div class="g2"><label><span class="rot">Meses no ano <small>vazio = tabela</small></span><input id="fa-mes" class="campo" type="number" min="0" step="any" value="${esc(it.meses)}"></label>${vincSel(it.vinculo)}</div>
    <div class="fin-prev" id="fa-prev"></div>`;
  abrirModal({ titulo:TIPOS_ALT[tipo][1], rotulo: idx >= 0 ? 'Salvar' : 'Incluir na proposta', largura:540, html,
    aoConfirmar: async m => {
      const v = id => { const e = m.querySelector(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : undefined; };
      const n = Object.assign({}, it);
      if (tipo === 'novo') { n.nome = v('#fa-nome').trim(); n.sigla = v('#fa-sigla').trim(); n.tipoSetor = v('#fa-tipo'); n.paiId = v('#fa-pai'); n.rubricaId = v('#fa-rub'); n.vinculo = v('#fa-vinc'); n.novoId = n.novoId || novoId('pn'); if (!n.nome) throw new Error('Informe o nome.'); }
      if (tipo === 'extinguir') { n.setorId = v('#fa-set'); n.comSub = v('#fa-sub'); }
      if (tipo === 'mover') { n.setorId = v('#fa-set'); n.paiId = v('#fa-pai'); if (n.setorId === n.paiId) throw new Error('Um setor não pode responder a si mesmo.'); const sub = new Set(); const vis = id => E.lista.filter(x => x.paiId === id).forEach(x => { sub.add(x.id); vis(x.id); }); vis(n.setorId); if (sub.has(n.paiId)) throw new Error('O novo superior está dentro do próprio ramo do setor.'); }
      if (tipo === 'renomear') { n.setorId = v('#fa-set'); n.nome = v('#fa-nome').trim(); n.sigla = v('#fa-sigla').trim(); n.tipoSetor = v('#fa-tipo'); if (!n.nome && !n.sigla && !n.tipoSetor) throw new Error('Informe o que muda.'); }
      if (tipo === 'cargo') { n.setorId = v('#fa-set'); n.rubricaId = v('#fa-rub'); n.vinculo = v('#fa-vinc'); }
      if (tipo === 'despesa') { n.setorId = v('#fa-set'); n.rubricaId = v('#fa-rub'); n.descricao = v('#fa-desc').trim(); n.qtd = v('#fa-qtd'); n.valor = v('#fa-val'); n.meses = v('#fa-mes'); n.vinculo = v('#fa-vinc'); if (!n.rubricaId && !n.valor) throw new Error('Escolha um item ou informe o valor.'); if (!n.rubricaId && !n.descricao) throw new Error('Descreva a despesa.'); if (!numBR(n.qtd)) throw new Error('Informe a quantidade.'); }
      const a = itensProp(p), i = a.findIndex(x => x.id === n.id); if (i >= 0) a[i] = n; else a.push(n);
      salvarItensProp(p, a); return true;
    }
  }).then(ok => { if (ok) renderPropostas(); });
  if (tipo === 'despesa') {
    const ms = document.querySelectorAll('.modal'), mm = ms[ms.length - 1];
    const prev = () => { const c = calcDesp({ rubricaId:mm.querySelector('#fa-rub').value, quantidade:mm.querySelector('#fa-qtd').value, valorUnitario:mm.querySelector('#fa-val').value, meses:mm.querySelector('#fa-mes').value, vinculo:mm.querySelector('#fa-vinc').value }); mm.querySelector('#fa-prev').innerHTML = `<div>Mensal<b>${fmtM(c.mensal)}</b></div><div>Anual (${c.meses.toLocaleString('pt-BR')} meses)<b>${fmtM(c.anual)}</b></div>`; const r = rubricaDe(mm.querySelector('#fa-rub').value); mm.querySelector('#fa-vinc').closest('label').style.display = r && r.percEfetivo !== '' ? '' : 'none'; };
    mm.querySelectorAll('#fa-rub,#fa-qtd,#fa-val,#fa-mes,#fa-vinc').forEach(x => x.addEventListener('input', prev)); prev();
    tv.atualizarRubFA = () => { const s = mm.querySelector('#fa-rub'); if (s) { const v = s.value; s.innerHTML = opcoesRubricas(v); prev(); } };
  }
}
async function aplicarProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p || !ehAdmin()) return;
  if (cenMapa) sairCenario();
  const itens = itensProp(p), ovs = overridesDe(p.id); if (!itens.length && !ovs.length) return toast('A proposta não tem alterações.', 'aviso');
  if (!await confirmar('Aplicar proposta', `Aplicar as <b>${itens.length + ovs.length}</b> alteração(ões) de <b>${esc(p.nome)}</b> à <b>estrutura oficial</b>? Setores serão criados, extintos, movidos ou renomeados, e os lançamentos do cenário Atual serão ajustados. Recomendo exportar uma cópia antes (Configurações).`, 'Aplicar à estrutura', true)) return;
  const real = new Map(); const R = x => real.get(x) || x;
  itens.forEach(it => {
    if (it.tipo === 'novo') {
      const pai = R(it.paiId), s = novoSetor({ id:novoId('s'), nome:it.nome, sigla:it.sigla || '', tipo:it.tipoSetor || 'Coordenadoria', paiId:pai, ordem:String(Math.max(0, ...filhosDe(pai).map(k => num(k.ordem))) + 1), atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.setores.push(s); enfileirar('setores', s); real.set(it.novoId, s.id); indexar(); registrar(s.id, `Criado pela proposta "${p.nome}"`);
      if (it.rubricaId) { const d = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:it.rubricaId, quantidade:'1', cenario:'Atual', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); }
    }
    const s = porId.get(R(it.setorId));
    if (it.tipo === 'extinguir' && s) { [s.id, ...(it.comSub ? descendentes(s.id) : [])].forEach(i => { const x = porId.get(i); if (x) alterar(x, 'status', 'Extinto', true); }); registrar(s.id, `Extinto pela proposta "${p.nome}"`); DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual' && porId.get(d.setorId) && porId.get(d.setorId).status === 'Extinto').forEach(d => { DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true); }); }
    if (it.tipo === 'mover' && s) { s.dx = ''; s.dy = ''; alterar(s, 'paiId', R(it.paiId)); }
    if (it.tipo === 'renomear' && s) { if (it.nome) alterar(s, 'nome', it.nome); if (it.sigla) alterar(s, 'sigla', it.sigla); if (it.tipoSetor) alterar(s, 'tipo', it.tipoSetor); }
    if (it.tipo === 'cargo' && s) {
      const d = DB.despesas.find(x => x.setorId === s.id && x.observacao === MARCA_CHEFIA && (x.cenario || 'Atual') === 'Atual');
      if (it.rubricaId === '__remover') { if (d) { DB.despesas = DB.despesas.filter(x => x !== d); enfileirar('despesas', d, true); } }
      else if (d) { d.rubricaId = it.rubricaId; d.vinculo = it.vinculo || d.vinculo; d.valorUnitario = ''; d.atualizadoEm = agora(); enfileirar('despesas', d); }
      else { const n = novoReg('despesas', { id:novoId('fd'), setorId:s.id, rubricaId:it.rubricaId, quantidade:'1', cenario:'Atual', vinculo:it.vinculo || 'Comissionado', descricao:'Titular', observacao:MARCA_CHEFIA, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(n); enfileirar('despesas', n); }
      registrar(s.id, `Cargo do titular alterado pela proposta "${p.nome}"`);
    }
    if (it.tipo === 'despesa' && (s || !it.setorId)) { const d = novoReg('despesas', { id:novoId('fd'), setorId:s ? s.id : '', rubricaId:it.rubricaId || '', quantidade:String(it.qtd), valorUnitario:it.valor || '', meses:it.meses || '', vinculo:it.vinculo || '', descricao:it.descricao || '', cenario:'Atual', observacao:'Proposta: ' + p.nome, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }); DB.despesas.push(d); enfileirar('despesas', d); }
  });
  // edições feitas no mapa da proposta
  ovs.filter(o => !porId.has(o.setorId)).forEach(o => { const s = deOverride(o); if (o.excluido === 'Sim') s.status = 'Extinto'; DB.setores.push(s); enfileirar('setores', s); });
  indexar();
  ovs.filter(o => porId.has(o.setorId)).forEach(o => { const s = porId.get(o.setorId), n = deOverride(o); if (o.excluido === 'Sim') n.status = 'Extinto'; CAMPOS.setores.forEach(k => { if (k !== 'id' && !['atualizadoEm','atualizadoPor'].includes(k) && String(s[k] ?? '') !== String(n[k] ?? '')) s[k] = n[k]; }); s.atualizadoEm = agora(); s.atualizadoPor = cfg.usuario || ''; enfileirar('setores', s); });
  ovs.forEach(o => registrar(o.setorId, `Alterado pela proposta "${p.nome}"`));
  p.status = 'Aplicada'; p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p);
  indexar(); salvarLocal(); toast(`Proposta "${p.nome}" aplicada à estrutura oficial.`); renderPropostas();
}
function exportarProposta(id){
  const p = DB.propostas.find(x => x.id === id); if (!p) return;
  const cp = custoProposta(p), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const linhas = ['Proposta;' + q(p.nome), 'Situação;' + q(p.status), '', 'Alterações', ...itensProp(p).map(it => q(TIPOS_ALT[it.tipo][1]) + ';' + q(descreverAlt(it, cp.E).replace(/<[^>]+>/g, ''))), '',
    'Setor;Item;Tipo;Descrição;Quantidade;Valor unitário;Mensal;Meses;Anual', ...cp.linhas.map(l => { const c = calcDesp(l), s = cp.E.mapa.get(l.setorId); return [s ? s.nome : '', c.r.codigo || '', c.categoria, l.descricao, c.qtd, n(c.unit), n(c.mensal), c.meses, n(c.anual)].map(q).join(';'); }),
    '', 'Total mensal da proposta;' + n(cp.m), 'Total mensal atual;' + n(baseAtual().m)];
  baixarArquivo('gaborg-proposta-' + (p.nome || 'sem-nome').replace(/[^\w-]+/g, '_').slice(0, 40) + '.csv', '﻿' + linhas.join('\r\n'), 'text/csv;charset=utf-8');
}
/* Bolsas: cadastro próprio com custos diferentes */
function renderBolsas(){
  const bolsas = DB.rubricas.filter(r => r.categoria === 'Bolsa'), ro = somenteLeitura() ? 'disabled' : '';
  const usos = id => DB.despesas.filter(d => d.rubricaId === id).length + DB.propostas.reduce((t, p) => t + itensProp(p).filter(i => i.rubricaId === id).length, 0);
  return `<div class="cartao bl" style="margin-bottom:14px"><h3><i class="fa-solid fa-graduation-cap"></i>Bolsas</h3><p class="s">Cadastre cada tipo de bolsa com o seu valor mensal e a quantidade de meses pagos no ano (ex.: bolsa de 10 meses). Elas aparecem nos lançamentos do Financeiro e nas alterações das Propostas.</p>
    <div class="acoes so-edit"><button class="btn btn-p" onclick="formBolsa()"><i class="fa-solid fa-plus"></i>Nova bolsa</button></div></div>
    ${bolsas.length ? `<div class="tab-wrap"><table class="tab"><thead><tr><th style="min-width:110px">Código</th><th style="min-width:220px">Nome da bolsa</th><th class="fin-num" style="min-width:120px">Valor mensal (R$)</th><th class="fin-num">Meses/ano</th><th class="fin-num">Custo anual por bolsista</th><th class="fin-num">Usos</th><th></th></tr></thead><tbody>${bolsas.sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR')).map(r => `<tr>
      <td><input class="campo fin-edit" ${ro} value="${esc(r.codigo)}" onchange="alterarRubrica(${arg(r.id)},'codigo',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit" ${ro} value="${esc(r.nome)}" onchange="alterarRubrica(${arg(r.id)},'nome',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit n" ${ro} type="number" min="0" step="0.01" value="${esc(r.valorMensal)}" onchange="alterarRubrica(${arg(r.id)},'valorMensal',this.value);renderPropostas()"></td>
      <td><input class="campo fin-edit n" ${ro} type="number" min="0" max="13.34" step="any" value="${esc(r.meses)}" placeholder="12" style="min-width:60px" onchange="alterarRubrica(${arg(r.id)},'meses',this.value);renderPropostas()"></td>
      <td class="fin-num"><b>${fmtM(numBR(r.valorMensal) * (r.meses !== '' ? numBR(r.meses) : 12))}</b></td><td class="fin-num">${usos(r.id)}</td>
      <td><div class="u-acoes so-edit"><button class="btn btn-perigo btn-sm btn-i" title="Excluir" onclick="excluirRubrica(${arg(r.id)}).then(()=>renderPropostas())"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="cartao vazio">Nenhuma bolsa cadastrada.</div>'}`;
}
function formBolsa(id, deDentro){
  if (somenteLeitura()) return;
  abrirModal({ titulo:'Nova bolsa', rotulo:'Cadastrar', largura:460,
    html:`<label><span class="rot">Nome da bolsa</span><input id="fb-nome" class="campo" required placeholder="ex.: Bolsa Formador Regional"></label>
      <div class="g2"><label><span class="rot">Código <small>opcional</small></span><input id="fb-cod" class="campo" placeholder="ex.: BOLSA-FR"></label><label><span class="rot">Valor mensal (R$)</span><input id="fb-val" class="campo" type="number" min="0" step="0.01" required></label></div>
      <label><span class="rot">Meses pagos no ano</span><input id="fb-mes" class="campo" type="number" min="0" max="13.34" step="any" value="12"></label>`,
    aoConfirmar: async m => {
      const nome = m.querySelector('#fb-nome').value.trim(), val = m.querySelector('#fb-val').value; if (!nome || val === '') throw new Error('Informe o nome e o valor.');
      const r = novoReg('rubricas', { id:novoId('rb'), codigo:m.querySelector('#fb-cod').value.trim() || ('BOLSA-' + (DB.rubricas.filter(x => x.categoria === 'Bolsa').length + 1)), nome, categoria:'Bolsa', valorMensal:val, encargos:'', meses:m.querySelector('#fb-mes').value || '12', ativo:'Sim', atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' });
      DB.rubricas.push(r); enfileirar('rubricas', r); salvarLocal(); toast('Bolsa cadastrada.'); return true;
    }
  }).then(ok => { if (!ok) return; if (deDentro && tv.atualizarRubFA) tv.atualizarRubFA(); else renderPropostas(); });
}

/* ===================== MAPA POR CENÁRIO (atual × propostas) E COMPARATIVO ===================== */
let cenMapa = '', cenSwap = false, DBoficial = null;
const VISTAS_CEN = ['mapa', 'lista', 'painel'];
/* Ao entrar numa proposta, a estrutura exibida e editada passa a ser a da proposta; a oficial fica guardada intacta */
function aplicarCenario(){
  const p = DB.propostas.find(x => x.id === cenMapa); if (!p) { cenMapa = ''; return; }
  if (cenSwap) desaplicarCenario();
  const E = estruturaProposta(p);
  DBoficial = DB.setores; DB.setores = E.lista; cenSwap = true; indexar();
}
function desaplicarCenario(){ if (!cenSwap) return; DB.setores = DBoficial; DBoficial = null; cenSwap = false; indexar(); }
function sairCenario(){ desaplicarCenario(); cenMapa = ''; atualizarBarraCen(); preencherCenarios(); }
function remarcarCenario(){
  if (!cenSwap) return; const p = DB.propostas.find(x => x.id === cenMapa); if (!p) return;
  const of = new Map(DBoficial.map(s => [s.id, s])), cargos = new Set(itensProp(p).filter(i => i.tipo === 'cargo').map(i => i.setorId));
  DB.setores.forEach(s => marcarSetor(s, of.get(s.id), cargos.has(s.id)));
}
function salvarOverride(rec, del){
  const p = DB.propostas.find(x => x.id === cenMapa); if (!p || somenteLeitura()) return;
  const of = DBoficial.find(s => s.id === rec.id), key = p.id + '_' + rec.id, ex = DB.propSetores.find(o => o.id === key);
  const tira = () => { if (ex) { DB.propSetores = DB.propSetores.filter(o => o !== ex); enfileirar('propSetores', ex, true); } };
  const poe = o => { const i = DB.propSetores.findIndex(x => x.id === o.id); if (i >= 0) DB.propSetores[i] = o; else DB.propSetores.push(o); enfileirar('propSetores', o); };
  if (del) { if (of) poe(paraOverride(p.id, Object.assign({}, rec, { status:'Extinto' }), true)); else tira(); }
  else if (of && CAMPOS.setores.every(k => ['atualizadoEm','atualizadoPor'].includes(k) || String(rec[k] ?? '') === String(of[k] ?? ''))) tira();
  else poe(paraOverride(p.id, rec, false));
  p.atualizadoEm = agora(); p.atualizadoPor = cfg.usuario || ''; enfileirar('propostas', p);
  clearTimeout(salvarOverride.t); salvarOverride.t = setTimeout(() => { remarcarCenario(); if (vistaAtual === 'mapa') { visiveis.forEach(n => { const el = elNo.get(n.id); if (el) { el.outerHTML = cardHTML(n); } }); elNo.clear(); document.querySelectorAll('#nos .no').forEach(el => elNo.set(el.dataset.id, el)); desenharArestas(); } atualizarBarraCen(); }, 250);
}
function atualizarBarraCen(){
  const b = $('#cen-barra'); if (!b) return;
  const p = cenMapa && DB.propostas.find(x => x.id === cenMapa);
  document.body.classList.toggle('cen-ativo', !!p);
  b.classList.toggle('hidden', !p); if (!p) return;
  const cp = custoProposta(p), base = baseAtual(), d = cp.m - base.m, E = cp.E, n = c => E.lista.filter(s => s._marcas.includes(c)).length;
  const emEstrutura = VISTAS_CEN.includes(vistaAtual);
  b.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span class="cb-t">${somenteLeitura() ? 'Vendo' : 'Editando'} a proposta <b>${esc(p.nome)}</b></span>
    <span class="cb-n">${n('novo') ? `<i style="--t:#16a34a">+${n('novo')} novo(s)</i>` : ''}${n('extinto') ? `<i style="--t:#dc2626">${n('extinto')} extinto(s)</i>` : ''}${n('movido') ? `<i style="--t:#7c3aed">${n('movido')} movido(s)</i>` : ''}${n('renomeado') ? `<i style="--t:#0891b2">${n('renomeado')} renomeado(s)</i>` : ''}${n('editado') ? `<i style="--t:#ca8a04">${n('editado')} editado(s)</i>` : ''}<i style="--t:${d > 0 ? '#dc2626' : '#16a34a'}">${d ? (d > 0 ? '+' : '−') + fmtM0(Math.abs(d)) + '/mês' : 'custo igual'}</i></span>
    ${emEstrutura ? '' : '<span class="cb-x">a estrutura atual está sendo exibida nesta tela</span>'}
    <span class="cb-a"><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})"><i class="fa-solid fa-code-compare"></i>Comparar</button><button class="btn btn-s btn-sm" onclick="trocarVista('propostas');propSel=${arg(p.id)};abaProp('propostas')"><i class="fa-solid fa-list-check"></i>Proposta</button><button class="btn btn-p btn-sm" onclick="escolherCenarioMapa('')"><i class="fa-solid fa-arrow-left"></i>Voltar à estrutura atual</button></span>`;
}
const ROT_MARCA = { novo:['Novo', '#16a34a'], extinto:['Extinto', '#dc2626'], movido:['Movido', '#7c3aed'], renomeado:['Renomeado', '#0891b2'], editado:['Editado', '#ca8a04'], cargo:['Cargo alterado', '#ea580c'] };
function listaCenario(id){
  const p = id && DB.propostas.find(x => x.id === id);
  if (p && cenSwap && id === cenMapa) { remarcarCenario(); return DB.setores; }
  return p ? estruturaProposta(p).lista : setoresOficiais();
}
function linhasCenario(id){
  const p = id && DB.propostas.find(x => x.id === id);
  return p ? custoProposta(p).linhas : DB.despesas.filter(d => (d.cenario || 'Atual') === 'Atual');
}
function nomeCenario(id){ const p = id && DB.propostas.find(x => x.id === id); return p ? p.nome : 'Estrutura atual (oficial)'; }
/* Executa fn com a estrutura de um cenário no lugar da oficial (só para desenhar; nada é gravado) */
function comLista(lista, fn, manterLayout, abExtra){
  const S = { setores:DB.setores, porId, filhos, prof, areaDe, areas, valPorSetor, pos, visiveis, caixas, modos, origemRaiz, abertos };
  DB.setores = lista; const jaAtivo = comLista.ativo; comLista.ativo = true;
  try { indexar(); if (abExtra) abertos = new Set([...abertos, ...abExtra]); return fn(); }
  finally {
    comLista.ativo = jaAtivo;
    const L = { pos, visiveis, caixas, modos, origemRaiz };
    DB.setores = S.setores; porId = S.porId; filhos = S.filhos; prof = S.prof; areaDe = S.areaDe; areas = S.areas; valPorSetor = S.valPorSetor; abertos = S.abertos;
    if (manterLayout) { pos = L.pos; visiveis = L.visiveis; caixas = L.caixas; modos = L.modos; origemRaiz = L.origemRaiz; }
    else { pos = S.pos; visiveis = S.visiveis; caixas = S.caixas; modos = S.modos; origemRaiz = S.origemRaiz; }
  }
}
const emCenario = fn => fn();
function ancestraisMarcados(lista){
  const m = new Map(lista.map(s => [s.id, s])), r = new Set();
  lista.filter(s => s._marcas && s._marcas.length).forEach(s => { let x = m.get(s.paiId), g = 0; while (x && g++ < 40) { r.add(x.id); x = m.get(x.paiId); } if (s._paiOrig) { let y = m.get(s._paiOrig), h = 0; while (y && h++ < 40) { r.add(y.id); y = m.get(y.paiId); } } });
  return r;
}
function preencherCenarios(){
  const sel = $('#m-cen'); if (!sel) return;
  if (cenMapa && !DB.propostas.some(p => p.id === cenMapa)) cenMapa = '';
  sel.innerHTML = '<option value="">Estrutura atual</option>' + DB.propostas.filter(p => p.status !== 'Aplicada').map(p => `<option value="${esc(p.id)}" ${p.id === cenMapa ? 'selected' : ''}>Proposta: ${esc(p.nome)}</option>`).join('');
  sel.value = cenMapa;
  const f = null;
  if (f) {
    f.classList.toggle('hidden', !cenMapa);
    if (cenMapa) { const p = DB.propostas.find(x => x.id === cenMapa), cp = custoProposta(p), b = baseAtual(), d = cp.m - b.m;
      f.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span><b>${esc(p.nome)}</b> · ${itensProp(p).length} alteração(ões) · ${d ? (d > 0 ? '+' : '−') + fmtM0(Math.abs(d)) + '/mês' : 'sem impacto financeiro'} · somente visualização</span><button class="btn btn-s btn-sm" onclick="abrirComparativo('', ${arg(p.id)})"><i class="fa-solid fa-code-compare"></i>Comparar com o atual</button><button class="btn btn-s btn-sm" onclick="trocarVista('propostas');propSel=${arg(p.id)};abaProp('propostas')"><i class="fa-solid fa-pen"></i>Editar proposta</button><button class="btn btn-s btn-sm" onclick="escolherCenarioMapa('')"><i class="fa-solid fa-xmark"></i>Voltar ao atual</button>`; }
  }
  atualizarBarraCen();
}
function escolherCenarioMapa(id){
  limparMulti(true); fecharPainel(); desaplicarCenario();
  cenMapa = id || '';
  if (cenMapa) { ancestraisMarcados(listaCenario(cenMapa)).forEach(a => abertos.add(a)); aplicarCenario(); }
  if (vistaAtual !== 'mapa') trocarVista('mapa'); else { atualizarBarraCen(); desenharMapa(); }
  setTimeout(() => ajustar(true), 40);
}
function verPropostaNoMapa(id){ escolherCenarioMapa(id); }
function marcasHTML(s){ return (s._marcas && s._marcas.length) ? [...new Set(s._marcas)].map(m => `<span class="cen-tag" style="--t:${ROT_MARCA[m][1]}">${ROT_MARCA[m][0]}</span>`).join('') : ''; }
function infoCenario(id){
  const lista = listaCenario(cenMapa), m = new Map(lista.map(s => [s.id, s])), s = m.get(id); if (!s) return;
  const linhas = linhasCenario(cenMapa).filter(l => l.setorId === id), real = DB.setores.find(x => x.id === id);
  const pai = m.get(s.paiId), paiOrig = s._paiOrig ? m.get(s._paiOrig) : null;
  abrirModal({ titulo: s.nome, rotulo:'Fechar', semCancelar:true, largura:480,
    html:`<p style="margin-top:-6px">${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''} ${marcasHTML(s)}</p>
      <p><span class="rot">Responde a (nesta proposta)</span>${esc(pai ? pai.nome : '—')}${paiOrig ? `<br><small style="color:var(--mut)">antes: ${esc(paiOrig.nome)}</small>` : ''}</p>
      ${real && real.nome !== s.nome ? `<p><span class="rot">Nome atual</span>${esc(real.nome)}</p>` : ''}
      <div><span class="rot">Custos nesta proposta</span>${linhas.length ? linhas.map(l => { const c = calcDesp(l); return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:3px 0"><span>${esc(c.r.codigo || l.descricao || c.categoria)} × ${c.qtd.toLocaleString('pt-BR')}</span><b>${fmtM(c.mensal)}/mês</b></div>`; }).join('') : '<p class="s">Nenhum.</p>'}</div>
      <div class="acoes" style="justify-content:flex-start">${real ? `<button type="button" class="btn btn-s btn-sm" onclick="this.closest('.modal').remove();escolherCenarioMapa('');setTimeout(()=>irPara(${arg(id)}),80)"><i class="fa-solid fa-arrow-right"></i>Abrir setor na estrutura atual</button>` : ''}</div>` });
}
/* ---------- Comparativo lado a lado ---------- */
const cmp = { a:'', b:'', sinc:true, v:[null, null] };
function diffCenarios(aId, bId){
  const A = listaCenario(aId), B = listaCenario(bId), mA = new Map(A.map(s => [s.id, s])), mB = new Map(B.map(s => [s.id, s]));
  const ativo = s => s && s.status !== 'Extinto', nm = (m, id) => { const s = m.get(id); return s ? (s.sigla || s.nome) : '(topo)'; };
  const est = [];
  B.forEach(s => { const a = mA.get(s.id);
    if (ativo(s) && !ativo(a)) est.push({ id:s.id, tipo:a ? 'reativado' : 'novo', txt:`<b>${esc(s.nome)}</b> (${esc(s.tipo)}) sob ${esc(nm(mB, s.paiId))}` });
    if (!ativo(s) && ativo(a)) est.push({ id:s.id, tipo:'extinto', txt:`<b>${esc(a.nome)}</b> (${esc(a.tipo)})` });
    if (a && ativo(s) && ativo(a)) {
      if ((a.paiId || '') !== (s.paiId || '')) est.push({ id:s.id, tipo:'movido', txt:`<b>${esc(s.nome)}</b>: ${esc(nm(mA, a.paiId))} → ${esc(nm(mB, s.paiId))}` });
      if (a.nome !== s.nome || (a.sigla || '') !== (s.sigla || '')) est.push({ id:s.id, tipo:'renomeado', txt:`${esc(a.nome)} → <b>${esc(s.nome)}</b>` });
      if (a.tipo !== s.tipo) est.push({ id:s.id, tipo:'tipo', txt:`<b>${esc(s.nome)}</b>: ${esc(a.tipo)} → ${esc(s.tipo)}` });
      const mud = CAMPOS_DADOS.filter(c => String(a[c] ?? '') !== String(s[c] ?? ''));
      if (mud.length) est.push({ id:s.id, tipo:'editado', txt:`<b>${esc(s.nome)}</b>: ` + mud.map(c => { const v = x => { x = String(x ?? '').trim(); if (!x) return '—'; if (c === 'impacto') return (IMPACTO[num(x)] || [x])[0]; if (['orcamento','custoMensal'].includes(c)) return fmtRc(x); return x.length > 40 ? x.slice(0, 40).replace(/\n/g, ' ') + '…' : x.replace(/\n/g, ' · '); }; return `${esc(ROTULOS[c] || c)}: ${esc(v(a[c]))} → <b>${esc(v(s[c]))}</b>`; }).join('; ') });
    }
  });
  A.forEach(a => { if (!mB.has(a.id) && ativo(a)) est.push({ id:a.id, tipo:'extinto', txt:`<b>${esc(a.nome)}</b> (${esc(a.tipo)})` }); });
  const custo = lst => { const m = new Map(); lst.forEach(l => { const c = calcDesp(l); const o = m.get(l.setorId) || { m:0, itens:[] }; o.m += c.mensal; o.itens.push((c.r.codigo || l.descricao || c.categoria) + (c.qtd !== 1 ? ' ×' + c.qtd.toLocaleString('pt-BR') : '')); m.set(l.setorId, o); }); return m; };
  const cA = custo(linhasCenario(aId)), cB = custo(linhasCenario(bId)), fin = [];
  new Set([...cA.keys(), ...cB.keys()]).forEach(id => { const x = cA.get(id) || { m:0, itens:[] }, y = cB.get(id) || { m:0, itens:[] }, d = y.m - x.m; if (Math.abs(d) > .004) fin.push({ id, nome:(mB.get(id) || mA.get(id) || {}).nome || '(sem setor)', a:x, b:y, d }); });
  fin.sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
  const tot = (l, k) => l.reduce((t, x) => t + calcDesp(x)[k], 0), LA = linhasCenario(aId), LB = linhasCenario(bId);
  return { est, fin, tA:tot(LA, 'mensal'), tB:tot(LB, 'mensal'), aA:tot(LA, 'anual'), aB:tot(LB, 'anual'), mA, mB, A, B };
}
function abrirComparativo(a, b){
  cmp.a = a || ''; cmp.b = b !== undefined ? b : (cenMapa || (DB.propostas[0] || {}).id || '');
  let el = $('#cmp'); if (!el) { el = document.createElement('div'); el.id = 'cmp'; document.body.appendChild(el); }
  el.classList.remove('hidden'); renderComparativo();
}
function fecharComparativo(){ const el = $('#cmp'); if (el) { el.classList.add('hidden'); el.innerHTML = ''; } }
function opcoesCen(sel){ return '<option value="">Estrutura atual (oficial)</option>' + DB.propostas.map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.nome)}${p.status ? ' · ' + esc(p.status) : ''}</option>`).join(''); }
function renderComparativo(){
  const el = $('#cmp'), D = diffCenarios(cmp.a, cmp.b), dif = D.tB - D.tA;
  const ROT = { novo:['Criado', '#16a34a', 'fa-square-plus'], reativado:['Reativado', '#16a34a', 'fa-rotate-left'], extinto:['Extinto', '#dc2626', 'fa-square-minus'], movido:['Subordinação', '#7c3aed', 'fa-arrows-up-down-left-right'], renomeado:['Nome', '#0891b2', 'fa-pen'], tipo:['Tipo', '#0e7490', 'fa-tag'], editado:['Dados', '#ca8a04', 'fa-pen-to-square'] };
  el.innerHTML = `<div class="cmp-topo"><b><i class="fa-solid fa-code-compare"></i> Comparar cenários</b>
      <select class="campo" onchange="cmp.a=this.value;renderComparativo()">${opcoesCen(cmp.a)}</select><span class="cmp-x">×</span><select class="campo" onchange="cmp.b=this.value;renderComparativo()">${opcoesCen(cmp.b)}</select>
      <label class="chk" style="margin-left:6px"><input type="checkbox" ${cmp.sinc ? 'checked' : ''} onchange="cmp.sinc=this.checked"><span>Mover os dois mapas juntos</span></label>
      <button class="btn btn-s btn-sm" onclick="exportarComparativo()"><i class="fa-solid fa-file-csv"></i>CSV</button><button class="btn btn-s btn-sm btn-i" title="Fechar (Esc)" onclick="fecharComparativo()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="cmp-mapas">
      ${[0, 1].map(i => `<div class="cmp-pane"><div class="cmp-tit"><span>${i ? 'B' : 'A'} · ${esc(nomeCenario(i ? cmp.b : cmp.a))}</span><b>${fmtM0(i ? D.tB : D.tA)}/mês</b></div><div class="cmp-vp" id="cmp-vp${i}"><div class="mundo-cmp" id="cmp-m${i}"></div></div></div>`).join('')}
    </div>
    <div class="cmp-dif">
      <div class="cmp-res"><span><b>${D.est.length}</b> mudança(s) de estrutura</span><span><b>${D.fin.length}</b> setor(es) com custo diferente</span><span>Diferença de custo (B − A): <b class="${dif > 0 ? 'fin-pos' : dif < 0 ? 'fin-neg' : ''}">${dif ? (dif > 0 ? '+' : '−') + fmtM(Math.abs(dif)) + '/mês · ' + (D.aB - D.aA > 0 ? '+' : '−') + fmtM0(Math.abs(D.aB - D.aA)) + '/ano' : 'nenhuma'}</b></span></div>
      <div class="cmp-col"><h4>Estrutura</h4>${D.est.length ? D.est.map(x => `<button class="cmp-it" onclick="cmpFocar(${arg(x.id)})" style="--c:${ROT[x.tipo][1]}"><i class="fa-solid ${ROT[x.tipo][2]}"></i><span><small>${ROT[x.tipo][0]}</small>${x.txt}</span></button>`).join('') : '<p class="s">Nenhuma diferença de estrutura.</p>'}</div>
      <div class="cmp-col"><h4>Custos por setor</h4>${D.fin.length ? D.fin.map(x => `<button class="cmp-it" onclick="cmpFocar(${arg(x.id)})" style="--c:${x.d > 0 ? '#dc2626' : '#16a34a'}"><i class="fa-solid ${x.d > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i><span><small>${x.d > 0 ? '+' : '−'}${fmtM(Math.abs(x.d))}/mês</small><b>${esc(x.nome)}</b><br><span style="color:var(--mut);font-size:11.5px">A: ${esc(x.a.itens.join(', ') || '—')} · B: ${esc(x.b.itens.join(', ') || '—')}</span></span></button>`).join('') : '<p class="s">Nenhuma diferença de custo.</p>'}</div>
    </div>`;
  // marcas de diferença em cada lado
  const marcaA = new Map(), marcaB = new Map();
  D.est.forEach(x => { const t = x.tipo === 'reativado' ? 'novo' : x.tipo === 'tipo' ? 'renomeado' : x.tipo; if (t === 'editado' && marcaB.has(x.id)) return; if (t === 'extinto') { marcaA.set(x.id, 'extinto'); marcaB.set(x.id, 'extinto'); } else marcaB.set(x.id, t); if (t === 'movido') marcaA.set(x.id, 'movido'); });
  D.fin.forEach(x => { if (!marcaB.has(x.id)) marcaB.set(x.id, 'cargo'); });
  [[cmp.a, marcaA, 0], [cmp.b, marcaB, 1]].forEach(([id, mk, i]) => montarPaneCmp(id, mk, i));
}
function montarPaneCmp(cid, marcas, i){
  const lista = listaCenario(cid).map(s => Object.assign({}, s, { _marcas: marcas.has(s.id) ? [marcas.get(s.id)] : [] }));
  const anc = ancestraisMarcados(lista); marcas.forEach((v, id) => anc.add(id));
  let html = '', L;
  comLista(lista, () => {
    calcularLayout();
    let ar = ''; visiveis.forEach(s => filhosVis(s.id).forEach(k => { if (pos.has(k.id)) ar += `<path d="${caminhoAresta(s, k)}"/>`; }));
    html = `<svg style="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible">${ar}</svg>` + visiveis.map(cardHTML).join('').replace(/ sel /g, ' ').replace(/ msel /g, ' ');
    L = limites(); cmp['pos' + i] = new Map(pos);
  }, false, anc);
  const vp = $('#cmp-vp' + i), mu = $('#cmp-m' + i); mu.innerHTML = html;
  const r = vp.getBoundingClientRect(), k = Math.max(.1, Math.min((r.width - 30) / (L.x1 - L.x0), (r.height - 30) / (L.y1 - L.y0), .9));
  cmp.v[i] = { k, x:(r.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:14 - L.y0 * k };
  aplicarCmp(i);
  let arr = null;
  vp.onpointerdown = e => { if (e.target.closest('.no')) { const id = e.target.closest('.no').dataset.id; cmpFocar(id); return; } arr = { x:e.clientX, y:e.clientY, v:Object.assign({}, cmp.v[i]) }; vp.setPointerCapture(e.pointerId); vp.classList.add('pan'); };
  vp.onpointermove = e => { if (!arr) return; const dx = e.clientX - arr.x, dy = e.clientY - arr.y; [i, ...(cmp.sinc ? [1 - i] : [])].forEach(j => { if (j === i) { cmp.v[j].x = arr.v.x + dx; cmp.v[j].y = arr.v.y + dy; } else { cmp.v[j].x += e.movementX; cmp.v[j].y += e.movementY; } aplicarCmp(j); }); };
  vp.onpointerup = vp.onpointercancel = () => { arr = null; vp.classList.remove('pan'); };
  vp.onwheel = e => { e.preventDefault(); const b = vp.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, f = Math.exp(-e.deltaY * .0015); [i, ...(cmp.sinc ? [1 - i] : [])].forEach(j => { const v = cmp.v[j]; if (!v) return; const kk = Math.max(.06, Math.min(2.5, v.k * f)), q = kk / v.k; cmp.v[j] = { k:kk, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; aplicarCmp(j); }); };
}
function aplicarCmp(i){ const m = $('#cmp-m' + i), v = cmp.v[i]; if (m && v) m.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`; }
function cmpFocar(id){
  [0, 1].forEach(i => { const p = cmp['pos' + i] && cmp['pos' + i].get(id), vp = $('#cmp-vp' + i); document.querySelectorAll(`#cmp-m${i} .no`).forEach(n => n.classList.toggle('sel', n.dataset.id === id)); if (!p || !vp) return; const r = vp.getBoundingClientRect(), k = Math.max(cmp.v[i].k, .6); cmp.v[i] = { k, x:r.width / 2 - (p.x + NW / 2) * k, y:r.height / 2 - (p.y + NH / 2) * k }; const m = $('#cmp-m' + i); m.style.transition = 'transform .4s'; aplicarCmp(i); setTimeout(() => { m.style.transition = ''; }, 420); });
}
function exportarComparativo(){
  const D = diffCenarios(cmp.a, cmp.b), q = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/<[^>]+>/g, '') + '"', n = v => numBR(v).toFixed(2).replace('.', ',');
  const l = ['A;' + q(nomeCenario(cmp.a)), 'B;' + q(nomeCenario(cmp.b)), 'Custo mensal A;' + n(D.tA), 'Custo mensal B;' + n(D.tB), 'Diferença mensal;' + n(D.tB - D.tA), 'Diferença anual;' + n(D.aB - D.aA), '', 'Mudança de estrutura;Detalhe', ...D.est.map(x => q(x.tipo) + ';' + q(x.txt)), '', 'Setor;Custo mensal A;Custo mensal B;Diferença;Itens A;Itens B', ...D.fin.map(x => [x.nome, n(x.a.m), n(x.b.m), n(x.d), x.a.itens.join(', '), x.b.itens.join(', ')].map(q).join(';'))];
  baixarArquivo('gaborg-comparativo-' + new Date().toISOString().slice(0, 10) + '.csv', '﻿' + l.join('\r\n'), 'text/csv;charset=utf-8');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#cmp') && !$('#cmp').classList.contains('hidden') && !document.querySelector('.modal')) { e.stopImmediatePropagation(); fecharComparativo(); } }, true);

/* ===================== MAPA: EXIBIÇÃO, ANIMAÇÕES E INTERATIVIDADE ===================== */
let mapaUI = Object.assign({ leg:true, mini:true, hover:true, anim:true, dicas:true }, store.get('gaborg_mapa_ui', {}));
const semMovimento = () => !mapaUI.anim || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function aplicarMapaUI(){
  document.body.classList.toggle('sem-leg', !mapaUI.leg);
  document.body.classList.toggle('sem-mini', !mapaUI.mini);
  const b = $('#m-btn-leg'); if (b) { b.classList.toggle('on', mapaUI.leg); b.title = mapaUI.leg ? 'Esconder a legenda (L)' : 'Mostrar a legenda (L)'; b.innerHTML = `<i class="fa-solid ${mapaUI.leg ? 'fa-list' : 'fa-eye-slash'}"></i>`; }
  const m = $('#m-btn-mini'); if (m) { m.classList.toggle('on', mapaUI.mini); m.title = mapaUI.mini ? 'Esconder o minimapa (M)' : 'Mostrar o minimapa (M)'; }
  store.set('gaborg_mapa_ui', mapaUI);
  if (mapaUI.mini && vistaAtual === 'mapa') setTimeout(desenharMini, 30);
}
function alternarMapaUI(k){ mapaUI[k] = !mapaUI[k]; aplicarMapaUI(); if (k === 'hover' && !mapaUI.hover) limparFoco(); }
function menuExibicao(ev){
  const ja = $('#m-exib'); if (ja) { ja.remove(); return; }
  const op = (k, ic, t, d) => `<label class="exib-op"><i class="fa-solid ${ic}"></i><span><b>${t}</b><small>${d}</small></span><input type="checkbox" ${mapaUI[k] ? 'checked' : ''} onchange="alternarMapaUI('${k}')"></label>`;
  const el = document.createElement('div'); el.id = 'm-exib'; el.className = 'm-exib';
  el.innerHTML = `<b class="t">Exibição do mapa</b>${op('leg', 'fa-list', 'Legenda', 'cores e dicas de uso (tecla L)')}${op('mini', 'fa-map', 'Minimapa', 'visão geral no canto (tecla M)')}${op('hover', 'fa-wand-magic-sparkles', 'Destacar ao passar o mouse', 'realça o ramo e esmaece o resto')}${op('dicas', 'fa-message', 'Fichas rápidas', 'resumo do setor ao parar o mouse')}${op('anim', 'fa-film', 'Animações', 'transições ao abrir e fechar ramos')}`;
  $('#v-mapa').appendChild(el);
  setTimeout(() => document.addEventListener('pointerdown', function f(e){ if (!e.target.closest('#m-exib,#m-btn-exib')) { el.remove(); document.removeEventListener('pointerdown', f, true); } }, true), 0);
}

/* Transição do layout: os setores deslizam até a nova posição; os que aparecem saem do superior e os que somem voltam para ele */
let animMapa = null;
function animarLayout(antes, elsAntigos){
  if (animMapa) { cancelAnimationFrame(animMapa.raf); animMapa = null; }
  if (semMovimento() || !antes || !antes.size || visiveis.length > 700) return;
  const alvo = new Map(pos), origem = new Map(), novos = new Set();
  const anc = id => { let a = porId.get((porId.get(id) || {}).paiId), g = 0; while (a && !antes.has(a.id) && g++ < 40) a = porId.get(a.paiId); return a && antes.get(a.id); };
  visiveis.forEach(n => { let o = antes.get(n.id); if (!o) { o = anc(n.id) || alvo.get(n.id); novos.add(n.id); } origem.set(n.id, o); });
  let mudou = false; origem.forEach((o, id) => { const f = alvo.get(id); if (Math.abs(o.x - f.x) > .5 || Math.abs(o.y - f.y) > .5) mudou = true; });
  // setores que saíram: cópias que encolhem até o superior visível
  const saindo = [];
  elsAntigos.forEach((el, id) => {
    if (alvo.has(id)) return;
    let a = porId.get((porId.get(id) || {}).paiId), g = 0; while (a && !alvo.has(a.id) && g++ < 40) a = porId.get(a.paiId);
    const de = antes.get(id), para = a ? alvo.get(a.id) : de; if (!de) return;
    el.classList.add('saindo'); el.classList.remove('sel', 'msel'); $('#nos').appendChild(el); saindo.push({ el, de, para }); mudou = true;
  });
  if (!mudou) { saindo.forEach(s => s.el.remove()); return; }
  const dur = 460, t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
  const passo = agora_ => {
    const t = Math.min(1, (agora_ - t0) / dur), e = ease(t);
    origem.forEach((o, id) => { const f = alvo.get(id), x = o.x + (f.x - o.x) * e, y = o.y + (f.y - o.y) * e; pos.set(id, { x, y }); const el = elNo.get(id); if (el) { el.style.transform = `translate(${x}px,${y}px)`; if (novos.has(id)) el.style.opacity = String(Math.min(1, e * 1.4)); } });
    saindo.forEach(s => { const x = s.de.x + (s.para.x - s.de.x) * e, y = s.de.y + (s.para.y - s.de.y) * e; s.el.style.transform = `translate(${x}px,${y}px) scale(${1 - .5 * e})`; s.el.style.opacity = String(1 - e); });
    desenharArestas();
    if (t < 1) animMapa.raf = requestAnimationFrame(passo);
    else { animMapa = null; alvo.forEach((v, k) => pos.set(k, v)); novos.forEach(id => { const el = elNo.get(id); if (el) el.style.opacity = ''; }); saindo.forEach(s => s.el.remove()); desenharArestas(); desenharMini(); }
  };
  animMapa = { raf:requestAnimationFrame(passo), alvo };
}
function terminarAnimMapa(){ if (!animMapa) return; cancelAnimationFrame(animMapa.raf); animMapa.alvo.forEach((v, k) => pos.set(k, v)); animMapa = null; document.querySelectorAll('#nos .no.saindo').forEach(e => e.remove()); visiveis.forEach(n => { const el = elNo.get(n.id), p = pos.get(n.id); if (el && p) { el.style.transform = `translate(${p.x}px,${p.y}px)`; el.style.opacity = ''; } }); desenharArestas(); }

/* Pulso de destaque num setor */
function pulsar(id){ const el = elNo.get(id); if (!el || semMovimento()) return; el.classList.remove('pulso'); void el.offsetWidth; el.classList.add('pulso'); setTimeout(() => el.classList.remove('pulso'), 1500); }

/* Destaque do ramo ao passar o mouse */
let tFoco = null, focoId = '', tDica = null;
function relacionados(id){ const r = new Set([id]); caminho(id).forEach(a => r.add(a.id)); descendentes(id).forEach(d => r.add(d)); return r; }
function aplicarFoco(id){
  if (!mapaUI.hover || drag || animMapa) return;
  focoId = id; const r = emCenario(() => relacionados(id));
  vpEl.classList.add('focando');
  elNo.forEach((el, k) => el.classList.toggle('rel', r.has(k)));
  document.querySelectorAll('#arestas path[data-f]').forEach(p => p.classList.toggle('rel', r.has(p.dataset.f) && r.has(p.dataset.p)));
}
function limparFoco(){ clearTimeout(tFoco); focoId = ''; vpEl.classList.remove('focando'); document.querySelectorAll('#nos .no.rel,#arestas path.rel').forEach(e => e.classList.remove('rel')); }
/* Ficha rápida */
function mostrarDica(id, el){
  if (!mapaUI.dicas || drag) return;
  const dados = emCenario(() => { const s = porId.get(id); if (!s) return null; return { s, sub:descendentes(id).size, cam:caminho(id).map(nomeCurto).slice(-2).join(' › ') }; }); if (!dados) return;
  const { s, sub, cam } = dados, f = cenMapa ? null : custoSetorFin(id, false), ft = cenMapa ? null : custoSetorFin(id, true), sv = statusVal(id), imp = num(s.impacto), qt = num(s.quantidade);
  const d = $('#m-dica');
  d.innerHTML = `<div class="dc-t" style="--c:${corTipo(s.tipo)}"><i class="fa-solid ${icTipo(s.tipo)}"></i>${esc(s.tipo)}${s.sigla ? ' · ' + esc(s.sigla) : ''}</div><b>${esc(s.nome)}</b>${cam ? `<small>${esc(cam)}</small>` : ''}
    <div class="dc-g">
      ${qt ? `<span><b>${fmtN(qt)}</b>${rotuloUnid(s)}</span>` : ''}
      <span><b>${sub}</b>subordinado(s)</span>
      ${num(s.servidores) ? `<span><b>${fmtN(s.servidores)}</b>servidores</span>` : ''}
      ${f && f.Atual.m ? `<span><b>${fmtRc(f.Atual.m)}</b>por mês${sub && ft.Atual.m !== f.Atual.m ? ` · ${fmtRc(ft.Atual.m)} c/ ramo` : ''}</span>` : ''}
    </div>
    <div class="dc-r"><i class="fa-solid fa-user"></i>${esc(s.responsavel || 'Sem responsável')}</div>
    ${imp || sv !== 'Sem validação' ? `<div class="dc-r">${imp ? `<span class="p" style="background:${IMPACTO[imp][1]}"></span>Impacto ${IMPACTO[imp][0].toLowerCase()}` : ''}${sv !== 'Sem validação' ? ` <span class="p" style="background:${STATUS_VAL[sv]}"></span>${esc(sv)}` : ''}</div>` : ''}
    <div class="dc-h">clique: detalhes · duplo clique: abrir/fechar · botão direito: mais ações</div>`;
  const r = el.getBoundingClientRect(), vr = vpEl.getBoundingClientRect(), w = 270;
  let x = r.right - vr.left + 10, y = r.top - vr.top;
  if (x + w > vr.width - 8) x = r.left - vr.left - w - 10;
  if (x < 8) { x = Math.max(8, r.left - vr.left); y = r.bottom - vr.top + 10; }
  d.style.left = x + 'px'; d.style.top = Math.max(8, Math.min(y, vr.height - 190)) + 'px';
  d.classList.add('on');
}
function esconderDica(){ clearTimeout(tDica); const d = $('#m-dica'); if (d) d.classList.remove('on'); }
$('#nos').addEventListener('mouseover', e => {
  const no = e.target.closest('.no'); if (!no || no.classList.contains('saindo') || drag) return;
  const id = no.dataset.id; if (id === focoId) return;
  clearTimeout(tFoco); clearTimeout(tDica); esconderDica();
  tFoco = setTimeout(() => aplicarFoco(id), 160);
  tDica = setTimeout(() => mostrarDica(id, no), 650);
});
$('#nos').addEventListener('mouseout', e => {
  const no = e.target.closest('.no'); if (!no) return;
  if (e.relatedTarget && no.contains(e.relatedTarget)) return;
  clearTimeout(tFoco); clearTimeout(tDica); esconderDica();
  tFoco = setTimeout(limparFoco, 120);
});
vpEl.addEventListener('pointerdown', e => { esconderDica(); if (e.button !== 2) limparFoco(); terminarAnimMapa(); if (!e.target.closest('#m-ctx')) fecharMenuNo(); }, true);
vpEl.addEventListener('wheel', () => esconderDica(), { passive:true });

/* Menu de ações do setor (botão direito ou toque longo) */
function fecharMenuNo(){ const m = $('#m-ctx'); if (m) m.remove(); }
function menuNo(id, x, y){
  fecharMenuNo(); esconderDica();
  const info = emCenario(() => { const s = porId.get(id); return s ? { s, temF:temFilhos(id), ab:abertos.has(id) } : null; }); if (!info) return;
  const { s, temF, ab } = info, ed = !somenteLeitura(), real = !cenSwap && !!DB.setores.find(x => x.id === id);
  const it = (a, ic, t, cond = true) => cond ? `<button data-a="${a}"><i class="fa-solid ${ic}"></i>${t}</button>` : '';
  const m = document.createElement('div'); m.id = 'm-ctx'; m.className = 'm-ctx';
  m.innerHTML = `<div class="ct">${esc(s.sigla || nomeCurto(s))}<small>${esc(s.tipo)}</small></div>
    ${it('det', 'fa-circle-info', 'Ver detalhes')}
    ${it('focar', 'fa-crosshairs', 'Focar neste ramo')}
    ${it('abrir', 'fa-angles-down', 'Abrir o ramo inteiro', temF)}
    ${it('fechar', 'fa-angles-up', 'Recolher o ramo', temF && ab)}
    ${it('caminho', 'fa-route', 'Mostrar o caminho até o topo')}
    ${it('irmaos', 'fa-people-group', 'Selecionar os irmãos', ed)}
    ${it('mt', 'fa-map-location-dot', 'Ver escolas no mapa de MT', /^(DRE |DME$)/i.test(s.sigla || '') || s.tipo === 'Unidades Escolares')}
    ${ed ? '<hr>' : ''}${it('novo', 'fa-plus', 'Novo subordinado', ed)}${it('fin', 'fa-sack-dollar', 'Lançamento financeiro', ed && real)}${it('auto', 'fa-wand-magic-sparkles', 'Voltar à posição automática', ed && (s.dx || s.dy))}`;
  $('#v-mapa').appendChild(m);
  const vr = vpEl.getBoundingClientRect(), w = 230, h = m.offsetHeight;
  m.style.left = Math.min(x - vr.left, vr.width - w - 8) + 'px'; m.style.top = Math.min(y - vr.top, vr.height - h - 8) + 'px';
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return; fecharMenuNo();
    const a = b.dataset.a;
    if (a === 'det') selecionar(id);
    if (a === 'focar') focarRamo(id);
    if (a === 'abrir') { emCenario(() => [id, ...descendentes(id)].forEach(i => { if (temFilhos(i)) abertos.add(i); })); salvarAbertos(); desenharMapa(); setTimeout(() => focarRamo(id), semMovimento() ? 30 : 500); }
    if (a === 'fechar') alternarAberto(id, false);
    if (a === 'caminho') mostrarCaminho(id);
    if (a === 'irmaos') { multi.add(id); selecionarIrmaos(); }
    if (a === 'novo') novoSetorEm(id);
    if (a === 'mt') { trocarVista('escolas'); const lst = escolasLista(), dres = dresDe(lst), alvo = /^DME$/i.test(s.sigla) ? 'dre metropolitana' : norm(s.sigla || ''); const i = dres.findIndex(d => norm(d) === alvo); setTimeout(() => focarDREmt(i), 400); }
    if (a === 'fin') formDespesa('', id);
    if (a === 'auto') { const r = porId.get(id); guardarPos([r]); r.dx = ''; r.dy = ''; enfileirar('setores', r); desenharMapa(); }
  });
  setTimeout(() => document.addEventListener('pointerdown', function f(e){ if (!e.target.closest('#m-ctx')) { fecharMenuNo(); document.removeEventListener('pointerdown', f, true); } }, true), 0);
}
vpEl.addEventListener('contextmenu', e => { const alvo = document.elementFromPoint(e.clientX, e.clientY), no = (alvo && alvo.closest('.no')) || e.target.closest('.no'); if (!no) return; e.preventDefault(); menuNo(no.dataset.id, e.clientX, e.clientY); });
// toque longo no celular
let tLongo = null;
vpEl.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; const no = e.target.closest('.no'); if (!no) return; const x = e.clientX, y = e.clientY; clearTimeout(tLongo); tLongo = setTimeout(() => { if (drag && drag.moveu) return; drag = null; menuNo(no.dataset.id, x, y); if (navigator.vibrate) navigator.vibrate(15); }, 550); });
['pointerup', 'pointercancel', 'pointermove'].forEach(t => vpEl.addEventListener(t, e => { if (t !== 'pointermove' || (drag && drag.moveu)) clearTimeout(tLongo); }));

/* Focar um ramo: aproxima até caber o setor e seus subordinados visíveis */
function focarRamo(id){
  const ids = emCenario(() => [id, ...descendentes(id)]).filter(i => pos.has(i)); if (!ids.length) return;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  ids.forEach(i => { const p = pos.get(i); x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + NW); y1 = Math.max(y1, p.y + NH); });
  const vp = vpEl.getBoundingClientRect(), pn = $('#painel').classList.contains('aberto') && window.innerWidth > 820 ? 460 : 0, topo = 120;
  const k = Math.max(.15, Math.min(1.25, (vp.width - pn - 80) / (x1 - x0), (vp.height - topo - 60) / (y1 - y0)));
  view = { k, x:(vp.width - pn - (x1 - x0) * k) / 2 - x0 * k, y:topo + (vp.height - topo - 40 - (y1 - y0) * k) / 2 - y0 * k };
  aplicarView(!semMovimento()); setTimeout(() => pulsar(id), semMovimento() ? 0 : 420);
}
/* Caminho até o topo: destaca e anima as ligações */
function mostrarCaminho(id){
  const ids = emCenario(() => [id, ...caminho(id).map(a => a.id)]);
  vpEl.classList.add('focando'); elNo.forEach((el, k) => el.classList.toggle('rel', ids.includes(k)));
  document.querySelectorAll('#arestas path[data-f]').forEach(p => p.classList.toggle('rel', ids.includes(p.dataset.f) && ids.includes(p.dataset.p)));
  document.querySelectorAll('#arestas path.rel').forEach(p => p.classList.add('fluxo'));
  ids.slice().reverse().forEach((i, n) => setTimeout(() => pulsar(i), n * 180));
  setTimeout(() => { document.querySelectorAll('#arestas path.fluxo').forEach(p => p.classList.remove('fluxo')); limparFoco(); }, 3200 + ids.length * 180);
}
/* Duplo clique no fundo: aproxima naquele ponto */
vpEl.addEventListener('dblclick', e => { if (e.target.closest('.no')) return; const r = vpEl.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top, k = Math.min(2.5, view.k * 1.6), q = k / view.k; view = { k, x:cx - (cx - view.x) * q, y:cy - (cy - view.y) * q }; aplicarView(!semMovimento()); });
document.addEventListener('keydown', e => {
  if (vistaAtual !== 'mapa' || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden') || e.target.closest('input,textarea,select,[contenteditable]')) return;
  if (e.key === 'l' || e.key === 'L') { alternarMapaUI('leg'); toast(mapaUI.leg ? 'Legenda visível.' : 'Legenda escondida (L para mostrar).'); }
  if (e.key === 'm' || e.key === 'M') alternarMapaUI('mini');
  if ((e.key === 'f' || e.key === 'F') && selId) focarRamo(selId);
});
aplicarMapaUI();

/* Base de escolas estaduais (SEDUC-MT) – planilha "Base de Dados - Completo", aba "1. BASE DE INFORMAÇÕES", ano letivo 2026.
 * Campos: código, unidade, índice da DRE, município, tipo de lotação, localidade (U/R), endereço, número, CEP, bairro, telefone, e-mail, latitude, longitude */
const ESCOLAS_ANO = "2026";
const ESCOLAS_DRES = ["DRE ALTA FLORESTA", "DRE BARRA DO GARÇAS", "DRE CONFRESA", "DRE CÁCERES", "DRE DIAMANTINO", "DRE JUÍNA", "DRE MATUPÁ", "DRE METROPOLITANA", "DRE PONTES E LACERDA", "DRE PRIMAVERA DO LESTE", "DRE RONDONÓPOLIS", "DRE SINOP", "DRE TANGARÁ DA SERRA"];
const ESCOLAS_BASE = [["21717","EE 19 DE MAIO",0,"ALTA FLORESTA","ESCOLA","U","Rua São Judas Tadeu","349","78.580-000","Boa Nova I","66 35212094","escola.21717@edu.mt.gov.br",-9.8765,-56.0663],["145718","EE BOA ESPERANÇA",0,"ALTA FLORESTA","ESCOLA CAMPO","R","Comunidade Ourolanda- Rod.MT 325-Km 75.","0","78.580-000","Zona Rural","66 9632-227","escola.145718@edu.mt.gov.br",-10.3692,-56.4326],["15547","EE DOM BOSCO",0,"ALTA FLORESTA","ESCOLA INTEGRAL","U","RUA JOÃO DE BARRO","111","78.580-000","JARDIM DAS ARARAS","66 35212399","escola.15547@edu.mt.gov.br",-9.8958,-56.0746],["148091","EE JARDIM UNIVERSITÁRIO",0,"ALTA FLORESTA","ESCOLA","U","Av. Unemat","555","78.580-000","Residencial Universitário","66 992402112","escola.148091@edu.mt.gov.br",-9.9039,-56.0984],["40118","EE JAYME VERÍSSIMO DE CAMPOS JÚNIOR",0,"ALTA FLORESTA","ESCOLA INTEGRAL","U","RUA RIO JORDÃO","1","78.580-000","CIDADE ALTA","66 99264499","escola.40118@edu.mt.gov.br",-9.8473,-56.0737],["15610","EE LUDOVICO DA RIVA NETO",0,"ALTA FLORESTA","ESCOLA INTEGRAL","U","RUA ORLÂNDIA, CX POSTAL 116","119","78.580-000","VILA NOVA","66 996824385","escola.15610@edu.mt.gov.br",-9.8345,-56.0822],["197300","EE MILITAR DOM PEDRO II TENENTE CORONEL EVANDRO DIAS DE SOUZA",0,"ALTA FLORESTA","ESCOLA MILITAR","U","Avenida Uniflor","188","78.580-000","CENTRO","66 992206532","escola.197300@edu.mt.gov.br",-9.8675,-56.0851],["15504","EE MUNDO NOVO",0,"ALTA FLORESTA","ESCOLA CAMPO","R","3ª VICINAL LESTE COMUNIDADE MUNDO NOVO","1","78.580-000","Zona Rural","66 984330626","escola.15504@edu.mt.gov.br",-9.8514,-55.9387],["45047","EE OURO VERDE",0,"ALTA FLORESTA","ESCOLA CAMPO","R","Rodovia mt 325 km 25 comunidade ouro verde","0","78.580-000","Zona Rural","66 99903218","escola.45047@edu.mt.gov.br",-10.0705,-56.1751],["15474","EE PROFESSORA MARINES FÁTIMA DE SÁ TEIXEIRA",0,"ALTA FLORESTA","ESCOLA","U","AVENIDA LUDOVICO DA RIVA NETO","1702","78.580-000","CENTRO","66 35213677","escola.15474@edu.mt.gov.br",-9.8854,-56.0866],["15482","EE RUI BARBOSA",0,"ALTA FLORESTA","ESCOLA","U","AVENIDA MINAS GERAIS","46","78.580-000","CIDADE ALTA","66 35211497","escola.15482@edu.mt.gov.br",-9.8539,-56.0718],["15601","EECM CECÍLIA MEIRELES",0,"ALTA FLORESTA","ESCOLA CÍVICO-MILITAR","U","AV. AMAZONAS","141","78.580-000","Cidade Bela","66 9212-6330","escola.15601@edu.mt.gov.br",-9.8496,-56.0794],["124044","EE PORTAL DA AMAZÔNIA",0,"APIACÁS","ESCOLA INTEGRAL","U","AVENIDA DOS YPÊS","01","78.595-000","PRIMAVERA","66 98416033","escola.124044@edu.mt.gov.br",-9.5724,-57.3975],["15652","EE VINÍCIUS DE MORAES",0,"APIACÁS","ESCOLA","U","AV. MONTEIRO LOBATO","1","78.595-000","Pioneiro","66 35931191","escola.15652@edu.mt.gov.br",-9.5557,-57.3856],["140988","EEI ITAWYAK",0,"APIACÁS","ESCOLA INDÍGENA","R","Aldeia kururuzinho","00","78.595-000","Terra Indígena Kayabi","66 35931202","escola.140988@edu.mt.gov.br",-8.8839,-57.3267],["46434","EE FREI CANECA",0,"CARLINDA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Estrada D2, esquina com Estara D Comunidade Nazaré","348","78.587-000","Zona Rural","66 992708376","escola.46434@edu.mt.gov.br",-9.9101,-55.7412],["46442","EECM TANCREDO DE ALMEIDA NEVES",0,"CARLINDA","ESCOLA CÍVICO-MILITAR","U","AV TANCREDO DE ALMEIDA NEVES","115","78.587-000","CENTRO","66 99260319","escola.46442@edu.mt.gov.br",-9.967,-55.825],["145726","EE CEREJEIRAS",0,"NOVA BANDEIRANTES","ESCOLA CAMPO","R","RUA JOAO DE DEUS RIBEIRO","0","78.565-000","JAPURANA","66 981371266","escola.145726@edu.mt.gov.br",-9.9691,-58.015],["127728","EE PROFESSOR VALDOMIRO TEODORO CANDIDO",0,"NOVA BANDEIRANTES","ESCOLA","U","AVENIDA COMENDADOR LUIZ MENEGHEL","438","78.565-000","CENTRO","66 35721133","escola.127728@edu.mt.gov.br",-9.8505,-57.8163],["124087","EE IVONE BORKWSKI DE LIMA",0,"NOVA CANAÃ DO NORTE","ESCOLA CAMPO","R","Avenida Jardim","81","78.515-000","Distrito Colorado do Norte","66 99607187","escola.124087@edu.mt.gov.br",-10.446,-56.0983],["13544","EE NOVA UNIÃO",0,"NOVA CANAÃ DO NORTE","ESCOLA CAMPO","R","Rua Newton Vieira Barbosa","0","78.515-000","Distrito Ouro Branco","66 996642316","escola.13544@edu.mt.gov.br",-10.5569,-55.9453],["13536","EECM NOVA CANAÃ",0,"NOVA CANAÃ DO NORTE","ESCOLA CÍVICO-MILITAR","U","Avenida Parana","115","78.515-000","CENTRO","66 35511238","escola.13536@edu.mt.gov.br",-10.639,-55.7094],["173282","EE PROFESSORA NEIDE ENARA SIMA",0,"NOVA MONTE VERDE","ESCOLA","U","RUA REINOLDO KAUFMANN","29","78.593-000","SAO LUCAS","66 98138071","escola.173282@edu.mt.gov.br",-9.9861,-57.4688],["15636","EE JOÃO PAULO I",0,"PARANAÍTA","ESCOLA INTEGRAL/ESPORTE","U","Avenida Ayrton Senna da Silva","s/n","78.590-000","CENTRO","66 35631015","escola.15636@edu.mt.gov.br",-9.6653,-56.4765],["154059","EE SÃO PEDRO",0,"PARANAÍTA","ESCOLA CAMPO","R","Assentamento São Pedro-Estrada Capixaba","306","78.590-000","Comunidade Sombra da Manha","66 999826019","escola.154059@edu.mt.gov.br",-9.7695,-56.6897],["15644","EECM DOUTOR MÁRIO CORRÊA DA COSTA",0,"PARANAÍTA","ESCOLA CÍVICO-MILITAR","U","Via 02","2264","78.590-000","CENTRO","66 35631490","escola.15644@edu.mt.gov.br",-9.6645,-56.4724],["15105","EE 09 DE JULHO",1,"ÁGUA BOA","ESCOLA","U","Rua 11","750","78.635-000","Guaruja","66 34681002","escola.15105@edu.mt.gov.br",-14.0533,-52.1641],["15091","EE ANTÔNIO GROHS",1,"ÁGUA BOA","ESCOLA INTEGRAL/MISTA","U","RUA 07","456","78.635-000","CENTRO","66 34681202","escola.15091@edu.mt.gov.br",-14.0566,-52.1598],["176770","EE JARAGUÁ",1,"ÁGUA BOA","ESCOLA CAMPO/INTEGRAL/AGRÍCOLA","R","RUA PRINCIPAL","01","78.635-000","Assentamento Jaraguá","66 981378848","escola.176770@edu.mt.gov.br",-14.0048,-52.5128],["214590","EE MILITAR TIRADENTES 3º SARGENTO PM JUSTINO PINHEIRO DOS SANTOS",1,"ÁGUA BOA","ESCOLA MILITAR","U","Avenida Planalto","3715","78.635-000","Universitário","66 981326793","escola.214590@edu.mt.gov.br",-14.0704,-52.1632],["11533","EE CORONEL JERÔNIMO GOMES SILVA",1,"ARAGUAIANA","ESCOLA","U","Travessa da Saúde","31","78.685-000","CENTRO","66 34991278","escola.11533@edu.mt.gov.br",-15.7301,-51.8347],["11410","EE FRANCISCO DOURADO",1,"BARRA DO GARÇAS","ESCOLA","U","AV. ARAGUAIA    QUADRA 19","s/n","78.601-470","JARDIM AMAZÔNIA","66 992153365","escola.11410@edu.mt.gov.br",-15.8783,-52.2413],["11282","EE HERONIDES ARAÚJO",1,"BARRA DO GARÇAS","ESCOLA CAMPO","R","BR 158 KM 698","00","78608500","DISTRITO DE INDIANÓPOLIS","66 992564202","escola.11282@edu.mt.gov.br",-15.0344,-52.238],["11339","EE IRMÃ DIVA PIMENTEL",1,"BARRA DO GARÇAS","ESCOLA INTEGRAL/MISTA","U","RUA DOM AQUINO","791","78.600-001","SANTO ANTÔNIO","66 34011741","escola.11339@edu.mt.gov.br",-15.8806,-52.2614],["11290","EE JOSÉ ÂNGELO DOS SANTOS",1,"BARRA DO GARÇAS","ESCOLA","U","RUA VITÓRIO PEREIRA DA SILVA","979","78.600-294","SÃO JOÃO","66 34016624","escola.11290@edu.mt.gov.br",-15.8899,-52.2736],["11355","EE MARECHAL EURICO GASPAR DUTRA",1,"BARRA DO GARÇAS","ESCOLA INTEGRAL/LÍNGUAS","U","RUA MATO GROSSO","1523","78.600-023","CENTRO","66 34016737","escola.11355@edu.mt.gov.br",-15.887,-52.2679],["11363","EE MILITAR DOM PEDRO II DEPUTADO NORBERTO SCHWANTES",1,"BARRA DO GARÇAS","ESCOLA MILITAR","U","Rua Eudócia Oliveira Silva","117","78603006","Conjunto Habitacional Piracema","66 34012274","escola.11363@edu.mt.gov.br",-15.8826,-52.2861],["213462","EE MILITAR TIRADENTES CABO PM VANILSON SILVA CARVALHO",1,"BARRA DO GARÇAS","ESCOLA MILITAR","U","RUA PRESIDENTE VARGAS","1268","78601246","SETOR CIDADE VELHA","66 992222605","escola.213462@edu.mt.gov.br",-15.8905,-52.25872],["60194","EECM PROFESSORA MARIA DE LOURDES HORA MORAES",1,"BARRA DO GARÇAS","ESCOLA CÍVICO-MILITAR","U","RUA PE. ZEFERINO AGOSTINI S/N","0","78.600-001","VILA MARIA","66 34055012","escola.60194@edu.mt.gov.br",-15.891,-52.335],["11371","EECM SENADOR FILINTO MÜLLER",1,"BARRA DO GARÇAS","ESCOLA CÍVICO-MILITAR","U","Rua Amaro Leite","619","78.600-027","CENTRO","66 992248433","escola.11371@edu.mt.gov.br",-15.8927,-52.2618],["76929","EEI DEPUTADO MÁRIO JURUNA",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ÁREA RURAL","1","78.607-899","ÁREA RURAL DE BARRA DO GARÇAS","66 34011468","escola.76929@edu.mt.gov.br",-15.4214,-52.9336],["11452","EEI DOM FELIPPÓ RINALDI",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","TERRA INDÍGENA SÃO MARCOS","SN","78.600-001","Zona Rural","66 34161021","escola.11452@edu.mt.gov.br",-15.3758,-52.9026],["124010","EEI HAMBÉ",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ALDEIA NOVA ESPERANÇA","10","78607899","ÁREA RURAL DE BARRA DO GARÇAS","66 34017620","escola.124010@edu.mt.gov.br",-15.4715,-52.8591],["158844","EEI JUCELINO TSEREMA-Á",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ÁREA RURAL","s/n","78.607-899","ÁREA RURAL DE BARRA DO GARÇAS","66 34011468","escola.158844@edu.mt.gov.br",-15.3558,-52.8477],["107263","EEI ULISSES GUIMARÃES",1,"BARRA DO GARÇAS","ESCOLA INDÍGENA","R","ÁREA RURAL","1","78.607-899","ÁREA RURAL DE BARRA DO GARÇAS","66 34482000","escola.107263@edu.mt.gov.br",-15.4515,-52.8586],["15172","EE COUTO MAGALHÃES",1,"CAMPINÁPOLIS","ESCOLA","U","RUA LAUDELINO DOMINGOS DE ARAÚJO","1700","78.630-000","SETOR ANTONIO PEDRO","66 992575852","escola.15172@edu.mt.gov.br",-14.5426,-52.7916],["123021","EEI ALDEIONA",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA ALDEIONA","1","78.630-000","RESERVA INDÍGENA","66 34371030","escola.123021@edu.mt.gov.br",-14.4142,-53.3873],["131822","EEI BUTSE WAWE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA SÃO FELIPE","1","78.630-000","RESERVA INDÍGENA","66 34371030","escola.131822@edu.mt.gov.br",-14.4272,-52.8944],["192643","EEI CONSTANTINO TSEREROWÊ",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA DZEPA","0","78.630-000","TERRA INIDIGENA PARABUBURE","66 34371030","escola.192643@edu.mt.gov.br",-14.4326,-53.1291],["166294","EEI DAVID AI'RERO",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","Aldeia Etepó're","00","78.630-000","Terra indígena Parabubure","66 34371030","escola.166294@edu.mt.gov.br",-14.3759,-53.1708],["118532","EEI ESTRELA",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA ESTRELAz","2","78.630-000","Zona Rural","66 34371030","escola.118532@edu.mt.gov.br",-14.3372,-53.2108],["148121","EEI LUIZ RUDZANE'EDI OREBEWE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA RO OREDZA OZE","6","78.630-000","Zona Rural","66 34371030","escola.148121@edu.mt.gov.br",-14.4914,-53.0263],["156361","EEI RAÍ'RÃTE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA SAO PEDRO","2","78.630-000","RESERVA INDIGENA","66 34371030","escola.156361@edu.mt.gov.br",-14.266,-53.0306],["119229","EEI WA'OMORÃ",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA BOM JESUS DA LAPA","1","78.630-000","RESERVA INDÍGENA","66 33437115","escola.119229@edu.mt.gov.br",-14.2578,-52.9892],["115231","EEI XAVANTE",1,"CAMPINÁPOLIS","ESCOLA INDÍGENA","R","ALDEIA NOVO PARAÍSO","1","78.630-000","Zona Rural","66 34371159","escola.115231@edu.mt.gov.br",-14.4305,-53.4467],["15130","EE 31 DE MARÇO",1,"CANARANA","ESCOLA","U","Avenida Paraná","328","78.640-000","CENTRO","66 984380501","escola.15130@edu.mt.gov.br",-13.5536,-52.2705],["154156","EE MILITAR TIRADENTES CABO PM SEBASTIÃO FERREIRA MIRANDA",1,"CANARANA","ESCOLA MILITAR","U","RUA SANTA ROSA","604","78.640-000","NOVA CANARANA","66 34783592","escola.154156@edu.mt.gov.br",-13.559,-52.263],["131857","EEI ETENHIRITIPÁ",1,"CANARANA","ESCOLA INDÍGENA","R","TERRA INDÍGENA PIMENTEL BARBOSA","0","78.640-000","ALDEIA WEDERÃ","66 34781100","escola.131857@edu.mt.gov.br",-13.2882,-51.5797],["156345","EEI SAMUEL SAHUTUWÊ",1,"CANARANA","ESCOLA INDÍGENA","R","TERRA INDÍGENA PIMENTEL BARBOSA","0","78.640-000","ALDEIA ETENHIRITIPÁ","66 34781100","escola.156345@edu.mt.gov.br",-13.317,-51.6826],["11550","EE GETÚLIO VARGAS",1,"COCALINHO","ESCOLA","U","RUA ARCEU BEZERRA VILARINS","223","78.680-000","CENTRO","66 992260928","escola.11550@edu.mt.gov.br",-14.3949,-51.0002],["69299","EEI IKPENG",1,"FELIZ NATAL","ESCOLA INDÍGENA","R","TERRA INDÍGENA DO XINGÚ","0","78.885-000","CTL PAVURU","66 34781100","escola.69299@edu.mt.gov.br",-11.7436,-53.6115],["192112","EEI CENTRAL AIHA",1,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","Terra Indígena do Xingu","s/n","78.875-000","Aldeia Kalapalo","66 984103902","escola.192112@edu.mt.gov.br",-12.1638,-53.2568],["156353","EEI MAVUTSININ",1,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","TERRA INDÍGENA DO XINGÚ","0","78.875-000","ALDEIA YPAVU","66 34781100","escola.156353@edu.mt.gov.br",-12.1534,-53.433],["11487","EE ANTÔNIO NONATO ROCHA",1,"GENERAL CARNEIRO","ESCOLA CAMPO","R","19ª TRAVESSA PRINCIPAL, S/N","155","78620-970","PAREDÃO","66 34491020","escola.11487@edu.mt.gov.br",-15.5715,-53.4116],["11509","EE DOUTOR JOÃO PONCE DE ARRUDA",1,"GENERAL CARNEIRO","ESCOLA","U","AVENIDA RACHID J. MAMED","s/n","78.620-970","CENTRO","66 34161061","escola.11509@edu.mt.gov.br",-15.7083,-52.7558],["11479","EEI SAGRADO CORAÇÃO DE JESUS",1,"GENERAL CARNEIRO","ESCOLA INDÍGENA/INTEGRAL/MISTA","R","ALDEIA MERURI - RODOVIA BR 070 KM 112","0","78.620-000","ZONA RURAL - TI MERURI","66 34161172","escola.11479@edu.mt.gov.br",-15.5503,-53.0784],["69329","EE TANCREDO NEVES",1,"NOVA NAZARÉ","ESCOLA","U","RUA FABIANE ALVES DA SILVA LIMA QD 26 LT 02","s/n","78.638-000","SETOR SUL","66 34671102","escola.69329@edu.mt.gov.br",-13.9887,-51.8021],["15067","EE JUSCELINO KUBITSCHEK DE OLIVEIRA",1,"NOVA XAVANTINA","ESCOLA","U","AV. BRASILIA","287","78.690-000","TONETTO","66 34381976","escola.15067@edu.mt.gov.br",-14.6641,-52.3503],["15059","EE MILITAR TIRADENTES CABO PM DANNER MAIA BARBOSA",1,"NOVA XAVANTINA","ESCOLA MILITAR","U","AV. RIO GRANDE DO SUL","1039","78.690-000","CENTRO","66 992281871","escola.15059@edu.mt.gov.br",-14.6599,-52.3546],["15032","EE MINISTRO JOÃO ALBERTO",1,"NOVA XAVANTINA","ESCOLA","U","Av. Expedição Roncador Xingu","275","78.690-000","CENTRO","66 34381293","escola.15032@edu.mt.gov.br",-14.6747,-52.353],["15075","EECM ARLINDO ESTILAC LEAL",1,"NOVA XAVANTINA","ESCOLA CÍVICO-MILITAR","U","Av. COUTO MAGALHÃES","2563","78.690-000","ESTILAC LEAL","66 34382960","escola.15075@edu.mt.gov.br",-14.6464,-52.3549],["11576","EE DINIZ ALVES DE TOLEDO",1,"NOVO SÃO JOAQUIM","ESCOLA","U","Rua Divina Madalena","332","78.625-000","CENTRO","66 34791128","escola.11576@edu.mt.gov.br",-14.9104,-53.0213],["11568","EE JOSÉ DE ALENCAR",1,"NOVO SÃO JOAQUIM","ESCOLA CAMPO","R","RUA PRINCIPAL","s/nº","78.625-000","CENTRO / DISTRITO CACHOEIRA DA FUMAÇA","66 981266555","escola.11568@edu.mt.gov.br",-15.0908,-52.8053],["49549","EECM SÃO MIGUEL",1,"PONTAL DO ARAGUAIA","ESCOLA CÍVICO-MILITAR","U","Rua.: Custódio de Souza Pinto","86","78.698-000","Universitário","66 992426283","escola.49549@edu.mt.gov.br",-15.9084,-52.2613],["13013","EE SÃO DOMINGOS SÁVIO",1,"PONTE BRANCA","ESCOLA","U","Av.Cel.Belmiro Nogueira da Silva","1","78.610-000","CENTRO","66 34661312","escola.13013@edu.mt.gov.br",-16.7644,-52.8376],["192228","EE 20 DE MARÇO",1,"QUERÊNCIA","ESCOLA CAMPO","R","ESTRADA R9","s/n","78.643-000","SETOR RURAL","66 09719428","escola.192228@edu.mt.gov.br",-12.597,-52.1946],["157260","EE COUTINHO UNIÃO",1,"QUERÊNCIA","ESCOLA CAMPO","R","AVENIDA CENTRO OESTE, S/N, DISTRITO DE COUTINHO UNIÃO","0","78.643-000","Zona Rural","66 992267160","escola.157260@edu.mt.gov.br",-11.9593,-52.4941],["61441","EE MILITAR TIRADENTES CORONEL PM JORGE LUIZ DE MAGALHÃES",1,"QUERÊNCIA","ESCOLA MILITAR","U","AV. FRANCISCO SCHNEIDER","1524","78.643-000","SETOR NOVA QUERÊNCIA","66 984326887","escola.61441@edu.mt.gov.br",-12.5866,-52.2106],["44253","EE QUERÊNCIA",1,"QUERÊNCIA","ESCOLA","U","RUA VERONICA J. FONTANA","186","78.643-000","SETOR D","66 992829740","escola.44253@edu.mt.gov.br",-12.5931,-52.2087],["124850","EEI CENTRAL KISÉDJE",1,"QUERÊNCIA","ESCOLA INDÍGENA","R","ALDEIA KHIKATXI","1","78.643-000","TERRA INDÍGENA WAWI","66 44007906","escola.124850@edu.mt.gov.br",-11.869,-52.9028],["15180","EE CORONEL ONDINO RODRIGUES LIMA",1,"RIBEIRÃO CASCALHEIRA","ESCOLA","U","Avenida Professor Zacarias","1396","78.675-000","CENTRO","66 34891300","escola.15180@edu.mt.gov.br",-12.931,-51.8238],["45403","EE ALEXANDRE LEITE",1,"RIBEIRÃOZINHO","ESCOLA","U","AVENIDA SENADOR JOÃO VILAS BOAS","625","78.613-000","CENTRO","66 34151200","escola.45403@edu.mt.gov.br",-16.4912,-52.6934],["69280","EEI DIAUARUM",1,"SÃO FÉLIX DO ARAGUAIA","ESCOLA INDÍGENA","R","TERRA INDÍGENA DO XINGÚ","0","78.670-000","CTL DIAUARUM","66 34781100","escola.69280@edu.mt.gov.br",-11.1992,-53.2356],["11517","EE ARTHUR DA COSTA E SILVA",1,"TORIXORÉU","ESCOLA","U","Avenida Deputado Heronides Araújo","SN","78.695-000","Vila União","66 09644022","escola.11517@edu.mt.gov.br",-16.1966,-52.5561],["16560","EE JOÃO SATO",3,"ARAPUTANGA","ESCOLA INTEGRAL","U","Av. Marechal Rondon","813","78.260-000","CENTRO","65 999112496","escola.16560@edu.mt.gov.br",-15.4708,-58.3494],["16594","EE PRESIDENTE TANCREDO DE ALMEIDA NEVES",3,"ARAPUTANGA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Av.Dionisio Santa Rosa","1","78.260-000","Comunidade de Farinópolis","65 998083238","escola.16594@edu.mt.gov.br",-15.4053,-58.449],["16624","EECM NOSSA SENHORA DE FÁTIMA",3,"ARAPUTANGA","ESCOLA CÍVICO-MILITAR","U","RUA MARQUES DE POMBAL","445","78.260-000","JARDIM PRIMAVERA","65 99612241","escola.16624@edu.mt.gov.br",-15.4732,-58.3423],["11606","EE 11 DE MARÇO",3,"CÁCERES","ESCOLA","U","RUA TIRADENTES","732","78.200-001","CENTRO","65 996208638","escola.11606@edu.mt.gov.br",-16.07,-57.6846],["176664","EE 12 DE OUTUBRO",3,"CÁCERES","ESCOLA CAMPO","R","BR 070","0","78.219.899","Agrovila Nova Esperança","65 999304491","escola.176664@edu.mt.gov.br",-16.2977,-58.1911],["11630","EE LEOPOLDO AMBRÓSIO FILHO",3,"CÁCERES","ESCOLA INTEGRAL","U","Rua dos Cajueiros","s/n","78.211-210","DNER","65 999969310","escola.11630@edu.mt.gov.br",-16.078,-57.6611],["61298","EE MILITAR TIRADENTES PROFESSOR NATALINO FERREIRA MENDES",3,"CÁCERES","ESCOLA MILITAR","U","RUA TIRADENTES","726","78.210-090","CENTRO","65 32230001","escola.61298@edu.mt.gov.br",-16.0697,-57.6852],["11703","EE PROFESSOR DEMÉTRIO COSTA PEREIRA",3,"CÁCERES","ESCOLA INTEGRAL/MISTA","U","RUA DOS COLIBRIS","0","78210490","CIDADE ALTA","65 996642527","escola.11703@edu.mt.gov.br",-16.0718,-57.6773],["84336","EE PROFESSOR JOÃO FLORENTINO SILVA NETO",3,"CÁCERES","ESCOLA CAMPO","R","Rua Dercídio Magio","s/n","78.236-970","DISTRITO DE CARAMUJO","65 981321600","escola.84336@edu.mt.gov.br",-15.8449,-57.862],["11657","EE SÃO LUIZ",3,"CÁCERES","ESCOLA","U","AVENIDA GETÚLIO VARGAS","2085","78.210-902","JARDIM CELESTE","65 996716947","escola.11657@edu.mt.gov.br",-16.0849,-57.6754],["11690","EECM FREI AMBRÓSIO",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","AVENIDA NOSSA SENHORA DO CARMO","1","78.200-001","JUNCO","65 996630824","escola.11690@edu.mt.gov.br",-16.101,-57.6867],["11797","EECM PROFESSORA ANA MARIA DAS GRAÇAS DE SOUZA NORONHA",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","RUA MONTEIROS","0","78.217-383","COHAB NOVA","65 996585833","escola.11797@edu.mt.gov.br",-16.048,-57.6593],["11614","EECM SENADOR MÁRIO MOTTA",3,"CÁCERES","ESCOLA CÍVICO-MILITAR","U","Rua Dr Leopoldo Ambrosio  Filho","0","78.200-001","SAO LUIZ","65 999096909","escola.11614@edu.mt.gov.br",-16.0853,-57.6951],["212490","EEDIEB PROFESSOR MILTON MARQUES CURVO",3,"CÁCERES","ESCOLA","U","Rua Bolivia","21","78.210-270","CENTRO","65 999956706","escola.212490@edu.mt.gov.br",-16.0774,-57.6915],["69493","EE BOA ESPERANÇA",3,"CURVELÂNDIA","ESCOLA","U","AVENIDA MARIANA","3188","78.237-000","CENTRO","65 32731115","escola.69493@edu.mt.gov.br",-15.6101,-57.9208],["71790","EE JOSÉ BEJO",3,"GLÓRIA D'OESTE","ESCOLA","U","Rua Maria Cecília Della Costa","2606","78.293-000","José Bejo","65 999895140","escola.71790@edu.mt.gov.br",-15.7725,-58.3127],["16640","EE PAULINO MODESTO",3,"INDIAVAÍ","ESCOLA","U","Rua Nossa Senhora do Carmo","0","78.295-000","CENTRO","65 998441868","escola.16640@edu.mt.gov.br",-15.4951,-58.578],["11894","EE PADRE JOSÉ ANCHIETA",3,"LAMBARI D'OESTE","ESCOLA","U","RUA CIDROLANDIA","145 E","78.278-000","CENTRO","65 99611566","escola.11894@edu.mt.gov.br",-15.3197,-58.0039],["16284","EE BOA VISTA",3,"MIRASSOL D'OESTE","ESCOLA","U","RUA BARÃO DO RIO BRANCO","238","78.280-000","ALTO DA BOA VISTA","65 99816434","escola.16284@edu.mt.gov.br",-15.6883,-58.0967],["16195","EE JOÃO DE CAMPOS WIDAL",3,"MIRASSOL D'OESTE","ESCOLA CAMPO/INTEGRAL","R","AVENIDA CUIABÁ","1","78.280-000","Distrito de Sonho Azul","65 996693881","escola.16195@edu.mt.gov.br",-15.7737,-58.1215],["94420","EE MADRE CRISTINA",3,"MIRASSOL D'OESTE","ESCOLA CAMPO","R","Assentamento Roseli Nunes","SN","78.280-000","Zona Rural","65 998048231","escola.94420@edu.mt.gov.br",-15.534,-58.0234],["16241","EE PADRE JOSÉ DE ANCHIETA",3,"MIRASSOL D'OESTE","ESCOLA INTEGRAL","U","Rua XV de Novembro","1151","78.280-000","CIDADE TAMANDARÉ","65 996243664","escola.16241@edu.mt.gov.br",-15.6727,-58.0845],["16209","EE PADRE TIAGO",3,"MIRASSOL D'OESTE","ESCOLA","U","RUA PROFESSOR ODÉLIO BARBOSA DA SILVA","620","78.280-000","CENTRO","65 32411670","escola.16209@edu.mt.gov.br",-15.6759,-58.0961],["16233","EE PEDRO GALHARDO GARCIA",3,"MIRASSOL D'OESTE","ESCOLA","U","RUA PAULINA MOREIRA DE MATOS - PARQUE MORUMBI","241","78.280-000","PARQUE MORUMBI","65 32412296","escola.16233@edu.mt.gov.br",-15.6774,-58.0858],["16187","EECM 12 DE OUTUBRO",3,"MIRASSOL D'OESTE","ESCOLA CÍVICO-MILITAR","U","RUA NILMA PEREIRA LEITE","1298","78.280-000","CENTRO","65 996237931","escola.16187@edu.mt.gov.br",-15.6792,-58.1018],["16314","EE 13 DE MAIO",3,"PORTO ESPERIDIÃO","ESCOLA","U","Rua Ramão Lara Franco","46","78.240-000","Parque das Américas","65 998016574","escola.16314@edu.mt.gov.br",-15.8541,-58.466],["16322","EE SÃO GERALDO",3,"PORTO ESPERIDIÃO","ESCOLA CAMPO","R","Rua Padre Nazareno","s/n°","78.240-000","Bocaiuval","65 996510318","escola.16322@edu.mt.gov.br",-15.7282,-58.6237],["154989","EEI CHIQUITANO JOSÉ TURÍBIO",3,"PORTO ESPERIDIÃO","ESCOLA INDÍGENA","R","TERRA INDIGENA ALDEIA VILA NOVA BARBECHO","0","78.240-000","indígena","65 32251337","escola.154989@edu.mt.gov.br",-16.2684,-59.1593],["109444","EEI CHIQUITANOS",3,"PORTO ESPERIDIÃO","ESCOLA INDÍGENA","R","Marechal Rondon","0","78.240-000","Zona Rural","65 32251337","escola.109444@edu.mt.gov.br",-16.2415,-59.4489],["16632","EE PROFESSOR DEMÉTRIO PEREIRA",3,"RESERVA DO CABAÇAL","ESCOLA","U","Av. Mato Grosso","222","78.265-000","CENTRO","65 981172872","escola.16632@edu.mt.gov.br",-15.1204,-58.3844],["11886","EE DEPUTADO FRANCISCO EDUARDO RANGEL TORRES",3,"RIO BRANCO","ESCOLA","U","Avenida Sete de Setembro","1017","78.275-000","CIDADE ALTA","65 999316708","escola.11886@edu.mt.gov.br",-15.2464,-58.116],["11843","EE DEPUTADO FRANCISCO VILLANOVA",3,"SALTO DO CÉU","ESCOLA","U","RUA ESPIRITO SANTO","412","78.270-000","BELA VISTA","65 996143896","escola.11843@edu.mt.gov.br",-15.1295,-58.1326],["15261","EE 15 DE JUNHO",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA","U","RUA JALES","1","78.285-000","JARDIM ZEFERINO  I","65 996465449","escola.15261@edu.mt.gov.br",-15.6215,-58.1721],["15210","EE DEPUTADO BERTOLDO FREIRE",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA INTEGRAL","U","Rua Pernambuco","962","78.285-000","CENTRO","65 996143896","escola.15210@edu.mt.gov.br",-15.6277,-58.1799],["15253","EE LOURENÇO PERUCHI",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA INTEGRAL","U","RUA LEON DENIS","526","78.285-000","JARDIM POPULAR","65 999906694","escola.15253@edu.mt.gov.br",-15.6359,-58.1845],["15300","EE SANTA ROSA",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA CAMPO","R","RODOVIA MT 175 KM 50","SN","78.285-000","COMUNIDADE DO BARREIRÃO","65 999078373","escola.15300@edu.mt.gov.br",-15.5666,-58.2587],["15237","EECM MIGUEL BARBOSA",3,"SÃO JOSÉ DOS QUATRO MARCOS","ESCOLA CÍVICO-MILITAR","U","RUA SETE DE SETEMBRO","845","78.285-000","JARDIM SANTA ROSA","65 999310627","escola.15237@edu.mt.gov.br",-15.6239,-58.1812],["39055","EE JOÃO REZENDE DE AZEVEDO",2,"ALTO BOA VISTA","ESCOLA","U","Avenida Brasil","700","78.665-000","CENTRO","66 35391163","escola.39055@edu.mt.gov.br",-11.6788,-51.379],["69205","EE PROFESSOR GERSON CARLOS DA SILVA",2,"BOM JESUS DO ARAGUAIA","ESCOLA","U","Rua J Ribeiro","230","78.678-000","CENTRO","66 35381250","herculesofn@gmail.com",-12.1708,-51.5091],["118524","EEI MARAIWATSEDE",2,"BOM JESUS DO ARAGUAIA","ESCOLA INDÍGENA","R","Aldeia Maraiwatsede","0","78.678-000","rural","66 35381340","escola.118524@edu.mt.gov.br",-11.8979,-51.6827],["14222","EE ELIAS BENTO",2,"CANABRAVA DO NORTE","ESCOLA","U","AVENIDA ANTONIO BOSAIPO","78","78.658-000","CENTRO","66 35771195","escola.14222@edu.mt.gov.br",-11.0498,-51.8268],["159700","EE ANTÔNIO ALVES DIAS",2,"CONFRESA","ESCOLA CAMPO/INTEGRAL/MISTA","R","MT 430 KM 35 AGROVILA NOVO PLANALTO","s/n","78.652-000","Zona Rural","66 999884090","escola.159700@edu.mt.gov.br",-10.5749,-51.8318],["194921","EE MILITAR TIRADENTES CABO PM JOSÉ MARTINS DE MOURA",2,"CONFRESA","ESCOLA MILITAR","U","Avenida Aluísio Babinski","139","78.652-000","Setor Babinsk","66 35641453","escola.194921@edu.mt.gov.br",-10.6495,-51.57],["156388","EE SOL NASCENTE",2,"CONFRESA","ESCOLA CAMPO","R","ASSENTAMENTO CONFRESA RONCADOR, AGROVILA LUMIAR, KM 45","s/n","78.652-000","Zona Rural","66 99723114","escola.156388@edu.mt.gov.br",-10.3681,-51.6811],["124907","EE TEOTÔNIO CARLOS DA CUNHA NETO",2,"CONFRESA","ESCOLA","U","Av. S esquina com SQ 19","0","78.652-000","Setor Gameleira","66 35641828","escola.124907@edu.mt.gov.br",-10.6405,-51.5694],["158828","EE WALDIR BENTO DA COSTA",2,"CONFRESA","ESCOLA CAMPO","R","Rua moreira Cabral, distrito de Veranópolis","s/n","78.652-000","Zona Rural","66 35649107","escola.158828@edu.mt.gov.br",-10.4595,-51.4526],["38652","EECM 29 DE JULHO",2,"CONFRESA","ESCOLA CÍVICO-MILITAR","U","RUA IPORÁ","6","78.652-000","CENTRO","66 992539929","escola.38652@edu.mt.gov.br",-10.6464,-51.5721],["212482","EEDIEB CREUSLHI DE SOUZA RAMOS",2,"CONFRESA","ESCOLA INTEGRAL/ESPORTE","U","Av. Centro-Oeste, esq. c/ Pequizeiro","735","78.652-000","VILA NOVA","66 997113867","escola.212482@edu.mt.gov.br",-10.661,-51.5751],["75710","EEI TAPI'ITÃWA",2,"CONFRESA","ESCOLA INDÍGENA","R","ALDEIA INDÍGENA TAPI'ITÃWA","0","78.652-000","TERRA INDÍGENA URUBU BRANCO","66 99843748","escola.75710@edu.mt.gov.br",-10.6691,-51.3527],["38709","EE JUSCELINO KUBISTCHEK",2,"LUCIARA","ESCOLA","U","AVENIDA 10 DE MAIO","0","78.660-000","CENTRO","66 984161908","escola.38709@edu.mt.gov.br",-11.2232,-50.6692],["75698","EEI HADORI",2,"LUCIARA","ESCOLA INDÍGENA","R","ALDEIA SÃO DOMINGOS","0","78.660-000","Zona Rural","66 35281327","escola.75698@edu.mt.gov.br",-11.2446,-50.6627],["69140","EE 29 DE SETEMBRO",2,"NOVO SANTO ANTÔNIO","ESCOLA","U","Av.Santo Antonio","68","78.674-000","CENTRO","66 35481129","escola.69140@edu.mt.gov.br",-12.2907,-50.9668],["14206","EE ALEXANDRE QUIRINO SOUZA",2,"PORTO ALEGRE DO NORTE","ESCOLA","U","RUA  SÃO  PEDRO","472","78.655-000","CENTRO","66 35691289","escola.14206@edu.mt.gov.br",-10.8819,-51.6351],["158623","EE ANTÔNIA LEÃO DOS SANTOS",2,"PORTO ALEGRE DO NORTE","ESCOLA CAMPO","R","COLONIA GOIAS I","0","78.655-000","PA UNIAO MARGARIDA","66 992271842","escola.158623@edu.mt.gov.br",-10.7492,-51.8655],["91456","EE JOSÉ GONÇALVES DOS SANTOS",2,"PORTO ALEGRE DO NORTE","ESCOLA CAMPO/INTEGRAL","R","AVENIDA 01","00","78.655-000","NOVA FLORESTA","66 98461314","escola.91456@edu.mt.gov.br",-10.785,-51.9921],["14214","EECM 13 DE MAIO",2,"PORTO ALEGRE DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA AMAZONAS","1","78.655-000","SETOR DOS ESPORTES","66 35691377","escola.14214@edu.mt.gov.br",-10.8828,-51.6291],["77925","EE SANTA CRUZ",2,"SANTA CRUZ DO XINGU","ESCOLA","U","AV. PROJETADA A, QD. A LT A","1","78.664-000","ELDORADO","66 35941170","escola.77925@edu.mt.gov.br",-10.158,-52.3869],["158348","EE ROBERVAL COSTA REIS",2,"SANTA TEREZINHA","ESCOLA CAMPO","R","Proj. de Assentamento Porto Velho-Colônia Santa Terezinha","s/nº","78.650-000","Zona Rural","66 981024273","escola.158348@edu.mt.gov.br",-10.5295,-50.8533],["14150","EE SANTA TEREZINHA",2,"SANTA TEREZINHA","ESCOLA","U","RUA DO COMERCIO","240","78.650-000","CENTRO","66 981162561","escola.14150@edu.mt.gov.br",-10.4758,-50.5141],["148075","EEI HAWALORA",2,"SANTA TEREZINHA","ESCOLA INDÍGENA","R","Aldeia Hawalora","0","78.650-000","S/N","66 98418344","escola.148075@edu.mt.gov.br",-10.6409,-50.6209],["75680","EEI ITXALÁ",2,"SANTA TEREZINHA","ESCOLA INDÍGENA","R","Aldeia Itxala","s/nº","78.650-000","Zona Rural","66 984631387","escola.75680@edu.mt.gov.br",-10.6538,-50.6047],["14184","EEI TAPIRAPÉ",2,"SANTA TEREZINHA","ESCOLA INDÍGENA","R","ALDEIA MAJTYRI","1","78.650-000","Zona Rural","66 992567656","escola.14184@edu.mt.gov.br",-10.6235,-50.6236],["14095","EE PRESIDENTE TANCREDO DE ALMEIDA NEVES",2,"SÃO FÉLIX DO ARAGUAIA","ESCOLA INTEGRAL/MISTA","U","Avenida Governador José Fragelli","1167","78.670-000","VILA NOVA","66 98477590","escola.14095@edu.mt.gov.br",-11.6178,-50.6717],["14087","EE SEVERIANO NEVES",2,"SÃO FÉLIX DO ARAGUAIA","ESCOLA CAMPO","R","AVENIDA SÃO VICENTE","SN","78.670-000","DISTRITO ESPIGÃO DO LESTE","66 98428904","escola.14087@edu.mt.gov.br",-11.4321,-50.6875],["137758","EECM PROFESSORA HILDA ROCHA SOUZA",2,"SÃO FÉLIX DO ARAGUAIA","ESCOLA CÍVICO-MILITAR","U","AV SEVERIANO NEVES","s/n","78.670-000","CENTRO","66 35221202","escola.137758@edu.mt.gov.br",-11.6172,-50.6684],["158615","EE 05 DE ABRIL",2,"SÃO JOSÉ DO XINGU","ESCOLA CAMPO/INTEGRAL/MISTA","R","RUA 01 QUADRA 06","0","78.663-000","DISTRITO DE SANTO ANTONIO DO FONTOURA","66 35081168","escola.158615@edu.mt.gov.br",-10.5804,-52.2491],["14192","EE ANTÔNIO GOMES PRIMO",2,"SÃO JOSÉ DO XINGU","ESCOLA","U","AVENIDA DOMITÍLIA GOMES DE OLIVEIRA","68","78.663-000","CENTRO","66 35681197","escola.14192@edu.mt.gov.br",-10.8041,-52.7353],["123986","EEI BEPKOROROTI",2,"SÃO JOSÉ DO XINGU","ESCOLA INDÍGENA","R","ALDEIA PIARAÇU","SN","78.663-000","ALDEIA","66 44007888","escola.123986@edu.mt.gov.br",-10.7792,-53.0794],["158372","EEI BITAHAMA",2,"SÃO JOSÉ DO XINGU","ESCOLA INDÍGENA","R","ALDEIA PAKAYA","SN","78.663-000","Zona Rural","66 35681073","escola.158372@edu.mt.gov.br",-10.8339,-53.1169],["69230","EE ANTÔNIO CARLOS MOURA",2,"SERRA NOVA DOURADA","ESCOLA","U","RUA AÇAI","292","78.668-000","CENTRO","66 34731060","escola.69230@edu.mt.gov.br",-12.0878,-51.4016],["14230","EE MARIA ESTHER PERES",2,"VILA RICA","ESCOLA","U","RUA UM","07","78.645-000","SETOR SUL","66 35541428","escola.14230@edu.mt.gov.br",-10.0159,-51.1156],["127701","EE MILITAR TIRADENTES SOLDADO PM ANTÔNIO EUSTÁQUIO DE PAULA",2,"VILA RICA","ESCOLA MILITAR","U","Rua 52","723","78.645-000","SETOR OESTE","66 35541574","escola.127701@edu.mt.gov.br",-10.0185,-51.1302],["155128","EE ÁGUA SANTA",4,"ALTO PARAGUAI","ESCOLA CAMPO","R","AVENIDA PRINCIPAL","s/n","78.410-000","Assentamento Nova Esperança","65 99697383","escola.155128@edu.mt.gov.br",-14.8896,-56.7154],["13838","EE ALEXANDRE GOMES SILVA CHAVES",4,"ALTO PARAGUAI","ESCOLA","U","Rua Santos Dumont","70","78.410-000","CENTRO","65 992172029","escola.13838@edu.mt.gov.br",-14.5157,-56.4846],["13889","EE DOUTOR ARNALDO ESTEVÃO DE FIGUEIREDO",4,"ALTO PARAGUAI","ESCOLA INTEGRAL","U","AVENIDA MAJOR SIMÃO AURELIANO DE BARROS","221","78.410-000","CENTRO","65 99949233","escola.13889@edu.mt.gov.br",-14.5164,-56.483],["173509","EE HENRIQUE JOSÉ TRINDADE",4,"ALTO PARAGUAI","ESCOLA CAMPO/INTEGRAL/MISTA","R","RUA MANOEL DIAS","s/n","78.410-000","CAPÃO VERDE","65 999647702","escola.173509@edu.mt.gov.br",-14.9357,-56.8451],["13897","EE PROFESSORA ZÉLIA COSTA DE ALMEIDA",4,"ALTO PARAGUAI","ESCOLA CAMPO","R","Rua 25 de Outubro","0","78.410-000","Distrito de Tira Sentido","65 999125277","escola.13897@edu.mt.gov.br",-14.8345,-56.8107],["13919","EE ALFREDO DE ARAÚJO GRANJA",4,"ARENÁPOLIS","ESCOLA","U","AVENIDA DAURY RIVA","200S","78.420-000","VILA NOVA","65 996848294","escola.13919@edu.mt.gov.br",-14.4607,-56.8457],["13951","EE SENADOR FILINTO MÜLLER",4,"ARENÁPOLIS","ESCOLA INTEGRAL","U","RUA GLICERIO MARTINS PINTO","50E","78.420-000","VILA NOVA","65 33431053","escola.13951@edu.mt.gov.br",-14.4582,-56.8434],["13943","EECM GOVERNADOR JOÃO PONCE DE ARRUDA",4,"ARENÁPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Presidente Costa e Silva,","731","78.420-000","VILA NOVA","65 33431853","escola.13943@edu.mt.gov.br",-14.4579,-56.8473],["163660","EE ANA MARIA TISSIANI DE OLIVEIRA",4,"DIAMANTINO","ESCOLA CAMPO","R","AGROVILA BOJUI","00","78.400-000","ZONA RURAL - ESCOLA DO CAMPO","65 992244108","escola.163660@edu.mt.gov.br",-14.1998,-56.4211],["163643","EE CASTRO ALVES",4,"DIAMANTINO","ESCOLA CAMPO","R","ASSENTAMENTO CAETÉS-SETOR BALALA fone 065.9.9812.2398","7km","78.400-000","PROJETO DE ASSENTAMENTO CAETÉS","65 992018245","escola.163643@edu.mt.gov.br",-14.4263,-56.2523],["163651","EE DÉCIO LUIZ FURIGO",4,"DIAMANTINO","ESCOLA CAMPO","R","RUA DECIO LUIZ FURIGO","s/n","78.400-000","DECIOLÂNDIA","65 999203128","escola.163651@edu.mt.gov.br",-14.1829,-57.5071],["176427","EE JOÃO BATISTA DE ALMEIDA",4,"DIAMANTINO","ESCOLA INTEGRAL","U","RUA FORTALEZA","100","78.402-000","JARDIM ALVORADA","65 98463559","escola.176427@edu.mt.gov.br",-14.3792,-56.379],["15369","EE MILITAR TIRADENTES DOUTOR MANOEL JOSÉ MURTINHO",4,"DIAMANTINO","ESCOLA MILITAR","U","RUA DAS AZALEIAS","306","78.400-000","NOVO DIAMANTINO","65 996161735","escola.15369@edu.mt.gov.br",-14.3756,-56.3861],["15377","EE NILCE MARIA DE MAGALHÃES",4,"DIAMANTINO","ESCOLA","U","Rua dos Estudantes","200","78.400-000","Buriti","65 33361779","escola.15377@edu.mt.gov.br",-14.4178,-56.4408],["15385","EE PLÁCIDO DE CASTRO",4,"DIAMANTINO","ESCOLA INTEGRAL","U","AVENIDA MUNICIPAL","1389","78.400-000","São Benedito","65 33361717","escola.15385@edu.mt.gov.br",-14.405,-56.4457],["15350","EE SERRA AZUL",4,"DIAMANTINO","ESCOLA","U","RUA DAS PITOMBEIRAS","407","78.402-000","NOVO DIAMANTINO","65 999847635","escola.15350@edu.mt.gov.br",-14.3739,-56.3952],["15334","EECM IRMÃ LUCINDA FACCHINI",4,"DIAMANTINO","ESCOLA CÍVICO-MILITAR","U","AVENIDA MUNICIPAL","573","78.400-000","DA PONTE","65 993501416","escola.15334@edu.mt.gov.br",-14.408,-56.4515],["12882","EE DOUTOR FÁBIO SILVÉRIO DE FARIAS",4,"NOBRES","ESCOLA INTEGRAL","U","PRAÇA ROOSEVELT RACHID JAUDY","175","78.470-000","CENTRO","65 999657771","escola.12882@edu.mt.gov.br",-14.7204,-56.3274],["84344","EE MARECHAL CÂNDIDO RONDON",4,"NOBRES","ESCOLA CAMPO","R","VILA RODA D'ÁGUA","0","78.479-000","DISTRITO COQUEIRAL","65 99272284","escola.84344@edu.mt.gov.br",-14.5518,-55.9724],["12890","EE PROFESSOR NILO PÓVOAS",4,"NOBRES","ESCOLA","U","AVENIDA MARECHAL RONDON","325","78.470-000","CENTRO","65 33761958","escola.12890@edu.mt.gov.br",-14.7225,-56.335],["12866","EECM INOCÊNCIA RACHID JAUDY",4,"NOBRES","ESCOLA CÍVICO-MILITAR","U","RUA PROFESSORA NIVA MATOS DE OLIVEIRA","877","78.470-000","SÃO JOSÉ","65 992612838","escola.12866@edu.mt.gov.br",-14.7252,-56.3304],["14044","EE DESEMBARGADOR OLEGÁRIO MOREIRA DE BARROS",4,"NORTELÂNDIA","ESCOLA INTEGRAL","U","Avenida Rodolfo Rodrigues da Silva","155","78.430-000","Ponte","65 992729136","escola.14044@edu.mt.gov.br",-14.4504,-56.8127],["14036","EE IDALINA DE FARIAS",4,"NORTELÂNDIA","ESCOLA","U","AV. PREFEITO JOÃO MACAUBA","1270","78.430-000","CENTRO","65 33461514","escola.14036@edu.mt.gov.br",-14.4539,-56.8026],["192058","EE PROFESSORA MURALHA DE MIRANDA PASSOS",4,"NOVA MARILÂNDIA","ESCOLA","U","Rua das Bromélias","s/n","78.415-000","loteamento Planalto","65 33521365","escola.192058@edu.mt.gov.br",-14.3671,-56.9836],["71838","EE OSMAIR PINHEIRO DA SILVA",4,"NOVA MARINGÁ","ESCOLA","U","Av Amos Bernardino Zanchet","828 E","78.440-000","CENTRO","66 981091173","escola.71838@edu.mt.gov.br",-13.0282,-57.0916],["194905","EE MILITAR TIRADENTES CORONEL PM CELSO HENRIQUE SOUZA BARBOSA",4,"NOVA MUTUM","ESCOLA MILITAR","U","RUA DOS CEDROS","884 N","78450-086","CENTRO","65 993289989","escola.194905@edu.mt.gov.br",-13.8124,-56.0783],["114553","EE PADRE JHOANNES BERTHOLD HENNING",4,"NOVA MUTUM","ESCOLA CAMPO","R","ÁREA RURAL","34","78457899","ÁREA RURAL DE NOVA MUTUM","65 992505549","escola.114553@edu.mt.gov.br",-13.8225,-55.7011],["163554","EECM RUI BARBOSA",4,"NOVA MUTUM","ESCOLA","U","RUA DAS PRIMAVERAS","718W","78.450-084","CENTRO","65 996853353","escola.163554@edu.mt.gov.br",-13.8257,-56.0847],["97012","EECM JOSÉ APARECIDO RIBEIRO",4,"NOVA MUTUM","ESCOLA CÍVICO-MILITAR","U","AVENIDA MUTUM","1401w","78452040","BELA VISTA","65 33083704","escola.97012@edu.mt.gov.br",-13.8172,-56.0894],["145696","EECM VIRGÍLIO CORRÊA FILHO",4,"NOVA MUTUM","ESCOLA CÍVICO-MILITAR","U","RUA DOS ANGICOS","1127","78454522","RESIDENCIAL PARAÍSO","65 998463808","escola.145696@edu.mt.gov.br",-13.8352,-56.0944],["184390","EE BENEDITA DE ALMEIDA",4,"ROSÁRIO OESTE","ESCOLA CAMPO","R","Comunidade Novo Horizonte","s/n","78.480-000","Distrito de Arruda","65 999652458","escola.184390@edu.mt.gov.br",-14.8818,-56.1796],["12785","EE CORONEL ARTUR BORGES",4,"ROSÁRIO OESTE","ESCOLA","U","AVENIDA CORONEL ARTUR BORGES","566","78.480-000","CENTRO","65 992022794","rodrigo.vespucci@edu.mt.gov.br",-14.8287,-56.4277],["176648","EE ESTEVÃO PEREIRA DE ALMEIDA",4,"ROSÁRIO OESTE","ESCOLA CAMPO","R","ASSENTAMENTO FORQUILHA DO RIO MANSO","SN","78480-971","DISTRITO DO MARZAGÃO","65 99340673","escola.176648@edu.mt.gov.br",-14.7679,-56.1189],["12831","EE MARECHAL RONDON",4,"ROSÁRIO OESTE","ESCOLA CAMPO","R","Av Principal","s/nº","7848350051","DISTRITO DO BAUXI","65 993347084","escola.12831@edu.mt.gov.br",-15.14783,-56.72601],["173541","EE PROFESSORA ELIZABET EVANGELISTA PEREIRA",4,"ROSÁRIO OESTE","ESCOLA INTEGRAL","U","RUA C","43","78.480-000","COHAB VELHA","65 999632218","escola.173541@edu.mt.gov.br",-14.8265,-56.4285],["12815","EECM PROFESSOR JOÃO CALIXTO BERNARDES",4,"ROSÁRIO OESTE","ESCOLA CÍVICO-MILITAR","U","Rua: C Quadra: 10  Cohab Nossa Senhora do Rosário","s/n","78.480-000","Santo Antonio","65 992768123","escola.12815@edu.mt.gov.br",-14.8406,-56.4383],["124079","EE CÂNDIDO PORTINARI",4,"SANTA RITA DO TRIVELATO","ESCOLA","U","AV 28 DE DEZEMBRO","snº.","78.445-000","CENTRO","65 981274598","escola.124079@edu.mt.gov.br",-13.8183,-55.2756],["13935","EE ACADÊMICO LAURO AUGUSTO DE BARROS",4,"SANTO AFONSO","ESCOLA","U","AVENIDA SEBASTIÃO JACINTO","350","78.425-000","CENTRO","65 999036323","escola.13935@edu.mt.gov.br",-14.4957,-57.0043],["13927","EE GERALDO SANTANA DOS SANTOS",4,"SANTO AFONSO","ESCOLA CAMPO","R","RUA DAS PERDIZES","0","78.425-000","GLEBA UNIÃO - VILA BOA ESPERANÇA","65 31051017","escola.13927@edu.mt.gov.br",-14.4551,-57.1563],["15407","EE DOMINGOS BRIANTE",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA","U","Rua Santa Catarina","1574","78.435-000","PLANALTO","65 999215269","escola.15407@edu.mt.gov.br",-13.4561,-56.7251],["173363","EE SANTANA D'ÁGUA LIMPA",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA CAMPO","R","Assentamento Santana Dagua Limpa","s/nº","78.435-000","Lote 214 - Rural","65 993270283","escola.173363@edu.mt.gov.br",-13.3678,-56.6837],["15393","EE SÃO JOSÉ DO RIO CLARO",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA INTEGRAL","U","AVENIDA URUGUAI","441","78.435-000","CENTRO","65 992823991","escola.15393@edu.mt.gov.br",-13.4464,-56.7203],["15423","EECM DOUTOR ANÍSIO JOSÉ MOREIRA",4,"SÃO JOSÉ DO RIO CLARO","ESCOLA CÍVICO-MILITAR","U","RUA ACRE","544","78.435-000","CENTRO","66 992118293","escola.15423@edu.mt.gov.br",-13.4486,-56.7237],["142166","EE DOM FRANCO DALLA VALLE",5,"ARIPUANÃ","ESCOLA CAMPO","R","RUA MAÇARANDUBA","1","78.325-000","CONSELVAN","66 36031266","escola.142166@edu.mt.gov.br",-9.9274,-59.9226],["104230","EE PROFESSOR ELÍDIO MURCELLI FILHO",5,"ARIPUANÃ","ESCOLA INTEGRAL/MISTA/ESPORTE","U","AVENIDA DERCIO TORREMOCHA AGUILAR","2246","78.325-000","PARQUE INDUSTRIAL HELEODORO MAZON","66 35651553","escola.104230@edu.mt.gov.br",-10.1769,-59.4353],["14729","EECM SÃO FRANCISCO DE ASSIS",5,"ARIPUANÃ","ESCOLA CÍVICO-MILITAR","U","RUA COMENDADOR MANOEL PEDRO DE OLIVEIRA","121","78.325-000","CENTRO","66 35651503","escola.14729@edu.mt.gov.br",-10.1732,-59.4542],["78280","EEI ADECA VELA ARARA",5,"ARIPUANÃ","ESCOLA INDÍGENA","R","Terra Indigena Arara do Rio Branco Aldeia Volta Grande","1000","78.325-000","Terra Indigena Arara do Rio Branco","66 992189222","escola.78280@edu.mt.gov.br",-9.905,-59.6026],["82252","EEI PASAPKAREEJ",5,"ARIPUANÃ","ESCOLA INDÍGENA","R","Aldeia Taquaral","01","78.325-000","Terra Indigena Aripuanã","66 35651482","escola.82252@edu.mt.gov.br",-10.4163,-59.7105],["14761","EE EWALDO MEYER RODERJAN",5,"BRASNORTE","ESCOLA INTEGRAL/MISTA","U","Rua Cáceres","1250","78.350-000","CENTRO","66 35921574","escola.14761@edu.mt.gov.br",-12.1221,-58.0011],["196495","EECM PROFESSORA NORMA LÚCIA NUNES",5,"BRASNORTE","ESCOLA CÍVICO-MILITAR","U","RUA GUAÍRA","185","78.350-000","CENTRO","66 35921989","escola.196495@edu.mt.gov.br",-12.1176,-58.0094],["129232","EEI MYHYINYMYKYTA SKIRIPI",5,"BRASNORTE","ESCOLA INDÍGENA","R","Aldeia Barranco Vermelho","11","78.350-000","Zona Rural","66 44007208","escola.129232@edu.mt.gov.br",-11.4304,-58.3195],["154938","EEI TAPURÁ IRANTXE",5,"BRASNORTE","ESCOLA INDÍGENA","R","ALDEIA PAREDÃO","10","78.350-000","ALDEIA","66 44007209","escola.154938@edu.mt.gov.br",-12.9229,-58.0326],["91421","EEI XINUI MYKY",5,"BRASNORTE","ESCOLA INDÍGENA","R","Aldeia Japuira","10","78.350-000","Zona Rural","66 35922451","escola.91421@edu.mt.gov.br",-12.1778,-58.4002],["14796","EE MARIA QUITÉRIA",5,"CASTANHEIRA","ESCOLA","U","Avenida 04 de Julho","552","78.345-000","CENTRO","66 999816422","escola.14796@edu.mt.gov.br",-11.1399,-58.6115],["137774","EE MÁRIO DE ANDRADE",5,"CASTANHEIRA","ESCOLA CAMPO","R","vale do seringal, loteamento 3º, comunidade nova conquista","3","78.345-000","rural","66 44007248","escola.137774@edu.mt.gov.br",-10.8423,-58.4741],["137766","EE PAULO FREIRE",5,"CASTANHEIRA","ESCOLA CAMPO","R","VALE DO SERINGAL COMUNIDADE SÃO LOURENÇO SETOR IV","IV","78.345-000","rural","66 99667432","escola.137766@edu.mt.gov.br",-10.7403,-58.4842],["69469","EE BERNARDINO GOMES DA LUZ",5,"COLNIZA","ESCOLA","U","AVenida DOS PINHAIS","446","78.335-000","CENTRO","66 35711138","escola.69469@edu.mt.gov.br",-9.4581,-59.2223],["145734","EE MARIA MIRANDA ARAÚJO",5,"COLNIZA","ESCOLA CAMPO","R","AV. SANTOS DUMONT","s/nº","78.336-000","Zona Rural","66 35991113","escola.145734@edu.mt.gov.br",-9.2498,-60.3289],["97004","EE MILITAR TIRADENTES 3º SARGENTO PM EDUARDO LUIZ DE SOUZA",5,"COLNIZA","ESCOLA MILITAR","U","RUA: A-7","50","78.335-000","BELA VISTA","66 981139853","escola.97004@edu.mt.gov.br",-9.458,-59.209],["183636","EE PEDRO BORGES",5,"COLNIZA","ESCOLA CAMPO","R","BR 174 KM 29","s/n","78.335-000","Projeto de Assentamento Scol Sul","66 98470247","escola.183636@edu.mt.gov.br",-9.6903,-59.169],["154695","EE TARSILA DO AMARAL",5,"COLNIZA","ESCOLA","U","Avenida Mato Grosso","446","78.335-000","CENTRO","66 98127547","escola.154695@edu.mt.gov.br",-9.4572,-59.2226],["119237","EE ANDRÉ ANTÔNIO MAGGI",5,"COTRIGUAÇU","ESCOLA CAMPO","R","AV 07 DE SETEMBRO","0","78.330-000","NOVA UNIÃO","66 35271149","escola.119237@edu.mt.gov.br",-9.3677,-58.946],["44261","EE MARIA DA GLÓRIA VARGAS OCHOA",5,"COTRIGUAÇU","ESCOLA","U","RUA GUMERCINDO BERNARDI","28","78.330-000","CENTRO","66 992369985","escola.44261@edu.mt.gov.br",-9.9064,-58.5644],["157244","EE SIDNEY CÉSAR FÜHR",5,"COTRIGUAÇU","ESCOLA CAMPO","R","ASSENTAMENTO PA JURUENA CDR9 COMUNIDADE SANTA LUZIA","243","78.330-000","LINHA GAUCHA","66 999844784","escola.157244@edu.mt.gov.br",-10.0023,-58.3698],["21636","EE CECÍLIA DE CASTRO BARBOSA",5,"JUARA","ESCOLA CAMPO","R","COMUNIDADE DO JAÚ - ESTRADA RIO DOS PEIXES KM 30","00","78.575-000","Zona Rural","66 99974641","escola.21636@edu.mt.gov.br",-11.1948,-57.3115],["158658","EE DAURY RIVA",5,"JUARA","ESCOLA INTEGRAL","U","Avenida Paraná","750 E","78.575-000","RESIDENCIAL SANTA TEREZINHA","66 35563976","escola.158658@edu.mt.gov.br",-11.2538,-57.4962],["15792","EE DOM AQUINO CORRÊA",5,"JUARA","ESCOLA CAMPO","R","rua oliveira, zona rural","s/n","78.575-000","comunidade águas claras","66 99686069","escola.15792@edu.mt.gov.br",-11.0711,-57.5698],["194930","EE MILITAR TIRADENTES CABO PM ISRAEL WESLEY PRADO DE ALMEIDA",5,"JUARA","ESCOLA MILITAR","U","Rua Bauru","1067 S","78.575-000","JARDIM PRIMAVERA","66 35565615","escola.194930@edu.mt.gov.br",-11.2622,-57.5019],["118559","EE NIVALDO FRACAROLLI",5,"JUARA","ESCOLA","U","RUA SOROCABA","927S","78.575-000","JARDIM PRIMAVERA","66 35564203","escola.118559@edu.mt.gov.br",-11.2594,-57.5021],["15687","EE OSCAR SOARES",5,"JUARA","ESCOLA","U","AVENIDA RIO ARINOS","3950","78.575-000","GLEBA TAQUARAL","66 996520715","escola.15687@edu.mt.gov.br",-11.2523,-57.5076],["15741","EECM COMENDADOR JOSÉ PEDRO DIAS",5,"JUARA","ESCOLA CÍVICO-MILITAR","U","RUA ANITA GARIBALDI","179 W","78.575-000","BOA VISTA","66 996963527","escola.15741@edu.mt.gov.br",-11.2603,-57.5172],["212440","EEDIEB JOSÉ DIAS",5,"JUARA","ESCOLA","U","RUA PORTO VELHO","256 E","78.575-000","CENTRO","66 999253630","escola.212440@edu.mt.gov.br",-11.2481,-57.5068],["131849","EEI JUPORIJUP",5,"JUARA","ESCOLA INDÍGENA","R","AVENIDA RIO ARINOS/ALDEIA TATUÍ","500 W","78.575-000","ALDEIA TATUÍ-ZONA RURAL","66 35561616","escola.131849@edu.mt.gov.br",-10.9204,-57.536],["145750","EEI KRIXI BAROMPO",5,"JUARA","ESCOLA INDÍGENA","R","Aldeia Munduruku","0","78.575-000","ALDEIA NOVA MUNDURUKU","66 35561616","escola.145750@edu.mt.gov.br",-10.8832,-57.5543],["131830","EEI LEONARDO CRIXI APIAKÁ",5,"JUARA","ESCOLA INDÍGENA","R","ESTRADA JUARA ÁGUAS CLARAS ALDEIA MAYROB KM 65","0","78.575-000","ALDEIA MAYROB-ZONA RURAL","66 35561616","escola.131830@edu.mt.gov.br",-10.9005,-57.4746],["173525","EEI PÉ DE MUTUM",5,"JUARA","ESCOLA INDÍGENA","R","Aldeia Pé de Mutum","SN","78.575-000","Aldeia Pé de Mutum","66 35661106","escola.173525@edu.mt.gov.br",-10.8899,-58.3402],["14613","EE 07 DE SETEMBRO",5,"JUÍNA","ESCOLA","U","AVENIDA ARAPONGAS","517N","78.320-000","MODULO 04","66 99982820","escola.14613@edu.mt.gov.br",-11.4113,-58.7578],["14648","EE 21 DE ABRIL",5,"JUÍNA","ESCOLA INTEGRAL","U","Rua Pariri","50s","78.320-000","Padre Duilio Liburde","66 35662161","escola.14648@edu.mt.gov.br",-11.4451,-58.7662],["14567","EE ANA NÉRI",5,"JUÍNA","ESCOLA","U","AV. PRESIDENTE TANCREDO DE ALMEIDA NEVES","266N","78.320-000","SÃO JOSÉ OPERÁRIO","66 35663756","escola.14567@edu.mt.gov.br",-11.4147,-58.7458],["173347","EE ANTÔNIA MOURA MUNIZ",5,"JUÍNA","ESCOLA","U","RUA PRESIDENTE PRUDENTE","SN","78.320-000","MODULO 6","66 35663116","escola.173347@edu.mt.gov.br",-11.419,-58.7855],["14591","EE ANTÔNIO FRANCISCO LISBOA",5,"JUÍNA","ESCOLA CAMPO","R","LINHA 05 KM 05","1","78.320-000","BAIRRO BOA SORTE - COMUNIDADE SAO LUCAS","66 992604920","escola.14591@edu.mt.gov.br",-11.3841,-58.7807],["14630","EE MILITAR TIRADENTES PADRE EZEQUIEL RAMIN",5,"JUÍNA","ESCOLA MILITAR","U","Rua Pe. Ezequiel Ramin","125W","78.320-000","Modulo 05","66 35662700","escola.14630@edu.mt.gov.br",-11.4189,-58.7758],["14575","EECM DOUTOR ARTUR ANTUNES MACIEL",5,"JUÍNA","ESCOLA CÍVICO-MILITAR","U","RUA PAULO CARNEIRO DA SILVA","45N","78.320-000","MÓDULO 02","66 35662022","escola.14575@edu.mt.gov.br",-11.4216,-58.7606],["192031","EEI ENAWENÊ NAWÊ",5,"JUÍNA","ESCOLA INDÍGENA","R","BR 174 - terra indigena enawenê nawê","s/n","78.320-000","Aldeia Halaitaikwa","66 35661106","escola.192031@edu.mt.gov.br",-11.2779,-58.3182],["166308","EEI ETEREPUIY",5,"JUÍNA","ESCOLA INDÍGENA","R","Aldeia Rio  Capivara","SN","78.320-000","Zona Rural","66 35661106","escola.166308@edu.mt.gov.br",-11.2425,-59.2447],["192040","EE ALINE MARIA TEIXEIRA",5,"JURUENA","ESCOLA INTEGRAL","U","Rua Ezequiel Ramin","s/n","78.340-000","VILA NOVA","66 35532041","escola.192040@edu.mt.gov.br",-10.3305,-58.5073],["21083","EE DOM AQUINO CORRÊA",5,"JURUENA","ESCOLA","U","RUA 07 DE MAIO","42","78.340-000","CENTRO","66 35531404","escola.21083@edu.mt.gov.br",-10.3309,-58.4964],["15849","EE ROSMAY KARA JOSÉ",5,"NOVO HORIZONTE DO NORTE","ESCOLA","U","RUA IGUAÇU","562","78.570-000","CENTRO","66 981365599","escola.15849@edu.mt.gov.br",-11.3887,-57.3179],["15806","EE JOSÉ ALVES BEZERRA",5,"PORTO DOS GAÚCHOS","ESCOLA","U","AV. GUILHERME MEYER","1450","78.560-000","CENTRO","66 35261193","escola.15806@edu.mt.gov.br",-11.5362,-57.4062],["154970","EE JOSÉ CLETO GIEHL",5,"PORTO DOS GAÚCHOS","ESCOLA CAMPO","R","RUA UMUARAMA","1","78.560-000","COMUNIDADE NOVO PARANA - ZONA RURAL","66 999261947","escola.154970@edu.mt.gov.br",-11.618,-57.235],["15814","EE RENATO SPINELLI",5,"PORTO DOS GAÚCHOS","ESCOLA CAMPO","R","RUA SAO PAULO","0","78.560-000","GLEBA SAO JOAO","66 35671064","escola.15814@edu.mt.gov.br",-11.4337,-57.0312],["16349","EE GUARANTÃ",6,"GUARANTÃ DO NORTE","ESCOLA INTEGRAL","U","RUA INHARÉ","937","78.520-000","CENTRO","66 9612-7856","escola.16349@edu.mt.gov.br",-9.9502,-54.9104],["16357","EE IRANY JAIME FARINA",6,"GUARANTÃ DO NORTE","ESCOLA CAMPO","R","Avenida dos Canários","344","78.520-000","Cotrel","66 99691842","escola.16357@edu.mt.gov.br",-9.9482,-54.9543],["16365","EE KREEN AKARORE",6,"GUARANTÃ DO NORTE","ESCOLA","U","RUA DAS CASTANHEIRAS","1657","78.520-000","CIDADE NOVA","66 35521923","escola.16365@edu.mt.gov.br",-9.9499,-54.919],["114561","EE PROFESSOR ÉLCIO PRATES",6,"GUARANTÃ DO NORTE","ESCOLA INTEGRAL/ESPORTE","U","AVENIDA SENADOR JONAS PINHEIRO","420","78.520-000","JARDIM AEROPORTO","66 35523489","escola.114561@edu.mt.gov.br",-9.9616,-54.9149],["60208","EECM ALBERT EINSTEIN",6,"GUARANTÃ DO NORTE","ESCOLA CÍVICO-MILITAR","U","RUA INHARÉ","835","78.520-000","CENTRO","66 984261244","escola.60208@edu.mt.gov.br",-9.9488,-54.9103],["49646","EE PAULO FREIRE",6,"MARCELÂNDIA","ESCOLA","U","Rua Tres Poderes","970","78.535-000","CENTRO","66 999428388","escola.49646@edu.mt.gov.br",-11.0864,-54.5212],["13552","EE PEDRO BIANCHINI",6,"MARCELÂNDIA","ESCOLA","U","RUA JOÃO BIONDARO","532","78535000","CENTRO","66 35361324","escola.13552@edu.mt.gov.br",-11.0832,-54.5217],["123013","EEI CENTRAL KAMADU",6,"MARCELÂNDIA","ESCOLA INDÍGENA","R","ALDEIA TUBA  TUBA","1","78.535-000","PARQUE INDIGENA DO XINGU","66 35362698","escola.123013@edu.mt.gov.br",-11.0289,-53.2869],["140813","EEI PANAKU",6,"MARCELÂNDIA","ESCOLA INDÍGENA","R","ALDEIA AIPORÉ","1","78.535-000","PARQUE INDIGENA DO XINGU","66 996369083","escola.140813@edu.mt.gov.br",-11.0462,-53.4219],["16381","EE ANTÔNIO OMETTO",6,"MATUPÁ","ESCOLA INTEGRAL/ESPORTE","U","AV. HERMINIO OMETTO","11","78.525-000","ZH1-001","66 996563293","escola.16381@edu.mt.gov.br",-10.1794,-54.9303],["16403","EE BAIRRO UNIÃO",6,"MATUPÁ","ESCOLA","U","Rua 10","46","78.525-000","União","66 999321666","escola.16403@edu.mt.gov.br",-10.1672,-54.9281],["154180","EE SENADOR JONAS PINHEIRO",6,"MATUPÁ","ESCOLA CAMPO","R","LINHA 03 - Comunidade Santo Antonio","s/n","78.525-000","Gleba União","66 35951365","escola.154180@edu.mt.gov.br",-10.17086,-54.25903],["38563","EECM JARDIM DAS FLORES",6,"MATUPÁ","ESCOLA CÍVICO-MILITAR","U","RUA 14","36","78.525-000","JARDIM DAS FLORES","66 992525884","escola.38563@edu.mt.gov.br",-10.1733,-54.9222],["153958","EEI TERENA DE KOMOMOYEA KOVÔERO",6,"MATUPÁ","ESCOLA INDÍGENA","R","Aldeia Indígena Kuxonety Pokeê - Iriri Novo","0","78.525-000","GLEBA IRIRI NOVO","66 35951365","escola.153958@edu.mt.gov.br",-9.7448,-53.7705],["44270","EE 13 DE MAIO",6,"NOVA GUARITA","ESCOLA","U","AVENIDA DOS MIGRANTES","1224","78.508-000","CENTRO","66 99716941","escola.44270@edu.mt.gov.br",-10.3053,-55.3994],["69582","EE ANDRÉ ANTÔNIO MAGGI",6,"NOVO MUNDO","ESCOLA","U","Rua Santa Catarina","101","78.528-000","CENTRO","66 35396076","escola.69582@edu.mt.gov.br",-9.9774,-55.1714],["16411","EE 19 DE JULHO",6,"PEIXOTO DE AZEVEDO","ESCOLA","U","RUA CRISTAL","314","78.530-000","CENTRO","66 997122800","escola.16411@edu.mt.gov.br",-10.2405,-54.9921],["124052","EE LEONÍSIO LEMOS MELO",6,"PEIXOTO DE AZEVEDO","ESCOLA CAMPO","R","Rua Joaquim de Barros","0","78.530-000","Alto Alegre","66 35041141","escola.124052@edu.mt.gov.br",-10.4359,-54.4516],["16454","EE LUCIENE CARDOSO DE OLIVEIRA",6,"PEIXOTO DE AZEVEDO","ESCOLA","U","RUA COLÍDER","368","78.530-000","AEROPORTO","66 999035369","escola.16454@edu.mt.gov.br",-10.2502,-54.9888],["40320","EE MILITAR TIRADENTES 2º SARGENTO PM LUCIANO JOSÉ QUEIROZ",6,"PEIXOTO DE AZEVEDO","ESCOLA MILITAR","U","RUA MATO GROSSO","365","78.530-000","AEROPORTO","65 992414067","escola.40320@edu.mt.gov.br",-10.2403,-55.0017],["16438","EECM KREEN AKARORE",6,"PEIXOTO DE AZEVEDO","ESCOLA CÍVICO-MILITAR","U","RUA WASHINGTON LUIZ","1","78.530-000","CENTRO","66 35752632","escola.16438@edu.mt.gov.br",-10.2379,-54.9963],["83607","EEI ELIO TURI RONDON TERENA",6,"PEIXOTO DE AZEVEDO","ESCOLA INDÍGENA","R","MT322","s/n","78.530-000","ALDEIA KOPENOTY","66 35041126","escola.83607@edu.mt.gov.br",-10.4493,-54.4171],["158380","EEI GORONÃ",6,"PEIXOTO DE AZEVEDO","ESCOLA INDÍGENA","R","ALDEIA KAMERETXIKO CAPOTO JARINA","001","78.530-000","ALDEIA","66 99991539","escola.158380@edu.mt.gov.br",-10.5289,-53.4199],["124001","EEI METUKTIRE",6,"PEIXOTO DE AZEVEDO","ESCOLA INDÍGENA","R","ALDEIA METUKTIRE","123","78.530-000","Zona Rural","66 98102875","escola.124001@edu.mt.gov.br",-10.33779,-53.03561],["13498","EE 12 DE ABRIL",6,"TERRA NOVA DO NORTE","ESCOLA","U","Av Clóves Felício Vettorato","186","78.505-000","CENTRO","66 35341217","escola.13498@edu.mt.gov.br",-10.5984,-55.1146],["13528","EE LUCAS AUXÍLIO TONIAZZO",6,"TERRA NOVA DO NORTE","ESCOLA CAMPO","R","BR 163, KM 667, AVENIDA PRINCIPAL, CENTRO","s/n","78.505-000","ZONA RURAL, AGROVILA XANXERÊ","66 996453232","escola.13528@edu.mt.gov.br",-10.5165,-55.2306],["160040","EE TERRA NOVA",6,"TERRA NOVA DO NORTE","ESCOLA CAMPO/INTEGRAL/AGRÍCOLA","R","RUA PRINCIPAL","001","78.505-000","DÉCIMA AGROVILA","66 996558689","escola.160040@edu.mt.gov.br",-10.4244,-54.842],["10774","EE DOM ANTÔNIO CAMPELO",7,"ACORIZAL","ESCOLA INTEGRAL","U","RUA DOZE DE DEZEMBRO","s/n","78.485-000","CANDONGA","65 33531216","escola.10774@edu.mt.gov.br",-15.2023,-56.3633],["10804","EE PIO MACHADO",7,"ACORIZAL","ESCOLA","U","LOCALIDADE","704","78485000","CENTRO","65 33531217","escola.10804@edu.mt.gov.br",-15.1999,-56.3667],["10766","EE PONCE DE ARRUDA",7,"ACORIZAL","ESCOLA CAMPO","R","Av. Eduardo José da Cruz","0","78.485-000","ALDEIA","65 999662931","escola.10766@edu.mt.gov.br",-15.1529,-56.4158],["10758","EE PROFESSORA CEZINA ANTÔNIA BOTELHO",7,"ACORIZAL","ESCOLA CAMPO/INTEGRAL/MISTA","R","Praça Sebastião de arruda botelho","0","78.485-000","Centro - Distrito de Baús","65 999330682","escola.10758@edu.mt.gov.br",-15.2358,-56.2949],["12629","EECM CORONEL ANTÔNIO PAES DE BARROS",7,"BARÃO DE MELGAÇO","ESCOLA INTEGRAL/MISTA","U","AVENIDA MARECHAL RONDON","0","78.190-000","CENTRO","65 33311277","escola.12629@edu.mt.gov.br",-16.2001,-55.9688],["12610","EE PROFESSORA MARIA SILVINA PEIXOTO DE MOURA",7,"BARÃO DE MELGAÇO","ESCOLA CAMPO","R","Povoado São Pedro","0","78.190-000","Distrito de Joselândia","65 36344443","escola.12610@edu.mt.gov.br",-16.5723,-56.2075],["78298","EEI KOGE EIARI",7,"BARÃO DE MELGAÇO","ESCOLA INDÍGENA","R","ALDEIA INDIGENA PERIGARA","s n","78.190-000","Zona Rural","65 33311107","escola.78298@edu.mt.gov.br",-16.9203,-56.2294],["10243","EE CORONEL RAFAEL DE SIQUEIRA",7,"CHAPADA DOS GUIMARÃES","ESCOLA INTEGRAL","U","Rua Santo Antonio","350","78.195-000","CENTRO","65 33011572","escola.10243@edu.mt.gov.br",-15.4611,-55.75],["10278","EE REUNIDAS DE CACHOEIRA RICA",7,"CHAPADA DOS GUIMARÃES","ESCOLA QUILOMBOLA","R","Av. Principal","s/n","78.195-000","Cachoeira Rica","65 99960665","escola.10278@edu.mt.gov.br",-15.2674,-55.6023],["10260","EE SÃO JOSÉ",7,"CHAPADA DOS GUIMARÃES","ESCOLA CAMPO","R","AV: PRINCIPAL","s/nº","78.197-000","CENTRO","65 33041081","escola.10260@edu.mt.gov.br",-15.18,-55.7534],["44954","EECM PROFESSORA ANA TEREZA ALBERNAZ",7,"CHAPADA DOS GUIMARÃES","ESCOLA CÍVICO-MILITAR","U","RUA DAS PALMEIRAS","480","78.195-000","SAO SEBASTIÃO","65 33011725","escola.44954@edu.mt.gov.br",-15.467,-55.7356],["60224","CEAADA PROFESSORA ARLETE PEREIRA MIGUELETTI",7,"CUIABÁ","ESCOLA ESPECIALIZADA/INTEGRAL","U","Rua General Vale","189","78.010-200","BANDEIRANTES","65 30543343","escola.60224@edu.mt.gov.br",-15.6025,-56.0935],["10430","EE ALINA DO NASCIMENTO TOCANTINS",7,"CUIABÁ","ESCOLA","U","AVENIDA IPIRANGA","2560","78.030-500","CIDADE ALTA","65 36375186","escola.10430@edu.mt.gov.br",-15.6111,-56.1207],["10502","EE AUREOLINA EUSTÁCIA RIBEIRO",7,"CUIABÁ","ESCOLA INTEGRAL/MISTA","U","AV GENEROSO MALHEIROS (PRAÇA CENTRAL)","305","78.028-685","CIDADE VERDE","65 36236089","escola.10502@edu.mt.gov.br",-15.6109,-56.1319],["21091","EECM CLÊINIA ROSALINA DE SOUZA",7,"CUIABÁ","ESCOLA INTEGRAL/ESPORTE","U","Rua A Quadra 15 Esquina 06","247","78.058-000","Residencial Itamaraty","65 36531432","escola.21091@edu.mt.gov.br",-15.5858,-56.0386],["10731","EE DE ENSINO ESPECIAL LIVRE APRENDER",7,"CUIABÁ","ESCOLA ESPECIALIZADA","U","RUA A","1597","78.010-670","AREÃO","65 98463989","escola.10731@edu.mt.gov.br",-15.5972,-56.0791],["9920","EECM DJALMA FERREIRA DE SOUZA",7,"CUIABÁ","ESCOLA INTEGRAL/ARTE","U","AV Djalma Ferreira de Souza, S/N","s/nº","78.053-000","Morada do Ouro","65 993478513","escola.9920@edu.mt.gov.br",-15.5714,-56.0643],["9717","EECM DOUTOR ESTEVÃO ALVES CORRÊA",7,"CUIABÁ","ESCOLA","U","RUA 230 QUADRA 66 SETOR II","51","78.088-260","TIJUCAL","65 36657505","escola.9717@edu.mt.gov.br",-15.6305,-56.0143],["9857","EECM FRANCISCO ALEXANDRE FERREIRA MENDES",7,"CUIABÁ","ESCOLA INTEGRAL","U","RUA DOUTOR ÁUREO LINO DA SILVA","363","78.068-545","BOA ESPERANÇA","65 992297207","escola.9857@edu.mt.gov.br",-15.6146,-56.0631],["194565","EECM GOVERNADOR JOSÉ FRAGELLI",7,"CUIABÁ","ESCOLA INTEGRAL/ESPORTE","U","AVENIDA AGRÍCOLA PAES DE BARROS","0","78.030-210","VERDÃO","65 992316157","escola.194565@edu.mt.gov.br",-15.605,-56.1218],["9679","EECM HERMELINDA DE FIGUEIREDO",7,"CUIABÁ","ESCOLA","U","Rua Londrina","37","78.085-225","Coophema","65 33587965","escola.9679@edu.mt.gov.br",-15.6346,-56.0587],["10359","EECM JOSÉ DE MESQUITA",7,"CUIABÁ","ESCOLA INTEGRAL/MISTA","U","RUA BARÃO DE MELGAÇO","945","78.025-300","PORTO","65 36371117","escola.10359@edu.mt.gov.br",-15.6131,-56.1141],["10340","EE LICEU CUIABANO MARIA DE ARRUDA MÜLLER",7,"CUIABÁ","ESCOLA","U","Praca General Mallet","150","78.045-250","Quilombo","65 33220242","escola.10340@edu.mt.gov.br",-15.5929,-56.1017],["9733","EECM MANOEL CAVALCANTE PROENÇA",7,"CUIABÁ","ESCOLA","U","RUA 107 QUADRA 14 SETOR 01 TIJUCAL FUNDO COM AV.DR.MEIRELLES","320","78.088-028","TIJUCAL","65 36663366","escola.9733@edu.mt.gov.br",-15.6361,-56.0224],["10707","EE MARCELINA DE CAMPOS",7,"CUIABÁ","ESCOLA","U","AV. PRINCIPAL QDA 18","472","78.035-750","SANTA AMÁLIA","65 21291106","escola.10707@edu.mt.gov.br",-15.5924,-56.1374],["10596","EE MILITAR DOM PEDRO II PRESIDENTE MÉDICI",7,"CUIABÁ","ESCOLA MILITAR","U","Avenida Mato Grosso","564","78.005-030","Araés","65 33215134","escola.10596@edu.mt.gov.br",-15.5894,-56.0961],["10693","EE MILITAR TIRADENTES",7,"CUIABÁ","ESCOLA MILITAR","U","AVENIDA GONÇALO ANTUNES DE BARROS","SN","78050667","CARUMBÉ","65 36417238","escola.10693@edu.mt.gov.br",-15.58134,-56.05029],["9326","EECM PADRE ERNESTO CAMILO BARRETO",7,"CUIABÁ","ESCOLA","U","RUA FORTALEZA","35","78.065-350","JARDIM PAULISTA","65 992175334","escola.9326@edu.mt.gov.br",-15.6172,-56.0847],["117595","EE PADRE FIRMO PINTO DUARTE FILHO",7,"CUIABÁ","ESCOLA","U","RUA A","121","78.097-014","Distrito Industrial","65 36677523","escola.117595@edu.mt.gov.br",-15.6471,-55.9933],["9911","EECM PADRE JOÃO PANAROTTO",7,"CUIABÁ","ESCOLA INTEGRAL/TECNOLOGIA","U","Rua 64 Quadra G CPA  IV 2ª Etapa","0","78.058-100","CPA IV  2ª ETAPA","65 998179894","escola.9911@edu.mt.gov.br",-15.5629,-56.0329],["9946","EECM PASCOAL MOREIRA CABRAL",7,"CUIABÁ","ESCOLA","U","RUA Avenida Asa Branca","0","78.075-335","RECANTO DOS PÁSSAROS","65 36632681","escola.9946@edu.mt.gov.br",-15.613,-56.0389],["9725","EECM PROFESSOR AGENOR FERREIRA LEÃO",7,"CUIABÁ","ESCOLA","U","Rua 314 -Quadra 102 - Setor III","94","78.088-390","TIJUCAL","65 36652002","escola.9725@edu.mt.gov.br",-15.625,-56.0085],["9610","EE PROFESSOR ANTÔNIO EPAMINONDAS",7,"CUIABÁ","ESCOLA INTEGRAL/LÍNGUAS","U","Rua Padre Remeter,","355","78.008-150","LIXEIRA","65 33222376","escola.9610@edu.mt.gov.br",-15.5928,-56.0848],["9652","EECM PROFESSOR BENEDITO DE CARVALHO",7,"CUIABÁ","ESCOLA","U","RUA A","296","78.053-438","MORADA DO OURO SETOR NORTE","65 99947790","escola.9652@edu.mt.gov.br",-15.5668,-56.0622],["42587","EE PROFESSOR RAFAEL RUEDA",7,"CUIABÁ","ESCOLA INTEGRAL/ESPORTE","U","AVENIDA INTEGRAÇÃO III","761","78099000","Pedra 90","65 992410518","escola.42587@edu.mt.gov.br",-15.6287,-55.9523],["9547","EECM PROFESSOR WELSON MESQUITA DE OLIVEIRA",7,"CUIABÁ","ESCOLA","U","RUA FRANCISCO DE JESUS","430","78.098-100","PASCOAL RAMOS","65 20180507","escola.9547@edu.mt.gov.br",-15.6407,-55.9814],["9865","EE PROFESSORA ALICE FONTES PINHEIRO",7,"CUIABÁ","ESCOLA","U","RUA E","157","78030385","JARDIM NOSSA SENHORA APARECIDA","65 984630960","escola.9865@edu.mt.gov.br",-15.6396,-56.047],["10057","EECM PROFESSORA DIONE AUGUSTA SILVA SOUZA",7,"CUIABÁ","ESCOLA","U","AVENIDA TUIUIU","45","78.058-000","CPA IV","65 98474243","escola.10057@edu.mt.gov.br",-15.5593,-56.0422],["94439","EECM PROFESSORA DIVA HUGUENEY DE SIQUEIRA BASTOS",7,"CUIABÁ","ESCOLA","U","AVENIDA SENADOR JONAS PINHEIRO","687","78.056-408","JARDIM ARUEIRA","65 99337936","escola.94439@edu.mt.gov.br",-15.5412,-56.0422],["9709","EECM PROFESSORA MARIANA LUIZA MOREIRA",7,"CUIABÁ","ESCOLA","U","AVENIDA SECUNDARIA III","644","78.088-620","TIJUCAL","65 36655614","escola.9709@edu.mt.gov.br",-15.6324,-56.0081],["9938","EE PROFESSORA PACIANA TORRES DE SANT'ANA",7,"CUIABÁ","ESCOLA","U","AVENIDA PRINCIPAL","585","78.090-274","RESIDENCIAL COXIPÓ","65 999371035","escola.9938@edu.mt.gov.br",-15.6464,-56.0332],["9849","EECM RAIMUNDO PINHEIRO DA SILVA",7,"CUIABÁ","ESCOLA","U","AV. FERNANDO CORREA DA COSTA","3610","78.070-200","SHANGRILÁ","65 36273350","escola.9849@edu.mt.gov.br",-15.6232,-56.0634],["10642","EE RAIO DE SOL",7,"CUIABÁ","ESCOLA ESPECIALIZADA","U","RUA RIO MANSO","s/n","78.065-705","GRANDE TERCEIRO","65 36222431","escola.10642@edu.mt.gov.br",-15.6249,-56.0802],["21628","EECM RODOLFO AUGUSTO TRECHAUD E CURVO",7,"CUIABÁ","ESCOLA","U","RUA J QUADRA 09","25","78.048-090","RESIDENCIAL PAIAGUÁS","65 36236967","escola.21628@edu.mt.gov.br",-15.5624,-56.0832],["9830","EE SANTOS DUMONT",7,"CUIABÁ","CONFESSIONAL","U","RUA PIMENTA BUENO","534","78.015-190","DOM AQUINO","65 33651999","escola.9830@edu.mt.gov.br",-15.6164,-56.091],["9474","EE SOUZA BANDEIRA",7,"CUIABÁ","CONFESSIONAL","U","AV. FERNANDO CORREA DA COSTA","214","78.070-210","COXIPÓ DA PONTE","65 36271320","escola.9474@edu.mt.gov.br",-15.6217,-56.0652],["10065","EE TANCREDO DE ALMEIDA NEVES",7,"CUIABÁ","ESCOLA","U","RUA MILITAR","185","78.060-000","JARDIM LEBLON","65 36534849","escola.10065@edu.mt.gov.br",-15.5998,-56.0747],["10480","EECM ALCEBÍADES CALHÃO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA FILINTO MULLER","1300","78.043-409","Quilombo","65 36220154","escola.10480@edu.mt.gov.br",-15.586,-56.1039],["9520","EECM ANDRÉ AVELINO RIBEIRO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Av. Deputado Osvaldo Candido Pereira","365","78.055-210","Morada da Serra CPA I","65 36413039","escola.9520@edu.mt.gov.br",-15.5564,-56.0522],["9571","EECM DOUTOR HÉLIO PALMA DE ARRUDA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Av Dante Martins de Oliveira Quadra 08","s/n","78.058-751","Novo Mato Grosso","65 984721217","escola.9571@edu.mt.gov.br",-15.5824,-56.0441],["9687","EECM DOUTOR LEÔNIDAS ANTERO DE MATOS",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","rua 36 qd 43","s/n","78.058-300","CPA III setor III","65 36464214","escola.9687@edu.mt.gov.br",-15.5713,-56.0456],["20516","EECM DOUTOR MÁRIO DE CASTRO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA NEWTTON RABELO DE CASTRO QUADRA 180","23","78099005","Pedra 90","65 992455522","escola.20516@edu.mt.gov.br",-15.6327,-55.9452],["10456","EECM FILOGÔNIO CORRÊA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AV. SINFRONIO DE CAMARGO","691","78.104-000","Distrito Nossa Senhora da Guia","65 33534238","escola.10456@edu.mt.gov.br",-15.3507,-56.2334],["10405","EECM GUSTAVO KULMAN",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA SETE","SN","78.055-766","JARDIM VITÓRIA","65 981417794","escola.10405@edu.mt.gov.br",-15.5412,-56.0655],["9806","EECM HISTORIADOR RUBENS DE MENDONÇA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA B","77","78.090-839","COHAB SÃO GONÇALO","65 21365190","escola.9806@edu.mt.gov.br",-15.6472,-56.0453],["9393","EECM JOÃO BRIENNE DE CAMARGO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA JOÃO GOMES SOBRINHO","1092","78.008-800","LIXEIRA","65 33588578","escola.9393@edu.mt.gov.br",-15.5962,-56.0791],["184152","EECM JUAREZ RODRIGUES DOS ANJOS",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua Padre Amadeu (RUA DO COLÉGIO)","s/n","78.091-138","Santa Laura","65 99282577","escola.184152@edu.mt.gov.br",-15.6191,-55.9927],["9440","EECM LEOVEGILDO DE MELO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA 25 QUADRA 42","58","78.058-382","CPA III SETOR V","65 36465843","escola.9440@edu.mt.gov.br",-15.5623,-56.0358],["23329","EECM MALIK DIDIER NAMER ZAHAFI",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Avenida Newton Rabelo de Castro","425","78.099-005","Pedra 90","65 40420193","escola.23329@edu.mt.gov.br",-15.6336,-55.9456],["10421","EECM PADRE WANIR DELFINO CÉSAR",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Professor Floriano Siqueira de Carvalho","421","78.028-301","NOVO TERCEIRO","65 36343008","escola.10421@edu.mt.gov.br",-15.6155,-56.1319],["9482","EECM PROFESSOR HELIODORO CAPISTRANO DA SILVA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA D4 QUADRA 130","1","78.095-292","PARQUE CUIABA","65 36610847","escola.9482@edu.mt.gov.br",-15.6604,-56.0485],["76201","EECM PROFESSOR JOÃO CRISÓSTOMO DE FIGUEIREDO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua Bandeirantes quadra 86","625","78.058-725","Dr Fábio Leite II","65 992563048","escola.76201@edu.mt.gov.br",-15.5644,-56.0122],["10588","EECM PROFESSOR ULISSES CUIABANO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA DOS MIOSOTIS","555","78.043-116","JARDIM CUIABA","65 999255423","escola.10588@edu.mt.gov.br",-15.5954,-56.1188],["9814","EECM PROFESSORA ANA MARIA DO COUTO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AV.BRASIL","905","78.055-508","CPA II","65 99906669","escola.9814@edu.mt.gov.br",-15.5589,-56.0486],["49859","EECM PROFESSORA ELIANE DIGIGOV SANTANA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA VEREADOR JULIANO DA COSTA MARQUES","1503","78.050-560","BELA VISTA","65 36537082","escola.49859@edu.mt.gov.br",-15.5809,-56.0582],["124060","EECM PROFESSORA MARIA HERMÍNIA ALVES",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","RUA 101, QUADRA 89","SN","78.058-150","CPA IV","65 33591036","escola.124060@edu.mt.gov.br",-15.5563,-56.037],["49832","EECM SALIM FELÍCIO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Avenida Sebastião Rodrigues Lima","371","78.095-280","Parque Cuiabá","65 36660013","escola.49832@edu.mt.gov.br",-15.672,-56.039],["10448","EECM SENADOR AZEREDO",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA SENADOR METELLO","675","78.020-600","PORTO","65 999801673","escola.10448@edu.mt.gov.br",-15.6091,-56.1055],["9903","EECM VICTORINO MONTEIRO DA SILVA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","Rua I","s/n","78056-716","Ilza Terezinha Picolli Pagot","65 999466525","escola.9903@edu.mt.gov.br",-15.5353,-56.0344],["10154","EECM ZÉLIA COSTA DE ALMEIDA",7,"CUIABÁ","ESCOLA CÍVICO-MILITAR","U","AVENIDA F","273","78.090-320","JARDIM PRESIDENTE 2","65 36653213","escola.10154@edu.mt.gov.br",-15.6466,-56.0278],["212431","EEDIEB ANTÔNIO CESÁRIO DE FIGUEIREDO NETO",7,"CUIABÁ","ESCOLA","U","TRAVESSA FRANCISCO DE SIQUEIRA","195","78.010-010","BANDEIRANTES","65 33228754","escola.212431@edu.mt.gov.br",-15.6016,-56.0939],["212512","EEDIEB PROFESSORA ALMIRA DE AMORIM SILVA",7,"CUIABÁ","ESCOLA","U","AVENIDA OSASCO","765","78055055","CPA I","65 36414050","escola.212512@edu.mt.gov.br",-15.5655,-56.0461],["12378","EE ARNALDO ESTEVÃO DE FIGUEIREDO",7,"JANGADA","ESCOLA","U","Rua Ramiro Vieira Mendes","0","78.490-000","CENTRO","65 33441297","escola.12378@edu.mt.gov.br",-15.2368,-56.4856],["12386","EE BENEDITA AUGUSTA LEMES",7,"JANGADA","ESCOLA CAMPO","R","NOVO MATO GROSSO","0","78.490-000","Zona Rural","65 33441300","escola.12386@edu.mt.gov.br",-15.3741,-56.617],["21679","EE DAMIÃO MAMEDES DO NASCIMENTO",7,"JANGADA","ESCOLA CAMPO","R","Comunidade do Mutum","0","78.490-000","Zona Rural","65 33441300","escola.21679@edu.mt.gov.br",-15.3674,-56.6424],["45110","EE LUIZA SOARES BOABAID",7,"JANGADA","ESCOLA CAMPO","R","RUA VIVA VIDA","100","78.490-000","NOVA JANGADA","65 33441031","escola.45110@edu.mt.gov.br",-15.1813,-56.5189],["21652","EE PROFESSOR ARLINDO DE SOUZA BRUNO",7,"JANGADA","ESCOLA","U","avenida um","1","78.490-000","altos da jangada","65 33441298","escola.21652@edu.mt.gov.br",-15.2391,-56.4919],["12475","EE FELICIANO GALDINO",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA INTEGRAL/MISTA","U","RUA FELICÍSSIMO JOSÉ DA SILVA","117","78.170-000","CENTRO","65 33511456","escola.12475@edu.mt.gov.br",-15.7748,-56.3474],["40096","EE FREI EMILIANO MONTEIRO",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CAMPO","R","COMUNIDADE DE CAMPO ALEGRE DE CIMA","1","78.170-000","Zona Rural","65 992299760","escola.40096@edu.mt.gov.br",-15.7346,-56.5725],["21660","EE JOSÉ DE LIMA BARROS",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CAMPO","R","RUA MADRE MARIA ANTONIA","22","78.170-000","CENTRO - DISTRITO DE FAVAL","65 33511322","escola.21660@edu.mt.gov.br",-15.782,-56.7287],["153877","EE TEREZA CONCEIÇÃO DE ARRUDA",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA QUILOMBOLA/INTEGRAL/MISTA","R","RODOVIA TRANSPANTANEIRA MT 060 KM 25","10","78.170-000","QUILOMBO MATA CAVALO","65 98402265","escola.153877@edu.mt.gov.br",-15.8685,-56.41],["12440","EE VEREADOR AMARÍLIO GOMES DA SILVA",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CAMPO","R","AVENIDA PRINCIPAL","1","78.170-000","DISTRITO DE RIBEIRÃO DOS COCAIS","65 992299760","escola.12440@edu.mt.gov.br",-15.78,-56.2242],["12394","EECM JOSÉ DE BARROS MACIEL",7,"NOSSA SENHORA DO LIVRAMENTO","ESCOLA CÍVICO-MILITAR","U","Rua:Cel.Manoel Felix","121","78.170-000","CENTRO","65 33511196","escola.12394@edu.mt.gov.br",-15.7742,-56.3453],["10189","EECM PADRE JOSÉ MARIA DO SACRAMENTO",7,"NOVA BRASILÂNDIA","ESCOLA","U","AVENIDA VEREADOR GENIVAL NUNES DE ARAUJO","1341","78.860-000","CENTRO","66 33851401","escola.10189@edu.mt.gov.br",-14.9242,-54.9742],["38806","EECM ALVARINA ALVES DE FREITAS",7,"PLANALTO DA SERRA","ESCOLA","U","Rua Rosário Oeste","300","78.855-000","CENTRO","66 33286145","escola.38806@edu.mt.gov.br",-14.6637,-54.7737],["158810","EE ANTÔNIO GARCIA",7,"POCONÉ","ESCOLA CAMPO","R","Km 120 da BR 070, proximo ao posto 120","s/n","78.175-000","S/N","65 99964037","escola.158810@edu.mt.gov.br",-15.9371,-57.032],["12718","EECM BACHAREL RIBEIRO DE ARRUDA",7,"POCONÉ","ESCOLA INTEGRAL","U","RUA TIRADENTES","1305","78.175-000","CENTRO","65 33451556","escola.12718@edu.mt.gov.br",-16.2705,-56.6249],["12726","EE DOM FRANCISCO DE AQUINO CORRÊA",7,"POCONÉ","ESCOLA CAMPO","R","Rua Santa Terezinha","s/n","78.175-000","Distrito de Cangas","65 992365037","escola.12726@edu.mt.gov.br",-16.0787,-56.5698],["12670","EECM FREI CARLOS VALETTE",7,"POCONÉ","ESCOLA","U","AV. PINHEIRO MACHADO","1266","78.175-000","BOM PASTOR","65 33452344","escola.12670@edu.mt.gov.br",-16.2533,-56.632],["12742","EE PROFESSORA MARIA HELENA DE ARAÚJO BASTOS",7,"POCONÉ","ESCOLA","U","Rua São João Del Rey","688","78.175-000","jurumirim","65 33452662","escola.12742@edu.mt.gov.br",-16.264,-56.6412],["12688","EECM ANTÔNIO JOÃO RIBEIRO DE ARRUDA",7,"POCONÉ","ESCOLA CÍVICO-MILITAR","U","Rua Coronel Teófilo s/nº","s/n","78.175-000","São Benedito","65 33452737","escola.12688@edu.mt.gov.br",-16.2672,-56.6277],["12700","EECM PROFESSORA EUCÁRIS NUNES DA CUNHA E MORAES",7,"POCONÉ","ESCOLA CÍVICO-MILITAR","U","Rua Joaquim Murtinho","167","78.175-000","CENTRO","65 33452359","escola.12700@edu.mt.gov.br",-16.2601,-56.6268],["12505","EE FAUSTINO DIAS DE AMORIM",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO","R","Rua Bom Jesus","03","78.180-000","Varginha","65 999807933","escola.12505@edu.mt.gov.br",-15.814,-56.1009],["12564","EE HERMES RODRIGUES DE ALCÂNTARA",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA","U","Rua XV de Novembro","10","78.180-000","CENTRO","65 33411516","escola.12564@edu.mt.gov.br",-15.867,-56.0716],["76228","EE MARIA DE ARRUDA MÜLLER",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA QUILOMBOLA/INTEGRAL/MISTA","R","BR 364 KM 353","s/nº","78.180-000","FAZENDA ABOLIÇÃO","65 992108545","escola.76228@edu.mt.gov.br",-15.7898,-55.6071],["12513","EE NAGIB SAAD",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO/INTEGRAL/MISTA","R","Av. Faustino Dias Neto","0","78.180-000","Agrovila das Palmeiras","65 33351098","escola.12513@edu.mt.gov.br",-15.9659,-55.5381],["12580","EE OSWALDITA ELIZA TEIXEIRA COUTO",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA","U","Praça:Deputado Eugênio Vieira de Figueiredo","97","78.180-000","CENTRO","65 998192639","escola.12580@edu.mt.gov.br",-15.8667,-56.0793],["12556","EE SANTA CLAUDINA",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO/INTEGRAL/MISTA","R","Av Principal","44","78.180-000","Mimoso","65 33411070","escola.12556@edu.mt.gov.br",-16.2737,-55.7994],["117587","EE SANTANA DO TAQUARAL",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CAMPO","R","acesso as fazendas amparo e bandeirantes","SN","78.180-000","PA SANTANA DO TAQUARAL","06501010101","escola.117587@edu.mt.gov.br",-16.0499,-55.5039],["12548","EECM LEÔNIDAS DE MATOS",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA CÍVICO-MILITAR","U","AVENIDA SANTO ANTONIO","585","78.180-000","CENTRO","65 33411589","escola.12548@edu.mt.gov.br",-15.8639,-56.0756],["120979","EEI KOROGEDO PARU",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA INDÍGENA","R","Aldeia Córrego Grande","01","78.180-000","ALDEIA","65 44007637","escola.120979@edu.mt.gov.br",-16.5934,-55.2139],["119202","EEI PIEBAGA",7,"SANTO ANTÔNIO DO LEVERGER","ESCOLA INDÍGENA","R","aldeia piebaga","0","78.180-000","Tereza Cristina","65 33411773","escola.119202@edu.mt.gov.br",-16.5936,-54.9891],["12025","CHP PROFESSORA CÉLIA RODRIGUES DUQUE",7,"VÁRZEA GRANDE","ESCOLA ESPECIALIZADA","U","RUA MIGUEL LEITE","266","78.110-044","CENTRO SUL","65 36861464","escola.12025@edu.mt.gov.br",-15.652,-56.138],["75116","EE DE ENSINO ESPECIAL LUZ DO SABER",7,"VÁRZEA GRANDE","ESCOLA ESPECIALIZADA","U","RUA GONÇALO BOTELHO DE CAMPOS","251","78.116-136","PONTE NOVA","65 33623377","escola.75116@edu.mt.gov.br",-15.6276,-56.1157],["12157","EE DEPUTADO EMANUEL PINHEIRO",7,"VÁRZEA GRANDE","ESCOLA","U","AV. DOM ORLANDO CHAVES","778","78.115-970","Cristo Rei","65 99219321","escola.12157@edu.mt.gov.br",-15.6332,-56.1087],["11959","EE DEPUTADO GONÇALO BOTELHO DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/MISTA","U","Rua Jacob do Bandolim","30","78.128-234","Jd. Costa Verde","65 36867002","escola.11959@edu.mt.gov.br",-15.6792,-56.1227],["12319","EE DEPUTADO MILTON FIGUEIREDO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA CRUZEIRO DO SUL","22","78.158-006","JARDIM DOS ESTADOS","65 33641137","escola.12319@edu.mt.gov.br",-15.6404,-56.1747],["12181","EE DEPUTADO UBALDO MONTEIRO DA SILVA",7,"VÁRZEA GRANDE","ESCOLA","U","RUA MINAS GERAIS","s/nº","78.158-018","JARDIM DOS ESTADOS","65 36827815","escola.12181@edu.mt.gov.br",-15.6391,-56.1745],["12246","EE DOM BOSCO",7,"VÁRZEA GRANDE","ESCOLA","U","AV. PRINCIPAL DA COHAB DOM BOSCO","40","78.110-002","Cristo Rei","65 36857224","escola.12246@edu.mt.gov.br",-15.6485,-56.0973],["49875","EE DOMINGOS SÁVIO BRANDÃO LIMA",7,"VÁRZEA GRANDE","ESCOLA","U","RUA ARI PAES BARRETO","s/nº","78.118-091","Cristo Rei","65 36851523","escola.49875@edu.mt.gov.br",-15.6446,-56.1051],["71765","EECM DUNGA RODRIGUES",7,"VÁRZEA GRANDE","ESCOLA","U","AVENIDA CEL. SÉRGIO JULIÃO DE BRITO","s/n","78.120-400","PARQUE DO LAGO","65 36913990","escola.71765@edu.mt.gov.br",-15.6601,-56.0914],["173576","EECM GOVERNADOR DANTE MARTINS DE OLIVEIRA",7,"VÁRZEA GRANDE","ESCOLA","U","RUA CARVÃO BRANCO","s/n","78.149-502","NOVO MUNDO","65 36852737","escola.173576@edu.mt.gov.br",-15.6272,-56.1862],["173584","EE GOVERNADOR JOSÉ GARCIA NETO",7,"VÁRZEA GRANDE","ESCOLA","U","Av. Mario Andreazza","SN","78.144-850","Jardim Taruma","65 981436828","escola.173584@edu.mt.gov.br",-15.6171,-56.1773],["12289","EE IRMÃOS DO CAMINHO",7,"VÁRZEA GRANDE","ESCOLA CAMPO","R","Av Principal","0","78.110-002","SOUZA LIMA","65 36868186","escola.12289@edu.mt.gov.br",-15.7219,-56.1317],["104248","EE JAYME VERÍSSIMO DE CAMPOS JÚNIOR - JAIMINHO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA DAS BEGÔNIAS QUADRA  03 LOTES 04 e 05","SN","78.158-401","JARDIM DOS ESTADO LOTEAMENTO TARUMA","65 36954457","escola.104248@edu.mt.gov.br",-15.6197,-56.1709],["11940","EECM JOSÉ LEITE DE MORAES",7,"VÁRZEA GRANDE","ESCOLA","U","RUA SENADOR VICENTE VUOLO","0","78.118-081","Cristo Rei","65 36851608","escola.11940@edu.mt.gov.br",-15.6438,-56.1052],["40452","EE JÚLIO STRUBING MÜLLER",7,"VÁRZEA GRANDE","ESCOLA","U","AV. DOM ORLANDO CHAVES (UNIVAG BLOCO - C2)","2655","78.118-650","Cristo Rei","65 33623697","escola.40452@edu.mt.gov.br",-15.6448,-56.1055],["12149","EE MANOEL GOMES",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL","U","TRAVESSA BARNABé","3","78.115-540","MANGA","65 996833400","escola.12149@edu.mt.gov.br",-15.6312,-56.1143],["11991","EE MILITAR TIRADENTES TENENTE CORONEL PM LOUIRSON RODRIGUES BENEVIDES",7,"VÁRZEA GRANDE","ESCOLA MILITAR","U","RUA GOVERNADOR PEDRO PEDROSSIAN","s/n","78.110-069","JARDIM AEROPORTO","65 36842684","escola.11991@edu.mt.gov.br",-15.6465,-56.125],["12114","EE PEDRO GARDÉS",7,"VÁRZEA GRANDE","ESCOLA","U","AV. Filinto Muller","1511","78.110-056","CENTRO","65 36821318","escola.12114@edu.mt.gov.br",-15.6482,-56.1344],["12084","EE PORFÍRIA PAULA DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA","U","Rua Abdala José de Almeida","1","78.150-292","Santa isabel","65 36846571","escola.12084@edu.mt.gov.br",-15.6511,-56.1734],["11932","EE PROFESSOR FERNANDO LEITE DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA","U","AVENIDA ALZIRA SANTANA","347","78.135-626","CENTRO","65 36866007","escola.11932@edu.mt.gov.br",-15.6533,-56.1385],["12262","EE PROFESSOR HONÓRIO RODRIGUES AMORIM",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/LÍNGUAS","U","Rua Honorio Rodrigues - Quadra 22","s/n","78.118-184","Cristo Rei","65 36850029","escola.12262@edu.mt.gov.br",-15.6394,-56.0981],["12122","EECM PROFESSOR JERCY JACOB",7,"VÁRZEA GRANDE","ESCOLA","U","Rua São Judas Tadeu","99","78.138-040","Marajoara (antigo Água Vermelha)","65 99318466","escola.12122@edu.mt.gov.br",-15.6507,-56.1452],["12327","EE PROFESSOR JOSÉ MENDES MARTINS",7,"VÁRZEA GRANDE","ESCOLA","U","RUA: JOÃO LOPES MACEDO","4","78.120-520","JARDIM MARINGÁ II","65 36911863","escola.12327@edu.mt.gov.br",-15.6638,-56.0886],["12106","EE PROFESSORA ADALGISA DE BARROS",7,"VÁRZEA GRANDE","ESCOLA","U","AVENIDA PEDRO PEDROSSIAN","s/n","78.110-354","JARDIM AEROPORTO","65 999781725","escola.12106@edu.mt.gov.br",-15.6507,-56.1273],["106020","EE PROFESSORA ELIZABETH MARIA BASTOS MINEIRO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA ARACY DE ALMEIDA","n.º 1","78.152-124","SÃO MATHEUS","65 36945300","escola.106020@edu.mt.gov.br",-15.666,-56.1804],["12238","EECM PROFESSORA MARIA DA CUNHA BRUNO",7,"VÁRZEA GRANDE","ESCOLA","U","RUA DAS ACÁCIAS","s/nº","78.132-672","PRIMAVERA","65 36865215","escola.12238@edu.mt.gov.br",-15.689,-56.1334],["12335","EE PROFESSORA MARIA DE MACEDO RODRIGUES",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/MISTA","U","Rua Martins Afonso s/n","1","78.142-603","Mapim","65 36849061","escola.12335@edu.mt.gov.br",-15.6314,-56.1671],["12130","EE PROFESSORA MARIA LEITE MARCOSKI",7,"VÁRZEA GRANDE","ESCOLA","U","RUA TENENTE SOUZA MARQUES","s/n","78138452","MARAJOARA","65 36943662","escola.12130@edu.mt.gov.br",-15.656,-56.1564],["96865","EE PROFESSORA MARLENE MARQUES DE BARROS",7,"VÁRZEA GRANDE","ESCOLA","U","RUA PERU  QUADRA 01","8","78.143-330","JARDIM IMPERIAL","65 36953242","escola.96865@edu.mt.gov.br",-15.6205,-56.1701],["12254","EECM ARLETE MARIA DA SILVA",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","RUA F QUADRA 12","0","78.150-442","COHAB ASA BELA","65 36845207","escola.12254@edu.mt.gov.br",-15.6543,-56.1764],["12017","EECM DEPUTADO SALIM NADAF",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua Papa João Paulo (Cohab C Rei)","0","78.118-280","Cristo Rei","65 36913332","escola.12017@edu.mt.gov.br",-15.6584,-56.0982],["158364","EECM ERNANDY MAURÍCIO BARACAT DE ARRUDA",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua 15 quadra 56","s/n","78.148-792","Nova Fronteira","65 36861229","escola.158364@edu.mt.gov.br",-15.6645,-56.159],["12050","EECM IRENE GOMES DE CAMPOS",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","Rua da Guarita","288","78.110-100","Figueirinha","65 36828255","escola.12050@edu.mt.gov.br",-15.6379,-56.138],["12300","EECM MIGUEL BARACAT",7,"VÁRZEA GRANDE","ESCOLA INTEGRAL/CÍVICO-MILITAR","U","rua treze","SN","78.125-200","Residencial São Benedito","65 36840581","escola.12300@edu.mt.gov.br",-15.6814,-56.1847],["11967","EECM PROFESSOR VANIL STABILITO",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","RUA JOÃO AUGUSTO DE FIGUEIREDO","10","78.130-095","CENTRO SUL","65 36945001","escola.11967@edu.mt.gov.br",-15.6654,-56.1351],["11975","EECM PROFESSORA ELMAZ GATTAS MONTEIRO",7,"VÁRZEA GRANDE","ESCOLA CÍVICO-MILITAR","U","rua Presidente Arthur Bernardes","s/n","78.110-798","Ipase","65 36853375","escola.11975@edu.mt.gov.br",-15.6619,-56.1243],["13153","EE CORA CORALINA",8,"COMODORO","ESCOLA INTEGRAL/MISTA","U","RUA CASSEMIRO DO VALE","184 S","78.310-000","NOVA VACARIA","65 32832318","escola.13153@edu.mt.gov.br",-13.6543,-59.8024],["13137","EE DEPUTADO DJALMA CARNEIRO DA ROCHA",8,"COMODORO","ESCOLA CAMPO","R","Rua dos Ipês","s/nº","78.310-000","Nova Alvorada","65 992601658","escola.13137@edu.mt.gov.br",-13.6501,-59.9142],["13145","EE DONA ROSA FRIGER PIOVEZAN",8,"COMODORO","ESCOLA","U","RUA CEARÁ","280 N","78.310-000","Tertúlia","65 32831222","escola.13145@edu.mt.gov.br",-13.6544,-59.7829],["154164","EEI MAMAINDE",8,"COMODORO","ESCOLA INDÍGENA","R","ALDEIA CAPITÃO PEDRO","0","78.310-000","ALDEIA","65 993373460","escola.154164@edu.mt.gov.br",-13.2014,-60.138],["158313","EEI PIRINEUS DE SOUZA",8,"COMODORO","ESCOLA INDÍGENA","R","ALDEIA AROEIRA","0","78.310-000","ALDEIA","69 99249018","escola.158313@edu.mt.gov.br",-12.7213,-59.9888],["69523","EE CONQUISTA D´OESTE",8,"CONQUISTA DO OESTE","ESCOLA","U","RUA DAS JABUTICABEIRAS","1339","78.254-000","CENTRO","65 32651199","escola.69523@edu.mt.gov.br",-14.5378,-59.5424],["13218","EE BARÃO DE MELGAÇO",8,"FIGUEIRÓPOLIS D'OESTE","ESCOLA","U","RUA ALAGOAS","76","78.290-000","CENTRO","65 32351299","escola.13218@edu.mt.gov.br",-15.4456,-58.739],["13170","EE DEPUTADO JOÃO EVARISTO CURVO",8,"JAURU","ESCOLA","U","AV. SANTOS DUMONT","50","78.255-000","CENTRO","65 32441779","escola.13170@edu.mt.gov.br",-15.3404,-58.8646],["13188","EE JUSCELINO KUBITSCHEK DE OLIVEIRA",8,"JAURU","ESCOLA CAMPO","R","RUA JUSCELINO KUBITSCHEK DE OLIVEIRA","245","78.255-000","CENTRO","65 992669933","escola.13188@edu.mt.gov.br",-15.1666,-58.8625],["69558","EE ANGELINA FRANCISCON MAZUTTI",8,"JÚLIO","ESCOLA","U","VOLMIR TABORDA CAMARA","676","78.319-000","BOM JARDIM","65 992654228","escola.69558@edu.mt.gov.br",-13.7126,-59.2601],["69264","EE HERMES JOSÉ DA SILVA",8,"NOVA LACERDA","ESCOLA","U","RUA ESPIRITO SANTO","400","78.243-000","SÃO JOSÉ","65 99217739","escola.69264@edu.mt.gov.br",-14.4789,-59.5914],["13048","EE DEPUTADO DORMEVIL FARIA",8,"PONTES E LACERDA","ESCOLA","U","RUA CEARÁ","782","78.250-000","CENTRO","65 32661221","escola.13048@edu.mt.gov.br",-15.2362,-59.3349],["13056","EE MÁRIO SPINELLI",8,"PONTES E LACERDA","ESCOLA","U","RUA 14 DE FEVEREIRO","303","78.250-000","CENTRO","65 32664042","escola.13056@edu.mt.gov.br",-15.2299,-59.3452],["13102","EE MILITAR TIRADENTES 1º TENENTE PM CARLOS HENRIQUE PASCHOIOTTO SCHEIFER",8,"PONTES E LACERDA","ESCOLA MILITAR","U","AVENIDA BOM JESUS","531","78.250-000","CENTRO","65 32661592","escola.13102@edu.mt.gov.br",-15.2273,-59.3398],["13072","EE SÃO JOSÉ",8,"PONTES E LACERDA","ESCOLA","U","RUA TEREZINHA COURA GARBIM","1545","78.250-000","SÃO JOSÉ","65 999903941","escola.13072@edu.mt.gov.br",-15.234,-59.3247],["65498","EE OLAVO BILAC",8,"RONDOLÂNDIA","ESCOLA","U","Rua Mathilde Klemz","0","78.338-000","CENTRO","66 35421117","escola.65498@edu.mt.gov.br",-10.8407,-61.4616],["145742","EEI SERTANISTA APOENA MEIRELLES",8,"RONDOLÂNDIA","ESCOLA INDÍGENA","R","ALDEIA INDIGENA SERTANISTA APOENA MEIRELLES","s/n","78.338-000","TERRA INDIGENA SETE DE SETEMBRO","66 99219379","escola.145742@edu.mt.gov.br",-10.8128,-61.423],["123994","EEI ZARUP WEJ",8,"RONDOLÂNDIA","ESCOLA INDÍGENA ALTERNÂNCIA INTEGRAL","R","Aldeia Zarup'Wej","0","78.338-000","Terra Indigena Zoró","66 35421001","escola.123994@edu.mt.gov.br",-10.8573,-60.7697],["191841","EEI ZAWÃ KAREJ PANGYJEJ",8,"RONDOLÂNDIA","ESCOLA INDÍGENA ALTERNÂNCIA INTEGRAL","R","Aldeia Zawã Karej Pangyjej","s/n","78.338-000","Aldeia Zawã Karej Pangyjej","66 35421001","escola.191841@edu.mt.gov.br",-10.6508,-61.1302],["69400","EE RAINHA DA PAZ",8,"VALE DE SÃO DOMINGOS","ESCOLA CAMPO","R","RUA HONORATO AZAMBUJA","s/nº","78.253-000","CENTRO","65 32681056","escola.69400@edu.mt.gov.br",-15.2941,-59.066],["176460","EE 11 DE AGOSTO",8,"VILA BELA DA SANTÍSSIMA TRINDADE","ESCOLA CAMPO","R","Francisca Verdecio","01","78.246-000","Distrito de Santa Clara do Monte Cristo","65 35281021","escola.176460@edu.mt.gov.br",-16.0988,-59.9628],["13129","EE VERENA LEITE DE BRITO",8,"VILA BELA DA SANTÍSSIMA TRINDADE","ESCOLA QUILOMBOLA","U","Rua Municipal","738","78.245-000","CENTRO","65 32591234","escola.13129@edu.mt.gov.br",-15.007,-59.9492],["173355","EE BOA ESPERANÇA",9,"CAMPO VERDE","ESCOLA CAMPO","R","Assentamento Dom Osório - ROD BR 070 KM 348+30 KM a Esquerda","s/n","78.840-000","Zona Rural","66 996525687","escola.173355@edu.mt.gov.br",-15.3294,-54.7568],["9539","EE GUSTAVO DUTRA",9,"CAMPO VERDE","ESCOLA CAMPO","R","BR 364 KM 329","SN","78.180-000","SAO VICENTE DA SERRA","65 33412008","escola.9539@edu.mt.gov.br",-15.8234,-55.4207],["157252","EE LEDY ANITA BRESCANCIN",9,"CAMPO VERDE","ESCOLA","U","AVENIDA VEREADOR CESAR LIMA","950","78.840-000","SÃO MIGUEL","66 996602846","escola.157252@edu.mt.gov.br",-15.5534,-55.1526],["16152","EE PROFESSORA ALICE BARBOSA PACHECO",9,"CAMPO VERDE","ESCOLA CAMPO","R","Agrovila João Ponce de Arruda","SN","78.846-899","Zona Rural","66 999964186","escola.16152@edu.mt.gov.br",-15.578,-55.362],["16136","EE WALDEMON MORAES COELHO",9,"CAMPO VERDE","ESCOLA","U","RUA BELÉM","507","78.840-000","CENTRO","66 999369579","escola.16136@edu.mt.gov.br",-15.5502,-55.17],["16144","EECM JUPIARA",9,"CAMPO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA DOS SULISTAS","117-1","78843-074","JUPIARA","66 999631855","escola.16144@edu.mt.gov.br",-15.5637,-55.1721],["49786","EECM ULISSES GUIMARÃES",9,"CAMPO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA RIO DE JANEIRO","915","78.840-073","CENTRO","66 999621151","escola.49786@edu.mt.gov.br",-15.5417,-55.1707],["45829","EE GERVÁSIO DOS SANTOS COSTA",9,"GAÚCHA DO NORTE","ESCOLA","U","RUA CAPANEMA ESQUNA COM MINAS GERAIS","974","78.875-000","CENTRO","66 981270880","escola.45829@edu.mt.gov.br",-13.1816,-53.2587],["75728","EEI CENTRAL LEONARDO VILLAS-BÔAS",9,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","POSTO LEONARDO","1004","78.875-000","TERRA INDÍGENA DO XINGU","66 992507178","escola.75728@edu.mt.gov.br",-12.1999,-53.378],["69302","EEI KARIB - COMUNIDADE KUIKURO",9,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","COMUNIDADE KUIKURO ALDEIA IPATSE","1004","78.875-000","PARQUE INDIGENA DO XINGU","11 914519315","escola.69302@edu.mt.gov.br",-12.3524,-53.2095],["129240","EEI PIYULAGA",9,"GAÚCHA DO NORTE","ESCOLA INDÍGENA","R","TERRA NACIONAL DO XINGU","1","78.875-000","ALDEIA WAURÁ","66 996822137","escola.129240@edu.mt.gov.br",-12.2486,-53.5827],["82260","EEI ADÃO TOPTIVO",9,"GENERAL CARNEIRO","ESCOLA INDÍGENA","R","ALDEIA ABELHINHA","1","78.620-000","ALDEIA","66 34161181","escola.82260@edu.mt.gov.br",-15.6058,-53.9151],["11495","EEI SÃO JOSÉ SANGRADOURO",9,"GENERAL CARNEIRO","ESCOLA INDÍGENA","R","ALDEIA SANGRADOURO KM 225 BR 070","1","78.620-000","ALDEIA","66 34161181","escola.11495@edu.mt.gov.br",-15.6548,-53.9065],["13803","EE APOLÔNIO BOURET DE MELO",9,"PARANATINGA","ESCOLA INTEGRAL","U","Av. Bandeirante","2529","78.870-000","CENTRO","66 996742785","escola.13803@edu.mt.gov.br",-14.4296,-54.0494],["13781","EE OSVALDO CÂNDIDO PEREIRA",9,"PARANATINGA","ESCOLA","U","Avenida Mato Grosso","690","78.870-000","CENTRO","66 981530683","escola.13781@edu.mt.gov.br",-14.4272,-54.0504],["13773","EECM 29 DE JUNHO",9,"PARANATINGA","ESCOLA CÍVICO-MILITAR","U","Rua João Pessoa","794","78.870-000","Vila Concórdia","66 981334788","escola.13773@edu.mt.gov.br",-14.4396,-54.0567],["156230","EEI ATURUA",9,"PARANATINGA","ESCOLA INDÍGENA","R","TERRA INDIGENA BAKAIRI","1","78.870-000","ALDEIA ATURUA","66 98420780","escola.156230@edu.mt.gov.br",-14.3909,-54.6511],["118540","EEI KURÂ-BAKAIRI",9,"PARANATINGA","ESCOLA INDÍGENA/INTEGRAL/MISTA","R","TERRA INDÍGENA BAKAIRI","1","78.870-000","ALDEIA PAKUERA","66 35731316","escola.118540@edu.mt.gov.br",-14.3164,-54.6828],["128228","EEI PAIHITWARA",9,"PARANATINGA","ESCOLA INDÍGENA","R","TERRA INDIGENA MARECHAL RONDON, ETNIA XAVANTE","s/n","78.870-000","ALDEIA UIRAPURU","66 984218050","escola.128228@edu.mt.gov.br",-13.756,-53.8826],["13692","EE ARGEMIRO RODRIGUES PIMENTEL",9,"POXORÉU","ESCOLA CAMPO","R","RUA ANTONIO VIEIRA RUICCI","10","78.800-000","CENTRO - DISTRITO DE PARAÍSO DO LESTE","66 34172045","escola.13692@edu.mt.gov.br",-16.067,-54.1619],["13617","EE FRANKLIN CASSIANO",9,"POXORÉU","ESCOLA CAMPO","R","AVENIDA MANOEL CANDIDO DE OLIVEIRA","1","78.800-000","JARUDORE","66 99902846","escola.13617@edu.mt.gov.br",-16.1983,-54.3103],["13706","EE JOÃO BORGES VIEIRA",9,"POXORÉU","ESCOLA CAMPO","R","Avenida Nossa Senhora Aparecida","00","78.800-000","Distrito de  Aparecida do Leste","66 99257970","escola.13706@edu.mt.gov.br",-15.9987,-54.2554],["13595","EE PADRE CÉSAR ALBISETTI",9,"POXORÉU","ESCOLA INTEGRAL/EPT","R","Rua MT 260, KM 05","KM 05","78.800-000","Zona Rural","66 99997515","escola.13595@edu.mt.gov.br",-15.8348,-54.389],["13641","EE POXORÉO",9,"POXORÉU","CONFESSIONAL","U","RUA GOIÁS","160","78.800-000","CENTRO","66 992177498","escola.13641@edu.mt.gov.br",-15.8386,-54.3842],["13633","EE PRESIDENTE DUTRA",9,"POXORÉU","ESCOLA CAMPO","R","DISTRITO DE ALTO COITÉ","10","78.800-000","DISTRITO","66 34141156","escola.13633@edu.mt.gov.br",-15.739,-54.3382],["13609","EE PROFESSORA JURACY MACEDO",9,"POXORÉU","ESCOLA","U","Av. Dom Bosco","s/nº","78.800-000","João Pessoa","66 99683340","escola.13609@edu.mt.gov.br",-15.8299,-54.3947],["13625","EECM JOÃO PEDRO TORRES",9,"POXORÉU","ESCOLA CÍVICO-MILITAR","U","Rui Barbosa","1","78.800-000","Vila Irantinópolis","66 34361188","escola.13625@edu.mt.gov.br",-15.8159,-54.401],["148130","EEI MARIMBÚ",9,"POXORÉU","ESCOLA INDÍGENA","R","Aldeia Marimbú","10","78.800-000","Terra Indígena Sangradouro","66 984298650","escola.148130@edu.mt.gov.br",-15.4638,-53.9478],["173568","EE CAMPO MASSAPÉ",9,"PRIMAVERA DO LESTE","ESCOLA CAMPO","R","RODOVIA MT 130 KM 12 MAIS 30 KM À ESQUERDA - COLÔNIA RUSSA","s/n","78.850-000","Zona Rural","66 996923548","escola.173568@edu.mt.gov.br",-15.2694,-54.302],["173550","EE CAMPO VILA UNIÃO",9,"PRIMAVERA DO LESTE","ESCOLA CAMPO","R","RODOVIA MT 130,KM5 , 48KM A ESQUERDA DA RODOVIA MT 486","s/n","78.850-000","COMUNIDADE RURAL VILA UNIAO","66 34987404","escola.173550@edu.mt.gov.br",-15.2387,-54.4918],["13765","EE JOÃO RIBEIRO VILELA",9,"PRIMAVERA DO LESTE","ESCOLA","U","Rua Arlindo Cornelli","301","78.850-000","Centro Leste","66 999961350","escola.13765@edu.mt.gov.br",-15.5526,-54.291],["159697","EE MILITAR TIRADENTES 2° SARGENTO PM WELITON PEREIRA DUARTE",9,"PRIMAVERA DO LESTE","ESCOLA MILITAR","U","Rua da Cohab","175","78.850-000","Cohab Tancredo Neves","66 996707974","escola.159697@edu.mt.gov.br",-15.56447,-54.29155],["38571","EE MONTEIRO LOBATO",9,"PRIMAVERA DO LESTE","ESCOLA","U","Rua: Malva Real","48","78.850-000","Pioneiro","66 996599665","escola.38571@edu.mt.gov.br",-15.5726,-54.3099],["183652","EE PROFESSORA MARIA SEBASTIANA DE SOUZA",9,"PRIMAVERA DO LESTE","ESCOLA","U","AVENIDA AMAZONAS","402","78.850-000","Primavera 2","66 99638443","escola.183652@edu.mt.gov.br",-15.5483,-54.3015],["148113","EECM CREMILDA DE OLIVEIRA VIANA",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","RUA:ANTÔNIO SALOMÃO","35","78.850-000","SÃO CRISTOVÃO","66 99973910","escola.148113@edu.mt.gov.br",-15.5404,-54.2876],["158836","EECM PAULO FREIRE",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","RUA PINHEIRO","900","78.850-000","RESIDENCIAL BURITIS PRIMAVERA","66 31910756","escola.158836@edu.mt.gov.br",-15.5262,-54.3299],["13730","EECM PROFESSORA ALDA GAWLINSKI SCOPEL",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","Avenida São João","212","78.850-000","CENTRO","66 34982006","escola.13730@edu.mt.gov.br",-15.5568,-54.2978],["13757","EECM SEBASTIÃO PATRÍCIO",9,"PRIMAVERA DO LESTE","ESCOLA CÍVICO-MILITAR","U","AVENIDA PRIMAVERA","350","78.850-000","PRIMAVERA II","66 34987496","escola.13757@edu.mt.gov.br",-15.5432,-54.3009],["212504","EEDIEB GETÚLIO DORNELLES VARGAS",9,"PRIMAVERA DO LESTE","ESCOLA","U","Avenida São João","594","78.850-000","Primavera I","66 99990409","escola.212504@edu.mt.gov.br",-15.5575,-54.3014],["68713","EE VANDERLEI CECATTO",9,"SANTO ANTÔNIO DO LESTE","ESCOLA","U","Avenida Maceió","125","78.628-000","Jardim Bem Viver","66 99209873","escola.68713@edu.mt.gov.br",-14.7983,-53.6149],["12912","EE ARLINDA PESSOA MORBECK",10,"ALTO ARAGUAIA","ESCOLA","U","AVENIDA VEREADOR LAURISTON FERNANDES BARBOSA","74","78.780-000","AEROPORTO","66 34811819","escola.12912@edu.mt.gov.br",-17.3285,-53.2245],["12939","EE MARIA AUXILIADORA",10,"ALTO ARAGUAIA","CONFESSIONAL","U","Rua Santa Rita","171","78.780-000","CENTRO","66 999020487","escola.12939@edu.mt.gov.br",-17.3191,-53.2131],["12947","EE ONECÍDIO MANOEL DE RESENDE",10,"ALTO ARAGUAIA","ESCOLA CAMPO","R","RUA ESTADUAL","2","78.780-000","DISTRITO DO BURITI","66 99924376","escola.12947@edu.mt.gov.br",-17.9799,-53.5515],["12920","EECM CARLOS HUGUENEY",10,"ALTO ARAGUAIA","ESCOLA CÍVICO-MILITAR","U","RUA RIO BRANCO","253","78.780-000","CENTRO","66 34811195","escola.12920@edu.mt.gov.br",-17.3159,-53.2116],["12971","EE DEPUTADO OSCAR SOARES",10,"ALTO GARÇAS","ESCOLA CAMPO/INTEGRAL/AGRÍCOLA","U","Avenida Vereador Benedito Ferreira De Moura","s/n","78.770-000","NOVO HORIZANTE","66 34711484","escola.12971@edu.mt.gov.br",-16.9607,-53.5366],["12955","EECM DOUTOR YTRIO CORRÊA",10,"ALTO GARÇAS","ESCOLA CÍVICO-MILITAR","U","Avenida 7 de setembro","s/n","78.770-000","CENTRO","66 34711392","escola.12955@edu.mt.gov.br",-16.9533,-53.525],["13021","EECM CARLOS IRIGARAY FILHO",10,"ALTO TAQUARI","ESCOLA CÍVICO-MILITAR","U","RUA ALTINO PEREIRA DE SOUZA","1080","78.785-000","CENTRO","66 34961247","escola.13021@edu.mt.gov.br",-17.828,-53.2824],["12980","EE RUI BARBOSA",10,"ARAGUAINHA","ESCOLA","U","AVENIDA ARAGUAIA","1030","78.615-000","CENTRO","66 34761121","escola.12980@edu.mt.gov.br",-16.8551,-53.0341],["16071","EE SÃO LOURENÇO",10,"DOM AQUINO","CONFESSIONAL","U","RUA PRESIDENTE VARGAS","47","78.830-000","CENTRO","66 34511084","escola.16071@edu.mt.gov.br",-15.8107,-54.9198],["16110","EECM VINÍCIUS DE MORAES",10,"DOM AQUINO","ESCOLA INTEGRAL/CÍVICO-MILITAR","U","AV.JOÃO FURTADO DE MENDONÇA","s/n","78.830-000","VILA ESPORTIVA","66 34511056","escola.16110@edu.mt.gov.br",-15.8077,-54.9297],["14320","EE DONA MARIA DE LOURDES RIBEIRO FRAGELLI",10,"GUIRATINGA","ESCOLA INTEGRAL","U","AV. PARANÁ","925","78.760-000","SANTA MARIA BERTILA","66 99943956","escola.14320@edu.mt.gov.br",-16.3509,-53.7617],["14303","EE PEDRO FERREIRA",10,"GUIRATINGA","ESCOLA CAMPO","R","RUA PADRE  CORNÉLIO FARESIN","113","78.766-000","DISTRITO VALE RICO","66 34691062","escola.14303@edu.mt.gov.br",-16.3916,-54.1535],["49689","EE SANTA TERESINHA",10,"GUIRATINGA","CONFESSIONAL","U","Av.Marechal Rondon","779","78.760-000","CENTRO","66 999069900","escola.49689@edu.mt.gov.br",-16.3484,-53.76],["140805","EE BONIFÁCIO SACHETTI",10,"ITIQUIRA","ESCOLA CAMPO","R","AV. JORGE EDUARDO RAPOSO DE MEDEIROS - QUADRA 17 - LOTE 01","01","78.790-000","DISTRITO DE OURO BRANCO DO SUL","65 999070610","escola.140805@edu.mt.gov.br",-17.3813,-54.7599],["11231","EE DOM AQUINO CORRÊA",10,"ITIQUIRA","ESCOLA","U","RUA DR. FERNANDO CORRÊA DA COSTA","s/n","78.790-000","CENTRO","65 34911491","escola.11231@edu.mt.gov.br",-17.2082,-54.1477],["14826","EE ANTÔNIO FERREIRA SOBRINHO",10,"JACIARA","ESCOLA INTEGRAL/ESPORTE","U","Avenida Piracicaba","1030","78.820-000","CENTRO","66 34611902","escola.14826@edu.mt.gov.br",-15.9692,-54.9673],["14850","EE CELESTINO CORRÊA DA COSTA",10,"JACIARA","ESCOLA CAMPO","R","AVENIDA PRINCIPAL","521","78.820-000","Distrito de Celma","66 34091016","escola.14850@edu.mt.gov.br",-15.6557,-55.0776],["192163","EE MILITAR TIRADENTES MODELO SANTO ANTÔNIO",10,"JACIARA","ESCOLA MILITAR","U","Rua Irahy","778","78.820-000","SANTO ANTÔNIO","66 34611329","escola.192163@edu.mt.gov.br",-15.9514,-54.9712],["14893","EE MILTON DA COSTA FERREIRA",10,"JACIARA","ESCOLA","U","RUA CECI","1238","78.820-000","JARDIM AEROPORTO","66 9927-9471","escola.14893@edu.mt.gov.br",-15.9449,-54.9768],["14869","EE PREFEITO ARTUR RAMOS",10,"JACIARA","ESCOLA","U","RUA MOEMA","1079","78.820-000","CENTRO","66 34611431","escola.14869@edu.mt.gov.br",-15.9665,-54.9654],["14885","EE SÃO FRANCISCO",10,"JACIARA","CONFESSIONAL","U","Avenida Antonio Ferreira Sobrinho","1536","78.820-000","CENTRO","66 999891933","escola.14885@edu.mt.gov.br",-15.9632,-54.9696],["14940","EE DOM VUNIBALDO",10,"JUSCIMEIRA","ESCOLA CAMPO","R","AV. ALMIRANTE BARROSO","782","78.810-000","CENTRO","66 34411077","escola.14940@edu.mt.gov.br",-16.3154,-54.9381],["14982","EE JOÃO MATHEUS BARBOSA",10,"JUSCIMEIRA","ESCOLA INTEGRAL","U","RUA DR. CASTILHO","966","78.810-000","CENTRO","66 992587808","escola.14982@edu.mt.gov.br",-16.0535,-54.8867],["15008","EE SANTA ELVIRA",10,"JUSCIMEIRA","ESCOLA CAMPO/INTEGRAL","R","RUA GENI","670","78.810-000","DISTRITO DE SANTA ELVIRA","66 34551141","escola.15008@edu.mt.gov.br",-16.1642,-54.7968],["14958","EECM ANTÔNIO JOSÉ DE LIMA",10,"JUSCIMEIRA","ESCOLA CÍVICO-MILITAR","U","RUA: EMANUEL PINHEIRO","183","78.810-000","CENTRO","66 34121375","escola.14958@edu.mt.gov.br",-16.0527,-54.8832],["11207","EE 13 DE MAIO",10,"PEDRA PRETA","ESCOLA INTEGRAL","U","AV. FERNANDO CORREA DA COSTA","844","78.795-000","CENTRO","66 34861237","escola.11207@edu.mt.gov.br",-16.6217,-54.4763],["11215","EE SÃO PEDRO APÓSTOLO",10,"PEDRA PRETA","ESCOLA","U","AV PRESIDENTE VARGAS","220","78.795-000","CENTRO","66 997126523","escola.11215@edu.mt.gov.br",-16.6184,-54.4772],["11193","EECM 10 DE DEZEMBRO",10,"PEDRA PRETA","ESCOLA CÍVICO-MILITAR","U","AV. FREI SERVACIO","580","78.795-000","CENTRO","66 34861209","escola.11193@edu.mt.gov.br",-16.6193,-54.4722],["11185","EE 7 DE SETEMBRO",10,"RONDONÓPOLIS","ESCOLA CAMPO","R","Rua Emilia Costa Prado","270","78.754-000","Nova Galiléia","66 99986992","escola.11185@edu.mt.gov.br",-16.6003,-54.3649],["10871","EE ADOLFO AUGUSTO DE MORAES",10,"RONDONÓPOLIS","ESCOLA INTEGRAL/LÍNGUAS","U","Avenida  Padre Anchieta","937","78.740-031","Vila  Aurora I","66 30220293","escola.10871@edu.mt.gov.br",-16.4758,-54.6213],["10880","EE DANIEL MARTINS MOURA",10,"RONDONÓPOLIS","ESCOLA","U","AVENIDA DEPUTADO EMANUEL PINHEIRO","2700","78.720-400","JARDIM MODELO - DISTRITO DE V. OPERARIA","66 34263006","escola.10880@edu.mt.gov.br",-16.443,-54.6233],["11142","EE EMANUEL PINHEIRO",10,"RONDONÓPOLIS","ESCOLA","U","RUA 13 DE MAIO","1037","78.700-160","CENTRO","66 30230262","escola.11142@edu.mt.gov.br",-16.4665,-54.6345],["11061","EE JOSÉ MORAES",10,"RONDONÓPOLIS","ESCOLA","U","Rua Harolda Duetti Silva","244","78.725-220","JARDIM PRIMAVERA","66 34262665","escola.11061@edu.mt.gov.br",-16.4509,-54.6148],["10960","EE JOSÉ RODRIGUES DOS SANTOS",10,"RONDONÓPOLIS","ESCOLA CAMPO","R","Rua Santa Catarina","s/n","78.752-000","Distrito de Boa Vista","66 34642061","escola.10960@edu.mt.gov.br",-16.2148,-54.7818],["10928","EE JOSÉ SALMEN HANZE",10,"RONDONÓPOLIS","ESCOLA INTEGRAL","U","Rua Mascarenhas de Moraes","764","78.705-200","Cidade Salmen","66 992054367","escola.10928@edu.mt.gov.br",-16.4711,-54.65],["11134","EE LA SALLE",10,"RONDONÓPOLIS","CONFESSIONAL","U","RUA 13 DE MAIO","1699","78.710-080","LA SALLE","66 34267706","escola.11134@edu.mt.gov.br",-16.4626,-54.6385],["10863","EE LUCAS PACHECO DE CAMARGO",10,"RONDONÓPOLIS","ESCOLA INTEGRAL","U","RUA E","1","78715317","JARDIM VERA CRUZ","66 34233787","escola.10863@edu.mt.gov.br",-16.4486,-54.6308],["10995","EE MAJOR OTÁVIO PITALUGA",10,"RONDONÓPOLIS","ESCOLA","U","AV. AMAZONAS","789","78.700-050","CENTRO","66 30222196","escola.10995@edu.mt.gov.br",-16.4727,-54.6324],["10979","EE MARIA DE LIMA CADIDÉ",10,"RONDONÓPOLIS","ESCOLA","U","Avenida São João","1177","78.720-618","Vila Operária","66 34236863","escola.10979@edu.mt.gov.br",-16.4386,-54.6245],["49883","EE MILITAR DOM PEDRO II ANDRÉ ANTÔNIO MAGGI",10,"RONDONÓPOLIS","ESCOLA MILITAR","U","Avenida Rotary Internacional","1006","78.730-234","Nucleo Habitacional Participacao","66 34224577","escola.49883@edu.mt.gov.br",-16.4631,-54.6095],["196509","EE MILITAR TIRADENTES MAJOR PM ERNESTINO VERÍSSIMO DA SILVA",10,"RONDONÓPOLIS","ESCOLA MILITAR","U","RUA D","450","78745623","JARDIM MARIA TEREZA","66 34261273","escola.196509@edu.mt.gov.br",-16.4793,-54.6641],["11002","EE PINDORAMA",10,"RONDONÓPOLIS","ESCOLA INTEGRAL/ESPORTE","U","Rua Augusto de Moraes","990","78.710-790","Santa Cruz","66 30233810","escola.11002@edu.mt.gov.br",-16.4595,-54.6301],["11070","EE PROFESSOR DOMINGOS APARECIDO DOS SANTOS",10,"RONDONÓPOLIS","ESCOLA","U","RUA CLEMENTINA DUARTE AQUINO","s/n","78.715-437","NUCLEO HABITACIONAL SÃO JOSÉ II","66 34261899","escola.11070@edu.mt.gov.br",-16.4353,-54.6401],["44245","EE PROFESSORA AMÉLIA DE OLIVEIRA SILVA",10,"RONDONÓPOLIS","ESCOLA","U","Rua das Andorinhas, Qd 67","267","78.750-235","Residencial Parque Universitário","66 99675363","escola.44245@edu.mt.gov.br",-16.4626,-54.6706],["192139","EE PROFESSORA STELA MARIS VALERIANO DA SILVA",10,"RONDONÓPOLIS","ESCOLA INTEGRAL","U","RUA OITO - RESIDENCIAL EDELMINA QUERUBIM MARCHETTI","s/n","78.717-535","LOTEAMENTO CARLOS BEZERRA II","66 984121448","escola.192139@edu.mt.gov.br",-16.4194,-54.6364],["11118","EE RAMIRO BERNARDO DA SILVA",10,"RONDONÓPOLIS","ESCOLA","U","RUA LUIZ CLEMENTE","175","78.710-535","JARDIM PINDORAMA II","66 34267061","escola.11118@edu.mt.gov.br",-16.4513,-54.6402],["10901","EE SAGRADO CORAÇÃO DE JESUS",10,"RONDONÓPOLIS","CONFESSIONAL","U","AVENIDA CUIABÁ","1073","78.700-090","CENTRO","66 34213602","escola.10901@edu.mt.gov.br",-16.4702,-54.6313],["49794","EE SANTO ANTÔNIO",10,"RONDONÓPOLIS","CONFESSIONAL","U","RUA FRANCISCO FELIX","274","78.700-499","VILA SANTO ANTONIO","66 34216871","escola.49794@edu.mt.gov.br",-16.4629,-54.6237],["10910","EE SÃO JOSÉ OPERÁRIO",10,"RONDONÓPOLIS","CONFESSIONAL","U","AVENIDA BANDEIRANTES","5636","78.720-587","VILA OPERARIA","66 34254261","escola.10910@edu.mt.gov.br",-16.4389,-54.618],["10855","EE SILVESTRE GOMES JARDIM",10,"RONDONÓPOLIS","ESCOLA INTEGRAL/ESPORTE","U","Rua Presidente Costa e Silva","1365","78.714-269","Vila Mariana","66 34211572","escola.10855@edu.mt.gov.br",-16.4385,-54.6318],["145769","EECM FRANCISCA BARROS DE CARVALHO",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Avenida Pastor José Francisco da Silva","2647","78.750-736","Vila Olinda II","66 9909-9789","escola.145769@edu.mt.gov.br",-16.4648,-54.6777],["11126","EECM JOAQUIM NUNES ROCHA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","AVENIDA BAHIA","764","78.705-090","VILA SALMEN","66 34214011","escola.11126@edu.mt.gov.br",-16.4708,-54.6475],["11010","EECM MARECHAL DUTRA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Afonso Pena","695","78.700-070","CENTRO","66 30261022","escola.11010@edu.mt.gov.br",-16.472,-54.6354],["192147","EECM PROFESSORA EDITH PEREIRA BARBOSA",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Maria Irene Rodrigues Oliveira","SN","78.734-502","RESIDENCIAL SÍTIO FARIAS","66 34223716","escola.192147@edu.mt.gov.br",-16.4936,-54.5918],["11045","EECM PROFESSORA ELIZABETH DE FREITAS MAGALHÃES",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA CARLOS PEREIRA BARBOSA","68","78.735-665","JARDIM ATLANTICO","66 34220633","escola.11045@edu.mt.gov.br",-16.4709,-54.5781],["10952","EECM PROFESSORA EUNICE SOUZA DOS SANTOS",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","RUA DOM PEDRO II","4154","78.710-230","MONTE LIBANO","66 34266256","escola.10952@edu.mt.gov.br",-16.4448,-54.6511],["38636","EECM PROFESSORA MARIA ELZA FERREIRA INÁCIO",10,"RONDONÓPOLIS","ESCOLA CÍVICO-MILITAR","U","Rua Airton A. Santana","s/n","78.715-576","Residencial Marechal Rondon","66 9965-790","escola.38636@edu.mt.gov.br",-16.43,-54.6531],["43133","EE LUDOVICO VIEIRA CAMARGO",10,"SÃO JOSÉ DO POVO","ESCOLA","U","RUA ZANETE FERREIRA CARDINAL","690","78.773-000","CENTRO","66 34941071","escola.43133@edu.mt.gov.br",-16.4669,-54.2567],["14877","EECM IRMÃ MIGUELINA CORSO",10,"SÃO PEDRO DA CIPA","ESCOLA CÍVICO-MILITAR","U","Rua São Paulo","245","78.835-000","CENTRO","66 34181214","escola.14877@edu.mt.gov.br",-16.0017,-54.9195],["44180","EE 15 DE OUTUBRO",10,"TESOURO","ESCOLA","U","RUA MARECHAL RONDON","381","78.775-000","CENTRO","66 34351133","escola.44180@edu.mt.gov.br",-16.0829,-53.5522],["124028","EEI MAYROWI APIAKÁ",11,"APIACÁS","ESCOLA INDÍGENA","R","ALDEIA MAYROWI","SN","78.595-000","ALDEIA","66 99909284","escola.124028@edu.mt.gov.br",-7.8062,-57.8786],["116033","EE CRISTIANO ARAÚJO PIRES",11,"BOA ESPERANÇA DO NORTE","ESCOLA","U","RUA DOS JAMBOS","34","78.887-000","CENTRO","66 981367296","escola.116033@edu.mt.gov.br",-13.5141,-55.1482],["172456","EE DOROTHY STANG",11,"CLÁUDIA","ESCOLA CAMPO","R","Estrada Valdirene Km35 Assentamento Keno","0","78.540-000","Zona Rural","66 996681379","escola.172456@edu.mt.gov.br",-11.2579,-54.9264],["172081","EE FLORESTAN FERNANDES",11,"CLÁUDIA","ESCOLA CAMPO","R","ASSENTAMENTO 12 DE OUTUBRO, BR 163","KM 890","78.540-000","rural","66 999172788","escola.172081@edu.mt.gov.br",-11.3819,-55.3726],["13374","EE MANOEL SOARES CAMPOS",11,"CLÁUDIA","ESCOLA","U","RUA DOM AQUINO CORREA S/N","0","78.540-000","CENTRO","66 996314509","escola.13374@edu.mt.gov.br",-11.5037,-54.8745],["158330","EE ANDRÉ ANTÔNIO MAGGI",11,"COLÍDER","ESCOLA","U","RUA BORBA GATO","80","78.500-000","SETOR OESTE","66 996827608","escola.158330@edu.mt.gov.br",-10.7962,-55.4665],["13471","EE CAFENORTE",11,"COLÍDER","ESCOLA CAMPO","R","Comunidade Café Norte","0","78.500-000","Zona Rural","66 992017293","escola.13471@edu.mt.gov.br",-10.6203,-55.4214],["13404","EE DESEMBARGADOR MILTON ARMANDO POMPEU DE BARROS",11,"COLÍDER","ESCOLA","U","AVENIDA JAIME VERISSIMO DE CAMPOS JUNIOR - SETOR LESTE","285","78.500-000","CENTRO","66 35411337","escola.13404@edu.mt.gov.br",-10.8092,-55.4547],["13412","EE MILITAR DOM PEDRO II 2º TENENTE BM KLEIBER RODRIGUES ALVES",11,"COLÍDER","ESCOLA MILITAR","U","AV. IZABEL MARTINS SIMONE","159","78.500-000","TORRE - SETOR OESTE","66 996344457","escola.13412@edu.mt.gov.br",-10.8027,-55.4635],["13420","EE NOVA GALILEIA",11,"COLÍDER","ESCOLA CAMPO","R","Comunidade Nova Galileia","0","78.500-000","Zona Rural","66 996895108","escola.13420@edu.mt.gov.br",-10.5793,-55.5244],["13455","EE PALMITAL",11,"COLÍDER","ESCOLA CAMPO/INTEGRAL/MISTA","R","AVENIDA MOGNO - COMUNIDADE MARCO DE CIMENTO","250","78.500-000","Zona Rural","66 996035788","escola.13455@edu.mt.gov.br",-10.4129,-55.4971],["154016","EE PROFESSORA ALZIRA MARIA DA SILVA",11,"COLÍDER","ESCOLA","U","AV. MAL. DEODORO DA FONSECA","307","78.500-000","CENTRO","66 996238252","escola.154016@edu.mt.gov.br",-10.8056,-55.4559],["124923","EE ANDRÉ ANTÔNIO MAGGI",11,"FELIZ NATAL","ESCOLA","U","RUA ITAPIRANGA","111","78.885-000","CENTRO","66 999731769","escola.124923@edu.mt.gov.br",-12.3878,-54.9383],["120936","EE ANDRÉ ANTÔNIO MAGGI",11,"IPIRANGA DO NORTE","ESCOLA","U","RUA DOS GIRASSOIS","511","78.578-000","CENTRO","66 996030866","escola.120936@edu.mt.gov.br",-12.2408,-56.1478],["124109","EE BROMILDO LAWISCH",11,"ITANHANGÁ","ESCOLA","U","Rua Primavera","101","78.579-000","CENTRO","66 981249755","escola.124109@edu.mt.gov.br",-12.2357,-56.6444],["13560","EE PAPA JOÃO PAULO II",11,"ITAÚBA","ESCOLA","U","Avenida Brasil","504","78.510-000","CENTRO","66 35611302","escola.13560@edu.mt.gov.br",-11.0101,-55.2459],["16470","EE DOM BOSCO",11,"LUCAS DO RIO VERDE","ESCOLA","U","Avenida Mato Grosso","2191","78462041","RIO VERDE","65 996155139","escola.16470@edu.mt.gov.br",-13.0781,-55.9066],["154172","EE LUIZ CARLOS CECONELLO",11,"LUCAS DO RIO VERDE","ESCOLA","U","Rua do Otimismo","","78464-020","VIDA NOVA","","escola.154172@edu.mt.gov.br",-13.105,-55.9179],["198226","EE MÁRCIO SCHABATT SOUZA",11,"LUCAS DO RIO VERDE","ESCOLA","U","AVENIDA SERGIPE","1120-S","78466088","VENEZA","65 999964159","escola.198226@edu.mt.gov.br",-13.0884,-55.9115],["197297","EE MILITAR TIRADENTES SOLDADO PM ADRIANA MORAIS RAMOS",11,"LUCAS DO RIO VERDE","ESCOLA MILITAR","U","AVENIDA INDEPENDENCIA","815 W","78460613","BANDEIRANTES","65 99285404","escola.197297@edu.mt.gov.br",-13.0539,-55.9347],["38512","EECM ÂNGELO NADIN",11,"LUCAS DO RIO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA AMOR-PERFEITO","1590w","78460528","BANDEIRANTES","65 993420247","escola.38512@edu.mt.gov.br",-13.0681,-55.9342],["184586","EECM MANOEL DE BARROS",11,"LUCAS DO RIO VERDE","ESCOLA CÍVICO-MILITAR","U","RUA NELSON RIGO","2851-S","78464159","Parque das Américas","65 99961817","escola.184586@edu.mt.gov.br",-13.1082,-55.9067],["69612","EE GRÁCIA EDMUNDO ZEFERINO",11,"NOVA SANTA HELENA","ESCOLA","U","RUA RIO DE JANEIRO","000","78513000","CENTRO","66 35231128","escola.69612@edu.mt.gov.br",-10.8512,-55.1814],["77895","EE 19 DE DEZEMBRO",11,"NOVA UBIRATÃ","ESCOLA","U","RUA MARANHÃO","1550","78.888-000","CENTRO","66 999279810","escola.77895@edu.mt.gov.br",-13.0316,-55.2498],["173371","EE PEDRO BARBOSA",11,"NOVA UBIRATÃ","ESCOLA CAMPO","R","RUA DOS PEQUIS","18","78.888-000","DISTRITO ENTRE RIOS","66 997179467","escola.173371@edu.mt.gov.br",-12.4567,-54.347],["13366","EE NOSSA SENHORA APARECIDA",11,"SANTA CARMEM","ESCOLA","U","Avenida Alvorada","421","78.545-000","CENTRO","66 999263902","escola.13366@edu.mt.gov.br",-11.9796,-55.2811],["174122","EE BOM JARDIM",11,"SINOP","ESCOLA","U","Quadra 06 lote 4","1","78.559-006","BOM JARDIM","66 999238952","escola.174122@edu.mt.gov.br",-11.8578,-55.503],["194522","EE CARLOS DRUMMOND DE ANDRADE",11,"SINOP","ESCOLA CAMPO","R","ASSENTAMENTO WESLEY MANOEL DOS SANTOS - AGROVILA NOVA","0","78.559-899","ÁREA RURAL DE SINOP","66 996830059","escola.194522@edu.mt.gov.br",-11.4991,-55.6936],["173770","EE JORGE AMADO",11,"SINOP","ESCOLA","U","RUA JOAO PEDRO MOREIRA DE CARVALHO LOTES 03 E 04","558","78.559-106","CHACARAS SINOP","66 996590367","escola.173770@edu.mt.gov.br",-11.9026,-55.5053],["214159","EE MILITAR TIRADENTES 2º SARGENTO PM CLAUDEMIR FRANÇA MACIEL",11,"SINOP","ESCOLA MILITAR","U","ESTRADA CLAUDETE","442-A","78.555-810","JARDIM CURITIBA","66 36891124","escola.214159@edu.mt.gov.br",-11.891,-55.532],["13242","EE NILZA DE OLIVEIRA PIPINO",11,"SINOP","ESCOLA","U","RUA DOS LIRIOS","460","78.550-007","SETOR RESIDENCIAL SUL","66 35312173","escola.13242@edu.mt.gov.br",-11.8608,-55.5],["64149","EE PAULO FREIRE",11,"SINOP","ESCOLA","U","RUA DAS ALFAZEMAS","740","78.552-400","JARDIM OLIVEIRAS","66 35325222","escola.64149@edu.mt.gov.br",-11.8267,-55.5078],["173762","EE PROFESSOR DJALMA GUILHERME DA SILVA",11,"SINOP","ESCOLA","U","RUA DAS CELESTINAS","135","78.552-555","JARDIM DAS ORQUÍDEAS","66 999846306","escola.173762@edu.mt.gov.br",-11.8234,-55.4969],["91448","EE PROFESSORA EDELI MANTOVANI",11,"SINOP","ESCOLA","U","RUA CARLOS EDUARDO, QUADRA 17","770","78.553-531","JARDIM SÃO PAULO I","66 996784372","escola.91448@edu.mt.gov.br",-11.8258,-55.5187],["76180","EE PROFESSORA MARIA DE FÁTIMA GIMENEZ LOPES",11,"SINOP","ESCOLA","U","RUA DAS JABUTICABEIRAS","761","78.556-646","JD.CELESTE","66 999438982","escola.76180@edu.mt.gov.br",-11.8818,-55.5115],["172642","EE PROFESSORA ZENI VIEIRA",11,"SINOP","ESCOLA","U","RUA AUGUSTA","71","78.556-794","JARDIM IBIRAPUERA","66 999191725","escola.172642@edu.mt.gov.br",-11.8888,-55.5119],["124869","EE RENÉE MENEZES",11,"SINOP","ESCOLA CAMPO","U","RUA DO BAGRE","10","78.550-001","CAMPING CLUB","66 999696411","escola.124869@edu.mt.gov.br",-11.7022,-55.4463],["13331","EE ROSA DOS VENTOS",11,"SINOP","ESCOLA","U","RUA DAS PAINEIRAS","1400","78.555-058","JARDIM IMPERIAL","66 999062262","escola.13331@edu.mt.gov.br",-11.8397,-55.5168],["13285","EE SÃO VICENTE DE PAULA",11,"SINOP","ESCOLA","U","RUA COLONIZADOR ENIO PIPINO","455","78.557-484","SÃO CRISTÓVÃO","66 984322573","escola.13285@edu.mt.gov.br",-11.8977,-55.5053],["158399","EECM CLEUFA HUBNER",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS GAIVOTAS","565","78556400","JARDIM DAS NAÇÕES","66 99644623","escola.158399@edu.mt.gov.br",-11.8585,-55.5303],["13250","EECM ÊNIO PIPINO",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS AVENCAS","2261","78.550-178","SETOR COMERCIAL","66 999763705","escola.13250@edu.mt.gov.br",-11.8501,-55.5065],["13340","EECM NOSSA SENHORA DA GLÓRIA",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","BR 163 km","821","78.558-490","ALTO DA GLORIA","66 99685697","escola.13340@edu.mt.gov.br",-11.9816,-55.5165],["13307","EECM NOSSA SENHORA DE LOURDES",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","Av. Rute de Souza Silva","471","78.557-515","Industrial","66 992436677","escola.13307@edu.mt.gov.br",-11.8695,-55.4927],["13269","EECM OLÍMPIO JOÃO PISSINATTI GUERRA",11,"SINOP","ESCOLA CÍVICO-MILITAR","U","RUA DAS BILBERGIAS","422","78.550-389","JARDIM PRIMAVERA","66 35317228","escola.13269@edu.mt.gov.br",-11.8446,-55.497],["212474","EEDIEB BENEDITO SANTANA DA SILVA FREIRE",11,"SINOP","ESCOLA","U","RUA DAS AVENCAS","847","78.550-070","SETOR COMERCIAL","66 35320408","escola.212474@edu.mt.gov.br",-11.8624,-55.5098],["192210","EE ARLETE MARIA CAPPELLARI",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","Rua Rosa dos Ventos","1052","78.890-001","Rota do Sol","66 996869802","escola.192210@edu.mt.gov.br",-12.5789,-55.7436],["38598","EE IGNÁCIO SCHEVINSKI FILHO",11,"SORRISO","ESCOLA","U","RUA PASSO FUNDO","1243","78.890-001","BAIRRO INDUSTRIAL I","66 992010551","escola.38598@edu.mt.gov.br",-12.5592,-55.7107],["156434","EE JOSÉ DOMINGOS FRAGA",11,"SORRISO","ESCOLA","U","RUA TENENTE LIRA","1291","78.890-001","RESIDENCIAL VILLAGE","65 999747423","escola.156434@edu.mt.gov.br",-12.5343,-55.7423],["16500","EE MÁRIO SPINELLI",11,"SORRISO","ESCOLA","U","AVENIDA BLUMENAU","1831","78.894-038","MORADA DO SOL","66 992345029","escola.16500@edu.mt.gov.br",-12.5514,-55.73],["194948","EE MILITAR TIRADENTES CABO ANTÔNIO DILCEU DA SILVA AMARAL",11,"SORRISO","ESCOLA MILITAR","U","AVENIDA NOÊMIA TONELLO DALMOLIN","2499","78893110","PARQUE UNIVERSITÁRIO","65 992231011","escola.194948@edu.mt.gov.br",-12.552,-55.7203],["16519","EECM 13 DE MAIO",11,"SORRISO","ESCOLA CÍVICO-MILITAR","U","RUA ALTA FLORESTA","189","78.890-174","CENTRO","66 996656960","escola.16519@edu.mt.gov.br",-12.5439,-55.7279],["102326","EE ALFREDO TREUHERZ",11,"TABAPORÃ","ESCOLA CAMPO","R","AVENIDA DOS PRIMEIROS","s/nº","78.563-000","AGROVILA NOVA FRONTEIRA","66 984280768","escola.102326@edu.mt.gov.br",-11.3057,-56.2642],["49964","EE FRANCISCO SALDANHA NETO",11,"TABAPORÃ","ESCOLA","U","RUA VILAS BOAS","1185","78.563-000","CENTRO","66 35571206","escola.49964@edu.mt.gov.br",-11.304,-56.8115],["156000","EE PROFESSORA ZULEIDE DOS SANTOS BARROS",11,"TABAPORÃ","ESCOLA CAMPO","R","RUA 4, QUADRA 8","0","78.563-000","DISTRITO de AMERICANA DO NORTE","66 36021021","escola.156000@edu.mt.gov.br",-11.6373,-56.1427],["16543","EE CÂNDIDO PORTINARI",11,"TAPURAH","ESCOLA","U","RUA DOS ANGICOS","1602","78.573-000","Cristo Rei","66 992384015","escola.16543@edu.mt.gov.br",-12.7405,-56.5103],["65587","EE IVALDINO FRÂNCIO",11,"UNIÃO DO SUL","ESCOLA","U","RUA JABORÁ","183","78.543-000","SÃO LUIZ","66 992424397","escola.65587@edu.mt.gov.br",-11.5277,-54.3679],["13358","EECM NOSSA SENHORA DO PERPÉTUO SOCORRO",11,"VERA","ESCOLA CÍVICO-MILITAR","U","Av. Nicarágua","2024","78.880-000","CENTRO","66 999318959","escola.13358@edu.mt.gov.br",-12.2868,-55.2942],["14508","EE 07 DE SETEMBRO",12,"BARRA DO BUGRES","ESCOLA CAMPO","R","RUA SETE DE SETEMBRO","55","78.390-000","Distrito Assari","65 996262163","escola.14508@edu.mt.gov.br",-14.8762,-57.1757],["14435","EE ALFREDO JOSÉ DA SILVA",12,"BARRA DO BUGRES","ESCOLA INTEGRAL/ESPORTE","U","RUA TAMOIOS","55","78.390-000","MARACANÃ","65 996423997","escola.14435@edu.mt.gov.br",-15.0689,-57.1924],["14451","EE JOÃO DE CAMPOS BORGES",12,"BARRA DO BUGRES","ESCOLA","U","RUA B S/N","0","78.390-000","MARACANÃ - COHAB NHAMBIQUARA","65 996916461","escola.14451@edu.mt.gov.br",-15.0656,-57.1965],["14460","EE JÚLIO MÜLLER",12,"BARRA DO BUGRES","ESCOLA","U","RUA SÃO BENEDITO","701","78.390-000","CENTRO","65 33611244","escola.14460@edu.mt.gov.br",-15.072,-57.1805],["14419","EE PROFESSORA JULIETA XAVIER BORGES",12,"BARRA DO BUGRES","ESCOLA INTEGRAL","U","AV. DEP. EMANUEL PINHEIRO","100","78.390-000","SÃO RAIMUNDO","65 998075878","escola.14419@edu.mt.gov.br",-15.0612,-57.1751],["44938","EE SABINO FERREIRA MAIA",12,"BARRA DO BUGRES","ESCOLA CAMPO","R","Rua Goias","s/n","78.390-000","Distrito de Currupira","65 996045001","escola.44938@edu.mt.gov.br",-15.1106,-56.8583],["14478","EECM DEPUTADO RENÊ BARBOUR",12,"BARRA DO BUGRES","ESCOLA CÍVICO-MILITAR","U","Rua B","s/n","78.390-000","Residencial Roosevelt","65 999151153","escola.14478@edu.mt.gov.br",-15.0633,-57.198],["109436","EEI JULA PARÉ",12,"BARRA DO BUGRES","ESCOLA INDÍGENA/INTEGRAL","R","ALDEIA UMUTINA","s/n","78.390-000","Zona Rural","65 99948829","escola.109436@edu.mt.gov.br",-15.0887,-57.1088],["45055","EE ARGEU AUGUSTO DE MORAES",12,"CAMPO NOVO DO PARECIS","ESCOLA CAMPO","R","AVENIDA ARGEU AUGUSTO DE MORAES","s/n","78.360-000","FAZENDA ITAMARATI NORTE","65 33491131","escola.45055@edu.mt.gov.br",-14.319,-57.9673],["176451","EE MARECHAL CÂNDIDO RONDON",12,"CAMPO NOVO DO PARECIS","ESCOLA CAMPO","R","Rodovia 364","s/nº","78.360-000","DISTRITO MARECHAL RONDON","65 99293195","escola.176451@edu.mt.gov.br",-13.2974,-58.0361],["71773","EE PADRE ARLINDO IGNÁCIO DE OLIVEIRA",12,"CAMPO NOVO DO PARECIS","ESCOLA INTEGRAL","U","AVENIDA AMAZONAS QUADRA 271","100","78.360-000","JARDIM DAS PALMEIRAS","65 33824084","escola.71773@edu.mt.gov.br",-13.6547,-57.9049],["176800","EE PARECIS",12,"CAMPO NOVO DO PARECIS","ESCOLA","U","Avenida Amapá","614","78.360-000","Jardim Olenka","65 992625794","escola.176800@edu.mt.gov.br",-13.649,-57.9054],["163678","EE UNIÃO DA CHAPADA",12,"CAMPO NOVO DO PARECIS","ESCOLA","R","FAZENDA UNIÃO","SN","78.360-000","Zona Rural","65 999877104","escola.163678@edu.mt.gov.br",-13.6296,-57.9126],["16055","EECM MADRE TARCILA",12,"CAMPO NOVO DO PARECIS","ESCOLA CÍVICO-MILITAR","U","RUA GOIÁS","700","78.360-000","CENTRO","65 999223453","escola.16055@edu.mt.gov.br",-13.6605,-57.8876],["14516","EE DOUTOR JOAQUIM AUGUSTO DA COSTA MARQUES",12,"DENISE","ESCOLA","U","Rua 7 de Setembro","621","78.380-000","CENTRO","65 998083554","escola.14516@edu.mt.gov.br",-14.7266,-57.0489],["16047","EE JOÃO MONTEIRO SOBRINHO",12,"NOVA OLÍMPIA","ESCOLA INTEGRAL","U","AVENIDA FRANCISCO JOSE BERNARDO","554","78.370-000","OURO VERDE","65 996351505","escola.16047@edu.mt.gov.br",-14.7754,-57.2819],["96784","EE REINALDO DUTRA VILARINHO",12,"NOVA OLÍMPIA","ESCOLA CAMPO/INTEGRAL","R","Agrovila Assentamento Rio Branco - agrovila","s/n","78.370-000","Zona Rural","65 99678125","escola.96784@edu.mt.gov.br",-14.8623,-57.6823],["15954","EE WILSON DE ALMEIDA",12,"NOVA OLÍMPIA","ESCOLA","U","Av. Mato Grosso","454","78.370-000","CENTRO","65 998171573","escola.15954@edu.mt.gov.br",-14.7845,-57.2905],["157236","EECM PROFESSORA FRANCISCA DE SOUZA ALENCAR",12,"NOVA OLÍMPIA","ESCOLA CÍVICO-MILITAR","U","RUA 34, QUADRAS 40 E 41","0","78.370-000","JARDIM DAS OLIVEIRAS","65 33321816","escola.157236@edu.mt.gov.br",-14.7853,-57.273],["14486","EE REGINA TENÓRIO DE OLIVEIRA",12,"PORTO ESTRELA","ESCOLA","U","Rua Getulio Vargas","1","78.398-000","CENTRO","65 996079886","escola.14486@edu.mt.gov.br",-15.3354,-57.201],["154040","EE ANDRÉ ANTÔNIO MAGGI",12,"SAPEZAL","ESCOLA","U","AVENIDA ANTONIO ANDRÉ MAGGI","1870","78.365-000","JARDIM IPÊ","65 996155483","escola.154040@edu.mt.gov.br",-13.5477,-58.8213],["14532","EE PROFESSOR JOSÉ ARI DE OLIVEIRA",12,"SAPEZAL","ESCOLA","U","RUA PROJETADA 7","753NW","78367268","CENTRO","","escola.14532@edu.mt.gov.br",-13.5325,-58.843],["156370","EECM LUIZ FRUTUOSO DA SILVA",12,"SAPEZAL","ESCOLA CÍVICO-MILITAR","U","AVENIDA DO JÁU","1690 S","78.365-000","CENTRO","65 992887395","escola.156370@edu.mt.gov.br",-13.5462,-58.8198],["15873","EE 13 DE MAIO",12,"TANGARÁ DA SERRA","ESCOLA","U","Avenida Brasil","1148 W","78.300-096","JARDIM ACÁCIA","65 99607489","escola.15873@edu.mt.gov.br",-14.6258,-57.496],["15865","EE 29 DE NOVEMBRO",12,"TANGARÁ DA SERRA","ESCOLA","U","RUA JOSÉ CÂNDIDO MELHORANÇA","37-E","78.300-118","CENTRO","65 99281287","escola.15865@edu.mt.gov.br",-14.618,-57.4835],["15920","EE ANTÔNIO HORTOLLANI",12,"TANGARÁ DA SERRA","ESCOLA CAMPO","R","Avenida 07 de Setembro","1","78.306-000","Distrito São Joaquim","65 99980055","escola.15920@edu.mt.gov.br",-14.644,-57.311],["23841","EE DOUTOR HÉLCIO DE SOUZA",12,"TANGARÁ DA SERRA","ESCOLA","U","RUA CINCO","92","78.307-112","JARDIM NAZARÉ","65 99988197","escola.23841@edu.mt.gov.br",-14.6422,-57.4837],["15962","EE JONAS LOPES DA SILVA",12,"TANGARÁ DA SERRA","ESCOLA INTEGRAL/LÍNGUAS","U","RUA SEIS","1600E","78.301-106","JARDIM GOIÁS","65 30160336","escola.15962@edu.mt.gov.br",-14.6254,-57.4711],["213454","EE MILITAR TIRADENTES 1º TENENTE PM SALOMÃO FERNANDES FERREIRA PIOVESAN",12,"TANGARÁ DA SERRA","ESCOLA MILITAR","U","RUA MANOEL DIONÍSIO SOBRINHO","233-S","78300066","CENTRO","65 996351680","escola.213454@edu.mt.gov.br",-14.625,-57.4907],["15903","EE MINISTRO PETRÔNIO PORTELA NUNES",12,"TANGARÁ DA SERRA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Rua Santa Catarina","1","78307899","DISTRITO SÃO JORGE","65 999802660","escola.15903@edu.mt.gov.br",-14.6612,-57.9453],["15890","EE PATRIARCA DA INDEPENDÊNCIA",12,"TANGARÁ DA SERRA","ESCOLA CAMPO/INTEGRAL/MISTA","R","Rua Diva Martins Junqueira","167 W","78.305-000","Progresso","65 99991578","escola.15890@edu.mt.gov.br",-14.6635,-57.362],["76198","EE PAULO FREIRE",12,"TANGARÁ DA SERRA","ESCOLA CAMPO","R","ÁREA RURAL","s/n","78307899","ÁREA RURAL DE TANGARÁ DA SERRA","65 99225090","escola.76198@edu.mt.gov.br",-14.8794,-57.7887],["16020","EE PROFESSOR JOÃO BATISTA",12,"TANGARÁ DA SERRA","ESCOLA","U","AVENIDA ISMAEL JOSÉ DO NASCIMENTO","892","78.300-152","CENTRO - JARDIM EUROPA -SETOR NORTE","65 33291021","escola.16020@edu.mt.gov.br",-14.6116,-57.4836],["15989","EE VEREADOR BENTO MUNIZ",12,"TANGARÁ DA SERRA","ESCOLA","U","RUA LUIZ FERNANDES DE MOURA","1320 N","78.303-061","JARDIM TARUMÃ","65 33291455","escola.15989@edu.mt.gov.br",-14.5989,-57.4907],["15970","EE VEREADOR MANOEL MARINHEIRO",12,"TANGARÁ DA SERRA","ESCOLA","U","RUA AVELINA JACI BOHN","800-S","78.306-018","JARDIM RIO PRETO","65 33263847","escola.15970@edu.mt.gov.br",-14.6302,-57.4893],["15911","EE VEREADOR RAMON SANCHES MARQUES",12,"TANGARÁ DA SERRA","ESCOLA INTEGRAL/ESPORTE","U","RUA ALZIRO ZARUR","378-S","78.306-124","JARDIM CIDADE ALTA","65 999118850","escola.15911@edu.mt.gov.br",-14.6321,-57.4982],["15938","EECM PEDRO ALBERTO TAYANO",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA 07","1980","78.305-197","VILA ESMERALDA","65 33252898","escola.15938@edu.mt.gov.br",-14.6326,-57.524],["15997","EECM PROFESSORA JADA TORRES",12,"TANGARÁ DA SERRA","ESCOLA CÍVICO-MILITAR","U","RUA VITÓRIA","171 W","78.303-528","JARDIM DONA JÚLIA","65 996351968","escola.15997@edu.mt.gov.br",-14.6126,-57.5079],["129259","EEI MALAMALALI",12,"TANGARÁ DA SERRA","ESCOLA INDÍGENA","R","ÁREA RURAL","0","78307899","ÁREA RURAL DE TANGARÁ DA SERRA","65 33262612","escola.129259@edu.mt.gov.br",-14.3806,-58.2336],["946079","EECM ARÃO GOMES BEZERRA",11,"SORRISO","ESCOLA","U","Av. Zilda Arns","0","78895-450","Mário Raiter","","escola.946079@edu.mt.gov.br",-12.5834,-55.7069]];

/* ===================== MAPA DE MATO GROSSO: ESCOLAS E DREs ===================== */
const CAMPOS_ESC = ['codigo','nome','dre','municipio','tipo','localidade','endereco','numero','cep','bairro','telefone','email','latitude','longitude'];
const CORES_DRE = ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#0d9488','#9333ea','#b45309','#475569','#1d4ed8','#be123c'];
const GRUPOS_TIPO = [['Regular', /^ESCOLA$/], ['Cívico-militar', /CÍVICO/], ['Militar', /^ESCOLA MILITAR/], ['Campo', /CAMPO/], ['Indígena', /INDÍGENA/], ['Quilombola', /QUILOMBOLA/], ['Integral', /INTEGRAL/], ['Especializada', /ESPECIALIZADA/], ['Confessional', /CONFESSIONAL/]];
const CORES_TIPO = { 'Regular':'#2563eb', 'Cívico-militar':'#0f766e', 'Militar':'#334155', 'Campo':'#65a30d', 'Indígena':'#c2410c', 'Quilombola':'#7c2d12', 'Integral':'#7c3aed', 'Especializada':'#db2777', 'Confessional':'#ca8a04', 'Outro':'#94a3b8' };
const MODOS_MT = {
  dre:['fa-circle-dot', 'Unidades por DRE', 'Cada escola na cor da DRE a que é subordinada'],
  sodre:['fa-building-flag', 'Somente as DREs', 'Só as sedes das DREs e as suas regiões, sem as escolas'],
  regioes:['fa-draw-polygon', 'Regiões das DREs', 'Municípios pintados pela DRE, com as escolas por cima'],
  municipio:['fa-layer-group', 'Municípios', 'Quanto mais escuro, mais escolas no município'],
  cluster:['fa-object-group', 'Agrupadas', 'Bolhas com a quantidade de escolas; aproxime para separar'],
  tipo:['fa-shapes', 'Tipo de escola', 'Regular, cívico-militar, campo, indígena, integral...'],
  localidade:['fa-tree-city', 'Urbanas e rurais', 'Localização da escola']
};
const mt = { mapa:null, camadas:{}, base:'', modo:store.get('gaborg_mt_modo', 'dre'), fil:{ dres:new Set(), tipo:'', loc:'', q:'' }, foco:-1, lado:window.innerWidth > 820, ligacoes:store.get('gaborg_mt_lig', true), divisas:store.get('gaborg_mt_div', false), rotulos:store.get('gaborg_mt_rot', false), leg:store.get('gaborg_mt_leg2', false), mun:'', marcadores:new Map(), aberto:new Set(), carregando:null, malha:null, erroTiles:0 };
function escolasLista(){
  if (DB.escolas && DB.escolas.length) return DB.escolas.map(e => Object.assign({}, e, { latitude:numBR(e.latitude), longitude:numBR(e.longitude) })).filter(e => e.latitude && e.longitude);
  if (!escolasLista.seed) escolasLista.seed = ESCOLAS_BASE.map(r => ({ codigo:r[0], nome:r[1], dre:ESCOLAS_DRES[r[2]], municipio:r[3], tipo:r[4], localidade:r[5] === 'R' ? 'RURAL' : 'URBANA', endereco:r[6], numero:r[7], cep:r[8], bairro:r[9], telefone:r[10], email:r[11], latitude:r[12], longitude:r[13] }));
  return escolasLista.seed;
}
function dresDe(lista){ return [...new Set(lista.map(e => e.dre))].sort((a, b) => a.localeCompare(b, 'pt-BR')); }
const corDRE = (dres, d) => CORES_DRE[Math.max(0, dres.indexOf(d)) % CORES_DRE.length];
const nomeDRE = d => String(d || '').replace(/^DRE\s+/i, '').toLowerCase().replace(/(^|\s|-)(\S)/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E)\b/g, x => x.toLowerCase());
const grupoTipo = t => (GRUPOS_TIPO.find(([, re]) => re.test(String(t).toUpperCase())) || ['Outro'])[0];
const chaveMun = n => norm(n).replace(/[^a-z]/g, '');
function sedeDRE(d, lista){
  const cid = norm(String(d).replace(/^DRE\s+/i, '')) === 'metropolitana' ? 'cuiaba' : norm(String(d).replace(/^DRE\s+/i, ''));
  let pts = lista.filter(e => e.dre === d && norm(e.municipio) === cid && e.localidade !== 'RURAL'); if (!pts.length) pts = lista.filter(e => e.dre === d && norm(e.municipio) === cid); if (!pts.length) pts = lista.filter(e => e.dre === d);
  return [pts.reduce((t, e) => t + e.latitude, 0) / pts.length, pts.reduce((t, e) => t + e.longitude, 0) / pts.length];
}
function setorDaDRE(d){
  const alvo = norm(d) === 'dre metropolitana' ? 'dme' : norm(d);
  return setoresOficiais().find(s => norm(s.sigla) === alvo || norm(s.nome) === norm('Diretoria Regional de Educação de ' + String(d).replace(/^DRE\s+/i, '')));
}
function carregarScript(srcs){
  const lista = [].concat(srcs);
  return lista.reduce((p, src) => p.catch(() => new Promise((ok, erro) => {
    if (document.querySelector(`script[data-ok="${src}"]`)) return ok();
    const s = document.createElement('script'); s.src = src; s.onload = () => { s.dataset.ok = src; ok(); }; s.onerror = () => { s.remove(); erro(new Error('Não foi possível carregar ' + src)); }; document.head.appendChild(s);
  })), Promise.reject(new Error('início')));
}
function carregarCSS(href){ if (document.querySelector(`link[href="${href}"]`)) return; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
async function carregarLeaflet(){
  if (!(window.L && L.map)) {
    carregarCSS('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
    await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js']);
  }
}
async function carregarCluster(){
  if (window.L && L.markerClusterGroup) return true;
  try {
    carregarCSS('https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css');
    await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js', 'https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js']);
    return !!L.markerClusterGroup;
  } catch (e) { return false; }
}
/* Fundos de mapa sem chave de acesso (Esri e OpenStreetMap) e um modo sem fundo, que nunca falha */
const ESRI = s => `https://server.arcgisonline.com/ArcGIS/rest/services/${s}/MapServer/tile/{z}/{y}/{x}`;
const BASES_MT = {
  ruas:['OpenStreetMap', 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap'],
  claro:['Claro', ESRI('Canvas/World_Light_Gray_Base'), 'Esri, HERE, Garmin, © OpenStreetMap', ESRI('Canvas/World_Light_Gray_Reference')],
  escuro:['Escuro', ESRI('Canvas/World_Dark_Gray_Base'), 'Esri, HERE, Garmin, © OpenStreetMap', ESRI('Canvas/World_Dark_Gray_Reference')],
  topo:['Relevo', ESRI('World_Topo_Map'), 'Esri, HERE, Garmin, USGS'],
  satelite:['Satélite', ESRI('World_Imagery'), 'Esri, Maxar, Earthstar Geographics', ESRI('Reference/World_Boundaries_and_Places')],
  nenhum:['Sem fundo', null, '']
};
function trocarBaseMT(k){
  if (!mt.mapa) return; if (!BASES_MT[k]) k = 'ruas';
  mt.base = k; store.set('gaborg_mt_base3', k); mt.erroTiles = 0; mt.okTiles = 0;
  ['base', 'rotulosBase'].forEach(c => { if (mt.camadas[c]) { mt.mapa.removeLayer(mt.camadas[c]); mt.camadas[c] = null; } });
  const b = BASES_MT[k];
  $('#esc-map').classList.toggle('sem-fundo', !b[1]);
  if (b[1]) {
    mt.camadas.base = L.tileLayer(b[1], { attribution:b[2], maxZoom:18, maxNativeZoom:k === 'ruas' ? 19 : 16 }).addTo(mt.mapa);
    mt.camadas.base.on('tileerror', () => { mt.erroTiles++; if (mt.erroTiles > 12 && !mt.okTiles && mt.base === k) { trocarBaseMT('nenhum'); toast(`O fundo "${b[0]}" não respondeu. Mostrando sem fundo; escolha outro no botão de mapa.`, 'aviso'); } });
    mt.camadas.base.on('tileload', () => { mt.okTiles++; });
    if (b[3]) mt.camadas.rotulosBase = L.tileLayer(b[3], { pane:'rotulosBase', maxZoom:18, maxNativeZoom:16 }).addTo(mt.mapa);
  }
  if ($('#mt-menu') && $('#mt-menu').dataset.t === 'fundo') menuMT('fundo', null, true);
  estilizarMalhaMT();
}
async function renderEscolas(){
  const el = $('#esc-map'); if (!el) return;
  if (!mt.mapa) {
    $('#v-escolas').classList.toggle('sem-lado', !mt.lado);
    $('#esc-status').textContent = 'Carregando o mapa...';
    try { await (mt.carregando = mt.carregando || carregarLeaflet()); }
    catch (e) { $('#esc-status').innerHTML = `<span style="color:var(--perigo)">${esc(e.message)}. Verifique a internet e recarregue.</span>`; return; }
    $('#esc-status').textContent = '';
    mt.mapa = L.map(el, { zoomControl:false, preferCanvas:false, minZoom:4, maxZoom:18, zoomSnap:.25, zoomDelta:.5, wheelPxPerZoomLevel:110, attributionControl:true }).setView([-12.9, -55.6], 6);
    [['rotulosBase', 250, 1], ['mascara', 300, 1], ['malha', 350, 0], ['divisas', 380, 1], ['destaque', 390, 1]].forEach(([n, z, sem]) => { mt.mapa.createPane(n); mt.mapa.getPane(n).style.zIndex = z; if (sem) mt.mapa.getPane(n).style.pointerEvents = 'none'; });
    L.control.zoom({ position:'bottomright', zoomInTitle:'Aproximar', zoomOutTitle:'Afastar' }).addTo(mt.mapa);
    L.control.scale({ imperial:false, position:'bottomright' }).addTo(mt.mapa);
    mt.render = L.svg({ padding:.4 }); // SVG: deixa o mouse chegar aos municípios entre as escolas
    mt.svg = { malha:L.svg({ pane:'malha', padding:.5 }), mascara:L.svg({ pane:'mascara', padding:1 }), destaque:L.svg({ pane:'destaque', padding:.5 }) };
    ['malha', 'divisas', 'destaque', 'nomes', 'ligacoes', 'escolas', 'dres'].forEach(c => { mt.camadas[c] = L.layerGroup().addTo(mt.mapa); });
    trocarBaseMT(store.get('gaborg_mt_base3', 'ruas'));
    mt.mapa.on('click', () => { fecharMenuMT(); voltarMT(mt.mun ? 1 : 0); });
    const zoomCls = () => { el.classList.toggle('mt-longe', mt.mapa.getZoom() < (window.innerWidth > 820 ? 6.6 : 7.4)); el.classList.toggle('mt-perto', mt.mapa.getZoom() >= 8.5); el.classList.toggle('mt-sem-mun', mt.mapa.getZoom() < 7.6); };
    mt.mapa.on('zoomend', zoomCls); zoomCls();
    mt.mapa.on('movestart', fecharMenuMT);
    carregarMalhaMT();
    setTimeout(() => { mt.mapa.invalidateSize(); enquadrarMT(false); }, 60);
  } else setTimeout(() => mt.mapa.invalidateSize(), 60);
  montarControlesMT();
  desenharEscolasMT();
}
function montarControlesMT(){
  const c = $('#mt-ctrl'); if (!c) return;
  const [ic, nome] = MODOS_MT[mt.modo];
  c.innerHTML = `<div class="mt-barra">
      <button class="mt-b-modo" onclick="menuMT('modo',this)" title="Como as escolas aparecem no mapa"><i class="fa-solid ${ic}"></i><span>${esc(nome)}</span><i class="fa-solid fa-chevron-down"></i></button>
      <span class="mt-sep"></span>
      <button class="mt-bi" onclick="menuMT('fundo',this)" title="Fundo do mapa"><i class="fa-solid fa-map"></i></button>
      <button class="mt-bi" onclick="menuMT('camadas',this)" title="Linhas e nomes"><i class="fa-solid fa-sliders"></i></button>
      <button class="mt-bi" onclick="telaCheiaMT()" title="Tela cheia"><i class="fa-solid fa-expand"></i></button>
    </div><div class="mt-menu hidden" id="mt-menu"></div>`;
}
function fecharMenuMT(){ const m = $('#mt-menu'); if (m && !m.classList.contains('hidden')) { m.classList.add('hidden'); m.dataset.t = ''; } }
function menuMT(t, btn, manter){
  const m = $('#mt-menu'); if (!m) return;
  if (!manter && m.dataset.t === t) return fecharMenuMT();
  m.dataset.t = t;
  const sw = (k, n, d) => `<button class="mt-mi" onclick="alternarCamadaMT('${k}')"><span class="mt-sw ${mt[k] ? 'on' : ''}"></span><div><b>${n}</b><small>${d}</small></div></button>`;
  if (t === 'modo') m.innerHTML = `<div class="mt-mh">Mostrar as escolas</div>` + Object.entries(MODOS_MT).map(([k, [ic, n, d]]) => `<button class="mt-mi ${mt.modo === k ? 'on' : ''}" onclick="modoMT('${k}')"><i class="fa-solid ${ic}"></i><div><b>${esc(n)}</b><small>${esc(d)}</small></div>${mt.modo === k ? '<i class="fa-solid fa-check ck"></i>' : ''}</button>`).join('');
  else if (t === 'fundo') m.innerHTML = `<div class="mt-mh">Fundo do mapa</div>` + Object.entries(BASES_MT).map(([k, [n]]) => `<button class="mt-mi ${mt.base === k ? 'on' : ''}" onclick="trocarBaseMT('${k}')"><span class="mt-th mt-th-${k}"></span><div><b>${esc(n)}</b>${k === 'ruas' ? '<small>Mapa padrão do Leaflet, com cidades, rodovias e rios</small>' : k === 'nenhum' ? '<small>Só o território do estado</small>' : ''}</div>${mt.base === k ? '<i class="fa-solid fa-check ck"></i>' : ''}</button>`).join('');
  else m.innerHTML = `<div class="mt-mh">Linhas e nomes</div>` + sw('divisas', 'Divisas', 'Limites dos municípios e das regiões das DREs') + sw('rotulos', 'Nomes', 'Nome das regiões e dos municípios ao aproximar') + sw('ligacoes', 'Ligações', 'Linha de cada escola até a sua DRE');
  m.classList.remove('hidden');
}
document.addEventListener('pointerdown', e => { if (!e.target.closest || e.target.closest('.mt-ctrl')) return; fecharMenuMT(); });
async function modoMT(m){
  if (m === 'cluster' && !(await carregarCluster())) { toast('Não foi possível carregar o agrupamento. Mostrando por DRE.', 'aviso'); m = 'dre'; }
  mt.modo = m; store.set('gaborg_mt_modo', m); fecharMenuMT(); montarControlesMT();
  desenharEscolasMT();
}
function telaCheiaMT(){ const a = $('.mt-area'); if (document.fullscreenElement) document.exitFullscreen(); else if (a.requestFullscreen) a.requestFullscreen().then(() => setTimeout(() => mt.mapa.invalidateSize(), 200)).catch(() => {}); }
document.addEventListener('fullscreenchange', () => { if (mt.mapa) setTimeout(() => mt.mapa.invalidateSize(), 200); });
function filtrarEscolasMT(lista){
  const f = mt.fil, q = norm(f.q);
  return lista.filter(e => (!f.dres.size || f.dres.has(e.dre)) && (!f.tipo || grupoTipo(e.tipo) === f.tipo || (f.tipo === 'Integral' && /INTEGRAL/.test(e.tipo))) && (!f.loc || e.localidade === f.loc) && (!q || norm(e.nome + ' ' + e.codigo + ' ' + e.municipio + ' ' + e.bairro).includes(q)));
}
function popupEscola(e, dres){
  const cor = corDRE(dres, e.dre), end = [e.endereco, e.numero && e.numero !== '0' ? e.numero : '', e.bairro].filter(Boolean).join(', ');
  return `<div class="mt-pop"><div class="t" style="--c:${cor}"><i class="fa-solid fa-school"></i>${esc(e.tipo)} · ${esc(e.localidade === 'RURAL' ? 'Rural' : 'Urbana')}</div><b>${esc(e.nome)}</b><small>Código ${esc(e.codigo)} · ${esc(e.municipio)}</small>
    <div class="l"><i class="fa-solid fa-sitemap"></i><a href="#" onclick="event.preventDefault();focarDREmt(${dres.indexOf(e.dre)})" style="color:${cor}">${esc(e.dre)}</a></div>
    ${end ? `<div class="l"><i class="fa-solid fa-location-dot"></i>${esc(end)}${e.cep ? ' · ' + esc(e.cep) : ''}</div>` : ''}
    ${e.telefone ? `<div class="l"><i class="fa-solid fa-phone"></i>${esc(e.telefone)}</div>` : ''}
    ${e.email ? `<div class="l"><i class="fa-solid fa-envelope"></i><a href="mailto:${esc(e.email)}">${esc(e.email)}</a></div>` : ''}
    <div class="a"><a href="https://www.google.com/maps/dir/?api=1&destination=${e.latitude},${e.longitude}" target="_blank" rel="noopener"><i class="fa-solid fa-route"></i>Como chegar</a><a href="#" onclick="event.preventDefault();mt.mapa.flyTo([${e.latitude},${e.longitude}],15)"><i class="fa-solid fa-magnifying-glass-plus"></i>Aproximar</a></div></div>`;
}
function corEscolaMT(e, dres){
  if (mt.modo === 'tipo') return CORES_TIPO[grupoTipo(e.tipo)] || CORES_TIPO.Outro;
  if (mt.modo === 'localidade') return e.localidade === 'RURAL' ? '#65a30d' : '#2563eb';
  if (mt.modo === 'municipio') return '#0f172a';
  return corDRE(dres, e.dre);
}
function desenharEscolasMT(){
  if (!mt.mapa) return;
  const todas = escolasLista(), dres = dresDe(todas), lista = filtrarEscolasMT(todas), foco = mt.foco >= 0 ? dres[mt.foco] : null, modo = mt.modo, mun = mt.mun;
  if (mt.camadas.cluster) { mt.mapa.removeLayer(mt.camadas.cluster); mt.camadas.cluster = null; }
  mt.camadas.escolas.clearLayers(); mt.camadas.dres.clearLayers(); mt.camadas.ligacoes.clearLayers(); mt.marcadores.clear();
  const sedes = new Map(dres.map(d => [d, sedeDRE(d, todas)]));
  if (mt.ligacoes || (foco && modo !== 'sodre')) lista.filter(e => (!foco || e.dre === foco) && (!mun || chaveMun(e.municipio) === mun)).forEach(e => L.polyline([sedes.get(e.dre), [e.latitude, e.longitude]], { color:corDRE(dres, e.dre), weight:foco ? 1.6 : 1.1, opacity:foco ? .7 : .45, renderer:mt.render, interactive:false }).addTo(mt.camadas.ligacoes));
  const pequeno = modo === 'regioes' || modo === 'municipio';
  let destino = mt.camadas.escolas;
  if (modo === 'cluster' && L.markerClusterGroup) {
    destino = mt.camadas.cluster = L.markerClusterGroup({ showCoverageOnHover:false, spiderfyOnMaxZoom:true, maxClusterRadius:z => z < 7 ? 70 : 50, chunkedLoading:true,
      iconCreateFunction:cl => { const cont = {}; cl.getAllChildMarkers().forEach(m => { cont[m.options.fillColor] = (cont[m.options.fillColor] || 0) + 1; }); const tot = cl.getChildCount(), ord = Object.entries(cont).sort((a, b) => b[1] - a[1]);
        let ac = 0; const fatias = ord.map(([c, n]) => { const i = ac; ac += n / tot * 360; return `${c} ${i}deg ${ac}deg`; }).join(',');
        const t = tot < 10 ? 34 : tot < 50 ? 42 : tot < 150 ? 50 : 58;
        return L.divIcon({ html:`<div class="mt-bolha" style="width:${t}px;height:${t}px;background:conic-gradient(${fatias})"><span>${tot}</span></div>`, className:'mt-bolha-ic', iconSize:[t, t] }); } });
    mt.mapa.addLayer(destino);
  }
  if (modo !== 'sodre') lista.forEach(e => {
    const cor = corEscolaMT(e, dres), apagada = (foco && e.dre !== foco) || (mun && chaveMun(e.municipio) !== mun);
    const opts = { radius:pequeno ? 3.2 : (foco && !apagada ? 6.5 : 5.2), color:'#fff', weight:pequeno ? .8 : 1.4, fillColor:cor, fillOpacity:apagada ? .12 : (modo === 'municipio' ? .55 : .92), opacity:apagada ? .2 : 1 };
    if (destino === mt.camadas.escolas) opts.renderer = mt.render;
    const m = L.circleMarker([e.latitude, e.longitude], opts);
    if (!apagada) { m.on('mouseover', () => m.setRadius(opts.radius + 3)); m.on('mouseout', () => m.setRadius(opts.radius)); }
    m.bindTooltip(`<b>${esc(e.nome)}</b><br>${esc(e.municipio)} · ${esc(nomeDRE(e.dre))}`, { direction:'top', offset:[0, -4], className:'mt-tip' });
    m.bindPopup(() => popupEscola(e, dres), { maxWidth:320, className:'mt-popup' });
    destino.addLayer(m); mt.marcadores.set(e.codigo, m);
  });
  if (modo !== 'municipio') dres.forEach((d, i) => {
    const n = lista.filter(e => e.dre === d).length; if (!n && (mt.fil.dres.size && !mt.fil.dres.has(d))) return;
    const icone = L.divIcon({ className:'mt-dre-ic', html:`<div class="mt-dre ${foco === d ? 'on' : ''} ${foco && foco !== d ? 'off' : ''}" style="--c:${corDRE(dres, d)}"><i class="fa-solid fa-building-flag"></i><span>${esc(nomeDRE(d))}</span><b>${n}</b></div>`, iconSize:null, iconAnchor:[14, 14] });
    L.marker(sedes.get(d), { icon:icone, zIndexOffset:1000 + (foco === d ? 500 : 0), keyboard:false, title:'Sede da ' + d }).on('click', ev => { L.DomEvent.stopPropagation(ev); focarDREmt(foco === d && !mt.mun ? -1 : i); }).on('mouseover', () => realcarDREmt(i)).on('mouseout', () => realcarDREmt(-1)).addTo(mt.camadas.dres);
  });
  estilizarMalhaMT(); legendaMT(dres, lista); trilhaMT(dres);
  painelEscolasMT(todas, dres, lista);
}
function enquadrarMT(anim){
  if (!mt.mapa) return;
  const dur = anim === false || semMovimento() ? 0 : .9, pad = { paddingTopLeft:[40, 70], paddingBottomRight:[40, 40], duration:dur };
  const todas = escolasLista(), dres = dresDe(todas), foco = mt.foco >= 0 ? dres[mt.foco] : null;
  const filtrando = mt.fil.dres.size || mt.fil.tipo || mt.fil.loc || mt.fil.q;
  if (mt.mun && mt.munB && mt.munB.get(mt.mun)) return mt.mapa.flyToBounds(mt.munB.get(mt.mun), Object.assign({ maxZoom:11.5 }, pad));
  if (foco && !filtrando && mt.regB && mt.regB.get(foco)) return mt.mapa.flyToBounds(mt.regB.get(foco), Object.assign({ maxZoom:10 }, pad));
  if (!foco && !filtrando && mt.estadoB) return mt.mapa.flyToBounds(mt.estadoB, Object.assign({}, pad, { paddingTopLeft:[20, 60], paddingBottomRight:[20, 20] }));
  const l = filtrarEscolasMT(todas).filter(e => !foco || e.dre === foco);
  if (!l.length) return;
  mt.mapa.flyToBounds(L.latLngBounds(l.map(e => [e.latitude, e.longitude])), Object.assign({ maxZoom:12 }, pad));
}
function focarDREmt(i){
  mt.foco = i; mt.mun = ''; if (mt.mapa) mt.mapa.closePopup();
  if (i >= 0) mt.aberto.add(dresDe(escolasLista())[i]);
  desenharEscolasMT(); enquadrarMT(true);
}
function selecionarMunMT(k){
  const dres = dresDe(escolasLista()), f = mt.munF && mt.munF.get(k);
  if (!f) return;
  if (mt.mun === k) return voltarMT(1);
  mt.mun = k; const i = dres.indexOf(f.properties.dre); mt.foco = i;
  if (mt.mapa) mt.mapa.closePopup();
  desenharEscolasMT(); enquadrarMT(true);
}
function voltarMT(n){
  if (n >= 1 && mt.mun) { mt.mun = ''; desenharEscolasMT(); enquadrarMT(true); return; }
  if (n === 0 && (mt.foco >= 0 || mt.mun)) { mt.mun = ''; focarDREmt(-1); }
}
function trilhaMT(dres){
  const t = $('#mt-trilha'); if (!t) return;
  const foco = mt.foco >= 0 ? dres[mt.foco] : null, f = mt.mun && mt.munF ? mt.munF.get(mt.mun) : null;
  t.innerHTML = `<button class="${foco ? '' : 'on'}" onclick="voltarMT(0)"><i class="fa-solid fa-map-location-dot"></i>Mato Grosso</button>`
    + (foco ? `<i class="fa-solid fa-chevron-right sep"></i><button class="${f ? '' : 'on'}" style="--c:${corDRE(dres, foco)}" onclick="${f ? 'voltarMT(1)' : 'enquadrarMT(true)'}"><span class="pt"></span>${esc(nomeDRE(foco))}</button>` : '')
    + (f ? `<i class="fa-solid fa-chevron-right sep"></i><button class="on" onclick="enquadrarMT(true)">${esc(f.properties.nome)}</button>` : '')
    + (foco ? `<button class="x" onclick="voltarMT(${f ? 1 : 0})" title="Voltar (Esc)"><i class="fa-solid fa-arrow-left"></i></button>` : '');
}
/* ---------- Malha municipal do IBGE: regiões, divisas e nomes ---------- */
async function carregarMalhaMT(){
  const IBGE = 'https://servicodados.ibge.gov.br/api/v3/malhas/estados/51?qualidade=intermediaria&intrasubdivisao=municipio&formato=';
  let nomes = null, topo = null, geo = null;
  try { const c = JSON.parse(localStorage.getItem('gaborg_ibge_mt2') || 'null'); if (c && c.nomes && (c.topo || c.geo)) ({ nomes, topo, geo } = c); } catch (e) {}
  try {
    if (!nomes) { nomes = {}; (await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios').then(r => r.json())).forEach(x => { nomes[String(x.id)] = x.nome; }); }
    if (!topo && !geo) {
      try {
        await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/topojson-client/3.1.0/topojson-client.min.js', 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js']);
        const t = await fetch(IBGE + 'application/json').then(r => { if (!r.ok) throw new Error('IBGE ' + r.status); return r.json(); });
        if (t.type === 'Topology') topo = t; else if (t.type === 'FeatureCollection') geo = t; else throw new Error('formato');
      } catch (e) { geo = await fetch(IBGE + 'application/vnd.geo%2Bjson').then(r => { if (!r.ok) throw new Error('IBGE ' + r.status); return r.json(); }); }
      try { localStorage.setItem('gaborg_ibge_mt2', JSON.stringify({ topo, geo, nomes })); } catch (e) {}
    } else if (topo) await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/topojson-client/3.1.0/topojson-client.min.js', 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js']);
    if (topo) { const obj = topo.objects[Object.keys(topo.objects)[0]]; obj.geometries.forEach(g => { g.properties = g.properties || {}; g.properties.nome = nomes[String(g.properties.codarea)] || ''; }); mt.malha = { topo, obj }; }
    else { geo.features.forEach(f => { f.properties = f.properties || {}; f.properties.nome = nomes[String(f.properties.codarea)] || ''; }); mt.malha = { geo }; }
    const a = $('#mt-aviso-malha'); if (a) a.classList.add('hidden');
    desenharMalhaMT();
  } catch (e) { console.warn('GABOrg: malha municipal indisponível', e); const a = $('#mt-aviso-malha'); if (a) a.classList.remove('hidden'); }
}
function dreDosMunicipios(){
  const porMun = new Map(); escolasLista().forEach(e => { const k = chaveMun(e.municipio), o = porMun.get(k) || {}; o[e.dre] = (o[e.dre] || 0) + 1; porMun.set(k, o); });
  return porMun;
}
function corEscala(n, max){
  if (!n) return '#e2e8f0';
  const passos = ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'], lim = [1, 2, 4, 8, 16, 1e9];
  return passos[lim.findIndex(l => n <= l)];
}
function desenharMalhaMT(){ estilizarMalhaMT(); }
/* monta uma vez as camadas da malha (municípios, regiões, máscara fora do estado) e depois só muda o estilo */
function construirMalhaMT(){
  const { topo, obj, geo } = mt.malha, temTopo = !!(topo && window.topojson), todas = escolasLista(), dres = dresDe(todas);
  const porMun = dreDosMunicipios();
  const geoms = temTopo ? obj.geometries : geo.features;
  geoms.forEach(g => { const o = porMun.get(chaveMun(g.properties.nome)); g.properties.chave = chaveMun(g.properties.nome) || String(g.properties.codarea); g.properties.dre = o ? Object.entries(o).sort((a, b) => b[1] - a[1])[0][0] : ''; g.properties.n = o ? Object.values(o).reduce((a, b) => a + b, 0) : 0; g.properties.detalhe = o; });
  ['malha', 'divisas', 'destaque', 'nomes'].forEach(c => mt.camadas[c].clearLayers());
  if (mt.camadas.mascara) { mt.mapa.removeLayer(mt.camadas.mascara); mt.camadas.mascara = null; }
  const fc = temTopo ? topojson.feature(topo, obj) : geo;
  mt.temTopo = temTopo; mt.munF = new Map(); mt.munB = new Map(); mt.munL = new Map(); mt.regB = new Map(); mt.regGeo = new Map(); mt.regC = new Map();
  fc.features.forEach(f => { const k = f.properties.chave; mt.munF.set(k, f); const b = L.geoJSON(f).getBounds(); mt.munB.set(k, mt.munB.has(k) ? mt.munB.get(k).extend(b) : b); });
  // estado: fundo com sombra e máscara que esconde tudo o que está fora de Mato Grosso
  if (temTopo) {
    const estado = topojson.merge(topo, obj.geometries);
    mt.estadoB = L.geoJSON(estado).getBounds();
    mt.camadas.estado = L.geoJSON(estado, { renderer:mt.svg.malha, interactive:false, style:{ stroke:false, fillOpacity:1, className:'mt-estado' } }).addTo(mt.camadas.malha);
    const furos = estado.coordinates.map(pol => pol[0].map(([x, y]) => [y, x]));
    mt.camadas.mascara = L.polygon([[[-89, -400], [-89, 400], [89, 400], [89, -400]], ...furos], { renderer:mt.svg.mascara, interactive:false, stroke:false, fillOpacity:1, className:'mt-mascara' }).addTo(mt.mapa);
    dres.forEach(d => {
      const g = obj.geometries.filter(x => x.properties.dre === d); if (!g.length) return;
      const r = topojson.merge(topo, g); mt.regGeo.set(d, r); mt.regB.set(d, L.geoJSON(r).getBounds());
      // ponto do nome: centro do maior pedaço da região
      let best = null, ba = 0; r.coordinates.forEach(pol => { const ring = pol[0]; let A = 0, cx = 0, cy = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [x0, y0] = ring[j], [x1, y1] = ring[i], k = x0 * y1 - x1 * y0; A += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k; } if (Math.abs(A) > ba) { ba = Math.abs(A); best = [cy / (3 * A), cx / (3 * A)]; } });
      if (best) mt.regC.set(d, best);
    });
    mt.mesh = { mun:topojson.mesh(topo, obj, (a, b) => a !== b && a.properties.dre === b.properties.dre), dre:topojson.mesh(topo, obj, (a, b) => a !== b && a.properties.dre !== b.properties.dre), estado:topojson.mesh(topo, obj, (a, b) => a === b) };
  } else {
    mt.estadoB = L.geoJSON(fc).getBounds(); mt.mesh = null;
    dres.forEach(d => { const fs = fc.features.filter(f => f.properties.dre === d); if (!fs.length) return; const b = L.geoJSON({ type:'FeatureCollection', features:fs }).getBounds(); mt.regB.set(d, b); mt.regC.set(d, [b.getCenter().lat, b.getCenter().lng]); });
  }
  mt.mapa.setMaxBounds(L.latLngBounds([-36, -76], [7, -32])); mt.mapa.options.maxBoundsViscosity = .6; // Brasil inteiro, para ver MT no contexto do país
  mt.camadas.mun = L.geoJSON(fc, { renderer:mt.svg.malha, style:f => estiloMunMT(f),
    onEachFeature:(f, l) => {
      const k = f.properties.chave; (mt.munL.get(k) || mt.munL.set(k, []).get(k)).push(l);
      l.bindTooltip(() => dicaMunMT(f), { sticky:true, className:'mt-tip mt-tip-mun', direction:'top', offset:[0, -10] });
      l.on('mouseover', () => { mt.hover = k; (mt.munL.get(k) || []).forEach(x => x.setStyle(estiloMunMT(x.feature, true))); realcarDREmt(dres.indexOf(f.properties.dre), true); });
      l.on('mouseout', () => { if (mt.hover === k) mt.hover = ''; (mt.munL.get(k) || []).forEach(x => x.setStyle(estiloMunMT(x.feature))); realcarDREmt(-1); });
      l.on('click', ev => { L.DomEvent.stopPropagation(ev); fecharMenuMT(); selecionarMunMT(k); });
    } }).addTo(mt.camadas.malha);
  mt.malhaSig = assinaturaMT();
  if (mt.foco < 0 && !mt.mun) enquadrarMT(false);
}
const assinaturaMT = () => { const l = escolasLista(); return l.length + '|' + (l[0] && l[0].codigo) + '|' + (l[l.length - 1] && l[l.length - 1].dre); };
function corMascaraMT(){ const c = getComputedStyle($('#esc-map')).backgroundColor; return c && c !== 'rgba(0, 0, 0, 0)' ? c : '#f1f5f9'; }
function estiloMunMT(f, hover){
  const dres = dresDe(escolasLista()), foco = mt.foco >= 0 ? dres[mt.foco] : null, d = f.properties.dre, k = f.properties.chave;
  const ap = (foco && d !== foco), sel = mt.mun === k, semFundo = mt.base === 'nenhum', escuro = document.documentElement.dataset.tema === 'escuro' || ['escuro', 'satelite'].includes(mt.base);
  let fill = d ? corDRE(dres, d) : '#94a3b8', op;
  if (mt.modo === 'regioes') op = ap ? .1 : sel ? .75 : .5;
  else if (mt.modo === 'sodre') op = ap ? .08 : sel ? .6 : .38;
  else if (mt.modo === 'municipio') { fill = corEscala(f.properties.n); op = ap ? .25 : .9; }
  else if (semFundo) op = ap ? .05 : sel ? .4 : foco ? .24 : .16;
  else op = ap ? .02 : sel ? .3 : foco ? .12 : 0;
  if (ap && !semFundo) { fill = escuro ? '#020617' : '#0f172a'; op = .2; }
  if (mt.mun && !sel && !ap) op *= .55;
  if (hover) op = Math.min(.95, op + (mt.modo === 'municipio' ? .1 : .2));
  return { stroke:hover || sel, color:escuro ? '#f8fafc' : '#0f172a', weight:sel ? 2.6 : 1.8, opacity:1, fillColor:fill, fillOpacity:op, className:'mt-mun' };
}
function dicaMunMT(f){
  const o = f.properties.detalhe, dres = dresDe(escolasLista()), d = f.properties.dre;
  const l = escolasLista().filter(e => chaveMun(e.municipio) === f.properties.chave), u = l.filter(e => e.localidade !== 'RURAL').length;
  return `<div class="mt-dica" style="--c:${d ? corDRE(dres, d) : '#94a3b8'}"><b>${esc(f.properties.nome)}</b>${d ? `<span class="r"><i></i>${esc(nomeDRE(d))}</span>` : ''}
    ${l.length ? `<div class="n"><b>${l.length}</b> escola${l.length > 1 ? 's' : ''} estadua${l.length > 1 ? 'is' : 'l'}<small>${u} urbana${u === 1 ? '' : 's'} · ${l.length - u} rura${l.length - u === 1 ? 'l' : 'is'}</small></div>` : '<div class="n"><small>Nenhuma escola estadual na base</small></div>'}
    ${o && Object.keys(o).length > 1 ? `<small class="o">${Object.entries(o).map(([x, n]) => `${esc(nomeDRE(x))}: ${n}`).join(' · ')}</small>` : ''}
    <small class="h">${mt.mun === f.properties.chave ? 'Clique para voltar' : 'Clique para ver as escolas'}</small></div>`;
}
function realcarDREmt(i, doMapa){
  if (!mt.camadas.destaque) return; mt.camadas.destaque.clearLayers();
  const dres = dresDe(escolasLista()), d = dres[i]; if (!d || !mt.regGeo || !mt.regGeo.get(d)) return;
  if (doMapa && mt.foco >= 0) return; // dentro de uma DRE, o realce fica só no município
  const c = corDRE(dres, d);
  L.geoJSON(mt.regGeo.get(d), { renderer:mt.svg.destaque, interactive:false, style:{ color:'#fff', weight:7, opacity:.85, fill:false, lineJoin:'round' } }).addTo(mt.camadas.destaque);
  L.geoJSON(mt.regGeo.get(d), { renderer:mt.svg.destaque, interactive:false, style:{ color:c, weight:3.5, opacity:1, fill:!doMapa, fillColor:c, fillOpacity:.12, lineJoin:'round', className:'mt-reg-hl' } }).addTo(mt.camadas.destaque);
}
function estilizarMalhaMT(){
  if (!mt.mapa || !mt.malha) return;
  if (mt.malhaSig !== assinaturaMT() || !mt.camadas.mun) construirMalhaMT();
  const dres = dresDe(escolasLista()), foco = mt.foco >= 0 ? dres[mt.foco] : null, semFundo = mt.base === 'nenhum';
  const escuro = document.documentElement.dataset.tema === 'escuro' || ['escuro', 'satelite'].includes(mt.base);
  mt.camadas.mun.eachLayer(l => l.setStyle(estiloMunMT(l.feature, mt.hover === l.feature.properties.chave)));
  if (mt.camadas.estado) mt.camadas.estado.setStyle({ fillColor:escuro ? '#0f172a' : '#ffffff', fillOpacity:semFundo ? 1 : 0 });
  if (mt.camadas.mascara) mt.camadas.mascara.setStyle({ fillColor:corMascaraMT(), fillOpacity:semFundo ? 1 : 0 });
  $('#esc-map').classList.toggle('mt-foco-on', !!foco);
  // linhas
  mt.camadas.divisas.clearLayers(); mt.camadas.nomes.clearLayers();
  const linha = escuro ? '#e2e8f0' : '#0f172a', fina = escuro ? 'rgba(226,232,240,.45)' : (semFundo ? 'rgba(15,23,42,.18)' : 'rgba(15,23,42,.4)');
  if (mt.mesh) {
    const pintado = ['regioes', 'sodre', 'municipio'].includes(mt.modo);
    if (mt.divisas || pintado || foco) L.geoJSON(mt.mesh.mun, { pane:'divisas', interactive:false, style:{ color:fina, weight:foco ? 1 : .7 } }).addTo(mt.camadas.divisas);
    if (mt.divisas || mt.modo === 'regioes' || mt.modo === 'sodre') {
      L.geoJSON(mt.mesh.dre, { pane:'divisas', interactive:false, style:{ color:escuro ? '#0b1220' : '#ffffff', weight:5, opacity:.9, lineCap:'round', lineJoin:'round' } }).addTo(mt.camadas.divisas);
      L.geoJSON(mt.mesh.dre, { pane:'divisas', interactive:false, style:{ color:linha, weight:1.8, opacity:.8, lineCap:'round', lineJoin:'round' } }).addTo(mt.camadas.divisas);
    }
    L.geoJSON(mt.mesh.estado, { pane:'divisas', interactive:false, style:{ color:semFundo ? linha : '#7c3aed', weight:semFundo ? 2.4 : 2, opacity:semFundo ? .9 : .55, dashArray:semFundo ? null : '6 5', lineJoin:'round' } }).addTo(mt.camadas.divisas);
  }
  if (foco && mt.regGeo && mt.regGeo.get(foco)) {
    L.geoJSON(mt.regGeo.get(foco), { renderer:mt.svg.destaque, interactive:false, style:{ color:'#fff', weight:8, opacity:.9, fill:false, lineJoin:'round' } }).addTo(mt.camadas.divisas);
    L.geoJSON(mt.regGeo.get(foco), { renderer:mt.svg.destaque, interactive:false, style:{ color:corDRE(dres, foco), weight:4, opacity:1, fill:false, lineJoin:'round', className:'mt-reg-on' } }).addTo(mt.camadas.divisas);
  }
  // nomes: das regiões (se ligado ou nos modos pintados) e dos municípios (se ligado ou com uma DRE aberta)
  if (!foco && (mt.rotulos || mt.modo === 'regioes' || mt.modo === 'sodre')) mt.regC.forEach((c, d) => {
    const i = dres.indexOf(d);
    L.marker(c, { keyboard:false, zIndexOffset:-500, icon:L.divIcon({ className:'mt-reg-ic', html:`<span class="mt-reg" style="--c:${corDRE(dres, d)}">${esc(nomeDRE(d))}</span>`, iconSize:null }) })
      .on('click', ev => { L.DomEvent.stopPropagation(ev); focarDREmt(i); }).on('mouseover', () => realcarDREmt(i)).on('mouseout', () => realcarDREmt(-1)).addTo(mt.camadas.nomes);
  });
  if (mt.rotulos || foco) {
    const vistos = new Set();
    mt.munF.forEach((f, k) => {
      if (vistos.has(k) || !f.properties.nome || (foco && f.properties.dre !== foco)) return; vistos.add(k);
      const c = mt.munB.get(k).getCenter();
      L.marker(c, { interactive:false, keyboard:false, zIndexOffset:-600, icon:L.divIcon({ className:'mt-reg-ic', html:`<span class="mt-mun-n ${mt.mun === k ? 'on' : ''} ${f.properties.n ? '' : 'z'}">${esc(f.properties.nome)}${f.properties.n ? `<b>${f.properties.n}</b>` : ''}</span>`, iconSize:null }) }).addTo(mt.camadas.nomes);
    });
  }
}
function legendaMT(dres, lista){
  const el = $('#mt-leg'); if (!el) return;
  el.classList.toggle('fechada', !mt.leg);
  let it = [];
  if (mt.modo === 'tipo') { const c = {}; lista.forEach(e => { const g = grupoTipo(e.tipo); c[g] = (c[g] || 0) + 1; }); it = Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, n]) => [CORES_TIPO[k] || CORES_TIPO.Outro, k, n]); }
  else if (mt.modo === 'localidade') it = [['#2563eb', 'Urbanas', lista.filter(e => e.localidade !== 'RURAL').length], ['#65a30d', 'Rurais', lista.filter(e => e.localidade === 'RURAL').length]];
  else if (mt.modo === 'municipio') it = [['#dbeafe', '1 escola'], ['#93c5fd', '2'], ['#60a5fa', '3 a 4'], ['#3b82f6', '5 a 8'], ['#1d4ed8', '9 a 16'], ['#1e3a8a', 'mais de 16'], ['#e2e8f0', 'sem escola']];
  else it = dres.map((d, i) => [corDRE(dres, d), nomeDRE(d), lista.filter(e => e.dre === d).length, i]);
  el.innerHTML = `<button class="mt-leg-tg" onclick="mt.leg=!mt.leg;store.set('gaborg_mt_leg2',mt.leg);this.parentNode.classList.toggle('fechada',!mt.leg)" title="Mostrar ou esconder a legenda"><i class="fa-solid fa-list"></i><span>Legenda</span></button>
    <div class="mt-leg-c"><b>${esc(MODOS_MT[mt.modo][1])}</b><small>${esc(MODOS_MT[mt.modo][2])}</small><div class="its ${it.length > 8 ? 'duas' : ''}">${it.map(([c, n, q, i]) => i !== undefined ? `<button class="it ${mt.foco === i ? 'on' : ''}" onclick="focarDREmt(${mt.foco === i ? -1 : i})" onmouseenter="realcarDREmt(${i})" onmouseleave="realcarDREmt(-1)"><i style="background:${c}"></i>${esc(n)}<span>${q}</span></button>` : `<div class="it"><i style="background:${c}"></i>${esc(n)}${q !== undefined ? `<span>${q}</span>` : ''}</div>`).join('')}</div>
    ${mt.modo !== 'municipio' ? '<div class="sede"><span class="mt-dre" style="--c:#475569;transform:scale(.8);transform-origin:left"><i class="fa-solid fa-building-flag"></i><b>n</b></span>sede da DRE (nº de escolas)</div>' : ''}</div>`;
}
function painelEscolasMT(todas, dres, lista){
  const f = mt.fil, foco = mt.foco >= 0 ? dres[mt.foco] : null;
  const mun = new Set(lista.map(e => e.municipio)), urb = lista.filter(e => e.localidade !== 'RURAL').length;
  $('#esc-kpi').innerHTML = `<div><b>${lista.length.toLocaleString('pt-BR')}</b>escolas</div><div><b>${new Set(lista.map(e => e.dre)).size}</b>DREs</div><div><b>${mun.size}</b>municípios</div><div><b>${urb}</b>urbanas · <b>${lista.length - urb}</b> rurais</div>`;
  $('#esc-dres').innerHTML = dres.map((d, i) => { const n = todas.filter(e => e.dre === d).length; return `<button class="mt-chip ${!f.dres.size || f.dres.has(d) ? 'on' : ''}" style="--c:${corDRE(dres, d)}" onclick="alternarDREfiltro(${i})" title="${esc(d)}: ${n} escolas"><i></i>${esc(nomeDRE(d))}<b>${n}</b></button>`; }).join('');
  const fc = $('#esc-foco');
  if (foco) {
    const l = todas.filter(e => e.dre === foco), m = [...new Set(l.map(e => e.municipio))].sort(), u = l.filter(e => e.localidade !== 'RURAL').length, s = setorDaDRE(foco);
    const tipos = {}; l.forEach(e => { const g = grupoTipo(e.tipo); tipos[g] = (tipos[g] || 0) + 1; });
    fc.innerHTML = `<div class="mt-foco" style="--c:${corDRE(dres, foco)}"><div class="h"><i class="fa-solid fa-building-flag"></i><div><b>${esc(foco)}</b><small>${l.length} escolas · ${m.length} municípios · ${u} urbanas · ${l.length - u} rurais</small></div><button class="btn btn-s btn-sm btn-i" onclick="focarDREmt(-1)" title="Mostrar todas"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="tp">${Object.entries(tipos).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span>${esc(k)} <b>${v}</b></span>`).join('')}</div>
      <div class="mu">${m.map(x => esc(x)).join(' · ')}</div>
      ${s ? `<button class="btn btn-s btn-sm" onclick="trocarVista('mapa');setTimeout(()=>irPara(${arg(s.id)}),60)"><i class="fa-solid fa-diagram-project"></i>Ver no organograma</button>` : ''}</div>`;
  } else fc.innerHTML = '';
  if (mt.mun && mt.munF && mt.munF.get(mt.mun)) {
    const f = mt.munF.get(mt.mun), l = todas.filter(e => chaveMun(e.municipio) === mt.mun).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), d = f.properties.dre;
    fc.innerHTML = `<div class="mt-foco" style="--c:${d ? corDRE(dres, d) : '#94a3b8'}"><div class="h"><i class="fa-solid fa-city"></i><div><b>${esc(f.properties.nome)}</b><small>${d ? esc(d) + ' · ' : ''}${l.length} escola(s)</small></div><button class="btn btn-s btn-sm btn-i" onclick="voltarMT(1)" title="Voltar para a DRE"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="mt-mun-l">${l.map(e => `<button class="ei" onclick="irEscolaMT(${arg(e.codigo)})" onmouseenter="pulsarEscolaMT(${arg(e.codigo)})"><b>${esc(e.nome)}</b><small>${esc(grupoTipo(e.tipo))}${e.localidade === 'RURAL' ? ' · rural' : ''}${e.bairro ? ' · ' + esc(e.bairro) : ''}</small></button>`).join('') || '<small>Nenhuma escola estadual na base.</small>'}</div></div>`;
  }
  const grupos = dres.map(d => [d, lista.filter(e => e.dre === d)]).filter(([, l]) => l.length);
  const abrirTudo = !!f.q && lista.length <= 80;
  $('#esc-lista').innerHTML = grupos.length ? grupos.map(([d, l]) => { const ab = abrirTudo || mt.aberto.has(d); return `<div class="mt-grp ${foco === d ? 'foco' : ''}" style="--c:${corDRE(dres, d)}">
      <button class="gh" onclick="alternarGrupoMT(${arg(d)})"><i class="fa-solid fa-chevron-${ab ? 'down' : 'right'}"></i><span class="pt"></span><b>${esc(d)}</b><span class="n">${l.length}</span><span class="fo" onclick="event.stopPropagation();focarDREmt(${dres.indexOf(d)})" title="Mostrar no mapa"><i class="fa-solid fa-crosshairs"></i></span></button>
      ${ab ? `<div class="gi">${l.sort((a, b) => a.municipio.localeCompare(b.municipio, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR')).map(e => `<button class="ei" onclick="irEscolaMT(${arg(e.codigo)})"><b>${esc(e.nome)}</b><small>${esc(e.municipio)} · ${esc(grupoTipo(e.tipo))}${e.localidade === 'RURAL' ? ' · rural' : ''}</small></button>`).join('')}</div>` : ''}</div>`; }).join('') : '<div class="cartao vazio">Nenhuma escola com esses filtros.</div>';
}
function alternarGrupoMT(d){ mt.aberto.has(d) ? mt.aberto.delete(d) : mt.aberto.add(d); painelEscolasMT(escolasLista(), dresDe(escolasLista()), filtrarEscolasMT(escolasLista())); }
function alternarDREfiltro(i){
  const dres = dresDe(escolasLista()), d = dres[i];
  if (!mt.fil.dres.size) mt.fil.dres = new Set([d]);
  else if (mt.fil.dres.has(d)) mt.fil.dres.delete(d);
  else mt.fil.dres.add(d);
  if (mt.fil.dres.size === dres.length) mt.fil.dres.clear();
  desenharEscolasMT(); enquadrarMT(true);
}
function filtroEscMT(k, v){ mt.fil[k] = v; clearTimeout(filtroEscMT.t); filtroEscMT.t = setTimeout(() => { desenharEscolasMT(); if (k !== 'q' || v.length > 2) enquadrarMT(true); }, k === 'q' ? 250 : 0); }
function limparFiltrosMT(){ mt.fil = { dres:new Set(), tipo:'', loc:'', q:'' }; mt.foco = -1; ['#esc-q', '#esc-tipo', '#esc-loc'].forEach(s => { const e = $(s); if (e) e.value = ''; }); desenharEscolasMT(); enquadrarMT(true); }
function irEscolaMT(cod){
  const e = escolasLista().find(x => x.codigo === cod); if (!e || !mt.mapa) return;
  if (window.innerWidth <= 820) alternarLadoMT(false);
  const m = mt.marcadores.get(cod);
  if (mt.camadas.cluster && m) { mt.camadas.cluster.zoomToShowLayer(m, () => m.openPopup()); return; }
  mt.mapa.flyTo([e.latitude, e.longitude], Math.max(mt.mapa.getZoom(), 13), { duration:semMovimento() ? 0 : 1.1 });
  setTimeout(() => { if (m) m.openPopup(); pulsarEscolaMT(cod); }, semMovimento() ? 50 : 1150);
}
function pulsarEscolaMT(cod){
  const e = escolasLista().find(x => x.codigo === cod); if (!e || !mt.mapa) return;
  const ic = L.divIcon({ className:'mt-pulso-ic', html:'<span class="mt-pulso"></span>', iconSize:[60, 60], iconAnchor:[30, 30] });
  const p = L.marker([e.latitude, e.longitude], { icon:ic, interactive:false, keyboard:false }).addTo(mt.mapa);
  setTimeout(() => mt.mapa.removeLayer(p), 1300);
}
function alternarLadoMT(forcar){ mt.lado = forcar !== undefined ? forcar : !mt.lado; $('#v-escolas').classList.toggle('sem-lado', !mt.lado); setTimeout(() => mt.mapa && mt.mapa.invalidateSize(), 260); }
function alternarCamadaMT(k){ mt[k] = !mt[k]; store.set({ ligacoes:'gaborg_mt_lig', divisas:'gaborg_mt_div', rotulos:'gaborg_mt_rot' }[k], mt[k]); menuMT('camadas', null, true); desenharEscolasMT(); }
function exportarEscolasMT(){
  const l = filtrarEscolasMT(escolasLista()), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const csv = '﻿' + ['Código;Unidade escolar;DRE;Município;Tipo;Localidade;Endereço;Número;CEP;Bairro;Telefone;E-mail;Latitude;Longitude', ...l.map(e => [e.codigo, e.nome, e.dre, e.municipio, e.tipo, e.localidade, e.endereco, e.numero, e.cep, e.bairro, e.telefone, e.email, String(e.latitude).replace('.', ','), String(e.longitude).replace('.', ',')].map(q).join(';'))].join('\r\n');
  baixarArquivo('gaborg-escolas-' + new Date().toISOString().slice(0, 10) + '.csv', csv, 'text/csv;charset=utf-8');
}
async function importarEscolasMT(f){
  if (!f || !ehAdmin()) return;
  try {
    await carregarScript(['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);
    const wb = XLSX.read(await f.arrayBuffer(), { type:'array' });
    const H = { codigo:['codigo da escola','cod escola','codigo'], nome:['unidade escolar','escola'], dre:['dre'], municipio:['municipio'], tipo:['tipolotacaocalculada','tipo de lotacao','tipo'], localidade:['localidadeescola','localizacao','localidade'], endereco:['endereco'], numero:['numero'], cep:['cep'], bairro:['bairro'], telefone:['telefone'], email:['e-mail','email'], latitude:['latitude','latitude 2025'], longitude:['longitude','longitude 2025'] };
    let achou = null;
    for (const nome of wb.SheetNames) {
      const linhas = XLSX.utils.sheet_to_json(wb.Sheets[nome], { header:1, raw:false, defval:'' }); if (!linhas.length) continue;
      const cab = linhas[0].map(c => norm(c)), idx = {};
      Object.entries(H).forEach(([k, alts]) => { const i = alts.map(a => cab.indexOf(a)).find(i => i >= 0); if (i !== undefined) idx[k] = i; });
      if (idx.codigo !== undefined && idx.nome !== undefined && idx.dre !== undefined && idx.latitude !== undefined && idx.longitude !== undefined) { achou = { nome, linhas, idx }; break; }
    }
    if (!achou) throw new Error('Não encontrei uma aba com as colunas Código da Escola, Unidade Escolar, DRE, Latitude e Longitude.');
    const novas = achou.linhas.slice(1).map(r => { const o = {}; CAMPOS_ESC.forEach(k => o[k] = achou.idx[k] !== undefined ? String(r[achou.idx[k]] ?? '').trim() : ''); o.codigo = o.codigo.replace(/\.0+$/, ''); o.localidade = o.localidade.toUpperCase(); return o; })
      .filter(o => o.codigo && o.nome && numBR(o.latitude) && numBR(o.longitude));
    if (!novas.length) throw new Error('Nenhuma escola com coordenadas válidas.');
    const atuais = new Map(escolasLista().map(e => [e.codigo, e])), cods = new Set(novas.map(e => e.codigo));
    const inc = novas.filter(e => !atuais.has(e.codigo)).length, rem = [...atuais.keys()].filter(c => !cods.has(c)).length, alt = novas.filter(e => { const a = atuais.get(e.codigo); return a && (a.nome !== e.nome || a.dre !== e.dre || Math.abs(numBR(a.latitude) - numBR(e.latitude)) > 1e-5 || Math.abs(numBR(a.longitude) - numBR(e.longitude)) > 1e-5); }).length;
    if (!await confirmar('Atualizar base de escolas', `Aba <b>${esc(achou.nome)}</b>: <b>${novas.length}</b> escolas em <b>${new Set(novas.map(e => e.dre)).size}</b> DREs.<br>${inc} nova(s) · ${rem} removida(s) · ${alt} com nome, DRE ou localização diferente.<br><br>Gravar na planilha do GABOrg?`, 'Atualizar base')) return;
    (DB.escolas || []).filter(e => !cods.has(e.codigo)).forEach(e => enfileirar('escolas', e, true));
    DB.escolas = novas.map(e => novoReg('escolas', Object.assign({ id:e.codigo, atualizadoEm:agora(), atualizadoPor:cfg.usuario || '' }, e)));
    DB.escolas.forEach(e => enfileirar('escolas', e));
    salvarLocal(); escolasLista.seed = null; mt.foco = -1; desenharEscolasMT(); enquadrarMT(true);
    toast(`Base atualizada: ${novas.length} escolas.`);
  } catch (e) { toast('Falha ao importar: ' + e.message, 'erro'); }
}
document.addEventListener('keydown', e => { if (vistaAtual !== 'escolas' || e.key !== 'Escape' || document.querySelector('.modal')) return; const m = $('#mt-menu'); if (m && !m.classList.contains('hidden')) return fecharMenuMT(); if (mt.mun) voltarMT(1); else if (mt.foco >= 0) voltarMT(0); });

/* ===================== MENU LATERAL: RECOLHER E AJUSTAR LARGURA ===================== */
let ladoCfg = Object.assign({ mini:false, w:236 }, store.get('gaborg_lado', {}));
function aplicarLado(){
  const larga = window.innerWidth > 820;
  document.body.classList.toggle('lado-mini', larga && ladoCfg.mini);
  document.documentElement.style.setProperty('--lado-w', Math.max(180, Math.min(340, ladoCfg.w)) + 'px');
  const tg = document.querySelector('.lado-tg'); if (tg) tg.title = ladoCfg.mini ? 'Expandir o menu (tecla [ )' : 'Recolher o menu (tecla [ )';
  setTimeout(() => { if (vistaAtual === 'mapa') desenharMini(); }, 260);
}
function alternarLado(forcar){ ladoCfg.mini = forcar !== undefined ? forcar : !ladoCfg.mini; store.set('gaborg_lado', ladoCfg); aplicarLado(); }
(function(){
  const alca = document.querySelector('.lado-alca'), lado = document.querySelector('.lado'); if (!alca) return;
  let ini = null;
  alca.addEventListener('pointerdown', e => { ini = { x:e.clientX, w:lado.getBoundingClientRect().width }; alca.setPointerCapture(e.pointerId); alca.classList.add('on'); lado.classList.add('redim'); e.preventDefault(); });
  alca.addEventListener('pointermove', e => {
    if (!ini) return; const w = ini.w + e.clientX - ini.x;
    if (w < 130) { if (!ladoCfg.mini) { ladoCfg.mini = true; aplicarLado(); } return; }
    if (ladoCfg.mini) { ladoCfg.mini = false; aplicarLado(); }
    ladoCfg.w = Math.max(180, Math.min(340, w)); document.documentElement.style.setProperty('--lado-w', ladoCfg.w + 'px');
  });
  const fim = () => { if (!ini) return; ini = null; alca.classList.remove('on'); lado.classList.remove('redim'); store.set('gaborg_lado', ladoCfg); aplicarLado(); };
  alca.addEventListener('pointerup', fim); alca.addEventListener('pointercancel', fim);
  alca.addEventListener('dblclick', () => { ladoCfg.w = 236; alternarLado(false); });
})();
window.addEventListener('resize', aplicarLado);
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,select,[contenteditable]') || document.querySelector('.modal') || !$('#tv-modo').classList.contains('hidden')) return;
  if (e.key === '[' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); alternarLado(); }
});
aplicarLado();

/* ===================== MODO TV ===================== */
const tv = { slides:[], i:0, timer:null, prog:null, relogio:null, pausado:false, inicio:0, seg:Number(store.get('gaborg_tv_seg', 20)), ocioso:null, voltas:0 };
function tvSlides(){
  const L = [['visao', 'Visão geral'], ['mapa', 'Mapa da estrutura'], ['areas', 'Estrutura por área']];
  if (DB.despesas.length) L.push(['fin', 'Financeiro']);
  L.push(['val', 'Validações e impacto']);
  return L;
}
function abrirModoTV(){
  if (vistaAtual !== 'mapa') { const v = vistaAtual; vistaAtual = 'mapa'; calcularLayout(); vistaAtual = v; } else calcularLayout();
  tv.slides = tvSlides(); tv.i = 0; tv.pausado = false; tv.voltas = 0;
  $('#tv-seg').value = String(tv.seg);
  const el = $('#tv-modo'); el.classList.remove('hidden'); el.focus();
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  tvRelogio(); clearInterval(tv.relogio); tv.relogio = setInterval(tvRelogio, 1000);
  tvMostrar(0);
}
function fecharModoTV(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog); clearInterval(tv.relogio);
  $('#tv-modo').classList.add('hidden'); $('#tv-palco').innerHTML = '';
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  if (vistaAtual === 'mapa') desenharMapa();
}
function tvTelaCheia(){ if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); }
function tvRelogio(){ const d = new Date(); $('#tv-relogio').textContent = d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }); $('#tv-data').textContent = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' }); }
function tvTempo(v){ tv.seg = Number(v); store.set('gaborg_tv_seg', tv.seg); tvAgendar(); }
function tvPausar(forcar){ tv.pausado = forcar !== undefined ? forcar : !tv.pausado; $('#tv-btn-pausa').innerHTML = `<i class="fa-solid ${tv.pausado ? 'fa-play' : 'fa-pause'}"></i>`; tvAgendar(); }
function tvPasso(d){ tvMostrar((tv.i + d + tv.slides.length) % tv.slides.length); }
async function tvMostrar(i){
  if (i === 0 && tv.voltas++ > 0 && online()) { try { await lerNuvem(); calcularLayout(); tv.slides = tvSlides(); } catch (e) {} }
  tv.i = Math.min(i, tv.slides.length - 1);
  const [k, t] = tv.slides[tv.i];
  $('#tv-titulo-slide').textContent = t + ' · ' + (tv.i + 1) + '/' + tv.slides.length;
  $('#tv-pontos').innerHTML = tv.slides.map((s, j) => `<button class="${j === tv.i ? 'on' : ''}" title="${esc(s[1])}" onclick="tvMostrar(${j})"></button>`).join('');
  $('#tv-palco').innerHTML = `<div class="tv-slide">${TV_SLIDE[k]()}</div>`;
  if (k === 'mapa') tvMontarMapa();
  tvAgendar();
}
function tvAgendar(){
  clearTimeout(tv.timer); cancelAnimationFrame(tv.prog);
  const bar = $('#tv-barra'); bar.style.width = '0';
  if (tv.pausado || !tv.seg) return;
  tv.inicio = performance.now(); const dur = tv.seg * 1000;
  const anima = () => { const p = Math.min(1, (performance.now() - tv.inicio) / dur); bar.style.width = (p * 100) + '%'; if (p < 1) tv.prog = requestAnimationFrame(anima); };
  anima(); tv.timer = setTimeout(() => tvPasso(1), dur);
}
const tvKpi = (c, l, v, s, m) => `<div class="tv-kpi" style="--c:${c}"><div class="l">${l}</div><div class="v ${m ? 'm' : ''}">${v}</div><div class="s">${s}</div></div>`;
const TV_SLIDE = {
  visao(){
    const at = DB.setores.filter(s => s.status !== 'Extinto'), soma = k => at.reduce((a, s) => a + num(s[k]), 0);
    const pend = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').length, f = totaisFin(DB.despesas);
    return `<div class="tv-h" style="--c:#60a5fa"><i class="fa-solid fa-building-columns"></i>Secretaria de Estado de Educação<small>Decreto nº 2.236/2026</small></div>
      <div class="tv-kpis">${tvKpi('#3b82f6', 'Setores ativos', at.length.toLocaleString('pt-BR'), `${areas.length} áreas${(() => { const e = at.filter(s => s.tipo === 'Unidades Escolares').reduce((t, s) => t + num(s.quantidade), 0); return e ? ' · ' + e.toLocaleString('pt-BR') + ' escolas' : ''; })()}`)}${tvKpi('#22c55e', 'Servidores', soma('servidores').toLocaleString('pt-BR'), `${soma('comissionados').toLocaleString('pt-BR')} comissionados`)}${tvKpi('#a855f7', 'Custo mensal', fmtRc(f.Atual.m), f.Proposto.m ? `proposto ${fmtRc(f.Proposto.m)}` : 'lançamentos atuais', true)}${tvKpi('#f59e0b', 'Validações pendentes', pend, `${DB.validacoes.length} no total`)}${tvKpi('#ef4444', 'Sem responsável', at.filter(s => !s.responsavel && filhosDe(s.id).length).length, 'chefias a definir')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Setores por tipo</h4>${tvBarras(Object.entries(at.reduce((a, s) => (a[s.tipo] = (a[s.tipo] || 0) + 1, a), {})).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, n]) => [t, n, corTipo(t), n]))}</div>
      <div class="tv-caixa"><h4>Maiores áreas (setores)</h4>${tvBarras(areas.map(a => [nomeCurto(porId.get(a)), DB.setores.filter(s => areaDe.get(s.id) === a && s.status !== 'Extinto').length, corArea(a)]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => [x[0], x[1], x[2], x[1]]))}</div></div>`;
  },
  mapa(){ return `<div class="tv-h" style="--c:#22d3ee"><i class="fa-solid fa-diagram-project"></i>Mapa da estrutura<small>${visiveis.length} setores visíveis</small></div><div class="tv-mapa" id="tv-mapa"><div class="mundo-tv" id="tv-mundo"></div><span class="tv-dica"><i class="fa-solid fa-hand"></i> arraste para mover · roda ou pinça para zoom · duplo clique centraliza</span></div>`; },
  areas(){
    const f = new Map(); DB.despesas.filter(d => d.cenario !== 'Proposto').forEach(d => { const a = areaDe.get(d.setorId); f.set(a, (f.get(a) || 0) + calcDesp(d).mensal); });
    return `<div class="tv-h" style="--c:#a78bfa"><i class="fa-solid fa-sitemap"></i>Estrutura por área<small>${areas.length} unidades ligadas ao Gabinete</small></div>
      <div class="tv-grade">${(() => {
        const grandes = areas.filter(a => DB.setores.filter(x => areaDe.get(x.id) === a).length > 1), unicas = areas.filter(a => !grandes.includes(a));
        const card = (cor, tit, sub, lst, fm) => `<div class="tv-area" style="--c:${cor}"><b>${esc(tit)}</b><small>${esc(sub)}</small><div class="nums"><span><b>${lst.length}</b>setores</span><span><b>${lst.reduce((t, x) => t + num(x.servidores), 0).toLocaleString('pt-BR')}</b>servidores</span>${fm ? `<span><b>${fmtRc(fm)}</b>por mês</span>` : ''}</div></div>`;
        const ativos = a => DB.setores.filter(x => areaDe.get(x.id) === a && x.status !== 'Extinto');
        return grandes.sort((x, y) => ativos(y).length - ativos(x).length).map(a => card(corArea(a), nomeCurto(porId.get(a)), (porId.get(a) || {}).nome || '', ativos(a), f.get(a))).join('')
          + (unicas.length ? card('#94a3b8', 'Unidades do Gabinete', unicas.map(a => nomeCurto(porId.get(a))).join(' · '), unicas.flatMap(ativos), unicas.reduce((t, a) => t + (f.get(a) || 0), 0)) : '');
      })()}</div>`;
  },
  fin(){
    const t = totaisFin(DB.despesas), dif = t.Proposto.a - t.Atual.a;
    const porCat = {}; DB.despesas.forEach(d => { if (d.cenario === 'Proposto') return; const c = calcDesp(d); porCat[c.categoria] = (porCat[c.categoria] || 0) + c.anual; });
    const porSet = new Map(); DB.despesas.forEach(d => { if (d.cenario === 'Proposto') return; porSet.set(d.setorId, (porSet.get(d.setorId) || 0) + calcDesp(d).mensal); });
    return `<div class="tv-h" style="--c:#4ade80"><i class="fa-solid fa-sack-dollar"></i>Financeiro<small>valores com encargos</small></div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${tvKpi('#3b82f6', 'Mensal · atual', fmtRc(t.Atual.m), `${t.Atual.n} lançamentos`, true)}${tvKpi('#06b6d4', 'Anual · atual', fmtRc(t.Atual.a), '', true)}${tvKpi('#a855f7', 'Anual · proposto', fmtRc(t.Proposto.a), `${t.Proposto.n} lançamentos`, true)}${tvKpi(dif > 0 ? '#ef4444' : '#22c55e', 'Diferença anual', (dif > 0 ? '+' : '') + fmtRc(Math.abs(dif)).replace('R$', dif < 0 ? '−R$' : 'R$'), 'proposto − atual', true)}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Custo anual por tipo (atual)</h4>${tvBarras(Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, (CATEG_FIN[k] || CATEG_FIN.Outro)[0], fmtRc(v)]))}</div>
      <div class="tv-caixa"><h4>Setores com maior custo mensal</h4><div class="tv-lista">${[...porSet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7).map(([id, v]) => `<div><span>${esc(nomeCurto(porId.get(id)))} · ${esc((porId.get(id) || {}).nome || '')}</span><b>${fmtRc(v)}</b></div>`).join('')}</div></div></div>`;
  },
  val(){
    const cont = {}; DB.validacoes.forEach(v => cont[v.status || 'Pendente'] = (cont[v.status || 'Pendente'] || 0) + 1);
    const pend = DB.validacoes.filter(v => !v.status || v.status === 'Pendente').slice(0, 7);
    const alto = DB.setores.filter(s => num(s.impacto) >= 4 && s.status !== 'Extinto').sort((a, b) => num(b.impacto) - num(a.impacto)).slice(0, 7);
    return `<div class="tv-h" style="--c:#fbbf24"><i class="fa-solid fa-stamp"></i>Validações e impacto</div>
      <div class="tv-kpis" style="grid-template-columns:repeat(4,1fr)">${['Pendente', 'Aprovado', 'Aprovado com ressalvas', 'Reprovado'].map(k => tvKpi(STATUS_VAL[k] || '#64748b', k, cont[k] || 0, 'validações', false)).join('')}</div>
      <div class="tv-duas"><div class="tv-caixa"><h4>Aguardando validação</h4><div class="tv-lista">${pend.length ? pend.map(v => `<div><span>${esc(nomeCurto(porId.get(v.setorId)))} → ${esc(nomeCurto(porId.get(v.validadorId)))}</span><b>${v.solicitadoEm ? new Date(v.solicitadoEm).toLocaleDateString('pt-BR') : ''}</b></div>`).join('') : '<div><span>Nenhuma pendência</span><b>✓</b></div>'}</div></div>
      <div class="tv-caixa"><h4>Setores de impacto alto ou crítico</h4><div class="tv-lista">${alto.length ? alto.map(s => `<div><span>${esc(nomeCurto(s))} · ${esc(s.nome)}</span><b style="color:${IMPACTO[num(s.impacto)][1]}">${IMPACTO[num(s.impacto)][0]}</b></div>`).join('') : '<div><span>Nenhum setor avaliado com impacto alto</span><b>—</b></div>'}</div></div></div>`;
  }
};
function tvBarras(itens){ const max = Math.max(1, ...itens.map(x => x[1])); return itens.map(([n, v, c, rot]) => `<div class="tv-bar" style="--c:${c}"><span class="n">${esc(n)}</span><span class="t"><span style="width:${v / max * 100}%"></span></span><span class="v">${rot ?? v}</span></div>`).join(''); }
function tvMontarMapa(){
  const cx = $('#tv-mapa'), mundo = $('#tv-mundo'); if (!cx) return;
  const L = limites();
  let ar = ''; visiveis.forEach(s => filhosVis(s.id).forEach(k => { if (pos.has(k.id)) ar += `<path d="${caminhoAresta(s, k)}"/>`; }));
  mundo.innerHTML = `<svg style="position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible">${ar}</svg>` + visiveis.map(cardHTML).join('').replace(/ sel /g, ' ').replace(/ msel /g, ' ');
  const r = cx.getBoundingClientRect();
  const fit = () => { const k = Math.min((r.width - 40) / (L.x1 - L.x0), (r.height - 40) / (L.y1 - L.y0), 1.2); return { k, x:(r.width - (L.x1 - L.x0) * k) / 2 - L.x0 * k, y:(r.height - (L.y1 - L.y0) * k) / 2 - L.y0 * k }; };
  let v = fit(); const ap = () => { mundo.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.k})`; }; ap();
  let arr = null;
  cx.addEventListener('pointerdown', e => { arr = { x:e.clientX, y:e.clientY, vx:v.x, vy:v.y }; cx.setPointerCapture(e.pointerId); cx.classList.add('pan'); tvPausar(true); });
  cx.addEventListener('pointermove', e => { if (!arr) return; v.x = arr.vx + e.clientX - arr.x; v.y = arr.vy + e.clientY - arr.y; ap(); });
  const solta = () => { arr = null; cx.classList.remove('pan'); }; cx.addEventListener('pointerup', solta); cx.addEventListener('pointercancel', solta);
  cx.addEventListener('wheel', e => { e.preventDefault(); tvPausar(true); const b = cx.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top, k = Math.max(.08, Math.min(3, v.k * Math.exp(-e.deltaY * .0015))), q = k / v.k; v = { k, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; ap(); }, { passive:false });
  cx.addEventListener('dblclick', () => { v = fit(); ap(); });
  tv.moverMapa = (dx, dy, z) => { if (z) { const b = cx.getBoundingClientRect(), mx = b.width / 2, my = b.height / 2, k = Math.max(.08, Math.min(3, v.k * z)), q = k / v.k; v = { k, x:mx - (mx - v.x) * q, y:my - (my - v.y) * q }; } else { v.x += dx; v.y += dy; } ap(); };
}
document.addEventListener('keydown', e => {
  if ($('#tv-modo').classList.contains('hidden')) return;
  const noMapa = tv.slides[tv.i] && tv.slides[tv.i][0] === 'mapa' && tv.pausado && tv.moverMapa;
  if (e.key === 'Escape') { e.preventDefault(); fecharModoTV(); }
  else if (noMapa && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)) { e.preventDefault(); const p = 60; ({ ArrowLeft:() => tv.moverMapa(p, 0), ArrowRight:() => tv.moverMapa(-p, 0), ArrowUp:() => tv.moverMapa(0, p), ArrowDown:() => tv.moverMapa(0, -p), '+':() => tv.moverMapa(0, 0, 1.2), '=':() => tv.moverMapa(0, 0, 1.2), '-':() => tv.moverMapa(0, 0, 1 / 1.2) })[e.key](); }
  else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); tvPasso(1); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); tvPasso(-1); }
  else if (e.key === ' ') { e.preventDefault(); tvPausar(); }
  else if (e.key.toLowerCase() === 'f') tvTelaCheia();
  e.stopImmediatePropagation();
}, true);
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !$('#tv-modo').classList.contains('hidden')) { /* continua em tela normal */ } });
$('#tv-modo').addEventListener('pointermove', () => { const el = $('#tv-modo'); el.classList.remove('ocioso'); clearTimeout(tv.ocioso); tv.ocioso = setTimeout(() => el.classList.add('ocioso'), 3000); });

/* Erros inesperados depois de aberto: avisa em vez de falhar em silêncio */
window.addEventListener('error', e => { if (window.GABORG_INICIADO && e.message && typeof toast === 'function') toast('Erro: ' + e.message + ' — recarregue a página. Se repetir, envie esta mensagem ao suporte.', 'erro'); });
window.addEventListener('unhandledrejection', e => { const m = e.reason && (e.reason.message || String(e.reason)); if (window.GABORG_INICIADO && m && !/abort/i.test(m) && typeof toast === 'function') console.warn('GABOrg:', m); });

/* ===================== MENU DO USUÁRIO ===================== */
function menuUsuario(){
  const sync = $('#sync') ? $('#sync').outerHTML : '';
  const m = document.createElement('div'); m.className = 'modal';
  const escuro = document.documentElement.dataset.tema === 'escuro';
  m.innerHTML = `<div class="cx" role="dialog" aria-modal="true" style="max-width:380px"><div class="menu-u">
    <div class="cab"><span class="av">${esc(iniciais(cfg.usuario || cfg.login))}</span><div style="min-width:0"><b>${esc(cfg.usuario || cfg.login || 'Usuário')}</b><small>${esc(cfg.login || '')} · ${esc(cfg.perfil || '')}</small>${sync}</div></div>
    ${appInstalavel() ? '<button class="it" data-a="instalar"><i class="fa-solid fa-download"></i>Instalar o GABOrg como app</button>' : ''}
    <button class="it" data-a="tv"><i class="fa-solid fa-tv"></i>Modo TV (apresentação)</button>
    <button class="it" data-a="tema"><i class="fa-solid fa-circle-half-stroke"></i>${escuro ? 'Tema claro' : 'Tema escuro'}</button>
    <button class="it" data-a="senha"><i class="fa-solid fa-key"></i>Alterar minha senha</button>
    <button class="it" data-a="config"><i class="fa-solid fa-gear"></i>Configurações</button>
    <button class="it perigo" data-a="sair"><i class="fa-solid fa-power-off"></i>Sair</button>
    <button class="it" data-a="fechar" style="justify-content:center;color:var(--mut)">Fechar</button>
  </div></div>`;
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b && e.target !== m) return;
    m.remove(); const a = b && b.dataset.a;
    if (a === 'instalar') instalarApp();
    if (a === 'tv') abrirModoTV();
    if (a === 'tema') alternarTema();
    if (a === 'senha') modalTrocarSenha(false);
    if (a === 'config') trocarVista('config');
    if (a === 'sair') sair();
  });
  document.body.appendChild(m);
}

/* ===================== APP INSTALÁVEL (PWA) ===================== */
let pedidoInstalacao = null;
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const rodandoComoApp = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const appInstalavel = () => !rodandoComoApp() && (!!pedidoInstalacao || (ehIOS() && location.protocol === 'https:'));
function atualizarInstalavel(){ document.body.classList.toggle('pode-instalar', appInstalavel()); }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalacao = e; atualizarInstalavel(); });
window.addEventListener('appinstalled', () => { pedidoInstalacao = null; atualizarInstalavel(); toast('GABOrg instalado. Abra pelo ícone na tela inicial.'); });
async function instalarApp(){
  if (pedidoInstalacao) {
    pedidoInstalacao.prompt();
    try { await pedidoInstalacao.userChoice; } catch (e) {}
    pedidoInstalacao = null; atualizarInstalavel(); return;
  }
  if (ehIOS()) return abrirModal({ titulo:'Instalar no iPhone ou iPad', rotulo:'Entendi', semCancelar:true,
    html:`<p>No <b>Safari</b>:</p><ol style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.9;color:var(--txt2)"><li>Toque em <b>Compartilhar</b> <i class="fa-solid fa-arrow-up-from-bracket"></i> na barra do navegador.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Confirme em <b>Adicionar</b>. O GABOrg abre em tela cheia, como um app.</li></ol>` });
  toast('Use o menu do navegador › "Instalar app" ou "Adicionar à tela inicial".');
}
// Sem service worker: o app é só index.html + arquivo.js. Remove o de versões anteriores (sw.js), se houver.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
atualizarInstalavel();

window.GABORG_VERSAO_JS = VERSAO;
(async function iniciar(){
  window.GABORG_INICIADO = true;
  if (window.GABORG_VERSAO_HTML && window.GABORG_VERSAO_HTML !== VERSAO) setTimeout(() => toast(`Versões diferentes: index.html ${window.GABORG_VERSAO_HTML} × arquivo.js ${VERSAO}. Envie os dois arquivos da mesma versão ao GitHub.`, 'aviso'), 1500);
  $('#lg-login').value = cfg.login || ''; $('#lg-url').value = cfg.url || URL_PADRAO;
  $('#lg-lembrar').checked = sessao.lembrado();
  if (!cfg.token || !cfg.url || cfg.modo !== 'nuvem') return mostrarLogin();
  const d = store.get('gaborg_db', null);
  if (d && Array.isArray(d.setores) && d.setores.length) { DB = d; TABS_DB.forEach(t => DB[t] = (DB[t] || []).map(x => novoReg(t, x))); abrirApp(); }
  try {
    const me = await chamar({ action:'me' }, 30000);
    if (me.status !== 'success') { if (me.code !== 'AUTH') throw new Error(me.message); return; }
    aplicarUsuario(me.usuario);
    if (me.usuario.trocarSenha === 'Sim') { const ok = await modalTrocarSenha(true); if (!ok) return; }
    await carregarNuvem();
    if (!$('#app').classList.contains('hidden')) redesenharTudo(); else abrirApp();
    statusSync();
  } catch (e) {
    ultimoErro = e.message; statusSync();
    if ($('#app').classList.contains('hidden')) mostrarLogin(e.message);
  }
})();
