# Vehicle Debt Service

Sistema de consulta e simulação de pagamento de débitos veiculares, desenvolvido com NestJS, utilizando arquitetura modular, princípios SOLID e padrões de projeto para garantir extensibilidade, resiliência e desacoplamento entre domínio e integrações externas.

---

# Objetivo

O projeto tem como objetivo:

* Consultar débitos veiculares em múltiplos provedores
* Normalizar respostas JSON e XML
* Calcular juros por atraso
* Simular pagamentos via PIX e cartão
* Permitir pagamento total ou parcial
* Implementar fallback entre provedores
* Demonstrar boas práticas de arquitetura backend

---

# Tecnologias Utilizadas

## Backend

* Node.js
* TypeScript
* NestJS

## Validação

* class-validator
* class-transformer

## XML Parsing

* fast-xml-parser

## Documentação

* Swagger / OpenAPI

## Containerização

* Docker
* Docker Compose

---

# Arquitetura

O projeto foi estruturado utilizando uma abordagem inspirada em:

* Clean Architecture
* Hexagonal Architecture
* DDD (leve)
* SOLID

A principal preocupação foi separar claramente:

* domínio
* regras de negócio
* integrações externas
* apresentação HTTP

---

# Estrutura de Pastas

```txt
src/
├── modules/
│   └── debts/
│       ├── application/
│       ├── domain/
│       ├── infrastructure/
│       └── presentation/
│
├── shared/
│
├── app.module.ts
└── main.ts
```

---

# Como Rodar

## Pré-requisitos

* Node.js 22+
* npm
* Docker (opcional)

---

# Clonando o repositório

```bash
git clone https://github.com/iaiopvid/vehicle-debts-api.git
cd vehicle-debts-api
```

# Executando Localmente

## 1. Instalar dependências

```bash
npm install
```

---

## 2. Rodar aplicação

```bash
npm run start:dev
```

Servidor disponível em:

```txt
http://localhost:3000
```

---

# Swagger

Documentação disponível em:

```txt
http://localhost:3000/docs
```

---

# Endpoint Principal

## Consultar Débitos

### Request

POST

```txt
/debts/consult
```

Body:

```json
{
  "placa": "ABC1234"
}
```

---

# Exemplo de Resposta

```json
{
  "placa": "ABC1234",
  "debitos": [
    {
      "tipo": "IPVA",
      "valor_original": 1500,
      "valor_atualizado": 1800,
      "vencimento": "2024-01-10",
      "dias_atraso": 121
    }
  ]
}
```

---

# Executando com Docker

## Build

```bash
docker compose build
```

## Subir container

```bash
docker compose up
```

---

# Regras de Negócio

## IPVA

* Juros: 0.33% ao dia
* Limite máximo: 20%

---

## MULTA

* Juros: 1% ao dia
* Sem limite

---

## PIX

* Desconto de 5%

---

## Cartão de Crédito

* Até 12x
* Juros compostos de 2.5% ao mês

Fórmula utilizada:

```txt
valor_total * (1 + 0.025)^n / n
```

---

# Decisões Técnicas

# 1. Uso do NestJS

O NestJS foi escolhido por fornecer:

* arquitetura modular
* injeção de dependência nativa
* excelente organização
* facilidade para testes
* escalabilidade

Além disso, o framework favorece separação de responsabilidades e manutenção de projetos maiores.

---

# 2. Separação em Camadas

O sistema foi dividido em:

## Presentation

Responsável pela camada HTTP.

Contém:

* controllers
* DTOs
* validações

---

## Application

Responsável pela orquestração dos casos de uso.

Contém:

* use cases
* serviços de domínio
* coordenação de fluxo

---

## Domain

Responsável pelas regras centrais.

Contém:

* entidades
* enums
* interfaces

---

## Infrastructure

Responsável pelas integrações externas.

Contém:

* adapters
* mocks
* providers

---

# 3. Normalização de Dados

Cada provedor retorna formatos diferentes:

* Provider A → JSON
* Provider B → XML

O domínio nunca acessa esses formatos diretamente.

Os adapters convertem os dados para uma estrutura única.

Isso reduz acoplamento e facilita adicionar novos provedores.

---

