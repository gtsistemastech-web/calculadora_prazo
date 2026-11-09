/**
 * PrazoControl - Módulo Calculadora e Configurações (Restrito ao ADM)
 * Arquitetura Vanilla JavaScript (ES6+), Web Crypto API (SHA-256) e LocalStorage.
 */

// ══════════════════════════════════════════════════
// CONSTANTES & FERIADOS NACIONAIS
// ══════════════════════════════════════════════════
const FERIADOS_NACIONAIS = [
  { nome: "Confraternização Universal", data: "01/01" },
  { nome: "Tiradentes", data: "21/04" },
  { nome: "Dia do Trabalho", data: "01/05" },
  { nome: "Independência do Brasil", data: "07/09" },
  { nome: "Nossa Senhora Aparecida", data: "12/10" },
  { nome: "Finados", data: "02/11" },
  { nome: "Proclamação da República", data: "15/11" },
  { nome: "Dia da Consciência Negra", data: "20/11" },
  { nome: "Natal", data: "25/12" }
];

const DIAS_SEMANA = [
  "Domingo", "Segunda-feira", "Terça-feira",
  "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"
];

// Feriados e recessos extras pré-carregados (iguais aos do sistema original)
const FERIADOS_PADRAO_EXTRA = [
  { tipo: "dia", nome: "Corpus Christi - Ponto Facultativo", data: "05/06" },
  { tipo: "dia", nome: "Dia do Servidor Público", data: "28/10" },
  { tipo: "dia", nome: "Dia da Justiça", data: "08/12" },
  { tipo: "dia", nome: "Aniversário de Goiânia", data: "24/10" },
  { tipo: "periodo", nome: "Recesso Forense (Art. 220 CPC)", dataInicio: "20/12", dataFim: "20/01" }
];

// ══════════════════════════════════════════════════
// ESTADO GLOBAL DA APLICAÇÃO
// ══════════════════════════════════════════════════
let feriadosExtra = [];
let isAdmAutenticado = false;
let tipoCadastroFeriado = "dia";
let telaAtual = "calc";
let modoCalculo = "simples"; // 'simples' ou 'duplo'
let dadosUltimoCalculoSimples = { uteis: null, corridos: null, dataInicio: null };
let dadosUltimoCalculoDuplo = null;

// Hash SHA-256 padrão para senha inicial 'admin123'
const HASH_SENHA_PADRAO = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

// ══════════════════════════════════════════════════
// INICIALIZAÇÃO
// ══════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  inicializarTema();
  inicializarFeriados();
  inicializarAutenticacao();
  inicializarDataCalculo();
  renderFeriadosChips();
  executarCalculo();
});

function inicializarTema() {
  const temaSalvo = localStorage.getItem("prazocontrol_theme");
  const isDark = temaSalvo === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  const switchEl = document.getElementById("theme-switch");
  if (switchEl) switchEl.checked = isDark;
}

window.toggleTheme = () => {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("prazocontrol_theme", isDark ? "dark" : "light");
  const switchEl = document.getElementById("theme-switch");
  if (switchEl) switchEl.checked = isDark;
};

window.toggleSidebar = () => {
  const sidebar = document.getElementById("sidebar");
  const icon = document.getElementById("toggle-sidebar-icon");
  const isCollapsed = sidebar.classList.toggle("collapsed");
  if (icon) {
    icon.className = isCollapsed ? "fas fa-angles-right" : "fas fa-angles-left";
  }
};

window.toggleMobileMenu = () => {
  document.getElementById("sidebar").classList.toggle("mobile-open");
};

function inicializarFeriados() {
  const salvos = localStorage.getItem("prazocontrol_feriados_extra");
  if (salvos) {
    try {
      feriadosExtra = JSON.parse(salvos);
    } catch (e) {
      feriadosExtra = [...FERIADOS_PADRAO_EXTRA];
    }
  } else {
    feriadosExtra = [...FERIADOS_PADRAO_EXTRA];
    salvarFeriadosExtraStorage();
  }
}

function salvarFeriadosExtraStorage() {
  localStorage.setItem("prazocontrol_feriados_extra", JSON.stringify(feriadosExtra));
}

function inicializarDataCalculo() {
  const campoData = document.getElementById("calc-data-inicio");
  if (campoData && !campoData.value) {
    const hoje = new Date();
    campoData.value = objParaStr(hoje);
  }
}

