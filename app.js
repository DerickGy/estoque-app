// ─── Estado ──────────────────────────────────────────────────────────────────
let produtos = carregarLS('produtos') || [];
let vendas   = carregarLS('vendas')   || [];
let itensVenda = [];

// ─── LocalStorage ─────────────────────────────────────────────────────────────
function salvarLS(chave, dados) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

function carregarLS(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave));
  } catch { return null; }
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function fmt(v) {
  return 'R$ ' + parseFloat(v).toFixed(2).replace('.', ',');
}

function chaveUnica(modelo, cor, numero) {
  return (modelo + '|' + cor + '|' + numero).toLowerCase().trim();
}

function showMsg(el, txt, tipo) {
  el.textContent = txt;
  el.style.display = 'block';
  el.style.background = tipo === 'success' ? '#e8f5e9' : '#fdecea';
  el.style.color      = tipo === 'success' ? '#2e7d32' : '#c62828';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function showTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  el.classList.add('active');
  if (tab === 'venda') atualizarSelectProdutos();
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────
function onModeloInput() {
  const val = document.getElementById('f-modelo').value.trim().toLowerCase();
  const lista = document.getElementById('autocomplete-list');
  if (!val) { lista.style.display = 'none'; return; }

  // Agrupa modelos únicos (por nome)
  const vistos = new Map();
  produtos.forEach(p => {
    if (!vistos.has(p.modelo.toLowerCase())) vistos.set(p.modelo.toLowerCase(), p);
  });

  const filtrados = [...vistos.values()].filter(p => p.modelo.toLowerCase().includes(val));
  if (filtrados.length === 0) { lista.style.display = 'none'; return; }

  lista.innerHTML = filtrados.map(p =>
    `<div class="autocomplete-item"
       onmousedown="selecionarModelo('${p.modelo.replace(/'/g,"\\'")}','${p.cor.replace(/'/g,"\\'")}',${p.custo},${p.venda})">
      ${p.modelo}
      <small>${p.cor} — custo ${fmt(p.custo)} / venda ${fmt(p.venda)}</small>
    </div>`
  ).join('');
  lista.style.display = 'block';
}

function selecionarModelo(modelo, cor, custo, venda) {
  document.getElementById('f-modelo').value = modelo;
  document.getElementById('f-cor').value    = cor;
  document.getElementById('f-custo').value  = custo;
  document.getElementById('f-venda').value  = venda;
  document.getElementById('autocomplete-list').style.display = 'none';
  setTimeout(verificarDuplicata, 50);
}

function fecharLista() {
  setTimeout(() => {
    document.getElementById('autocomplete-list').style.display = 'none';
  }, 150);
}

// ─── Duplicata ────────────────────────────────────────────────────────────────
function encontrarDuplicata() {
  const modelo = document.getElementById('f-modelo').value.trim();
  const cor    = document.getElementById('f-cor').value.trim();
  const numero = document.getElementById('f-numero').value.trim();
  if (!modelo || !cor || !numero) return null;
  return produtos.find(p => chaveUnica(p.modelo, p.cor, p.numero) === chaveUnica(modelo, cor, numero)) || null;
}

function verificarDuplicata() {
  const dup = encontrarDuplicata();
  document.getElementById('aviso-duplicata').style.display = dup ? 'block' : 'none';
}

// ─── Cadastro de produto ──────────────────────────────────────────────────────
function cadastrarProduto() {
  const modelo = document.getElementById('f-modelo').value.trim();
  const cor    = document.getElementById('f-cor').value.trim();
  const numero = document.getElementById('f-numero').value.trim();
  const qtd    = parseInt(document.getElementById('f-qtd').value);
  const custo  = parseFloat(document.getElementById('f-custo').value);
  const venda  = parseFloat(document.getElementById('f-venda').value);
  const msg    = document.getElementById('msg-cadastro');

  if (!modelo || !cor || !numero || !qtd || isNaN(custo) || isNaN(venda)) {
    showMsg(msg, 'Preencha todos os campos.', 'erro');
    return;
  }

  const dup = encontrarDuplicata();
  if (dup) {
    dup.qtd   += qtd;
    dup.custo  = custo;
    dup.venda  = venda;
    showMsg(msg, `Estoque atualizado! ${modelo} nº${numero} agora tem ${dup.qtd} unidades.`, 'success');
  } else {
    produtos.push({ id: Date.now(), modelo, cor, numero, qtd, custo, venda });
    showMsg(msg, 'Produto cadastrado com sucesso!', 'success');
  }

  salvarLS('produtos', produtos);
  clearForm();
  renderEstoque();
}

function clearForm() {
  ['f-modelo','f-cor','f-numero','f-qtd','f-custo','f-venda'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('aviso-duplicata').style.display = 'none';
  document.getElementById('autocomplete-list').style.display = 'none';
}

// ─── Estoque ──────────────────────────────────────────────────────────────────
function renderEstoque() {
  const body  = document.getElementById('stock-body');
  const empty = document.getElementById('stock-empty');
  const table = document.getElementById('stock-table');

  if (produtos.length === 0) {
    empty.style.display = 'block';
    table.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'table';

  body.innerHTML = produtos.map(p => {
    const status = p.qtd === 0
      ? '<span class="badge out">Esgotado</span>'
      : p.qtd <= 2
        ? '<span class="badge low">Baixo</span>'
        : '<span class="badge ok">Ok</span>';

    return `<tr>
      <td><strong>${p.modelo}</strong></td>
      <td>${p.cor}</td>
      <td>${p.numero}</td>
      <td>${p.qtd}</td>
      <td style="color:#888">${fmt(p.custo)}</td>
      <td>${fmt(p.venda)}</td>
      <td>${status}</td>
      <td>
        <button class="btn danger" style="padding:4px 8px;font-size:12px"
          onclick="removerProduto(${p.id})">Remover</button>
      </td>
    </tr>`;
  }).join('');
}

function removerProduto(id) {
  if (!confirm('Remover este produto do estoque?')) return;
  produtos = produtos.filter(p => p.id !== id);
  salvarLS('produtos', produtos);
  renderEstoque();
}

// ─── Venda ────────────────────────────────────────────────────────────────────
function atualizarSelectProdutos() {
  const sel = document.getElementById('v-produto');
  const disponiveis = produtos.filter(p => p.qtd > 0);
  sel.innerHTML = '<option value="">Selecionar...</option>' +
    disponiveis.map(p =>
      `<option value="${p.id}">${p.modelo} — ${p.cor} nº${p.numero} (${p.qtd} un.) — ${fmt(p.venda)}</option>`
    ).join('');
}

function adicionarItem() {
  const sel = document.getElementById('v-produto');
  const qtd = parseInt(document.getElementById('v-qtd').value) || 1;
  const id  = parseInt(sel.value);
  if (!id) return;

  const prod = produtos.find(p => p.id === id);
  if (!prod) return;
  if (qtd > prod.qtd) {
    alert(`Quantidade maior que o estoque disponível (${prod.qtd} un.).`);
    return;
  }

  itensVenda.push({
    prodId: id,
    modelo: prod.modelo,
    cor: prod.cor,
    numero: prod.numero,
    qtd,
    sugerido: prod.venda,
    vendido: prod.venda
  });

  renderItens();
  sel.value = '';
  document.getElementById('v-qtd').value = 1;
}

function renderItens() {
  const lista  = document.getElementById('itens-lista');
  const header = document.getElementById('itens-header');

  if (itensVenda.length === 0) {
    lista.innerHTML = '';
    header.style.display = 'none';
    atualizarTotal();
    return;
  }

  header.style.display = 'grid';
  lista.innerHTML = itensVenda.map((item, i) => `
    <div class="venda-item">
      <span>${item.modelo} <span style="color:#aaa">nº${item.numero}</span></span>
      <span>${item.qtd}</span>
      <span style="color:#888">${fmt(item.sugerido)}</span>
      <input type="number" value="${item.vendido}" min="0" step="0.01"
        style="width:90px;font-size:13px;padding:4px 6px;border:1px solid #ddd;border-radius:5px"
        onchange="editarPreco(${i}, this.value)">
      <button class="btn danger" style="padding:3px 8px;font-size:12px"
        onclick="removerItem(${i})">✕</button>
    </div>
  `).join('');

  atualizarTotal();
}

function editarPreco(i, val) {
  itensVenda[i].vendido = parseFloat(val) || 0;
  atualizarTotal();
}

function removerItem(i) {
  itensVenda.splice(i, 1);
  renderItens();
}

function atualizarTotal() {
  const total = itensVenda.reduce((s, item) => s + item.vendido * item.qtd, 0);
  document.getElementById('v-total').textContent = fmt(total);
}

function registrarVenda() {
  const pagamento = document.getElementById('v-pagamento').value;
  const msg = document.getElementById('msg-venda');

  if (itensVenda.length === 0) { showMsg(msg, 'Adicione ao menos um item.', 'erro'); return; }
  if (!pagamento) { showMsg(msg, 'Selecione a forma de pagamento.', 'erro'); return; }

  const venda = {
    id: Date.now(),
    data: new Date().toISOString(),
    pagamento,
    itens: [...itensVenda],
    total: itensVenda.reduce((s, item) => s + item.vendido * item.qtd, 0)
  };

  // Debita do estoque
  itensVenda.forEach(item => {
    const prod = produtos.find(p => p.id === item.prodId);
    if (prod) prod.qtd -= item.qtd;
  });

  vendas.push(venda);
  salvarLS('produtos', produtos);
  salvarLS('vendas', vendas);

  limparVenda();
  renderEstoque();
  showMsg(document.getElementById('msg-venda'), 'Venda registrada! Estoque atualizado.', 'success');
}

function limparVenda() {
  itensVenda = [];
  renderItens();
  document.getElementById('v-pagamento').value = '';
}

// ─── Init ─────────────────────────────────────────────────────────────────────
renderEstoque();
