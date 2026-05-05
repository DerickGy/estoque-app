# Gestão de Estoque

Web app simples para comerciantes gerenciarem estoque e vendas, sem precisar de caderno.

## Funcionalidades

- Cadastro de produtos com autocomplete
- Detecção de duplicatas (soma ao estoque existente)
- Registro de vendas com desconto editável
- Atualização automática do estoque ao vender
- Dados salvos no navegador (localStorage)

---

## Como publicar no GitHub Pages (passo a passo)

### 1. Crie o repositório no GitHub
1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"New"** (canto superior esquerdo)
3. Dê o nome: `estoque-app`
4. Deixe como **Public**
5. **Não** marque nenhuma opção extra (sem README, sem .gitignore)
6. Clique em **"Create repository"**

### 2. Configure no seu computador
Abra o terminal (Prompt de Comando ou PowerShell no Windows) na pasta onde estão os arquivos e rode:

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/estoque-app.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub.

### 3. Ative o GitHub Pages
1. No repositório, clique em **Settings**
2. No menu lateral, clique em **Pages**
3. Em "Branch", selecione **main** e clique em **Save**
4. Aguarde 1-2 minutos

### 4. Acesse o app
Seu app estará disponível em:
```
https://SEU_USUARIO.github.io/estoque-app
```

Você pode mandar esse link para qualquer pessoa testar no celular ou computador, sem precisar instalar nada.