// ══════════════════════════════════════════════════
// SISTEMA DE AUTENTICAÇÃO E CONTROLE ADM (SHA-256)
// ══════════════════════════════════════════════════
async function calcularHashSHA256(texto) {
  const msgUint8 = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function inicializarAutenticacao() {
  const sessaoAdm = sessionStorage.getItem("prazocontrol_adm_auth");
  isAdmAutenticado = sessaoAdm === "true";
  atualizarInterfaceAutenticacao();
}

function atualizarInterfaceAutenticacao() {
  const avatar = document.getElementById("user-avatar");
  const nome = document.getElementById("user-nome");
  const role = document.getElementById("user-role");
  const btnAction = document.getElementById("btn-auth-action");
  const iconAction = document.getElementById("icon-auth-action");
  const badgeTop = document.getElementById("admin-badge-top");
  const lockBadgeNav = document.getElementById("nav-lock-badge");

  if (isAdmAutenticado) {
    avatar.textContent = "G";
    avatar.className = "user-avatar";
    nome.textContent = "Gustavo";
    role.textContent = "ADMINISTRADOR";
    role.className = "user-role is-adm";
    btnAction.title = "Sair do modo administrador";
    btnAction.className = "btn-action-user logout";
    iconAction.className = "fas fa-right-from-bracket";
    if (lockBadgeNav) {
      lockBadgeNav.style.background = "rgba(16, 185, 129, 0.2)";
      lockBadgeNav.style.color = "#10b981";
      lockBadgeNav.innerHTML = '<i class="fas fa-check"></i> ADM';
    }
    if (badgeTop) {
      badgeTop.innerHTML = `
        <span style="font-size:12px; font-weight:700; color:var(--success); background:var(--success-light); padding:4px 12px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">
          <i class="fas fa-shield-check"></i> Sessão ADM Ativa
        </span>
      `;
    }
  } else {
    avatar.textContent = "V";
    avatar.className = "user-avatar visitor";
    nome.textContent = "Visitante";
    role.textContent = "ACESSO PÚBLICO";
    role.className = "user-role";
    btnAction.title = "Entrar como administrador";
    btnAction.className = "btn-action-user";
    iconAction.className = "fas fa-key";
    if (lockBadgeNav) {
      lockBadgeNav.style.background = "rgba(245, 158, 11, 0.2)";
      lockBadgeNav.style.color = "#fbbf24";
      lockBadgeNav.innerHTML = '<i class="fas fa-lock"></i> ADM';
    }
    if (badgeTop) {
      badgeTop.innerHTML = `
        <button class="btn-sec" onclick="abrirModalLoginAdm()" style="padding:6px 14px; font-size:12px;">
          <i class="fas fa-lock" style="color:var(--warning)"></i> Modo Visitante (Entrar como ADM)
        </button>
      `;
    }
  }

  // Atualiza exibição da tela de configurações
  if (telaAtual === "config") {
    atualizarVisaoConfig();
  }
}

window.toggleAuthAdmin = () => {
  if (isAdmAutenticado) {
    // Logout
    isAdmAutenticado = false;
    sessionStorage.removeItem("prazocontrol_adm_auth");
    atualizarInterfaceAutenticacao();
    toast("aviso", "Você saiu do modo administrador.");
    if (telaAtual === "config") {
      atualizarVisaoConfig();
    }
  } else {
    abrirModalLoginAdm();
  }
};

window.abrirModalLoginAdm = () => {
  const input = document.getElementById("input-senha-adm");
  if (input) input.value = "";
  abrirModal("modal-login-adm");
  setTimeout(() => input?.focus(), 150);
};

window.autenticarAdm = async () => {
  const input = document.getElementById("input-senha-adm");
  const senhaDigitada = input?.value.trim();
  if (!senhaDigitada) {
    toast("aviso", "Por favor, digite a senha.");
    return;
  }

  const hashDigitado = await calcularHashSHA256(senhaDigitada);
  const hashSalvo = localStorage.getItem("prazocontrol_adm_hash") || HASH_SENHA_PADRAO;

  if (hashDigitado === hashSalvo) {
    isAdmAutenticado = true;
    sessionStorage.setItem("prazocontrol_adm_auth", "true");
    atualizarInterfaceAutenticacao();
    fecharModal("modal-login-adm");
    toast("ok", "Autenticado com sucesso como Administrador!");
    if (telaAtual === "config") {
      atualizarVisaoConfig();
    }
  } else {
    toast("erro", "Senha incorreta. Tente novamente.");
    input.select();
  }
};

window.alterarSenhaAdm = async () => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso não autorizado.");
    return;
  }
  const nova = document.getElementById("adm-nova-senha").value.trim();
  const confirma = document.getElementById("adm-confirma-senha").value.trim();

  if (!nova || !confirma) {
    toast("aviso", "Preencha ambos os campos de nova senha.");
    return;
  }
  if (nova.length < 6) {
    toast("aviso", "A senha deve conter no mínimo 6 caracteres.");
    return;
  }
  if (nova !== confirma) {
    toast("erro", "As senhas não coincidem.");
    return;
  }

  const novoHash = await calcularHashSHA256(nova);
  localStorage.setItem("prazocontrol_adm_hash", novoHash);
  document.getElementById("adm-nova-senha").value = "";
  document.getElementById("adm-confirma-senha").value = "";
  toast("ok", "Senha de Administrador alterada com sucesso!");
};

// ══════════════════════════════════════════════════
// NAVEGAÇÃO ENTRE TELAS
// ══════════════════════════════════════════════════
window.navegarPara = (tela) => {
  telaAtual = tela;

  // Botões da sidebar
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("ativo"));
  const btnNav = document.getElementById(`btn-nav-${tela}`);
  if (btnNav) btnNav.classList.add("ativo");

  // Seções principais
  document.querySelectorAll(".tela-section").forEach(s => s.classList.add("hidden"));
  const secao = document.getElementById(`tela-${tela}`);
  if (secao) secao.classList.remove("hidden");

  // Título e subtítulo
  const titleEl = document.getElementById("page-title");
  const subEl = document.getElementById("page-subtitle");

  if (tela === "calc") {
    titleEl.textContent = "Calculadora de Prazos";
    subEl.textContent = "Simule contagens considerando os feriados cadastrados";
    executarCalculo();
  } else if (tela === "config") {
    titleEl.textContent = "Configurações do Sistema";
    subEl.textContent = "Gerencie feriados estaduais, municipais e períodos de recesso forense";
    atualizarVisaoConfig();
  }

  // Fecha menu mobile após navegação
  document.getElementById("sidebar").classList.remove("mobile-open");
};

function atualizarVisaoConfig() {
  const lockScreen = document.getElementById("config-lock-screen");
  const adminPanel = document.getElementById("config-admin-panel");

  if (isAdmAutenticado) {
    lockScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    renderFeriadosExtraConfig();
  } else {
    lockScreen.classList.remove("hidden");
    adminPanel.classList.add("hidden");
  }
}

// ══════════════════════════════════════════════════
// ALGORITMOS DE DATAS E FERIADOS (GAUSS COMPUTUS)
// ══════════════════════════════════════════════════
function dataParaObj(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // 12h para evitar desvios de DST/fuso
}

function objParaStr(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatarDataBR(strOuDate) {
  if (!strOuDate) return "";
  let dt = typeof strOuDate === "string" ? dataParaObj(strOuDate) : strOuDate;
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const y = dt.getFullYear();
  return `${d}/${m}/${y}`;
}

// Algoritmo de Gauss para cálculo dos feriados móveis
function calcularFeriadosMoveis(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d2 = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d2 - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m2 = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m2 + 114) / 31);
  const dia = ((h + l - 7 * m2 + 114) % 31) + 1;

  const pascoa = new Date(ano, mes - 1, dia, 12, 0, 0);
  
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(pascoa.getDate() - 2);

  const carnaval1 = new Date(pascoa);
  carnaval1.setDate(pascoa.getDate() - 48);

  const carnaval2 = new Date(pascoa);
  carnaval2.setDate(pascoa.getDate() - 47);

  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);

  return {
    pascoa: objParaStr(pascoa),
    sextaSanta: objParaStr(sextaSanta),
    carnaval1: objParaStr(carnaval1),
    carnaval2: objParaStr(carnaval2),
    corpusChristi: objParaStr(corpusChristi)
  };
}

function dataEstaNoPeriodo(dateObj, dataInicioStr, dataFimStr) {
  if (!dataInicioStr || !dataFimStr) return false;
  const d = dateObj.getDate();
  const m = dateObj.getMonth() + 1;
  const y = dateObj.getFullYear();

  const iniPartes = dataInicioStr.split("/").map(Number);
  const fimPartes = dataFimStr.split("/").map(Number);

  if (iniPartes.length === 3 && fimPartes.length === 3) {
    const dtIni = new Date(iniPartes[2], iniPartes[1] - 1, iniPartes[0], 0, 0, 0);
    const dtFim = new Date(fimPartes[2], fimPartes[1] - 1, fimPartes[0], 23, 59, 59);
    const dtAlvo = new Date(y, m - 1, d, 12, 0, 0);
    return dtAlvo >= dtIni && dtAlvo <= dtFim;
  } else {
    // Apenas DD/MM (recorrente anualmente, como recesso 20/12 a 20/01)
    const valAtual = m * 100 + d;
    const valIni = iniPartes[1] * 100 + iniPartes[0];
    const valFim = fimPartes[1] * 100 + fimPartes[0];

    if (valIni <= valFim) {
      return valAtual >= valIni && valAtual <= valFim;
    } else {
      // Vira o ano (ex: 20/12 a 20/01)
      return valAtual >= valIni || valAtual <= valFim;
    }
  }
}

