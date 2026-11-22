#!/bin/bash
echo "Configurando Nginx para entradasyadb..."
sudo cp nginx/entradasyadb.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/entradasyadb.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
echo "âœ… Nginx configurado correctamente"
