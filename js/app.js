(() => {
  "use strict";

  const dadosOriginais = window.DADOS_ECONOMICOS ?? [];

  if (!dadosOriginais.length) {
    console.error("Nenhum dado econômico foi carregado.");
    return;
  }

  const formatarMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  const formatarPercentual = (valor) =>
    `${valor.toFixed(2).replace(".", ",")}%`;

  const calcularCrescimento = (atual, anterior) =>
    ((atual - anterior) / anterior) * 100;

  const dados = dadosOriginais.map((item, indice, array) => {
    const reajuste =
      indice === 0 ? null : calcularCrescimento(item.salario, array[indice - 1].salario);

    const saldoReal = reajuste === null ? null : reajuste - item.ipca;

    return {
      ...item,
      reajuste,
      saldoReal
    };
  });

  const elementos = {
    botaoTema: document.querySelector("#botao-tema"),
    iconeTema: document.querySelector("#icone-tema"),
    filtroAno: document.querySelector("#filtro-ano"),
    botaoImprimir: document.querySelector("#botao-imprimir"),
    corpoTabela: document.querySelector("#corpo-tabela"),
    destaqueAno: document.querySelector("#destaque-ano")
  };

  let graficos = {};

  function obterCoresDoTema() {
    const estilos = getComputedStyle(document.documentElement);

    return {
      texto: estilos.getPropertyValue("--cor-texto").trim(),
      textoSuave: estilos.getPropertyValue("--cor-texto-suave").trim(),
      borda: estilos.getPropertyValue("--cor-borda").trim(),
      primaria: estilos.getPropertyValue("--cor-primaria").trim(),
      positiva: estilos.getPropertyValue("--cor-positiva").trim(),
      negativa: estilos.getPropertyValue("--cor-negativa").trim(),
      superficie: estilos.getPropertyValue("--cor-superficie").trim()
    };
  }

  function preencherIndicadores() {
    const primeiro = dados[0];
    const ultimo = dados.at(-1);
    const maiorInflacao = dados.reduce((maior, item) =>
      item.ipca > maior.ipca ? item : maior
    );
    const maiorReajuste = dados
      .filter((item) => item.reajuste !== null)
      .reduce((maior, item) =>
        item.reajuste > maior.reajuste ? item : maior
      );

    const crescimentoAcumulado = calcularCrescimento(
      ultimo.salario,
      primeiro.salario
    );

    document.querySelector("#card-salario-inicial").textContent =
      formatarMoeda.format(primeiro.salario);
    document.querySelector("#card-salario-inicial-ano").textContent =
      `Ano de ${primeiro.ano}`;

    document.querySelector("#card-salario-final").textContent =
      formatarMoeda.format(ultimo.salario);
    document.querySelector("#card-salario-final-ano").textContent =
      `Ano de ${ultimo.ano}`;

    document.querySelector("#card-maior-inflacao").textContent =
      formatarPercentual(maiorInflacao.ipca);
    document.querySelector("#card-maior-inflacao-ano").textContent =
      `Registrada em ${maiorInflacao.ano}`;

    document.querySelector("#card-maior-reajuste").textContent =
      formatarPercentual(maiorReajuste.reajuste);
    document.querySelector("#card-maior-reajuste-ano").textContent =
      `Registrado em ${maiorReajuste.ano}`;

    document.querySelector("#resultado-acumulado").textContent =
      `+${formatarPercentual(crescimentoAcumulado)}`;
    document.querySelector("#descricao-acumulada").textContent =
      "de crescimento nominal do salário mínimo no período.";

    document.querySelector("#salario-inicial-hero").textContent =
      formatarMoeda.format(primeiro.salario);
    document.querySelector("#salario-final-hero").textContent =
      formatarMoeda.format(ultimo.salario);
  }

  function preencherFiltro() {
    const fragmento = document.createDocumentFragment();

    for (const item of dados) {
      const opcao = document.createElement("option");
      opcao.value = String(item.ano);
      opcao.textContent = String(item.ano);
      fragmento.append(opcao);
    }

    elementos.filtroAno.append(fragmento);
  }

  function atualizarDestaqueAno(anoSelecionado) {
    if (anoSelecionado === "todos") {
      elementos.destaqueAno.hidden = true;
      return;
    }

    const item = dados.find(({ ano }) => ano === Number(anoSelecionado));

    if (!item) {
      elementos.destaqueAno.hidden = true;
      return;
    }

    elementos.destaqueAno.hidden = false;

    document.querySelector("#destaque-ano-titulo").textContent = item.ano;
    document.querySelector("#destaque-salario").textContent =
      formatarMoeda.format(item.salario);
    document.querySelector("#destaque-reajuste").textContent =
      item.reajuste === null ? "—" : formatarPercentual(item.reajuste);
    document.querySelector("#destaque-ipca").textContent =
      formatarPercentual(item.ipca);

    const saldoElemento = document.querySelector("#destaque-saldo");

    if (item.saldoReal === null) {
      saldoElemento.textContent = "—";
      saldoElemento.className = "";
    } else {
      saldoElemento.textContent = `${item.saldoReal >= 0 ? "+" : ""}${formatarPercentual(item.saldoReal)}`;
      saldoElemento.className =
        item.saldoReal >= 0 ? "valor--positivo" : "valor--negativo";
    }
  }

  function obterSituacao(item) {
    if (item.saldoReal === null) {
      return {
        texto: "Sem comparação",
        classe: "badge badge--neutro"
      };
    }

    if (item.saldoReal > 0.05) {
      return {
        texto: "Acima da inflação",
        classe: "badge badge--positivo"
      };
    }

    if (item.saldoReal < -0.05) {
      return {
        texto: "Abaixo da inflação",
        classe: "badge badge--negativo"
      };
    }

    return {
      texto: "Próximo da inflação",
      classe: "badge badge--neutro"
    };
  }

  function preencherTabela() {
    const fragmento = document.createDocumentFragment();

    for (const item of dados) {
      const linha = document.createElement("tr");
      const situacao = obterSituacao(item);

      const saldoTexto =
        item.saldoReal === null
          ? "—"
          : `${item.saldoReal >= 0 ? "+" : ""}${formatarPercentual(item.saldoReal)}`;

      linha.innerHTML = `
        <td>${item.ano}</td>
        <td>${formatarMoeda.format(item.salario)}</td>
        <td>${item.reajuste === null ? "—" : formatarPercentual(item.reajuste)}</td>
        <td>${formatarPercentual(item.ipca)}</td>
        <td class="${item.saldoReal === null ? "" : item.saldoReal >= 0 ? "valor--positivo" : "valor--negativo"}">${saldoTexto}</td>
        <td><span class="${situacao.classe}">${situacao.texto}</span></td>
      `;

      fragmento.append(linha);
    }

    elementos.corpoTabela.append(fragmento);
  }

  function preencherInsight() {
    const comparaveis = dados.filter((item) => item.saldoReal !== null);
    const anosPositivos = comparaveis.filter((item) => item.saldoReal > 0).length;
    const anosNegativos = comparaveis.filter((item) => item.saldoReal < 0).length;

    const melhorAno = comparaveis.reduce((melhor, item) =>
      item.saldoReal > melhor.saldoReal ? item : melhor
    );

    const piorAno = comparaveis.reduce((pior, item) =>
      item.saldoReal < pior.saldoReal ? item : pior
    );

    document.querySelector("#texto-insight").textContent =
      `Entre 2011 e 2020, o reajuste salarial ficou acima do IPCA em ${anosPositivos} anos e abaixo em ${anosNegativos}. ` +
      `O melhor saldo real ocorreu em ${melhorAno.ano} (${formatarPercentual(melhorAno.saldoReal)}), ` +
      `enquanto o resultado mais desfavorável foi registrado em ${piorAno.ano} (${formatarPercentual(piorAno.saldoReal)}).`;
  }

  function configurarPadroesChart() {
    const cores = obterCoresDoTema();

    Chart.defaults.color = cores.textoSuave;
    Chart.defaults.borderColor = cores.borda;
    Chart.defaults.font.family =
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }

  function opcoesComuns() {
    const cores = obterCoresDoTema();

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: cores.texto,
            usePointStyle: true,
            boxWidth: 8,
            padding: 18
          }
        },
        tooltip: {
          backgroundColor: cores.texto,
          titleColor: cores.superficie,
          bodyColor: cores.superficie,
          padding: 12,
          cornerRadius: 10
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: cores.textoSuave
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: cores.borda
          },
          ticks: {
            color: cores.textoSuave
          }
        }
      }
    };
  }

  function criarGraficos() {
    if (typeof Chart === "undefined") {
      console.error("Chart.js não foi carregado.");
      return;
    }

    configurarPadroesChart();

    const cores = obterCoresDoTema();
    const anos = dados.map(({ ano }) => ano);

    const opcoesSalario = opcoesComuns();
    opcoesSalario.plugins.tooltip.callbacks = {
      label: (contexto) =>
        `${contexto.dataset.label}: ${formatarMoeda.format(contexto.parsed.y)}`
    };
    opcoesSalario.scales.y.ticks.callback = (valor) =>
      formatarMoeda.format(valor);

    graficos.salarios = new Chart(
      document.querySelector("#grafico-salarios"),
      {
        type: "line",
        data: {
          labels: anos,
          datasets: [
            {
              label: "Salário mínimo",
              data: dados.map(({ salario }) => salario),
              borderColor: cores.primaria,
              backgroundColor: `${cores.primaria}24`,
              fill: true,
              tension: 0.28,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 7
            }
          ]
        },
        options: opcoesSalario
      }
    );

    const opcoesComparacao = opcoesComuns();
    opcoesComparacao.plugins.tooltip.callbacks = {
      label: (contexto) =>
        `${contexto.dataset.label}: ${formatarPercentual(contexto.parsed.y)}`
    };
    opcoesComparacao.scales.y.ticks.callback = (valor) => `${valor}%`;

    graficos.comparacao = new Chart(
      document.querySelector("#grafico-comparacao"),
      {
        type: "line",
        data: {
          labels: anos.slice(1),
          datasets: [
            {
              label: "Reajuste salarial",
              data: dados.slice(1).map(({ reajuste }) => reajuste),
              borderColor: cores.positiva,
              backgroundColor: `${cores.positiva}20`,
              tension: 0.25,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 7
            },
            {
              label: "IPCA",
              data: dados.slice(1).map(({ ipca }) => ipca),
              borderColor: cores.negativa,
              backgroundColor: `${cores.negativa}20`,
              tension: 0.25,
              borderWidth: 3,
              pointRadius: 4,
              pointHoverRadius: 7
            }
          ]
        },
        options: opcoesComparacao
      }
    );

    const opcoesSaldo = opcoesComuns();
    opcoesSaldo.plugins.legend.display = false;
    opcoesSaldo.plugins.tooltip.callbacks = {
      label: (contexto) =>
        `Saldo real: ${contexto.parsed.y >= 0 ? "+" : ""}${formatarPercentual(contexto.parsed.y)}`
    };
    opcoesSaldo.scales.y.ticks.callback = (valor) => `${valor}%`;

    graficos.saldo = new Chart(
      document.querySelector("#grafico-saldo"),
      {
        type: "bar",
        data: {
          labels: anos.slice(1),
          datasets: [
            {
              label: "Saldo real",
              data: dados.slice(1).map(({ saldoReal }) => saldoReal),
              backgroundColor: dados.slice(1).map(({ saldoReal }) =>
                saldoReal >= 0 ? cores.positiva : cores.negativa
              ),
              borderRadius: 7,
              borderSkipped: false
            }
          ]
        },
        options: opcoesSaldo
      }
    );
  }

  function destruirGraficos() {
    Object.values(graficos).forEach((grafico) => grafico?.destroy());
    graficos = {};
  }

  function aplicarTema(tema) {
    const temaEscuro = tema === "dark";

    document.documentElement.dataset.theme = tema;
    elementos.botaoTema.setAttribute("aria-pressed", String(temaEscuro));
    elementos.botaoTema.setAttribute(
      "aria-label",
      temaEscuro ? "Ativar tema claro" : "Ativar tema escuro"
    );
    elementos.iconeTema.textContent = temaEscuro ? "☀" : "☾";

    localStorage.setItem("tema-salario-inflacao", tema);

    destruirGraficos();
    criarGraficos();
  }

  function inicializarTema() {
    const temaSalvo = localStorage.getItem("tema-salario-inflacao");
    const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const temaInicial = temaSalvo ?? (prefereEscuro ? "dark" : "light");

    document.documentElement.dataset.theme = temaInicial;

    const temaEscuro = temaInicial === "dark";
    elementos.botaoTema.setAttribute("aria-pressed", String(temaEscuro));
    elementos.botaoTema.setAttribute(
      "aria-label",
      temaEscuro ? "Ativar tema claro" : "Ativar tema escuro"
    );
    elementos.iconeTema.textContent = temaEscuro ? "☀" : "☾";
  }

  function registrarEventos() {
    elementos.botaoTema.addEventListener("click", () => {
      const temaAtual = document.documentElement.dataset.theme;
      aplicarTema(temaAtual === "dark" ? "light" : "dark");
    });

    elementos.filtroAno.addEventListener("change", (evento) => {
      atualizarDestaqueAno(evento.target.value);
    });

    elementos.botaoImprimir.addEventListener("click", () => {
      window.print();
    });
  }

  function iniciar() {
    inicializarTema();
    preencherIndicadores();
    preencherFiltro();
    preencherTabela();
    preencherInsight();
    criarGraficos();
    registrarEventos();

    document.querySelector("#ano-atual").textContent =
      new Date().getFullYear();
  }

  iniciar();
})();