function obterNomeFeriado(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  const keyMD = `${d}/${m}`;
  const keyYMD = `${y}-${m}-${d}`;

  // 1. Feriados e Períodos Extras cadastrados
  for (const f of feriadosExtra) {
    if (f.tipo === "periodo" || f.dataInicio) {
      if (dataEstaNoPeriodo(dateObj, f.dataInicio, f.dataFim)) {
        return f.nome;
      }
    } else if (f.data) {
      const partes = f.data.split("/");
      if (partes.length === 2) {
        if (partes[0].padStart(2, "0") === d && partes[1].padStart(2, "0") === m) return f.nome;
      } else if (partes.length === 3) {
        if (partes[0].padStart(2, "0") === d && partes[1].padStart(2, "0") === m && Number(partes[2]) === y) {
          return f.nome;
        }
      }
    }
  }

  // 2. Feriados Nacionais Fixos
  const fixo = FERIADOS_NACIONAIS.find(f => f.data === keyMD);
  if (fixo) return fixo.nome;

  // 3. Feriados Nacionais Móveis
  const moveis = calcularFeriadosMoveis(y);
  if (moveis.sextaSanta === keyYMD) return "Sexta-feira Santa";
  if (moveis.carnaval1 === keyYMD) return "Carnaval (Segunda-feira)";
  if (moveis.carnaval2 === keyYMD) return "Carnaval (Terça-feira)";
  if (moveis.corpusChristi === keyYMD) return "Corpus Christi";

  return null;
}

function ehDiaUtil(dt) {
  const dow = dt.getDay();
  if (dow === 0 || dow === 6) return false;
  if (obterNomeFeriado(dt)) return false;
  return true;
}

// ══════════════════════════════════════════════════
// CONTROLE DE MODO & PRESETS
// ══════════════════════════════════════════════════
window.setModoCalculo = (modo) => {
  modoCalculo = modo;
  const btnSimples = document.getElementById("btn-modo-simples");
  const btnDuplo = document.getElementById("btn-modo-duplo");
  const formSimples = document.getElementById("form-modo-simples");
  const formDuplo = document.getElementById("form-modo-duplo");
  const lblData = document.getElementById("lbl-data-inicio");

  if (modo === "duplo") {
    btnSimples?.classList.remove("ativo");
    btnDuplo?.classList.add("ativo");
    formSimples?.classList.add("hidden");
    formDuplo?.classList.remove("hidden");
    if (lblData) lblData.innerHTML = 'Data de Envio / Início <span class="req">*</span>';
  } else {
    btnDuplo?.classList.remove("ativo");
    btnSimples?.classList.add("ativo");
    formDuplo?.classList.add("hidden");
    formSimples?.classList.remove("hidden");
    if (lblData) lblData.innerHTML = 'Data de Início <span class="req">*</span>';
  }
  executarCalculo();
};

window.aplicarPresetDuplo = (qtd1, tipo1, qtd2, tipo2, btn) => {
  const inputQtd1 = document.getElementById("calc-duplo-qtd1");
  const inputTipo1 = document.getElementById("calc-duplo-tipo1");
  const inputQtd2 = document.getElementById("calc-duplo-qtd2");
  const inputTipo2 = document.getElementById("calc-duplo-tipo2");

  if (inputQtd1) inputQtd1.value = qtd1;
  if (inputTipo1) inputTipo1.value = tipo1;
  if (inputQtd2) inputQtd2.value = qtd2;
  if (inputTipo2) inputTipo2.value = tipo2;

  document.querySelectorAll(".btn-preset-duplo").forEach(b => b.classList.remove("ativo"));
  if (btn) btn.classList.add("ativo");

  executarCalculo();
};

