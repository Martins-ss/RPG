#!/bin/bash

# adiciona tudo
git add .

# só continua se houver mudanças
if git diff --cached --quiet; then
  echo "Nada para salvar"
  exit 0
fi

# cria commit automático com data
git commit -m "backup automático - $(date '+%Y-%m-%d %H:%M:%S')"

# envia pro GitHub
git push

echo "Backup enviado com sucesso!"
