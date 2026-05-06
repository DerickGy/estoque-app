// ── Estado ────────────────────────────────────────────────────────────────────
let produtos   = load('produtos') || [];
let vendas     = load('vendas')   || [];
let itensVenda = [];

function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }

// ── Tema ──────────────────────────────────────────────────────────────────────
const html = document.documentElement;
let tema = load('tema') || 'light';
html.setAttribute('data-theme', tema);
document.getElementById('theme-icon').textContent = tema === 'dark' ? '☀️' : '🌙';

function toggleTheme() {
  tema = tema === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', tema);
  document.getElementById('theme-icon').textContent = tema === 'dark' ? '☀️' : '🌙';
  save('tema', tema);
}

// ── Data ──────────────────────────────────────────────────────────────────────
function dataHoje() { return new Date().toISOString().split('T')[0]; }

function fmtData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

document.getElementById('header-data').textContent = fmtData(dataHoje());
document.getElementById('v-data').value = dataHoje();
document.getElementById('t-data').value = dataHoje();

// ── Utilitários ───────────────────────────────────────────────────────────────
function fmt(v) { return 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ','); }
function chave(m, c, n) { return (m + '|' + c + '|' + n).toLowerCase().trim(); }

function showMsg(el, txt, tipo) {
  el.textContent = txt;
  el.style.display = 'block';
  el.style.background = tipo === 'ok' ? 'var(--accent-bg)' : 'var(--danger-bg)';
  el.style.color = tipo === 'ok' ? 'var(--accent-text)' : 'var(--danger)';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function showTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  el.classList.add('active');
  if (tab === 'venda' || tab === 'troca') atualizarSelects();
  if (tab === 'historico') renderHistorico();
}

// ── Autocomplete ──────────────────────────────────────────────────────────────
function onModeloInput() {
  const val = document.getElementById('f-modelo').value.trim().toLowerCase();
  const lista = document.getElementById('ac-list');
  if (!val) { lista.style.display = 'none'; return; }

  const vistos = new Map();
  produtos.forEach(p => { if (!vistos.has(p.modelo.toLowerCase())) vistos.set(p.modelo.toLowerCase(), p); });
  const fil = [...vistos.values()].filter(p => p.modelo.toLowerCase().includes(val));

  if (!fil.length) { lista.style.display = 'none'; return; }

  lista.innerHTML = fil.map(p =>
    `<div class="ac-item" onmousedown="selModelo('${p.modelo.replace(/'/g, "\\'")}','${p.cor.replace(/'/g, "\\'")}',${p.custo},${p.venda})">
      ${p.modelo}
      <small>${p.cor} — venda ${fmt(p.venda)} / custo ${fmt(p.custo)}</small>
    </div>`
  ).join('');
  lista.style.display = 'block';
}

function selModelo(modelo, cor, custo, venda) {
  document.getElementById('f-modelo').value = modelo;
  document.getElementById('f-cor').value    = cor;
  document.getElementById('f-custo').value  = custo;
  document.getElementById('f-venda').value  = venda;
  document.getElementById('ac-list').style.display = 'none';
  setTimeout(verificarDup, 50);
}

function fecharLista() {
  setTimeout(() => { document.getElementById('ac-list').style.display = 'none'; }, 150);
}

// ── Duplicata ─────────────────────────────────────────────────────────────────
function encontrarDup() {
  const m = document.getElementById('f-modelo').value.trim();
  const c = document.getElementById('f-cor').value.trim();
  const n = document.getElementById('f-numero').value.trim();
  if (!m || !c || !n) return null;
  return produtos.find(p => chave(p.modelo, p.cor, p.numero) === chave(m, c, n)) || null;
}

function verificarDup() {
  document.getElementById('aviso-dup').style.display = encontrarDup() ? 'block' : 'none';
}