// ══════════════════════════════════════════════════
// MOTOR DE CÁLCULO DE PRAZOS
// ══════════════════════════════════════════════════
window.executarCalculo = () => {
  const dataInicioStr = document.getElementById("calc-data-inicio")?.value;
  const wrapEmpty = document.getElementById("calc-empty");
  const cardUteis = document.getElementById("calc-res-uteis");
  const cardCorridos = document.getElementById("calc-res-corridos");
  const cardDuplo = document.getElementById("calc-res-duplo");

  if (!dataInicioStr) {
    wrapEmpty?.classList.remove("hidden");
    cardUteis?.classList.add("hidden");
    cardCorridos?.classList.add("hidden");
    cardDuplo?.classList.add("hidden");
    return;
  }

  const dtTermoInicial = dataParaObj(dataInicioStr);
  const dataInicioFormatada = formatarDataBR(dtTermoInicial);

  // ── MODO PRAZO DUPLO / COMPOSTO ──
  if (modoCalculo === "duplo") {
    cardUteis?.classList.add("hidden");
    cardCorridos?.classList.add("hidden");

    const qtd1 = parseInt(document.getElementById("calc-duplo-qtd1")?.value) || 0;
    const tipo1 = document.getElementById("calc-duplo-tipo1")?.value || "corridos";
    const qtd2 = parseInt(document.getElementById("calc-duplo-qtd2")?.value) || 0;
    const tipo2 = document.getElementById("calc-duplo-tipo2")?.value || "uteis";

    if (qtd1 <= 0 || qtd2 <= 0) {
      wrapEmpty?.classList.remove("hidden");
      cardDuplo?.classList.add("hidden");
      return;
    }

    wrapEmpty?.classList.add("hidden");
    cardDuplo?.classList.remove("hidden");

    const resDuplo = calcularPrazoDuplo(dtTermoInicial, qtd1, tipo1, qtd2, tipo2);
    dadosUltimoCalculoDuplo = resDuplo;

    // Renderiza Vencimento Final
    const dataVencStr = formatarDataBR(resDuplo.vencimentoFinal);
    const diaSemanaVenc = DIAS_SEMANA[resDuplo.vencimentoFinal.getDay()];
    document.getElementById("calc-res-duplo-data").textContent = dataVencStr;
    document.getElementById("calc-res-duplo-diaSemana").textContent = diaSemanaVenc;

    // Resumo dos cards rápidos
    const descTipo1 = tipo1 === "corridos" ? "corridos" : "úteis";
    const descTipo2 = tipo2 === "corridos" ? "corridos" : "úteis";
    document.getElementById("calc-res-duplo-card-etapa1").textContent = `${formatarDataBR(resDuplo.etapa1.termo)} (${DIAS_SEMANA[resDuplo.etapa1.termo.getDay()]})`;
    document.getElementById("calc-res-duplo-card-etapa2").textContent = `${dataVencStr} (${diaSemanaVenc})`;

    // Linha do Tempo Visual (Stepper)
    let htmlTimeline = "";

    // 1. Início / Envio
    htmlTimeline += `
      <div class="timeline-item">
        <div class="timeline-dot inicio"><i class="fas fa-paper-plane"></i></div>
        <div class="timeline-content">
          <div class="timeline-title">Data de Envio / Início</div>
          <div class="timeline-date">
            <strong>${dataInicioFormatada}</strong> (${DIAS_SEMANA[dtTermoInicial.getDay()]})
            <span class="badge-tag info"><i class="fas fa-play"></i> Marco Zero</span>
          </div>
        </div>
      </div>
    `;

    // 2. Término da 1ª Etapa / Ciência
    const dataCienciaStr = formatarDataBR(resDuplo.etapa1.termo);
    const diaCiencia = DIAS_SEMANA[resDuplo.etapa1.termo.getDay()];
    let avisoProrrogacao1 = "";
    if (resDuplo.etapa1.prorrogou) {
      avisoProrrogacao1 = `
        <div style="margin-top:6px; font-size:11.5px; color:var(--warning); line-height:1.4">
          <i class="fas fa-triangle-exclamation"></i> Prazo teórico de ${qtd1} dias ${descTipo1} findou em dia não útil (${formatarDataBR(resDuplo.etapa1.dataTeorica)}). Prorrogado em ${resDuplo.etapa1.diasProrrogados} dia(s) para o 1º dia útil seguinte (Art. 5º, § 3º Lei 11.419/2006).
        </div>
      `;
    }

    htmlTimeline += `
      <div class="timeline-item">
        <div class="timeline-dot etapa1"><i class="fas fa-envelope-open-text"></i></div>
        <div class="timeline-content">
          <div class="timeline-title">1ª Etapa: Ciência / Dilação (${qtd1} dias ${descTipo1})</div>
          <div class="timeline-date">
            Efetivada em: <strong>${dataCienciaStr}</strong> (${diaCiencia})
            <span class="badge-tag warning"><i class="fas fa-check"></i> Ciência Aperfeiçoada</span>
          </div>
          ${avisoProrrogacao1}
        </div>
      </div>
    `;

    // 3. Início da 2ª Etapa (CPC 224)
    const dataIniContStr = formatarDataBR(resDuplo.transicao.primeiroDiaContagem);
    const diaIniCont = DIAS_SEMANA[resDuplo.transicao.primeiroDiaContagem.getDay()];
    htmlTimeline += `
      <div class="timeline-item">
        <div class="timeline-dot inicio" style="border-color:var(--purple);color:var(--purple);background:var(--purple-light)"><i class="fas fa-hourglass-start"></i></div>
        <div class="timeline-content">
          <div class="timeline-title">Início da Contagem da 2ª Etapa (Art. 224 CPC)</div>
          <div class="timeline-date">
            1º dia útil seguinte: <strong>${dataIniContStr}</strong> (${diaIniCont})
            <span class="badge-tag info" style="background:var(--purple-light);color:var(--purple)"><i class="fas fa-arrow-right"></i> Termo a quo</span>
          </div>
        </div>
      </div>
    `;

    // 4. Vencimento Final
    let avisoProrrogacao2 = "";
    if (resDuplo.etapa2.prorrogou) {
      avisoProrrogacao2 = `
        <div style="margin-top:6px; font-size:11.5px; color:var(--warning); line-height:1.4">
          <i class="fas fa-triangle-exclamation"></i> Vencimento teórico coincidiu com dia não útil (${formatarDataBR(resDuplo.etapa2.dataTeorica)}). Prorrogado para o 1º dia útil subsequente (Art. 224, § 1º CPC).
        </div>
      `;
    }

    htmlTimeline += `
      <div class="timeline-item">
        <div class="timeline-dot etapa2"><i class="fas fa-flag-checkered"></i></div>
        <div class="timeline-content">
          <div class="timeline-title">2ª Etapa: Vencimento Final (${qtd2} dias ${descTipo2})</div>
          <div class="timeline-date">
            Vencimento em: <strong>${dataVencStr}</strong> (${diaSemanaVenc})
            <span class="badge-tag success"><i class="fas fa-trophy"></i> Termo Final</span>
          </div>
          ${avisoProrrogacao2}
        </div>
      </div>
    `;

    document.getElementById("calc-res-duplo-timeline").innerHTML = htmlTimeline;

    // Detalhes extras e feriados
    let htmlDetalhes = `<div>Contagem combinada: <strong>${qtd1} dias ${descTipo1}</strong> de ciência/dilação + <strong>${qtd2} dias ${descTipo2}</strong> de prazo processual.</div>`;

    if (tipo2 === "uteis") {
      htmlDetalhes += `<div style="margin-top:4px;">Na 2ª etapa foram descontados <strong>${resDuplo.etapa2.finsDeSemana} dias de fim de semana</strong> e <strong>${resDuplo.etapa2.feriados.length} feriados/recessos</strong>.</div>`;
    }

    const todosFeriados = [...resDuplo.etapa1.feriados, ...resDuplo.etapa2.feriados];
    if (todosFeriados.length > 0) {
      htmlDetalhes += `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">`;
      todosFeriados.forEach(f => {
        htmlDetalhes += `<span class="badge-feriado extra" style="font-size:11px"><i class="fas fa-calendar-xmark"></i> ${f.data} - ${f.nome}</span>`;
      });
      htmlDetalhes += `</div>`;
    }

    document.getElementById("calc-res-duplo-detalhes").innerHTML = htmlDetalhes;
    return;
  }

  // ── MODO SIMPLES ──
  cardDuplo?.classList.add("hidden");
  const diasUteis = parseInt(document.getElementById("calc-dias-uteis")?.value) || 0;
  const diasCorridos = parseInt(document.getElementById("calc-dias-corridos")?.value) || 0;

  if (diasUteis <= 0 && diasCorridos <= 0) {
    wrapEmpty?.classList.remove("hidden");
    cardUteis?.classList.add("hidden");
    cardCorridos?.classList.add("hidden");
    return;
  }

  wrapEmpty?.classList.add("hidden");

  // CÁLCULO: DIAS ÚTEIS
  if (diasUteis > 0) {
    cardUteis?.classList.remove("hidden");
    const resUteis = calcularPrazoUteis(dtTermoInicial, diasUteis);
    dadosUltimoCalculoSimples.uteis = { ...resUteis, qtd: diasUteis, dataInicio: dtTermoInicial };

    document.getElementById("calc-res-uteis-data").textContent = formatarDataBR(resUteis.vencimento);
    document.getElementById("calc-res-uteis-qtd").textContent = `${diasUteis} dias úteis`;
    document.getElementById("calc-res-uteis-diaSemana").textContent = DIAS_SEMANA[resUteis.vencimento.getDay()];

    let htmlDetalhes = `<div>Prazo de <strong>${diasUteis} dias úteis</strong> contado a partir de <strong>${dataInicioFormatada}</strong> (${DIAS_SEMANA[dtTermoInicial.getDay()]}).</div>`;
    htmlDetalhes += `<div style="margin-top:4px;">Descontados <strong>${resUteis.finsDeSemana} dias de fim de semana</strong> e <strong>${resUteis.feriados.length} feriados/recessos</strong> no período.</div>`;

    if (resUteis.feriados.length > 0) {
      htmlDetalhes += `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">`;
      resUteis.feriados.forEach(f => {
        htmlDetalhes += `<span class="badge-feriado extra" style="font-size:11px"><i class="fas fa-calendar-xmark"></i> ${f.data} - ${f.nome}</span>`;
      });
      htmlDetalhes += `</div>`;
    }

    document.getElementById("calc-res-uteis-detalhes").innerHTML = htmlDetalhes;
  } else {
    cardUteis?.classList.add("hidden");
    dadosUltimoCalculoSimples.uteis = null;
  }

  // CÁLCULO: DIAS CORRIDOS
  if (diasCorridos > 0) {
    cardCorridos?.classList.remove("hidden");
    const resCorridos = calcularPrazoCorridos(dtTermoInicial, diasCorridos);
    dadosUltimoCalculoSimples.corridos = { ...resCorridos, qtd: diasCorridos, dataInicio: dtTermoInicial };

    document.getElementById("calc-res-corridos-data").textContent = formatarDataBR(resCorridos.vencimento);
    document.getElementById("calc-res-corridos-qtd").textContent = `${diasCorridos} dias corridos`;
    document.getElementById("calc-res-corridos-diaSemana").textContent = DIAS_SEMANA[resCorridos.vencimento.getDay()];

    let htmlDetalhes = `<div>Prazo de <strong>${diasCorridos} dias corridos</strong> contado a partir de <strong>${dataInicioFormatada}</strong>.</div>`;
    if (resCorridos.diasProrrogados > 0) {
      htmlDetalhes += `<div style="margin-top:4px;">O prazo teórico venceu em dia não útil (${formatarDataBR(resCorridos.dataTeorica)}). Prorrogado em <strong>${resCorridos.diasProrrogados} dia(s)</strong> até o primeiro dia útil seguinte.</div>`;
    } else {
      htmlDetalhes += `<div style="margin-top:4px;">Contagem contínua. Termo final coincidiu com dia útil comum.</div>`;
    }

    document.getElementById("calc-res-corridos-detalhes").innerHTML = htmlDetalhes;
  } else {
    cardCorridos?.classList.add("hidden");
    dadosUltimoCalculoSimples.corridos = null;
  }
};

