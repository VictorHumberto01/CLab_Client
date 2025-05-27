# 🧪 CLab - Plataforma Local de Ensino de C

Uma plataforma local e segura para ensino de programação em linguagem C, desenvolvida especialmente para iniciantes. O CLab oferece compilação segura, feedback automatizado via IA e diferentes níveis de acesso para uma experiência educacional completa.

![CLab Logo](https://img.shields.io/badge/CLab-C%20Learning%20Platform-blue?style=for-the-badge)

## ✨ Características Principais

- 🔒 **100% Local**: Funciona completamente offline, sem dependências externas
- 🤖 **IA Integrada**: Feedback automatizado e inteligente via LLaMA/Ollama  
- 🛡️ **Execução Segura**: Código executado em ambiente isolado (sandbox)
- 👥 **Multi-perfil**: Suporte para Administradores, Professores e Alunos
- 💻 **Interface Moderna**: Editor de código com syntax highlighting
- ⚡ **Performance**: Backend em Go para compilação rápida e eficiente

## 🎯 Objetivo

Criar uma plataforma educacional que facilite o aprendizado da linguagem C para estudantes iniciantes, oferecendo um ambiente seguro para experimentação, feedback inteligente e acompanhamento pedagógico.

## 🛠️ Stack Tecnológica

### Frontend
- **Electron** - Aplicação desktop multiplataforma
- **React** - Interface de usuário moderna e reativa
- **Monaco Editor** - Editor de código com syntax highlighting
- **Tailwind CSS** - Estilização rápida e responsiva

### Backend
- **Go** - Módulo de compilação e execução de código C
- **Python** - Módulo de IA para feedback automatizado
- **LLaMA via Ollama** - Modelo de linguagem local
- **SQLite** - Banco de dados leve e local

## 👥 Perfis de Usuário

### 👤 Administrador
- ✅ Criação de contas de professores
- 📊 Visualização e gerenciamento de salas
- 🔧 Configurações gerais do sistema

### 👨‍🏫 Professor
- 🏫 Criação de salas (com código de acesso)
- 📝 Criação e edição de tarefas
- 👀 Visualização dos envios e feedbacks dos alunos
- 📈 Relatórios de progresso

### 👨‍🎓 Aluno
- 🔑 Acesso via código de sala
- 💻 Submissão de código C
- 🤖 Recebimento de feedbacks automáticos
- 📚 Histórico de tentativas e progresso

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│                Frontend                     │
│            Electron + React                 │
│         Monaco Editor + Tailwind            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│              Backend Local                  │
├─────────────────────────────────────────────┤
│  📦 Módulo de Compilação (Go)               │
│  • Execução isolada com sandbox            │
│  • Compilação segura de código C           │
│  • Retorno de stdout/stderr                │
├─────────────────────────────────────────────┤
│  🧠 Módulo de IA (Python)                   │
│  • LLaMA via Ollama                        │
│  • Análise de código e erros               │
│  • Geração de feedback educativo           │
├─────────────────────────────────────────────┤
│  💾 Banco de Dados (SQLite)                 │
│  • Usuários e perfis                       │
│  • Salas e tarefas                         │
│  • Submissões e histórico                  │
└─────────────────────────────────────────────┘
```

## 📊 Modelo de Dados

### Principais Entidades
- **admins** - Administradores do sistema
- **professors** - Professores cadastrados
- **classrooms** - Salas de aula com códigos de acesso
- **students** - Alunos vinculados às salas
- **tasks** - Tarefas/exercícios criados pelos professores
- **submissions** - Submissões de código dos alunos

## 🚀 Roadmap de Desenvolvimento

### ✅ Fase 1: MVP Básico
- [ ] Arquitetura base do projeto
- [ ] Sistema de autenticação local
- [ ] CRUD de professores pelo administrador
- [ ] Criação e gerenciamento de salas
- [ ] Sistema de códigos de acesso
- [x] Editor de código integrado
- [x] Compilação e execução segura em Go
- [ ] Feedback básico via IA

### 🔄 Fase 2: Melhorias
- [ ] Histórico detalhado de tentativas
- [ ] Painel de progresso do aluno
- [ ] Sistema de notificações
- [ ] Edição avançada de tarefas
- [ ] Métricas e analytics

### 🎯 Fase 3: Expansão
- [ ] Suporte a outras linguagens
- [ ] Sistema de gamificação
- [ ] Exportação de relatórios
- [ ] Temas e personalização


## 🔐 Segurança

- **Sandbox de Execução**: Código C executado em ambiente completamente isolado
- **Sem Acesso à Rede**: Sistema funciona 100% offline
- **Isolamento de Processos**: Execução segura sem acesso ao sistema host
- **Validação de Entrada**: Sanitização de código antes da compilação
- **Logs de Auditoria**: Registro de todas as ações críticas

## 📁 Estrutura do Projeto

```
clab/
├── frontend/                 # Aplicação Electron + React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Comunicação com backend
│   │   └── utils/          # Utilitários frontend
│   └── public/             # Assets públicos
├── backend/
│   ├── compiler/           # Módulo Go de compilação
│   │   ├── sandbox/       # Sistema de sandbox
│   │   ├── executor/      # Executor de código C
│   │   └── api/          # API REST
│   └── ai/                # Módulo Python de IA
│       ├── models/        # Integração LLaMA/Ollama
│       ├── feedback/      # Geração de feedback
│       └── analysis/      # Análise de código
├── database/              # Scripts e migrações SQLite
├── docs/                 # Documentação do projeto
└── scripts/              # Scripts de build e deploy
```


## 🤝 Contribuição

### Como Contribuir
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request



**CLab** - *Transformando o aprendizado de programação em C* 🚀