// ── Cadastro ──────────────────────────────────────────────────────────────────
function cadastrarProduto() {
  const modelo = document.getElementById('f-modelo').value.trim();
  const cor    = document.getElementById('f-cor').value.trim();
  const numero = document.getElementById('f-numero').value.trim();
  const qtd    = parseInt(document.getElementById('f-qtd').value);
  const custo  = parseFloat(document.getElementById('f-custo').value);
  const venda  = parseFloat(document.getElementById('f-venda').value);
  const msg    = document.getElementById('msg-cadastro');

  if (!modelo || !cor || !numero || !qtd || isNaN(custo) || isNaN(venda)) {
    showMsg(msg, 'Preencha todos os campos.', 'erro'); return;
  }

  const dup = encontrarDup();
  if (dup) {
    dup.qtd += qtd; dup.custo = custo; dup.venda = venda;
    showMsg(msg, `Estoque atualizado! ${modelo} nº${numero} agora tem ${dup.qtd} unidades.`, 'ok');
  } else {
    produtos.push({ id: Date.now(), modelo, cor, numero, qtd, custo, venda });
    showMsg(msg, 'Produto cadastrado com sucesso!', 'ok');
  }

  save('produtos', produtos);
  clearForm();
  renderEstoque();
}

function clearForm() {
  ['f-modelo','f-cor','f-numero','f-qtd','f-custo','f-venda'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('aviso-dup').style.display = 'none';
  document.getElementById('ac-list').style.display = 'none';
}

// ── Estoque ───────────────────────────────────────────────────────────────────
function renderEstoque() {
  const body  = document.getElementById('stock-body');
  const empty = document.getElementById('stock-empty');
  const table = document.getElementById('stock-table');

  if (!produtos.length) { empty.style.display = 'block'; table.style.display = 'none'; return; }
  empty.style.display = 'none'; table.style.display = 'table';

  body.innerHTML = produtos.map(p => {
    const s = p.qtd === 0
      ? '<span class="badge out">Esgotado</span>'
      : p.qtd <= 2 ? '<span class="badge low">Baixo</span>'
      : '<span class="badge ok">Ok</span>';
    return `<tr>
      <td><strong>${p.modelo}</strong></td>
      <td>${p.cor}</td>
      <td style="font-family:'DM Mono',monospace">${p.numero}</td>
      <td style="font-family:'DM Mono',monospace">${p.qtd}</td>
      <td style="color:var(--text3);font-family:'DM Mono',monospace">${fmt(p.custo)}</td>
      <td style="font-family:'DM Mono',monospace">${fmt(p.venda)}</td>
      <td>${s}</td>
      <td><button class="btn danger" style="padding:3px 8px;font-size:11px" onclick="removerProduto(${p.id})">Remover</button></td>
    </tr>`;
  }).join('');
}

function removerProduto(id) {
  if (!confirm('Remover este produto?')) return;
  produtos = produtos.filter(p => p.id !== id);
  save('produtos', produtos);
  renderEstoque();
}

// ── Selects ───────────────────────────────────────────────────────────────────
function atualizarSelects() {
  const opts = '<option value="">Selecionar...</option>' +
    produtos.filter(p => p.qtd > 0).map(p =>
      `<option value="${p.id}">${p.modelo} — ${p.cor} nº${p.numero} (${p.qtd} un.) — ${fmt(p.venda)}</option>`
    ).join('');

  const todosOpts = '<option value="">Selecionar...</option>' +
    produtos.map(p =>
      `<option value="${p.id}">${p.modelo} — ${p.cor} nº${p.numero}</option>`
    ).join('');

  document.getElementById('v-produto').innerHTML  = opts;
  document.getElementById('t-dev-prod').innerHTML = todosOpts;
  document.getElementById('t-novo-prod').innerHTML = opts;
}

// ── Venda ─────────────────────────────────────────────────────────────────────
function adicionarItemVenda() {
  const sel = document.getElementById('v-produto');
  const qtd = parseInt(document.getElementById('v-qtd').value) || 1;
  const id  = parseInt(sel.value);
  if (!id) return;
  const prod = produtos.find(p => p.id === id);
  if (!prod) return;
  if (qtd > prod.qtd) { alert(`Estoque disponível: ${prod.qtd} un.`); return; }

  itensVenda.push({ prodId: id, modelo: prod.modelo, cor: prod.cor, numero: prod.numero, qtd, sugerido: prod.venda, vendido: prod.venda });
  renderItensVenda();
  sel.value = ''; document.getElementById('v-qtd').value = 1;
}

function renderItensVenda() {
  const lista  = document.getElementById('v-lista');
  const header = document.getElementById('v-header');
  if (!itensVenda.length) { lista.innerHTML = ''; header.style.display = 'none'; calcTotalVenda(); return; }
  header.style.display = 'grid';
  lista.innerHTML = itensVenda.map((item, i) => `
    <div class="v-row">
      <span>${item.modelo} <span style="color:var(--text3);font-family:'DM Mono',monospace">nº${item.numero}</span></span>
      <span style="font-family:'DM Mono',monospace">${item.qtd}</span>
      <span style="color:var(--text3);font-family:'DM Mono',monospace">${fmt(item.sugerido)}</span>
      <input type="number" value="${item.vendido}" min="0" step="0.01"
        style="width:90px;font-size:13px;padding:4px 6px"
        onchange="editarPrecoVenda(${i},this.value)">
      <button class="btn danger" style="padding:3px 7px;font-size:11px" onclick="remItemVenda(${i})">✕</button>
    </div>`).join('');
  calcTotalVenda();
}

function editarPrecoVenda(i, v) { itensVenda[i].vendido = parseFloat(v) || 0; calcTotalVenda(); }
function remItemVenda(i) { itensVenda.splice(i, 1); renderItensVenda(); }

function calcTotalVenda() {
  const total = itensVenda.reduce((s, it) => s + it.vendido * it.qtd, 0);
  document.getElementById('v-total').textContent = fmt(total);
}

function registrarVenda() {
  const pagamento = document.getElementById('v-pagamento').value;
  const data      = document.getElementById('v-data').value;
  const msg       = document.getElementById('msg-venda');

  if (!itensVenda.length) { showMsg(msg, 'Adicione ao menos um item.', 'erro'); return; }
  if (!pagamento) { showMsg(msg, 'Selecione a forma de pagamento.', 'erro'); return; }
  if (!data) { showMsg(msg, 'Informe a data da venda.', 'erro'); return; }

  const venda = {
    id: Date.now(), tipo: 'venda', data, pagamento,
    itens: [...itensVenda],
    total: itensVenda.reduce((s, it) => s + it.vendido * it.qtd, 0)
  };

  itensVenda.forEach(it => {
    const p = produtos.find(p => p.id === it.prodId);
    if (p) p.qtd -= it.qtd;
  });

  vendas.push(venda);
  save('produtos', produtos); save('vendas', vendas);
  limparVenda();
  renderEstoque();
  showMsg(document.getElementById('msg-venda'), 'Venda registrada com sucesso!', 'ok');
}

function limparVenda() {
  itensVenda = []; renderItensVenda();
  document.getElementById('v-pagamento').value = '';
  document.getElementById('v-data').value = dataHoje();
}

// ── Troca ─────────────────────────────────────────────────────────────────────
function calcSaldo() {
  const devVal  = parseFloat(document.getElementById('t-dev-val').value) || 0;
  const novoVal = parseFloat(document.getElementById('t-novo-val').value) || 0;
  const saldo   = novoVal - devVal;
  const el      = document.getElementById('t-saldo');
  const desc    = document.getElementById('saldo-desc');
  el.textContent = fmt(Math.abs(saldo));
  el.className = 'total-val ' + (saldo > 0 ? 'negativo' : saldo < 0 ? 'positivo' : 'zero');
  desc.textContent = saldo > 0 ? 'Cliente paga a diferença' : saldo < 0 ? 'Loja devolve a diferença' : 'Sem diferença';
}

document.getElementById('t-dev-val').addEventListener('input', calcSaldo);
document.getElementById('t-novo-val').addEventListener('input', calcSaldo);

function registrarTroca() {
  const devProdId  = parseInt(document.getElementById('t-dev-prod').value);
  const devQtd     = parseInt(document.getElementById('t-dev-qtd').value) || 1;
  const devVal     = parseFloat(document.getElementById('t-dev-val').value) || 0;
  const novoProdId = parseInt(document.getElementById('t-novo-prod').value);
  const novoQtd   = parseInt(document.getElementById('t-novo-qtd').value) || 1;
  const novoVal   = parseFloat(document.getElementById('t-novo-val').value) || 0;
  const pagamento = document.getElementById('t-pagamento').value;
  const data      = document.getElementById('t-data').value;
  const msg       = document.getElementById('msg-troca');

  if (!devProdId || !novoProdId) { showMsg(msg, 'Selecione os produtos da troca.', 'erro'); return; }
  if (!pagamento) { showMsg(msg, 'Selecione a forma de pagamento.', 'erro'); return; }

  const devProd  = produtos.find(p => p.id === devProdId);
  const novoProd = produtos.find(p => p.id === novoProdId);
  if (!novoProd || novoQtd > novoProd.qtd) { showMsg(msg, 'Estoque insuficiente do produto novo.', 'erro'); return; }

  if (devProd) devProd.qtd += devQtd;
  novoProd.qtd -= novoQtd;

  vendas.push({
    id: Date.now(), tipo: 'troca', data, pagamento,
    devolvido: { modelo: devProd?.modelo || '?', numero: devProd?.numero || '?', qtd: devQtd, valor: devVal },
    novo: { modelo: novoProd.modelo, numero: novoProd.numero, qtd: novoQtd, valor: novoVal },
    total: novoVal - devVal
  });

  save('produtos', produtos); save('vendas', vendas);
  limparTroca();
  renderEstoque();
  showMsg(document.getElementById('msg-troca'), 'Troca registrada com sucesso!', 'ok');
}

function limparTroca() {
  ['t-dev-prod','t-novo-prod','t-pagamento'].forEach(id => document.getElementById(id).value = '');
  ['t-dev-qtd','t-novo-qtd'].forEach(id => document.getElementById(id).value = 1);
  ['t-dev-val','t-novo-val'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('t-data').value = dataHoje();
  document.getElementById('t-saldo').textContent = 'R$ 0,00';
  document.getElementById('saldo-desc').textContent = '—';
}

// ── Histórico ─────────────────────────────────────────────────────────────────
function renderHistorico() {
  const de    = document.getElementById('h-de').value;
  const ate   = document.getElementById('h-ate').value;
  const tipo  = document.getElementById('h-tipo').value;
  const empty = document.getElementById('hist-empty');
  const lista = document.getElementById('hist-lista');
  const resumo = document.getElementById('hist-resumo');

  let filtrado = [...vendas].sort((a, b) => b.data.localeCompare(a.data));
  if (de)   filtrado = filtrado.filter(v => v.data >= de);
  if (ate)  filtrado = filtrado.filter(v => v.data <= ate);
  if (tipo) filtrado = filtrado.filter(v => v.tipo === tipo);

  if (!filtrado.length) {
    empty.style.display = 'block'; lista.innerHTML = ''; resumo.style.display = 'none'; return;
  }
  empty.style.display = 'none';

  lista.innerHTML = filtrado.map(v => {
    if (v.tipo === 'troca') {
      const saldo = v.total;
      const saldoStr = saldo === 0 ? 'Sem diferença'
        : saldo > 0 ? `Cliente pagou ${fmt(saldo)}`
        : `Loja devolveu ${fmt(Math.abs(saldo))}`;
      return `<div class="hist-item">
        <div class="hist-meta">
          <div>
            <span class="badge troca">Troca</span>
            <span class="hist-data" style="margin-left:8px">${fmtData(v.data)}</span>
          </div>
          <div style="text-align:right">
            <div class="hist-pag">${v.pagamento}</div>
          </div>
        </div>
        <div class="hist-itens">
          <span>↩ Dev: ${v.devolvido.modelo} nº${v.devolvido.numero} (${v.devolvido.qtd}x) ${fmt(v.devolvido.valor)}</span><br>
          <span style="margin-top:4px;display:inline-block">↪ Novo: ${v.novo.modelo} nº${v.novo.numero} (${v.novo.qtd}x) ${fmt(v.novo.valor)}</span><br>
          <span style="color:var(--text3);margin-top:4px;display:inline-block">${saldoStr}</span>
        </div>
      </div>`;
    }
    return `<div class="hist-item">
      <div class="hist-meta">
        <div>
          <span class="badge ok">Venda</span>
          <span class="hist-data" style="margin-left:8px">${fmtData(v.data)}</span>
        </div>
        <div style="text-align:right">
          <div class="hist-total">${fmt(v.total)}</div>
          <div class="hist-pag">${v.pagamento}</div>
        </div>
      </div>
      <div class="hist-itens">
        ${v.itens.map(it => `<span>${it.modelo} nº${it.numero} (${it.qtd}x) ${fmt(it.vendido)}</span>`).join(' · ')}
      </div>
    </div>`;
  }).join('');

  const totalVendas = filtrado.filter(v => v.tipo === 'venda').reduce((s, v) => s + v.total, 0);
  const nVendas = filtrado.filter(v => v.tipo === 'venda').length;
  const nTrocas = filtrado.filter(v => v.tipo === 'troca').length;
  resumo.style.display = 'block';
  resumo.innerHTML = `${filtrado.length} transações — ${nVendas} vendas (${fmt(totalVendas)}) · ${nTrocas} trocas`;
}

// ── Init ──────────────────────────────────────────────────────────────────────
renderEstoque();