function calcularPrazoUteis(dataInicioObj, qtdDias) {
  let cont = 0;
  let atual = new Date(dataInicioObj);
  let finsDeSemana = 0;
  const feriados = [];

  while (cont < qtdDias) {
    atual.setDate(atual.getDate() + 1);
    const dow = atual.getDay();
    const nomeFeriado = obterNomeFeriado(atual);

    if (dow === 0 || dow === 6) {
      finsDeSemana++;
    } else if (nomeFeriado) {
      feriados.push({ data: formatarDataBR(atual), nome: nomeFeriado });
    } else {
      cont++;
    }
  }

  return { vencimento: atual, finsDeSemana, feriados };
}

function calcularPrazoCorridos(dataInicioObj, qtdDias) {
  let atual = new Date(dataInicioObj);
  atual.setDate(atual.getDate() + qtdDias);
  const dataTeorica = new Date(atual);

  let diasProrrogados = 0;
  while (!ehDiaUtil(atual)) {
    atual.setDate(atual.getDate() + 1);
    diasProrrogados++;
  }

  return { vencimento: atual, dataTeorica, diasProrrogados };
}

function calcularPrazoDuplo(dataInicioObj, qtd1, tipo1, qtd2, tipo2) {
  // ETAPA 1 (ex.: 10 dias corridos de consulta eletrônica / ciência ficta)
  let termoEtapa1;
  let prorrogouEtapa1 = false;
  let dataTeoricaEtapa1 = null;
  let diasProrrogadosEtapa1 = 0;
  let feriadosEtapa1 = [];
  let finsDeSemanaEtapa1 = 0;

  if (tipo1 === "corridos") {
    let atual1 = new Date(dataInicioObj);
    atual1.setDate(atual1.getDate() + qtd1);
    dataTeoricaEtapa1 = new Date(atual1);

    // Se o termo final da 1ª etapa cair em dia não útil (sáb, dom, feriado), prorroga para o 1º dia útil seguinte
    // (Art. 5º, § 3º Lei 11.419/2006 e Art. 224, § 1º CPC)
    while (!ehDiaUtil(atual1)) {
      const nomeF = obterNomeFeriado(atual1);
      if (nomeF) {
        feriadosEtapa1.push({ data: formatarDataBR(atual1), nome: nomeF });
      }
      atual1.setDate(atual1.getDate() + 1);
      diasProrrogadosEtapa1++;
    }
    prorrogouEtapa1 = diasProrrogadosEtapa1 > 0;
    termoEtapa1 = atual1;
  } else {
    // tipo1 === "uteis"
    const r1 = calcularPrazoUteis(dataInicioObj, qtd1);
    termoEtapa1 = r1.vencimento;
    feriadosEtapa1 = r1.feriados;
    finsDeSemanaEtapa1 = r1.finsDeSemana;
    dataTeoricaEtapa1 = r1.vencimento;
  }

  // TRANSIÇÃO PARA A ETAPA 2:
  // A data termoEtapa1 é o dia em que se aperfeiçoou a ciência/fim da dilação.
  // Pelo Art. 224 do CPC, exclui-se o dia do começo (termoEtapa1) e o prazo conta a partir do 1º dia útil seguinte!
  let primeiroDiaUtilSeguinte = new Date(termoEtapa1);
  primeiroDiaUtilSeguinte.setDate(primeiroDiaUtilSeguinte.getDate() + 1);
  while (!ehDiaUtil(primeiroDiaUtilSeguinte)) {
    primeiroDiaUtilSeguinte.setDate(primeiroDiaUtilSeguinte.getDate() + 1);
  }

  // ETAPA 2 (Prazo Principal, ex.: 10 ou 15 dias úteis de contestação/recurso):
  let res2;
  if (tipo2 === "uteis") {
    res2 = calcularPrazoUteis(termoEtapa1, qtd2);
  } else {
    res2 = calcularPrazoCorridos(termoEtapa1, qtd2);
  }

  return {
    inicio: dataInicioObj,
    etapa1: {
      qtd: qtd1,
      tipo: tipo1,
      dataTeorica: dataTeoricaEtapa1,
      termo: termoEtapa1,
      prorrogou: prorrogouEtapa1,
      diasProrrogados: diasProrrogadosEtapa1,
      feriados: feriadosEtapa1,
      finsDeSemana: finsDeSemanaEtapa1
    },
    transicao: {
      dataCiencia: termoEtapa1,
      primeiroDiaContagem: primeiroDiaUtilSeguinte
    },
    etapa2: {
      qtd: qtd2,
      tipo: tipo2,
      vencimento: res2.vencimento,
      dataTeorica: res2.dataTeorica || res2.vencimento,
      prorrogou: (res2.diasProrrogados || 0) > 0,
      diasProrrogados: res2.diasProrrogados || 0,
      feriados: res2.feriados || [],
      finsDeSemana: res2.finsDeSemana || 0
    },
    vencimentoFinal: res2.vencimento
  };
}

