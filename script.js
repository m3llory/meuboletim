// Configuração Fixa do Aluno
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 27,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Dados fictícios padronizados locais (usados como padrão inicial se não houver dados salvos)
const dadosBoletimPadrao = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Frequência geral apenas demonstrativa (não calculada pelas faltas)
const FREQUENCIA_DEMONSTRATIVA = "92%";

// Variáveis de Estado da Sessão (permanecem apenas em memória)
let pinSessao = "";
let dadosAtuais = [];
let modoEdicao = false;

/**
 * Normalização para dados antigos/locais (ex: 75 -> 7,5)
 */
function normalizarNotaAntiga(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }
  let num = Number(valor);
  if (isNaN(num)) {
    return null;
  }
  if (num > 10 && num <= 100) {
    num = num / 10;
  }
  if (num >= 0 && num <= 10) {
    return num;
  }
  return null;
}

/**
 * Validação rigorosa para notas digitadas no modo de edição (0 a 10)
 */
function validarNotaEditada(valorStr) {
  if (valorStr === null || valorStr === undefined || valorStr.trim() === "") {
    return { valido: true, valor: null };
  }
  const textoFormatado = valorStr.trim().replace(",", ".");
  const num = Number(textoFormatado);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

/**
 * Validação para faltas digitadas (inteiro >= 0)
 */
function validarFaltaEditada(valorStr) {
  if (valorStr === null || valorStr === undefined || valorStr.trim() === "") {
    return { valido: false, valor: null };
  }
  const textoFormatado = valorStr.trim();
  const num = Number(textoFormatado);
  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

/**
 * Faz login e carrega os dados da API
 */
async function fazerLogin() {
  const campoPin = document.getElementById("campo-pin");
  const msgStatus = document.getElementById("mensagem-status-login");
  const pinDigitado = campoPin.value.trim();

  if (!pinDigitado) {
    exibirMensagem(msgStatus, "Por favor, digite seu PIN.", "erro");
    return;
  }

  exibirMensagem(msgStatus, "Conectando...", "info");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      exibirMensagem(msgStatus, "Turma, chamada ou PIN inválidos.", "erro");
      return;
    }

    if (resposta.status === 429) {
      exibirMensagem(msgStatus, "Muitas tentativas. Aguarde um minuto e tente novamente.", "erro");
      return;
    }

    if (!resposta.ok) {
      exibirMensagem(msgStatus, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
      return;
    }

    const resultado = await resposta.json();
    
    // Sucesso: Guarda PIN em memória e limpa o campo do formulário
    pinSessao = pinDigitado;
    campoPin.value = "";

    // Processamento dos dados
    if (resultado.dados && resultado.dados.disciplinas && resultado.dados.disciplinas.length > 0) {
      dadosAtuais = resultado.dados.disciplinas;
    } else {
      dadosAtuais = JSON.parse(JSON.stringify(dadosBoletimPadrao));
    }

    // Oculta login e mostra o boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";
    
    renderizarBoletim();

  } catch (erro) {
    exibirMensagem(msgStatus, "Não foi possível conectar ao servidor. Tente novamente.", "erro");
  }
}

/**
 * Preenche a tabela e atualiza os cards de resumo
 */
function renderizarBoletim() {
  const corpoTabela = document.getElementById("tabela-boletim");
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let contadorMediasValidas = 0;
  let acumuladorFaltasGeral = 0;
  let contagemBomDesempenho = 0;
  let contagemAtencao = 0;

  dadosAtuais.forEach((item, idx) => {
    // Tratamento das notas (suporta dados antigos e dados editados)
    const n1 = typeof item.tri1 === "number" && item.tri1 <= 10 ? item.tri1 : normalizarNotaAntiga(item.tri1);
    const n2 = typeof item.tri2 === "number" && item.tri2 <= 10 ? item.tri2 : normalizarNotaAntiga(item.tri2);
    const n3 = typeof item.tri3 === "number" && item.tri3 <= 10 ? item.tri3 : normalizarNotaAntiga(item.tri3);

    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;
    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, val) => acc + val, 0);
      media = soma / notasValidas.length;
      somaMedias += media;
      contadorMediasValidas++;
    }

    // Tratamento das faltas (garante formato de array com 3 elementos)
    let faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = faltasArray.reduce((acc, val) => acc + (Number(val) || 0), 0);
    acumuladorFaltasGeral += totalFaltasDisciplina;

    // Situação
    let situacaoTexto = "Nota ainda não disponível";
    let situacaoClasse = "situacao-indisponivel";

    if (media !== null) {
      if (media >= 6.0) {
        situacaoTexto = "Bom desempenho";
        situacaoClasse = "situacao-bom";
        contagemBomDesempenho++;
      } else {
        situacaoTexto = "Atenção";
        situacaoClasse = "situacao-atencao";
        contagemAtencao++;
      }
    }

    const tr = document.createElement("tr");

    if (modoEdicao) {
      // Modo de Edição com Inputs
      tr.innerHTML = `
        <td></td>
        <td><input type="text" class="input-edicao" id="input-tri1-${idx}" value="${formatarValorInput(item.tri1)}"></td>
        <td><input type="text" class="input-edicao" id="input-tri2-${idx}" value="${formatarValorInput(item.tri2)}"></td>
        <td><input type="text" class="input-edicao" id="input-tri3-${idx}" value="${formatarValorInput(item.tri3)}"></td>
        <td><strong>${media !== null ? media.toFixed(1).replace(".", ",") : "—"}</strong></td>
        <td>
          <input type="text" class="input-edicao" id="input-f1-${idx}" value="${faltasArray[0] ?? 0}" title="Faltas 1º Tri">
          <input type="text" class="input-edicao" id="input-f2-${idx}" value="${faltasArray[1] ?? 0}" title="Faltas 2º Tri">
          <input type="text" class="input-edicao" id="input-f3-${idx}" value="${faltasArray[2] ?? 0}" title="Faltas 3º Tri">
        </td>
        <td class="${situacaoClasse}">${situacaoTexto}</td>
      `;
      // Preenchimento seguro do nome da disciplina contra XSS
      tr.cells[0].appendChild(document.createTextNode(item.disciplina));
    } else {
      // Modo de Visualização Padrão
      tr.innerHTML = `
        <td><strong></strong></td>
        <td>${n1 !== null ? n1.toFixed(1).replace(".", ",") : "—"}</td>
        <td>${n2 !== null ? n2.toFixed(1).replace(".", ",") : "—"}</td>
        <td>${n3 !== null ? n3.toFixed(1).replace(".", ",") : "—"}</td>
        <td><strong>${media !== null ? media.toFixed(1).replace(".", ",") : "—"}</strong></td>
        <td>${totalFaltasDisciplina}</td>
        <td class="${situacaoClasse}">${situacaoTexto}</td>
      `;
      tr.cells[0].querySelector("strong").textContent = item.disciplina;
    }

    corpoTabela.appendChild(tr);
  });

  // Atualização dos Cards
  const mediaGeralFinal = contadorMediasValidas > 0 ? (somaMedias / contadorMediasValidas).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("media-geral").textContent = mediaGeralFinal;
  document.getElementById("total-faltas").textContent = acumuladorFaltasGeral;
  document.getElementById("bom-desempenho").textContent = contagemBomDesempenho;
  document.getElementById("precisa-atencao").textContent = contagemAtencao;
  document.getElementById("frequencia-geral").textContent = FREQUENCIA_DEMONSTRATIVA;
}

