@echo off
title AURALIE - Cloudflare Public Server Tunnel
echo ======================================================================
echo           AURALIE HAUTE COUTURE - CLOUDFLARE PUBLIC TUNNEL
echo ======================================================================
echo.
echo 1. Hay chac chan ban da chay: npm start (o mot cua so terminal khac)
echo 2. Dang khoi tao duong dan public truc tiep tu may cua ban...
echo.
echo Tim dong: "https://xxxx.trycloudflare.com" ben duoi
echo Copy link do va gui cho thay co / ban be de truy cap web tu xa!
echo (Nhan Ctrl + C de dung tunnel bat cu luc nao)
echo ======================================================================
echo.
.\cloudflared.exe tunnel --url http://localhost:3000
pause