// ══════════════════════════════════════════════════
// CERTIDÕES DE TEMPESTIVIDADE (ÁREA DE TRANSFERÊNCIA)
// ══════════════════════════════════════════════════
window.copiarCertidaoDuplo = () => {
  if (!dadosUltimoCalculoDuplo) {
    toast("aviso", "Realize o cálculo antes de copiar a certidão.");
    return;
  }
  const d = dadosUltimoCalculoDuplo;
  const dtInicio = formatarDataBR(d.inicio);
  const diaSemanaInicio = DIAS_SEMANA[d.inicio.getDay()];
  const dtCiencia = formatarDataBR(d.etapa1.termo);
  const diaSemanaCiencia = DIAS_SEMANA[d.etapa1.termo.getDay()];
  const dtInicioCont = formatarDataBR(d.transicao.primeiroDiaContagem);
  const diaSemanaIniCont = DIAS_SEMANA[d.transicao.primeiroDiaContagem.getDay()];
  const dtVencFinal = formatarDataBR(d.vencimentoFinal);
  const diaSemanaVenc = DIAS_SEMANA[d.vencimentoFinal.getDay()];

  const tipo1Desc = d.etapa1.tipo === "corridos" ? "dias corridos" : "dias úteis";
  const tipo2Desc = d.etapa2.tipo === "uteis" ? "dias úteis" : "dias corridos";

  const feriadosList = [...d.etapa1.feriados, ...d.etapa2.feriados];
  const feriadosStr = feriadosList.length > 0 
    ? feriadosList.map(f => `${f.data} (${f.nome})`).join(", ")
    : "Nenhum feriado no período";

  let texto = `CERTIDÃO DE CONTAGEM DE PRAZO DUPLO / COMPOSTO\n`;
  texto += `═══════════════════════════════════════════════════════\n`;
  texto += `1. MARCO INICIAL (ENVIO/DISPONIBILIZAÇÃO): ${dtInicio} (${diaSemanaInicio})\n\n`;
  texto += `2. 1ª ETAPA (${d.etapa1.qtd} ${tipo1Desc.toUpperCase()} - CIÊNCIA / DILAÇÃO):\n`;
  texto += `   • Término / Efetivação da Ciência: ${dtCiencia} (${diaSemanaCiencia})\n`;
  if (d.etapa1.prorrogou) {
    texto += `   • Observação: Prorrogado de ${formatarDataBR(d.etapa1.dataTeorica)} por coincidir com dia não útil (Art. 5º, § 3º da Lei Federal nº 11.419/2006).\n`;
  }
  texto += `\n3. 2ª ETAPA (${d.etapa2.qtd} ${tipo2Desc.toUpperCase()} - PRAZO PROCESSUAL):\n`;
  texto += `   • Início da Contagem (1º dia útil seguinte): ${dtInicioCont} (${diaSemanaIniCont})\n`;
  if (d.etapa2.tipo === "uteis") {
    texto += `   • Fins de Semana Descontados: ${d.etapa2.finsDeSemana} dia(s)\n`;
    texto += `   • Feriados/Recessos no Período: ${feriadosStr}\n`;
  }
  if (d.etapa2.prorrogou) {
    texto += `   • Prorrogação do Termo Final: Prorrogado de ${formatarDataBR(d.etapa2.dataTeorica)} para o primeiro dia útil subsequente (Art. 224, § 1º do CPC).\n`;
  }
  texto += `\n═══════════════════════════════════════════════════════\n`;
  texto += `VENCIMENTO FINAL DEFINITIVO: ${dtVencFinal} (${diaSemanaVenc})\n`;
  texto += `Fundamentação Legal: Art. 5º, § 3º da Lei Federal nº 11.419/2006 e Arts. 219 e 224 do CPC (Lei nº 13.105/2015).\n`;
  texto += `Simulado via PrazoControl.`;

  navigator.clipboard.writeText(texto).then(() => {
    toast("ok", "Certidão de Prazo Duplo copiada para a área de transferência!");
  }).catch(() => {
    toast("erro", "Não foi possível copiar automaticamente para a área de transferência.");
  });
};

window.copiarCertidaoSimples = (tipo) => {
  const dados = tipo === "uteis" ? dadosUltimoCalculoSimples.uteis : dadosUltimoCalculoSimples.corridos;
  if (!dados) {
    toast("aviso", "Realize o cálculo antes de copiar a certidão.");
    return;
  }

  const dtInicio = formatarDataBR(dados.dataInicio);
  const diaSemanaIni = DIAS_SEMANA[dados.dataInicio.getDay()];
  const dtVenc = formatarDataBR(dados.vencimento);
  const diaSemanaVenc = DIAS_SEMANA[dados.vencimento.getDay()];

  let texto = `CERTIDÃO DE TEMPESTIVIDADE DE PRAZO PROCESSUAL\n`;
  texto += `═══════════════════════════════════════════════════════\n`;
  texto += `• Termo Inicial: ${dtInicio} (${diaSemanaIni})\n`;
  texto += `• Prazo Processual: ${dados.qtd} ${tipo === "uteis" ? "dias úteis (Art. 219 CPC)" : "dias corridos"}\n`;
  if (tipo === "uteis") {
    texto += `• Fins de semana descontados: ${dados.finsDeSemana} dia(s)\n`;
    const feriadosStr = dados.feriados.length > 0 ? dados.feriados.map(f => `${f.data} (${f.nome})`).join(", ") : "Nenhum";
    texto += `• Feriados/Recessos descontados: ${feriadosStr}\n`;
  }
  if (dados.diasProrrogados > 0) {
    texto += `• Prorrogação: Termo original coincidiu com dia não útil (${formatarDataBR(dados.dataTeorica)}), prorrogado para o 1º dia útil subsequente.\n`;
  }
  texto += `═══════════════════════════════════════════════════════\n`;
  texto += `DATA FINAL DE VENCIMENTO: ${dtVenc} (${diaSemanaVenc})\n`;
  texto += `Fundamentação Legal: Arts. 219 e 224 da Lei nº 13.105/2015 (CPC).\n`;
  texto += `Simulado via PrazoControl.`;

  navigator.clipboard.writeText(texto).then(() => {
    toast("ok", `Certidão de Prazo em ${tipo === "uteis" ? "Dias Úteis" : "Dias Corridos"} copiada!`);
  }).catch(() => {
    toast("erro", "Erro ao copiar certidão.");
  });
};

