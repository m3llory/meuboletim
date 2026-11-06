// Dados fictícios padronizados do 9º Ano
const dadosBoletim = [
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

/**
 * Função para normalizar qualquer formato de nota para a escala de 0 a 10
 */
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Converte vírgula decimal para ponto, se for texto
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let num = Number(valor);

  // Verifica se o valor convertido é um número válido
  if (isNaN(num)) {
    return null;
  }

  // Ajusta escala de 0 a 100 para 0 a 10
  if (num > 10 && num <= 100) {
    num = num / 10;
  }

  // Retorna a nota se estiver na escala permitida (0 a 10)
  if (num >= 0 && num <= 10) {
    return num;
  }

  return null; // Caso a nota seja fora dos padrões permitidos
}

/**
 * Função principal para processar os dados e preencher a tela
 */
function renderizarBoletim() {
  const corpoTabela = document.getElementById("tabela-boletim");
  corpoTabela.innerHTML = ""; // Limpa a tabela antes de preencher

  let somaMedias = 0;
  let contadorMediasValidas = 0;
  let acumuladorFaltasGeral = 0;
  let contagemBomDesempenho = 0;
  let contagemAtencao = 0;

  dadosBoletim.forEach((item) => {
    // Normalização das notas dos trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Cálculo da média considerando apenas notas existentes
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;
    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, val) => acc + val, 0);
      media = soma / notasValidas.length;
      somaMedias += media;
      contadorMediasValidas++;
    }

    // Soma das faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, val) => acc + val, 0);
    acumuladorFaltasGeral += totalFaltasDisciplina;

    // Definição da situação da disciplina
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

    // Criação da linha da tabela
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${n1 !== null ? n1.toFixed(1).replace(".", ",") : "—"}</td>
      <td>${n2 !== null ? n2.toFixed(1).replace(".", ",") : "—"}</td>
      <td>${n3 !== null ? n3.toFixed(1).replace(".", ",") : "—"}</td>
      <td><strong>${media !== null ? media.toFixed(1).replace(".", ",") : "—"}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${situacaoClasse}">${situacaoTexto}</td>
    `;
    corpoTabela.appendChild(tr);
  });

  // Atualização dos cards de resumo
  const mediaGeralFinal = contadorMediasValidas > 0 ? (somaMedias / contadorMediasValidas).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("media-geral").textContent = mediaGeralFinal;
  document.getElementById("total-faltas").textContent = acumuladorFaltasGeral;
  document.getElementById("bom-desempenho").textContent = contagemBomDesempenho;
  document.getElementById("precisa-atencao").textContent = contagemAtencao;
  document.getElementById("frequencia-geral").textContent = FREQUENCIA_DEMONSTRATIVA;
}

// Executa a função assim que o arquivo carregar
renderizarBoletim();