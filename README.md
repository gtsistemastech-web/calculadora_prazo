# PrazoControl - Calculadora & Configurações

Sisteminha especializado e enxuto contendo exclusivamente os módulos de **Calculadora de Prazos Processuais** e **Configurações com Controle de Acesso para Administrador (ADM)**.

---

## 🚀 Funcionalidades

### 1. 🧮 Calculadora de Prazos Processuais (Acesso Público / Livre)
- **Modos de Cálculo**:
  - **Prazo Simples**: Calcula prazos em **Dias Úteis** (CPC/2015 Art. 219) e **Dias Corridos** (CPP, CLT quando aplicável).
  - **Prazo Duplo / Composto**: Simulação de contagem combinada de 2 etapas sucessivas (ex.: **10 dias corridos de ciência tácita/dilação + 10 ou 15 dias úteis de prazo recursal/resposta**, conforme Art. 5º, § 3º da Lei Federal nº 11.419/2006 e Arts. 219 e 224 do CPC).
- **Modelos Rápidos (1 clique)**:
  - `10c + 10u` (Ciência tácita + Prazo de 10 dias úteis)
  - `10c + 15u` (Intimação eletrônica Portal/DJe + Contestação/Apelação CPC)
  - `10c + 5u` (Intimação eletrônica + Embargos de Declaração)
  - `20c + 15u` (Dilação de Edital 20 dias + Contestação 15 dias)
- **Linha do Tempo Visual e Certidão de Tempestividade**:
  - Stepper passo a passo discriminando: data de envio/início, término da 1ª etapa com eventuais prorrogações legais, início da contagem da 2ª etapa e termo final.
  - Botão **"Copiar Certidão"** pronto para colagem em petições e sistemas processuais (Projudi, Eproc, PJe, SEI).
- **Regra de Contagem (Data Base Direta)**: exclui o dia de início informado e inclui o dia do vencimento, prorrogando automaticamente para o primeiro dia útil seguinte caso o término caia em fim de semana ou feriado.
- **Detalhamento do Vencimento**:
  - Data final e dia da semana.
  - Quantidade de dias de fim de semana descontados.
  - Relação e identificação nominal dos feriados/recessos intercalados.
  - Prorrogação automática do termo final caso o vencimento caia em final de semana ou feriado.
- **Painel de Feriados Considerados**:
  - Feriados nacionais fixos (incluindo o Dia da Consciência Negra em 20/Nov - Lei 14.759/2023).
  - Feriados nacionais móveis calculados dinamicamente via **Algoritmo de Gauss** (Carnaval, Sexta-feira Santa e Corpus Christi).
  - Feriados estaduais, municipais e recessos cadastrados.

---

### 2. ⚙️ Configurações (Acesso Restrito ao Administrador)
- **Proteção por Senha Criptografada**:
  - Visitantes ou usuários comuns têm acesso livre à calculadora, mas não conseguem acessar as configurações.
  - Autenticação via senha com hash criptográfico **SHA-256** (Web Crypto API nativa do navegador, sem envio de senhas para servidores ou armazenamento em texto puro).
  - **Senha inicial padrão**: `admin123`
  - Opção de alteração da senha de administrador dentro do próprio painel.
- **Gestão de Feriados Extras e Recessos**:
  - Cadastro de *Dia Único* (ex.: padroeiras, feriados municipais, portarias específicas).
  - Cadastro de *Período / Recesso* (ex.: Recesso Forense de 20/12 a 20/01 do Art. 220 do CPC).
  - Exclusão com modal de confirmação.
- **Importação, Backup e Restauração**:
  - **Botão Oficial TJGO 2026**: importa com 1 clique todos os 25 feriados, pontos facultativos e recesso forense do Tribunal de Justiça do Estado de Goiás.
  - **Carregar Arquivo JSON**: permite selecionar qualquer arquivo `.json` do computador.
  - **Exportar Feriados (JSON)**: baixa a lista atual de feriados em `.json`.
  - **Restaurar Padrão**: redefine para os feriados iniciais recomendados.

---

## 🎨 Interface & Design
- Identidade visual idêntica ao PrazoControl original com **Modo Escuro (Dark Mode)** e **Modo Claro (Light Mode)**.
- Sidebar retrátil e responsiva com suporte a dispositivos móveis.
- Chips visuais com badges coloridos para identificar feriados nacionais, feriados extras e períodos de recesso forense.

---

## 📁 Estrutura do Projeto

```
prazocontrol-calc/
├── index.html              # Estrutura das telas de Calculadora e Configurações
├── styles.css              # Estilos CSS modernos, variáveis e modo escuro
├── app.js                  # Lógica da calculadora, Gauss Computus e Auth ADM
├── feriados_tjgo_2026.json # Feriados e recessos oficiais do TJGO 2026
└── README.md               # Documentação do projeto
```

---

## 🌐 Como Executar e Publicar
1. **Uso Local**: Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari). Não requer instalação de pacotes (`npm install`).
2. **GitHub Pages**:
   - Crie um repositório no GitHub.
   - Suba os arquivos da pasta `prazocontrol-calc`.
   - Em *Settings* > *Pages*, selecione a branch `main` e salve. Seu sistema estará disponível online instantaneamente.