// ══════════════════════════════════════════════════
// RENDERIZAÇÃO DOS BADGES DE FERIADOS NA TELA
// ══════════════════════════════════════════════════
function renderFeriadosChips() {
  const container = document.getElementById("calc-feriados-lista");
  if (!container) return;

  const anoAtual = new Date().getFullYear();
  let html = "";

  // 1. Nacionais Fixos
  FERIADOS_NACIONAIS.forEach(f => {
    html += `<span class="badge-feriado nacional"><i class="fas fa-calendar-day"></i> ${f.nome} (${f.data})</span>`;
  });

  // 2. Nacionais Móveis
  const moveis = calcularFeriadosMoveis(anoAtual);
  html += `<span class="badge-feriado nacional"><i class="fas fa-church"></i> Sexta-feira Santa (${formatarDataBR(moveis.sextaSanta)})</span>`;
  html += `<span class="badge-feriado nacional"><i class="fas fa-mask"></i> Carnaval (${formatarDataBR(moveis.carnaval2)})</span>`;
  html += `<span class="badge-feriado nacional"><i class="fas fa-cross"></i> Corpus Christi (${formatarDataBR(moveis.corpusChristi)})</span>`;

  // 3. Feriados Extras e Recessos
  feriadosExtra.forEach(f => {
    if (f.tipo === "periodo") {
      html += `<span class="badge-feriado recesso"><i class="fas fa-calendar-week"></i> ${f.nome} (${f.dataInicio} a ${f.dataFim})</span>`;
    } else {
      html += `<span class="badge-feriado extra"><i class="fas fa-calendar-check"></i> ${f.nome} (${f.data})</span>`;
    }
  });

  container.innerHTML = html;
}

// ══════════════════════════════════════════════════
// GESTÃO DE CONFIGURAÇÕES (EXCLUSIVO ADM)
// ══════════════════════════════════════════════════
window.setTipoCadastroFeriado = (tipo) => {
  tipoCadastroFeriado = tipo;
  const btnDia = document.getElementById("btn-tipo-dia");
  const btnPeriodo = document.getElementById("btn-tipo-periodo");
  const rowDia = document.getElementById("add-feriado-row");
  const rowPeriodo = document.getElementById("add-periodo-row");

  if (tipo === "periodo") {
    btnDia.classList.remove("ativo");
    btnPeriodo.classList.add("ativo");
    rowDia.classList.add("hidden");
    rowPeriodo.classList.remove("hidden");
  } else {
    btnDia.classList.add("ativo");
    btnPeriodo.classList.remove("ativo");
    rowDia.classList.remove("hidden");
    rowPeriodo.classList.add("hidden");
  }
};

window.adicionarFeriado = () => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso restrito ao administrador.");
    return;
  }
  const nome = document.getElementById("novo-feriado-nome").value.trim();
  const data = document.getElementById("novo-feriado-data").value.trim();

  if (!nome || !data) {
    toast("aviso", "Preencha o nome e a data do feriado.");
    return;
  }

  feriadosExtra.push({ tipo: "dia", nome, data });
  salvarFeriadosExtraStorage();
  renderFeriadosExtraConfig();
  renderFeriadosChips();
  executarCalculo();

  document.getElementById("novo-feriado-nome").value = "";
  document.getElementById("novo-feriado-data").value = "";
  toast("ok", `Feriado "${nome}" adicionado com sucesso!`);
};

window.adicionarPeriodo = () => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso restrito ao administrador.");
    return;
  }
  const nome = document.getElementById("novo-periodo-nome").value.trim();
  const dataInicio = document.getElementById("novo-periodo-inicio").value.trim();
  const dataFim = document.getElementById("novo-periodo-fim").value.trim();

  if (!nome || !dataInicio || !dataFim) {
    toast("aviso", "Preencha o nome, data de início e data de fim.");
    return;
  }

  feriadosExtra.push({ tipo: "periodo", nome, dataInicio, dataFim });
  salvarFeriadosExtraStorage();
  renderFeriadosExtraConfig();
  renderFeriadosChips();
  executarCalculo();

  document.getElementById("novo-periodo-nome").value = "";
  document.getElementById("novo-periodo-inicio").value = "";
  document.getElementById("novo-periodo-fim").value = "";
  toast("ok", `Período "${nome}" adicionado com sucesso!`);
};

