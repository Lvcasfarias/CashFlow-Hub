# 👋 Bem-vindo ao CashFlow Hub!

Obrigado por escolher o CashFlow Hub para gerenciar suas finanças pessoais!

## 🎯 Primeiros Passos

### 1. Criar sua Conta
- Acesse http://localhost:3000
- Clique em "Cadastre-se"
- Preencha seus dados

### 2. Configurar suas Caixinhas
As caixinhas são o coração do sistema! Elas dividem seu dinheiro automaticamente.

**Sugestão inicial:**
- 🎯 Investimentos: 30%
- 📚 Conhecimento: 15%
- 🏠 Custos Fixos: 40%
- 🎉 Lazer: 10%
- 💰 Reserva Emergência: 5%

**Como fazer:**
1. Vá para "Caixinhas"
2. Clique em "Configurar"
3. Defina suas categorias e percentuais (total = 100%)
4. Salve

### 3. Registrar sua Primeira Entrada
Quando receber seu salário ou outra entrada:

1. Vá para "Caixinhas"
2. Clique em "Distribuir Entrada"
3. Digite o valor (ex: R$ 5.000)
4. O sistema distribui automaticamente entre suas caixinhas!

### 4. Cadastrar Gastos
Toda vez que gastar:

1. Vá para "Transações"
2. Clique em "Nova Transação"
3. Selecione tipo "Saída"
4. **Importante:** Escolha de qual caixinha sairá o dinheiro
5. O saldo da caixinha é atualizado automaticamente

## 💡 Dicas de Uso

### Motor de Caixinhas
- ✅ Sempre vincule saídas a uma caixinha
- ✅ Acompanhe os indicadores visuais:
  - 🟢 Verde: Tudo bem (< 80% gasto)
  - 🟡 Amarelo: Atenção (80-95% gasto)
  - 🟠 Laranja: Cuidado (95-100% gasto)
  - 🔴 Vermelho: Estourou o orçamento!

### Contas Fixas
Cadastre contas que se repetem todo mês:
- Aluguel
- Condomínio
- Internet
- Streaming
- Academia

**Benefício:** O sistema calcula automaticamente o impacto no futuro!

### Compras Parceladas
Cadastre compras parceladas:
- Notebook 12x
- Celular 10x
- Móveis 6x

**Benefício:** Veja quanto terá comprometido nos próximos meses!

### Gestão de Dívidas
Se tem dívidas, cadastre aqui:
- Empréstimos
- Cartão de crédito
- Cheque especial

**Funcionalidade:** Sistema de amortização para ir quitando aos poucos.

### Relatórios
Acompanhe sua evolução:
- 📈 Fluxo de Caixa: Entradas vs Saídas
- 📊 Distribuição: Onde seu dinheiro está indo
- 🔮 Projeção: Como estará seus próximos 6 meses

## 🎨 Personalização

### Tema
- Botão no canto inferior esquerdo
- Alterna entre modo claro e escuro

### Exportar Dados
- Todos os relatórios podem ser exportados para CSV
- Útil para análises no Excel

## 📚 Metodologia: Envelope Budgeting

O CashFlow Hub usa o método de "Envelope Budgeting" (Orçamento de Envelopes):

**Como funciona:**
1. Você define categorias (caixinhas)
2. Aloca uma % da renda para cada categoria
3. Gasta apenas o que tem em cada envelope
4. Quando o envelope esvazia, para de gastar naquela categoria

**Benefícios:**
- ✅ Controle total dos gastos
- ✅ Nunca estoura o orçamento total
- ✅ Visualização clara de onde o dinheiro vai
- ✅ Ajuda a priorizar gastos

## 🚀 Fluxo Recomendado

**Início do Mês:**
1. Configurar caixinhas (se ainda não fez)
2. Cadastrar contas fixas do mês
3. Cadastrar salário (distribuir automaticamente)

**Durante o Mês:**
1. Cadastrar cada gasto
2. Vincular à caixinha correta
3. Acompanhar indicadores visuais
4. Ajustar gastos se alguma caixinha estiver no amarelo/laranja

**Fim do Mês:**
1. Verificar relatórios
2. Analisar onde gastou mais
3. Ajustar porcentagens se necessário
4. Planejar próximo mês

## 🎯 Metas Financeiras

Use a Wishlist para metas de longo prazo:
- Viagem
- Carro
- Reforma
- Curso

**O sistema calcula:** Baseado na sobra mensal, quanto tempo levará para juntar!

## 📊 KPIs Importantes

Acompanhe mensalmente:
- **Taxa de Economia:** Quanto % da renda você guardou
- **Caixinhas no Verde:** Quantas não estouraram o orçamento
- **Dívidas:** Evolução do saldo devedor
- **Saldo Projetado:** Como estará em 6 meses

## ⚠️ Avisos Importantes

1. **Sempre vincule saídas a caixinhas** - Isso garante o controle
2. **Não delete caixinhas no meio do mês** - Pode descalibrar os saldos
3. **Faça backups regulares** - Use o script `./backup.sh`
4. **Revise semanalmente** - 15min/semana para revisar gastos

## 🆘 Precisa de Ajuda?

**Documentação:**
- README.md - Visão geral do sistema
- DEPLOY.md - Deployment e troubleshooting
- PRODUCTION_CHECKLIST.md - Checklist de produção

**Comandos Úteis:**
```bash
# Ver logs
docker compose logs -f

# Fazer backup
./backup.sh

# Reiniciar sistema
docker compose restart

# Ver status
docker compose ps
```

## 🎉 Pronto!

Você está pronto para ter controle total das suas finanças!

**Lembre-se:** 
- Disciplina > Ferramenta
- O sistema é uma ferramenta, você que faz acontecer
- Seja honesto nos lançamentos
- Revise regularmente

---

**Boa sorte na sua jornada financeira! 💰**

*CashFlow Hub - Seu dinheiro, suas regras, seu controle.*