# 4. Fallback entre Provedores

Foi implementado fallback automático:

```txt
Provider A
↓ falha
Provider B
```

Essa abordagem melhora resiliência e disponibilidade.

---

# 5. Data Fixa

A data atual foi fixada em:

```txt
2024-05-10
```

Isso garante previsibilidade nos testes e consistência dos cálculos.

---

# Padrões de Projeto Utilizados

# Adapter Pattern

Utilizado para adaptar diferentes formatos de provedores externos para um modelo único interno.

Exemplo:

* JSON → entidade normalizada
* XML → entidade normalizada

Benefícios:

* desacoplamento
* extensibilidade
* isolamento de integrações

---

# Strategy Pattern

Utilizado para encapsular regras diferentes de cálculo.

Exemplo:

* cálculo de juros IPVA
* cálculo de juros MULTA
* formas de pagamento

Benefícios:

* evita condicionais gigantes
* facilita novas regras
* melhora manutenção

---

# Factory / Orchestration

A lógica de fallback atua como um orquestrador de provedores.

Benefícios:

* centralização da estratégia de consulta
* possibilidade futura de load balancing
* possibilidade de priorização dinâmica

---

# Dependency Injection

Utilizado nativamente pelo NestJS.

Benefícios:

* desacoplamento
* facilidade de testes
* substituição simples de implementações

---

# SOLID

O projeto busca seguir princípios SOLID:

## Single Responsibility

Cada serviço possui apenas uma responsabilidade.

---

## Open/Closed

Novos provedores e regras podem ser adicionados sem modificar código existente.

---

## Dependency Inversion

O domínio depende de abstrações e não de implementações concretas.

---

# Trade-offs das Decisões

# 1. DDD Leve

Foi adotado DDD leve em vez de uma implementação completa.

## Ganhos

* simplicidade
* velocidade de desenvolvimento
* menor complexidade

## Perdas

* menor riqueza tática de domínio
* ausência de aggregates e domain events

---

# 2. Sem Banco de Dados

O sistema foi mantido stateless.

## Ganhos

* simplicidade
* menor overhead
* foco no domínio do desafio

## Perdas

* sem persistência
* sem histórico
* sem auditoria

---

# 3. Sem CQRS

CQRS não foi utilizado pois o domínio ainda é simples.

## Ganhos

* menor complexidade
* onboarding mais simples

## Perdas

* menor separação entre leitura/escrita
* menos flexibilidade em escala extrema

---

# 4. Fallback Simples

Foi implementado fallback sequencial.

## Ganhos

* implementação clara
* fácil manutenção

## Perdas

* sem balanceamento
* sem circuit breaker
* sem métricas avançadas

---

# Melhorias Futuras

# Resiliência

## Retry Automático

Implementar:

* retry exponencial
* retry configurável

Bibliotecas possíveis:

* p-retry
* retry-axios

---

## Circuit Breaker

Adicionar circuit breaker para evitar chamadas repetidas a provedores indisponíveis.

Sugestão:

* opossum

---

# Observabilidade

Adicionar:

* logs estruturados
* tracing distribuído
* métricas

Sugestões:

* Pino
* OpenTelemetry
* Prometheus

---

# Cache

Adicionar Redis para:

* evitar chamadas repetidas
* reduzir latência
* diminuir carga externa

---

# Testes

Expandir cobertura com:

* unit tests
* integration tests
* e2e tests

---

# Segurança

Adicionar:

* rate limiting
* helmet
* CORS configurável
* validação de payload mais robusta

---

# Escalabilidade

Possíveis evoluções:

* filas assíncronas
* arquitetura orientada a eventos
* microsserviços
* mensageria

---

# Melhorias Arquiteturais Futuras

* ConfigModule
* env validation
* feature flags
* providers dinâmicos
* health checks
* circuit breaker distribuído

---

# Considerações Finais

O principal objetivo deste projeto foi demonstrar:

* organização arquitetural
* separação de responsabilidades
* extensibilidade
* resiliência
* clareza de domínio
* boas práticas de backend moderno

Mesmo sendo um projeto pequeno, a estrutura foi desenhada para suportar crescimento sem gerar acoplamento excessivo ou complexidade prematura.

---