function renderFeriadosExtraConfig() {
  const container = document.getElementById("feriados-extra-list");
  if (!container) return;

  if (feriadosExtra.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:var(--text-light); padding:10px 0;">Nenhum feriado extra ou período cadastrado.</p>`;
    return;
  }

  let html = "";
  feriadosExtra.forEach((f, index) => {
    const isPeriodo = f.tipo === "periodo";
    const dataDesc = isPeriodo ? `${f.dataInicio} a ${f.dataFim}` : f.data;
    const icone = isPeriodo ? "fa-calendar-week" : "fa-calendar-day";
    const badgeClass = isPeriodo ? "recesso" : "extra";

    html += `
      <div class="item-feriado-extra">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="badge-feriado ${badgeClass}" style="font-size:11px;">
            <i class="fas ${icone}"></i> ${isPeriodo ? "Recesso" : "Dia Único"}
          </span>
          <span style="font-size:14px; font-weight:700; color:var(--text-main);">${f.nome}</span>
          <span style="font-size:13px; color:var(--text-muted);">(${dataDesc})</span>
        </div>
        <button class="btn-del-feriado" onclick="confirmarExcluirFeriado(${index})" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.confirmarExcluirFeriado = (index) => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso restrito ao administrador.");
    return;
  }
  const item = feriadosExtra[index];
  if (!item) return;

  document.getElementById("confirmar-msg").innerHTML = `Deseja remover <strong>${item.nome}</strong> da lista de feriados considerados?`;
  document.getElementById("btn-executar-confirmar").onclick = () => {
    feriadosExtra.splice(index, 1);
    salvarFeriadosExtraStorage();
    renderFeriadosExtraConfig();
    renderFeriadosChips();
    executarCalculo();
    fecharModal("modal-confirmar");
    toast("ok", "Item removido com sucesso.");
  };

  abrirModal("modal-confirmar");
};

const FERIADOS_TJGO_2026_OFICIAIS = [
  { tipo: "dia", nome: "Ano Novo (Feriado Nacional)", data: "01/01/2026" },
  { tipo: "dia", nome: "Carnaval (Feriado no Tribunal)", data: "16/02/2026" },
  { tipo: "dia", nome: "Carnaval (Feriado no Tribunal)", data: "17/02/2026" },
  { tipo: "dia", nome: "Carnaval até 12h (Feriado no Tribunal)", data: "18/02/2026" },
  { tipo: "dia", nome: "MotoGP em Goiânia (Ponto Facultativo TJGO)", data: "20/03/2026" },
  { tipo: "dia", nome: "Semana Santa - Quarta-feira (Feriado no Tribunal)", data: "01/04/2026" },
  { tipo: "dia", nome: "Semana Santa - Quinta-feira (Feriado no Tribunal)", data: "02/04/2026" },
  { tipo: "dia", nome: "Semana Santa - Sexta-feira da Paixão (Feriado no Tribunal)", data: "03/04/2026" },
  { tipo: "dia", nome: "Ponto Facultativo (Poder Judiciário Estadual)", data: "20/04/2026" },
  { tipo: "dia", nome: "Tiradentes (Feriado Nacional)", data: "21/04/2026" },
  { tipo: "dia", nome: "Dia do Trabalho (Feriado Nacional)", data: "01/05/2026" },
  { tipo: "dia", nome: "Dia de Nossa Senhora Auxiliadora (Padroeira de Goiânia)", data: "24/05/2026" },
  { tipo: "dia", nome: "Corpus Christi (Feriado Nacional)", data: "04/06/2026" },
  { tipo: "dia", nome: "Ponto Facultativo (Poder Judiciário Estadual)", data: "05/06/2026" },
  { tipo: "dia", nome: "Fundação da Cidade de Goiás (Feriado no Tribunal)", data: "26/07/2026" },
  { tipo: "dia", nome: "Independência do Brasil (Feriado Nacional)", data: "07/09/2026" },
  { tipo: "dia", nome: "Nossa Senhora Aparecida - Padroeira do Brasil (Feriado Nacional)", data: "12/10/2026" },
  { tipo: "dia", nome: "Aniversário de Goiânia (Feriado no Tribunal)", data: "24/10/2026" },
  { tipo: "dia", nome: "Dia do Servidor Público (Feriado Estadual Lei 20.756/20)", data: "28/10/2026" },
  { tipo: "dia", nome: "Finados (Feriado Nacional)", data: "02/11/2026" },
  { tipo: "dia", nome: "Proclamação da República (Feriado Nacional)", data: "15/11/2026" },
  { tipo: "dia", nome: "Dia da Consciência Negra (Feriado Nacional)", data: "20/11/2026" },
  { tipo: "dia", nome: "Dia da Justiça (Art. 123 do RITJGO)", data: "08/12/2026" },
  { tipo: "periodo", nome: "Recesso Forense - TJGO (Art. 123 RITJGO)", dataInicio: "20/12/2026", dataFim: "06/01/2027" },
  { tipo: "dia", nome: "Natal (Feriado Nacional)", data: "25/12/2026" }
];

window.importarFeriadosTJGO2026 = () => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso restrito ao administrador.");
    return;
  }
  document.getElementById("confirmar-msg").innerHTML = `Deseja importar a lista oficial de <strong>25 feriados e recessos do TJGO 2026</strong> conforme o calendário oficial?`;
  document.getElementById("btn-executar-confirmar").onclick = () => {
    let adicionados = 0;
    FERIADOS_TJGO_2026_OFICIAIS.forEach(novo => {
      const existe = feriadosExtra.some(f => 
        f.nome === novo.nome && (f.data === novo.data || f.dataInicio === novo.dataInicio)
      );
      if (!existe) {
        feriadosExtra.push(novo);
        adicionados++;
      }
    });
    salvarFeriadosExtraStorage();
    renderFeriadosExtraConfig();
    renderFeriadosChips();
    executarCalculo();
    fecharModal("modal-confirmar");
    toast("ok", `${adicionados} feriados do TJGO 2026 importados com sucesso!`);
  };
  abrirModal("modal-confirmar");
};

window.importarArquivoJSON = (event) => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso restrito ao administrador.");
    return;
  }
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      if (!Array.isArray(dados)) {
        toast("erro", "O arquivo JSON deve conter uma lista de feriados.");
        return;
      }
      let adicionados = 0;
      dados.forEach(novo => {
        if (novo && novo.nome && (novo.data || (novo.dataInicio && novo.dataFim))) {
          const existe = feriadosExtra.some(f => 
            f.nome === novo.nome && (f.data === novo.data || f.dataInicio === novo.dataInicio)
          );
          if (!existe) {
            feriadosExtra.push(novo);
            adicionados++;
          }
        }
      });
      salvarFeriadosExtraStorage();
      renderFeriadosExtraConfig();
      renderFeriadosChips();
      executarCalculo();
      toast("ok", `${adicionados} novos feriados importados do arquivo JSON!`);
    } catch (err) {
      console.error(err);
      toast("erro", "Erro ao processar arquivo JSON. Verifique o arquivo.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "UTF-8");
};

window.exportarFeriadosJSON = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(feriadosExtra, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `prazocontrol_feriados_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  toast("ok", "Arquivo JSON exportado com sucesso!");
};

window.restaurarFeriadosPadrao = () => {
  if (!isAdmAutenticado) {
    toast("erro", "Acesso restrito ao administrador.");
    return;
  }
  document.getElementById("confirmar-msg").innerHTML = `Deseja restaurar a lista inicial padrão de feriados e recessos?`;
  document.getElementById("btn-executar-confirmar").onclick = () => {
    feriadosExtra = [...FERIADOS_PADRAO_EXTRA];
    salvarFeriadosExtraStorage();
    renderFeriadosExtraConfig();
    renderFeriadosChips();
    executarCalculo();
    fecharModal("modal-confirmar");
    toast("ok", "Feriados padrão restaurados.");
  };
  abrirModal("modal-confirmar");
};

// ══════════════════════════════════════════════════
// MODAIS & TOASTS
// ══════════════════════════════════════════════════
window.abrirModal = (id) => {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("open");
};

window.fecharModal = (id) => {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach(m => fecharModal(m.id));
  }
});

document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fecharModal(overlay.id);
  });
});

window.toast = (tipo, mensagem) => {
  const wrap = document.getElementById("toast-wrap");
  if (!wrap) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast ${tipo}`;
  const icones = {
    ok: "fa-circle-check",
    aviso: "fa-circle-exclamation",
    erro: "fa-triangle-exclamation"
  };
  const icon = icones[tipo] || "fa-info-circle";

  toastEl.innerHTML = `<i class="fas ${icon}"></i> <span>${mensagem}</span>`;
  wrap.appendChild(toastEl);

  setTimeout(() => {
    toastEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toastEl.style.opacity = "0";
    toastEl.style.transform = "translateY(10px)";
    setTimeout(() => toastEl.remove(), 300);
  }, 3500);
};
