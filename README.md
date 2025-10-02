# AeroSense - Monitoramento de Qualidade do Ar

## Estrutura do Projeto

O projeto é organizado com três pastas principais:

-   `aero_sence_front/`: Contém a aplicação front-end desenvolvida com React.
-   `aero_sence_back/`: Contém a API back-end desenvolvida com Node.js e Express.
-   `aero_sense_mobile/`: Contém a aplicação mobile desenvolvida com Expo GO.

### Front-end (`aero_sence_front`)

-   **Tecnologias Principais:**
    -   **React:** Biblioteca principal para a construção da interface.
    -   **Vite:** Ferramenta de build e servidor de desenvolvimento de alta performance.
    -   **React Router:** Para a gestão de rotas e navegação entre páginas.
    -   **React Bootstrap:** Biblioteca de componentes de UI para um design consistente e responsivo.
    -   **Recharts:** Para a criação dos gráficos dinâmicos no dashboard.
    -   **Axios:** Para a comunicação com a API do back-end.
    

-   **Estrutura de Pastas:**
    -   `src/pages/`: Contém os componentes de página principais (Login, Dashboard, Histórico, etc.).
    -   `src/components/`: Armazena componentes reutilizáveis (Navbar, Gráficos, Inputs).
    -   `src/context/`: Onde fica a lógica de estado global, como o `AuthContext` para a gestão do utilizador.
    -   `src/services/`: Centraliza a configuração de serviços externos, como o `api.js` для as chamadas Axios.
    -   `src/styles/`: Contém os ficheiros de estilização CSS globais e específicos.

### Back-end (`aero_sence_back`)

-   **Tecnologias Principais:**
    -   **Node.js & Express:** Ambiente de execução e framework para a construção da API.
    -   **TypeScript:** Para adicionar tipagem estática e robustez ao código.
    -   **Prisma:** ORM (Object-Relational Mapper) para a comunicação com o banco de dados.
    -   **PostgreSQL:** Banco de dados relacional para o armazenamento dos dados.
    -   **JWT (JSON Web Tokens):** Para a implementação de um sistema de autenticação seguro.
    -   **Bcrypt.js:** Para a encriptação segura das palavras-passe dos utilizadores.

-   **Estrutura de Pastas:**
    -   `src/controllers/`: Contém a lógica de negócio da aplicação.
    -   `src/routes/`: Define os endpoints da API (ex: `POST /api/auth/register`).
    -   `src/middleware/`: Armazena funções que interceptam os pedidos, como o `authMiddleware` para proteger rotas.
    -   `src/services/`: Centraliza a inicialização de serviços, como o cliente Prisma.
    -   `prisma/`: Contém o ficheiro `schema.prisma`, que define a estrutura do banco de dados.
 
    ### Mobile (`aero_sense_mobile`)
    
- **Tecnologias Principais:**
    - **React Native:** Framework para a construção de aplicações nativas para iOS e Android utilizando JavaScript e React.
    - **Expo:** Plataforma e conjunto de ferramentas que simplificam o desenvolvimento, o build e a publicação de apps React Native.
    - **React Navigation:** Biblioteca para a gestão de rotas e navegação entre as diferentes telas do aplicativo.
    - **Axios:** Para a comunicação com a API do back-end, buscando e enviando dados dos sensores e do usuário.

- **Estrutura de Pastas:**

    - `screens/`: Contém os componentes de tela principais (Login, Dashboard, Histórico, Configurações, etc.).
    - `components/`: Armazena componentes reutilizáveis que são usados em várias telas (botões, cards, etc.).
    - `navigation/`: Define os navegadores (Stack, Tab) e a estrutura de navegação do app.
    - `assets/`: Para armazenar recursos estáticos como imagens, ícones e fontes.
    - `services/`: Centraliza a configuração de serviços, como as chamadas de API com Axios.

## Rodando front, back e mobile localmente

### Back-end
Para rodar o projeto em modo de desenvolvimento (com reinicialização automática):

```bash
# Navegue até a pasta do back-end
cd aero_sence_back

# Instale as dependências (apenas na primeira vez)
npm install

# Inicie o servidor em modo de desenvolvimento
npm run dev
```

A API estará a rodar em: http://localhost:3000.


### Front-end
Para rodar a aplicação React:

```bash
# Navegue até a pasta do front-end
cd aero_sence_front

# Instale as dependências (apenas na primeira vez)
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Mobile 
Para rodar a aplicação no Expo GO:

```bash
# Navegue até a pasta do mobile
cd aero_sence_mobile

# Instale as dependências (apenas na primeira vez)
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```
## Baixe o Expo Go na loja de aplicativos gratuitamente: 
- **Android:** Baixe na [**Google Play Store**](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** Baixe na [**Apple App Store**](https://apps.apple.com/us/app/expo-go/id982107779)

# Escaneie o QR Code exibido no terminal:
- **iOS:** Aponte a câmera do seu iPhone para o QR Code.
- **Android:** Abra o app Expo Go e use a opção "Scan QR Code".

## 📜 Scripts Adicionais

Além do script principal, você pode usar os seguintes comandos no terminal:

* **Rodar em um emulador Android:**
    ```bash
    npx expo run:android
    ```

* **Rodar em um simulador iOS (apenas macOS):**
    ```bash
    npx expo run:ios
    ```



A aplicação estará acessível em: http://localhost:5173.
