# RUNE Theme Factory

Uma mini “fábrica de temas” que roda na sua máquina para gerar **um tema do Chrome** + **assets da Chrome Web Store** a partir de 1 imagem (ou várias), já com os **tamanhos certinhos** e com **.zip pronto**.

> 📸 _Print da interface_

## Sobre

Publicar um tema na Chrome Web Store exige uma dúzia de imagens em tamanhos exatos. Fiz esta ferramenta para transformar um wallpaper em tema pronto, com todos os assets da loja, em um clique.

## Requisitos
- Node.js 18+ (recomendado 20+)

## Instalar
```bash
npm install
```

## Rodar (modo server)
```bash
npm start
```
Depois abra: http://localhost:4567

## Rodar (modo CLI)
```bash
npm run cli -- --input "C:\caminho\wallpaper.png" --name "MeuTema" --out ./out
```

## Como testar o tema no Chrome (unpacked)
1. Extraia o `theme.zip` gerado (ou use a pasta `out/.../theme/`)
2. Abra `chrome://extensions`
3. Ative **Modo do desenvolvedor**
4. Clique em **Carregar sem compactação** e selecione a pasta do tema

## O que ele gera
- `theme/` (manifest + imagens do tema)
- `webstore/` (ícone + screenshots + blocos promocionais)
- `theme.zip` e `webstore-assets.zip`

> Dica nerd: o recorte usa “cover” (tipo CSS `background-size: cover`). Ou seja: mantém proporção e corta sobras.


## Extras
- Recorte manual para assets da Web Store (Cropper.js no front)
- Overlay opcional nas capturas (genérico ou PNG enviado)

## Autor

Criado por **Guilherme Dill** · [RUNE Projects](https://www.runeprojects.com.br) · [GitHub](https://github.com/guilhermealceu)

## Licença

[MIT](LICENSE)