/**
 * Formata valores para inserção nos inputs de edição
 */
function formatarValorInput(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const norm = normalizarNotaAntiga(valor);
  return norm !== null ? norm.toString().replace(".", ",") : valor;
}

/**
 * Alterna entre visualização e edição
 */
function alternarModoEdicao() {
  modoEdicao = true;
  document.getElementById("btn-editar").style.display = "none";
  document.getElementById("btn-salvar").style.display = "inline-block";
  document.getElementById("btn-cancelar").style.display = "inline-block";
  renderizarBoletim();
}

/**
 * Cancela a edição sem salvar
 */
function cancelarEdicao() {
  modoEdicao = false;
  document.getElementById("btn-editar").style.display = "inline-block";
  document.getElementById("btn-salvar").style.display = "none";
  document.getElementById("btn-cancelar").style.display = "none";
  document.getElementById("mensagem-status-boletim").textContent = "";
  renderizarBoletim();
}

/**
 * Salva as alterações validando todas as entradas antes do envio
 */
async function salvarAlteracoes() {
  const msgStatus = document.getElementById("mensagem-status-boletim");
  exibirMensagem(msgStatus, "", "");

  let temErro = false;
  const novasDisciplinas = [];

  // Coleta e valida dados de cada linha
  for (let idx = 0; idx < dadosAtuais.length; idx++) {
    const itemOriginal = dadosAtuais[idx];
    
    const inpTri1 = document.getElementById(`input-tri1-${idx}`);
    const inpTri2 = document.getElementById(`input-tri2-${idx}`);
    const inpTri3 = document.getElementById(`input-tri3-${idx}`);

    const inpF1 = document.getElementById(`input-f1-${idx}`);
    const inpF2 = document.getElementById(`input-f2-${idx}`);
    const inpF3 = document.getElementById(`input-f3-${idx}`);

    // Limpa destaque de erros anteriores
    [inpTri1, inpTri2, inpTri3, inpF1, inpF2, inpF3].forEach(el => el.classList.remove("invalido"));

    // Validações de Notas
    const v1 = validarNotaEditada(inpTri1.value);
    const v2 = validarNotaEditada(inpTri2.value);
    const v3 = validarNotaEditada(inpTri3.value);

    if (!v1.valido) { inpTri1.classList.add("invalido"); temErro = true; }
    if (!v2.valido) { inpTri2.classList.add("invalido"); temErro = true; }
    if (!v3.valido) { inpTri3.classList.add("invalido"); temErro = true; }

    // Validações de Faltas
    const f1 = validarFaltaEditada(inpF1.value);
    const f2 = validarFaltaEditada(inpF2.value);
    const f3 = validarFaltaEditada(inpF3.value);

    if (!f1.valido) { inpF1.classList.add("invalido"); temErro = true; }
    if (!f2.valido) { inpF2.classList.add("invalido"); temErro = true; }
    if (!f3.valido) { inpF3.classList.add("invalido"); temErro = true; }

    novasDisciplinas.push({
      disciplina: itemOriginal.disciplina,
      tri1: v1.valor,
      tri2: v2.valor,
      tri3: v3.valor,
      faltas: [f1.valor ?? 0, f2.valor ?? 0, f3.valor ?? 0]
    });
  }

  if (temErro) {
    exibirMensagem(msgStatus, "Verifique os campos destacados em vermelho. Digite notas de 0 a 10 e faltas inteiras.", "erro");
    return;
  }

  exibirMensagem(msgStatus, "Salvando...", "info");

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      exibirMensagem(msgStatus, "Falha ao salvar dados. Tente novamente.", "erro");
      return;
    }

    // Atualiza estado local após confirmação do servidor
    dadosAtuais = novasDisciplinas;
    modoEdicao = false;

    document.getElementById("btn-editar").style.display = "inline-block";
    document.getElementById("btn-salvar").style.display = "none";
    document.getElementById("btn-cancelar").style.display = "none";

    renderizarBoletim();
    exibirMensagem(msgStatus, "Dados salvos com sucesso.", "sucesso");

  } catch (erro) {
    exibirMensagem(msgStatus, "Falha ao conectar com o servidor. Tente novamente.", "erro");
  }
}

/**
 * Função utilitária para exibir mensagens de status
 */
function exibirMensagem(elemento, texto, tipo) {
  elemento.textContent = texto;
  elemento.className = `mensagem-status ${tipo}`;
}